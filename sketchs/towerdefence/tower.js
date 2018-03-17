function Tower(x,y,balancedata,range,totalcd) {
	GameObject.call(this, x, y);

  x = this.pos.x;y = this.pos.y; 
  grid[x][y].tower = this;

  (this.balanceData = balancedata)
  ||(this.balanceData = balanceData.tower[buildTowerMode])
  ||(this.balanceData = balanceData.tower);

  this.level = 0;
  money -= this.balanceData.buildCost;
  gameObjects.push(new FadingText(x, y,'-{0}$'.format(this.balanceData.buildCost)));

  if(range == undefined)range = sqrt(this.balanceData.rangeSq.base);
  this.range = this.maxRange = range; 

  this.damage = this.balanceData.damage.base; 
  if(totalcd == undefined)totalcd = 10;

  this.onTargetChangedEvents = {};
  this._target = undefined;

  this.updateEvents.default = Tower.update;
  this.destroyEvents.removeSelfFromTile = Tower.removeSelfFromTile;
  this.destroyEvents.unselect = Tower.unselect;
  this.destroyEvents.returnMoney = Tower.returnMoney;

  this.totalcd = totalcd/_speed;
  this.cd = totalcd;

  this.bulletPrefab = undefined;
  this.chaoticTargeting = true;
  this.mode = defaultTowerMode;//random,closest,weakest,strongest
  this.bulletType = window[buildTowerMode];//Beam;Missile;Lightning

  this.texture = tileGraphics[8];

  this.recalcStats();
}

Tower.prototype.__proto__ = GameObject.prototype;

Object.defineProperty(Tower.prototype, "_range_", {
  get: function() {
    if(this.range != undefined && this.maxRange != undefined)return '{0}/{1}'.format(round10(this.range,-2),round10(this.maxRange,-2));
    if(this.range != undefined && this.maxRange == undefined)return round10(this.range,-2);
    return 'undefined';
  }, configurable: true, enumerable: true
});
Object.defineProperty(Tower.prototype, "dps", {
  get: function() {
    return round10(this.damage/this.totalcd*60/*frameRate()*/,-3);
  }, configurable: true, enumerable: true
});
Object.defineProperty(Tower.prototype, "trueDps", {
  get: function() {
    if(isPaused)return 0;
    return round10(this.damage/this.totalcd*frameRate()*_gameSpeed,-3);
  }, configurable: true, enumerable: true
});
Object.defineProperty(Tower.prototype, "speed", {
  set: function(value) {
    this.totalcd = round(60/value);
  },
  get: function() {
    return 60/this.totalcd;
  }, configurable: true, enumerable: true
});
Object.defineProperty(Tower.prototype, "range", {
  set: function(value) {
    if(value == this._range)return;
    if(this.maxRange&&value > this.maxRange){
      var t = this.maxRange;
      this.maxRange = value;
      value = this._range*this.maxRange/t;
    }
    this._range = value;
    this._rangeSq = value**2;
  },
  get: function() {
    return this._range;
  }, configurable: true, enumerable: true
});
Object.defineProperty(Tower.prototype, "rangeSq", {
  set: function(value) {
    if(value == this._rangeSq)return;
    this._rangeSq = value;
    this.range = sqrt(value);
  },
  get: function() {
    return this._rangeSq;
  }, configurable: true, enumerable: true
});
Object.defineProperty(Tower.prototype, "Range", {
  set: function(value) {
    this.range = value;
  },
  get: function() {
    return this.range;
  }, configurable: true, enumerable: false
});
Object.defineProperty(Tower.prototype, "target", {
  set: function(value) {
    if(this._target != value){
      this.runEvent(this.onTargetChangedEvents,this._target,value);
    }
    this._target = value;
  },
  get: function() {
    return this._target;
  }, configurable: true, enumerable: false
});
Object.defineProperty(Tower.prototype, "DiatanceToTargetSq", {
  get: function() {
    return this.distanceToSq(this.target);
  }, configurable: true, enumerable: false
});
Object.defineProperty(Tower.prototype, "CdPercentage", {
  get: function() {
    return (this.totalcd-this.cd)/this.totalcd;
  }, configurable: true, enumerable: false
});
Object.defineProperty(Tower.prototype, "upgradeCost", {
  get: function() {
    var rom = this.balanceData.upgradeCost;
    return /*round10(*/doubleProgression(rom.base,this.level,rom.escale,rom.lscale)/*,-2)*/;
  }, configurable: true, enumerable: true
});

Tower.prototype.getTarget = function() {
  var _enemies = findAllGameObjectsOfType(Enemy);
  var a = 1000;var b = [];
  for (var i = 0; i < _enemies.length; i++) {
    var diff = _enemies[i].distanceToSq(this);
    //if(diff <= this.rangeSq){this.target = _enemies[i];return true;}
    if(diff <= this.rangeSq){
      if(this.mode == 'random')b.push(_enemies[i]);
      if(this.mode == 'closest'){if(diff<a){a = diff;b = i;}}
      if(this.mode == 'weakest'){if(_enemies[i].TrueHP<a){a = _enemies[i].TrueHP;b = i;}}
      if(this.mode == 'strongest'){if(-_enemies[i].TrueHP<a){a = -_enemies[i].TrueHP;b = i;}}
    }
  }
  if(b.length == 0)return this.target = undefined;
  if(this.mode == 'random'){
    return this.target = random(b);
  }else{
    return this.target = _enemies[b];
  }
}

Tower.prototype.shoot = function() {
  if(this.target == undefined || this.chaoticTargeting || this.target.isDestroyed()){
    if(!this.getTarget())return false;
  }else if(this.DiatanceToTargetSq > this.rangeSq){if(!this.getTarget())return false;}

  gameObjects.push(new this.bulletType(this));
}

Tower.prototype.adjustRange = function(c) {
  uiLayer.isDirty = true;
  //c *= this.maxRange;
  this.Range = constrain(this.Range+c, 0.5, this.maxRange);
}

Tower.prototype.toString = function() {
  //return GameObject.prototype.toString.call(this);
  var r = '';//this.constructor.name+':\n';
  r += 'type:'+(this.bulletType.name)+'\n';
  r += 'level:'+(this.level+1)+'\n';
  r += 'upgrade cost:'+round10(this.upgradeCost,-1)+'\n';
  r += GameObject.toStringHelper.call(this,'_range_');
  r += 'damage:'+round10(this.damage,-2)+'\n';
  r += 'dps:'+this.dps+'\n';
  r += 'cd:'+this.totalcd+'\n';
  //r += '\n\n\n\n\n\n\n\n1';//testing
  r = r.substr(0,r.length-1)
  return r;
}

Tower.prototype.move = function(x,y) {
  if(x != undefined&&y == undefined){y = x.y;x = x.x;}
  if(x == undefined||y == undefined)throw 'trying to move tower to no position';
  grid[this.pos.x][this.pos.y].tower = undefined;
  this.pos.x = x;
  this.pos.y = y;
  grid[this.pos.x][this.pos.y].tower = this;
}

Tower.prototype.upgrade = function() {
  if((!tweakables.negativeMoney)&&money<this.upgradeCost)return;
  money -= this.upgradeCost;
  gameObjects.push(new FadingText(this.pos,'-{0}$'.format(round10(this.upgradeCost,-1))));
  this.level++;
  this.recalcStats();
}

Tower.prototype.recalcStats = function() {
  for (var i in this) {
    if(i == 'upgradeCost')continue;
    if(!this.balanceData[i])continue;
    if(typeof this.balanceData[i] == "number"){this[i] = this.balanceData[i];continue;}
    if(typeof this.balanceData[i] != "object")continue;
    var rom = this.balanceData[i];
    this[i] = /*round10(*/doubleProgression(rom.base,this.level,rom.escale,rom.lscale)/*,-2)*/;
  }
}

Tower.modes = ['random','closest','weakest','strongest'];

Tower.removeSelfFromTile = function() {
  //
  grid[this.pos.x][this.pos.y].tower = undefined;
}

Tower.unselect = function() {
  if(this == selectedTower)selectedTower = undefined;
  if(this == highlightedTower)highlightedThing = undefined;
}

Tower.update = function() {
  if(this.bulletType == Beam&&this.target == undefined){this.cd = this.totalcd;this.shoot();return;}
  this.cd--;
  if(this.cd <= 0){
    this.cd = this.totalcd;
    this.shoot();
  }
}

Tower.highlightTarget = function(e,oldTarget,newTarget) {
  if(oldTarget)oldTarget.drawEvents.highlightTarget = undefined;
  if(newTarget)newTarget.drawEvents.highlightTarget = Enemy.drawTraget;
}

Tower.draw = function() {
  //
}

Tower.returnMoney = function() {
  var r = this.balanceData.buildCost;
  var rom = this.balanceData.upgradeCost;
  r += doubleProgressionSum(rom.base,this.level-1,rom.escale,rom.lscale);
  money += r;
  gameObjects.push(new FadingText(this.pos,'+{0}$'.format(round10(r,-1))));
}