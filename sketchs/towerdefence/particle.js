function GameObject(x,y){
  if(x != undefined&&y == undefined){y = x.y;x = x.x;}
  if(x == undefined||y == undefined)throw 'trying to define a GameObject with no position';
  this.pos = createVector(x,y);

  this.destroyEvents = {};
  this.destroyEvents.removeSelfFromGameObjectArray = GameObject.removeSelfFromGameObjectArray;

  this.updateEvents = {};
  this.drawEvents = {};

  this.drawEvents.default = GameObject.defaultDraw;

  //delayApply(1,this.undestroy,this,[]);
}

GameObject.removeSelfFromGameObjectArray = function() {
  //print('a '+this.constructor.name.toLowerCase()+' is destroyed');
  gameObjects.remove(this);
}

GameObject.defaultDraw = function() {
  if(this.size == undefined)this.size = 1;
  push();
  noStroke();
  if(this.color){fill(this.color);}else{fill('white');}
  if(this.texture){
    //rect((this.pos.x),(this.pos.y),this.size/2,this.size/2);
    //blendMode(MULTIPLY);
    //canvas.drawingContext.globalCompositeOperation = 'destination-in';
    image(this.texture,(this.pos.x-this.size/2),(this.pos.y-this.size/2),this.size,this.size);
    //canvas.drawingContext.globalCompositeOperation = 'source-over';
  }else{ellipse((this.pos.x),(this.pos.y),this.size,this.size);}
  pop();
}

GameObject.runEvent = function(e) {
  for (var i in e) {
    if(e[i] == undefined)continue;
    e[i].apply(this,arguments);
  }
}

GameObject.toStringHelper = function(name) {
  //if(name == 'cd'||name == '_range'||name == 'maxRange'||name == 'rangeSq'||name == 'size')return '';//fixme
  if(this[name] == undefined||typeof this[name] == 'object')return '';
  if(typeof this[name] == 'function' && this[name].name == '')return '';
  if(typeof this[name] == 'function')return name.replace(/_/g,'')+':'+this[name].name+'\n';
  return name.replace(/_/g,'')+':'+this[name]+'\n';
}

GameObject.prototype.toString = function() {
  var r = this.constructor.name+':\n';
  for (var i in this) {
    r += GameObject.toStringHelper.call(this,i);
  }
  return r;
}

GameObject.prototype.runEvent = function(e) {
  //
  GameObject.runEvent.apply(this,arguments);
}

GameObject.prototype.isDestroyed = function() {
  //
  return !gameObjects.includes(this);
}

GameObject.prototype.undestroy = function() {
  if(!this.isDestroyed())return this;
  gameObjects.push(this);
  return this;
}

GameObject.prototype.destroy = function() {
  //
  this.runEvent(this.destroyEvents);
}

GameObject.prototype.update = function() {
  //
  this.runEvent(this.updateEvents);
}

GameObject.prototype.draw = function() {
  if(!tweakables.enableGraphics)return;
  this.runEvent(this.drawEvents);
}

GameObject.prototype.tick = function() {
  //console.warn('GameObject.prototype.tick is obsolete');
  for (var j = 0; j < GameSpeed; j++) {
    this.update();
  }
  this.draw();
}

GameObject.prototype.distanceToSq = function(obj) {
  if(obj == undefined)return undefined;
  return obj.pos.copy().sub(this.pos).magSq();
}

Object.defineProperty(GameObject.prototype, "x", {
  set: function(value) {
    this.pos.x = value;
  },
  get: function() {
    return this.pos.x;
  }, configurable: true, enumerable: false
});
Object.defineProperty(GameObject.prototype, "y", {
  set: function(value) {
    this.pos.y = value;
  },
  get: function() {
    return this.pos.y;
  }, configurable: true, enumerable: false
});

function Particle(x,y) {
  GameObject.call(this, x, y);

  this.lastPos = convertVectorToP5(this.pos);//clone(this.pos)
  this.speed = random(minSpeed*_speed,maxSpeed*_speed);
  colorMode(HSB, 255, 255, 255);
  this.color = color(map(this.speed,minSpeed*_speed,maxSpeed*_speed,0,255), 255, 255, 100);
  colorMode(RGB);
  this.size = 1;

  //this.drawEvents.default = Particle.defaultDraw;

  this.finishEvents = {};
  //this.finishEvents.default = Particle.defaultFinish;
}

Particle.prototype.__proto__ = GameObject.prototype;

Particle.defaultFinish = function() {
  //print('a '+this.constructor.name.toLowerCase()+' has finished');
  //this.finishEvents.default = undefined;
  this.updateEvents.areWeThereYet = undefined;
}

Particle.prototype.finish = function() {
  //
  this.runEvent(this.finishEvents);
}

function Enemy(x,y,maxHP) {
  if(x == undefined&&y == undefined)x = this.respawn();
  Particle.call(this, x, y);

  this.HP = 1;//Percentage(0..1)
  if(maxHP == undefined)maxHP = 10;
  this.maxHP = maxHP;

  this.offset = p5.Vector.random2D().mult(-0.2,0.2);
  this.gridPos = this.pos;

  this.price = 1;
  this.size = 0.5;

  this.updateEvents.flollowVectorField = Enemy.flollowVectorField;
  //this.updateEvents.areWeThereYet = Enemy.areWeThereYet;
  this.drawEvents.drawHP = Enemy.drawHP;
  this.finishEvents.respawn = this.respawn;
  this.finishEvents.takeMoney = Enemy.takeMoney;
  this.finishEvents.default = undefined;
  this.deathEvents = {};

  this.deathEvents.destroySelf = this.destroy;
  this.deathEvents.giveMoney = Enemy.giveMoney;
}

Enemy.prototype.__proto__ = Particle.prototype;

Object.defineProperty(Enemy.prototype, "TrueHP", {
  set: function(value) {
    if(value>this.maxHP){this.maxHP = value;this.HP = 1;}else{
      this.HP = value/this.maxHP;
    }   
  },
  get: function() {
    return this.HP*this.maxHP;
  }, configurable: true, enumerable: false
});
Object.defineProperty(Enemy.prototype, "gridPos", {//you should not use functions on this
  set: function(value) {
    this.pos = value.copy().add(this.offset);
  },
  get: function() {
    return this.pos.copy().sub(this.offset);
  }, configurable: true, enumerable: false
});

Enemy.flollowVectorField = function() {
  var gp = this.gridPos;
  this.vel = convertVectorToP5(grid[floor(gp.x)][floor(gp.y)].v);
  if(this.vel.x == 0&&this.vel.y == 0){this.finish();return;}
  if(this.vel.x == 0){this.vel.x = -(gp.x-floor(gp.x));}
  if(this.vel.y == 0){this.vel.y = -(gp.y-floor(gp.y));}
  this.lastPos = convertVectorToP5(gp);
  gp.add(this.vel.mult(this.speed));
  this.gridPos = gp;
}

Enemy.areWeThereYet = function() {
  console.warn('Enemy.areWeThereYet is obsolete');
  var diff = convertVectorToP5(goals[0]).sub(this.pos).magSq();
  if(diff < 0.1){this.finish();return true;}
  return false;
}

Enemy.drawHP = function() {
  if(this.HP == 1 && !tweakables.showFullHealthBar)return;
  if(!tweakables.drawHealthBarOnLayer2){var a = window;}else{var a = layer2;} 
  a.push();
  a.strokeWeight(tweakables.healthBarWidth);
  a.stroke('red');
  //var pos = p5.Vector.add(this.pos,createVector(this.offset,this.offset));
  var pos = this.pos;
  a.line((pos.x)-this.size/2,(pos.y)-this.size/2,pos.x+this.size/2,(pos.y)-this.size/2);
  a.stroke(0,255,0);
  a.line((pos.x)-this.size/2,(pos.y)-this.size/2,(pos.x-this.size/2)+this.size*this.HP,(pos.y)-this.size/2);
  a.pop();
}

Enemy.drawTraget = function() {
  var size = 1.5;
  layer2.image(tileGraphics[9],
    this.pos.x-size/2,
    this.pos.y-size/2,
    size,
    size
  );
}

Enemy.takeMoney = function() {
  //gameObjects.push(new FadingText(this.x, this.y,'-{0}$'.format(this.price)));
  money -= this.price;
  //this.price *= 2;//?????
}

Enemy.giveMoney = function() {
  //gameObjects.push(new FadingText(this.x, this.y,'+{0}$'.format(this.price)));
  money += this.price;
}

Enemy.prototype.receiveDamage = function(d){
  //if(isNaN(d))throw '1';
  this.TrueHP = this.TrueHP-d;
  if(this.HP <= 0)this.die();
}

Enemy.prototype.respawn = function() {
  var x;var y;
  if(entrances.length){
    var t = random(entrances);
    if(t instanceof Entrance)t.schedule(this);
    x = t.x;y = t.y;
  }else{
    do{
      x = floor(random(0,grid.length));
      y = floor(random(0,grid[0].length));
    }while(!grid[floor(x)][floor(y)].b)
  }
  return this.pos = createVector(x,y);
}

Enemy.prototype.die = function() {
  if(this.isDead)return;
  this.runEvent(this.deathEvents);
  this.isDead = true;
}

function Bullet(source/*x,y,target*/) {
  if(source == undefined)throw 'trying to define a Bullet without a source';
  this.source = source;
  Particle.call(this, source.pos);
  //x = this.pos.x;y = this.pos.y;
  this.size = 0.5;
  this.damage = source.damage; 
  if(source.damage == undefined)this.damage = 1;

  (this.range = source.Range) || (this.range = source.range);

  if(this.source.color)this.color = this.source.color;

  this.target = source.target;

  this.finishEvents.dealDamage = Bullet.dealDamage;
  this.finishEvents.destroySelf = this.destroy;

  this.failEvents = {};

  delayApply(1,this.applyPrefab,this,[]);
}

Bullet.prototype.__proto__ = Particle.prototype;

Bullet.dealDamage = function(d) {
  if(isNaN(d))d = this.damage;
  this.target.receiveDamage(d);
  //this.destroy();
}

Bullet.newTarget = function() {
  var _enemies = findAllGameObjectsOfType(Enemy);
  if(_enemies.length == 0){this.explode();return this.target = undefined;}
  var a = 1000;var b;
  if(this.range != undefined)a = this.range**2;
  for (var i = 0; i < _enemies.length; i++) {
    var diff = _enemies[i].distanceToSq(this);
    if(diff<a){a = diff;b = i;}
  }
  if(b == undefined){this.explode();return this.target = undefined;}
  return this.target = _enemies[b];
}

Bullet.prototype.fail = function() {
  //
  this.runEvent(this.failEvents);
}

Bullet.prototype.verifyTarget = function() {
  if(this.target == undefined || this.target.isDestroyed()){this.fail();}else
  if(this instanceof Missile &&
    this.range != undefined && 
    this.distanceToSq(this.target) > this.range**2)
  {this.fail();}else
  if(this.range != undefined && this.source.distanceToSq(this.target) > this.range**2){this.fail();}
  return this.target;
}

Bullet.prototype.applyPrefab = function() {
  //
  if(this.source.bulletPrefab)Object.assign(this,this.source.bulletPrefab);
}

function Missile(source){
  Bullet.call(this, source);

  this.speed *= 2;

  this.updateEvents.flollowTarget = Missile.flollowTarget;
  this.updateEvents.areWeThereYet = Missile.areWeThereYet;
  this.failEvents.newTarget = Bullet.newTarget;
  //this.destroyEvents.explode = Missile.explode;
}

Missile.prototype.__proto__ = Bullet.prototype;

Missile.flollowTarget = function() {
  if(this.verifyTarget() == undefined)return;
  var dir = this.target.pos.copy().sub(this.pos).setMag(this.speed);
  if(this.mass == undefined){
    this.vel = dir;
  }else{
    this.acc = dir.mult(1/this.mass);
    if(this.vel == undefined)this.vel = this.acc;
    this.vel.add(this.acc).setMag(this.speed);
  }
  this.lastPos = this.pos.copy();
  this.pos.add(this.vel);
}

Missile.areWeThereYet = function() {
  if(this.target == undefined)return false;
  var d1 = this.target.distanceToSq({pos:this.lastPos});
  var d2 = this.target.distanceToSq(this);
  if(d1 <= d2&&this.speed**2 > max(d1,d2)){this.finish();return true;}
  return false;
}

Missile.prototype.explode = function() {
  this.target = undefined;
  gameObjects.push(new Explosion(this.pos));
  this.destroy();
}

function Beam(source) {
  Bullet.call(this, source);

  //colorMode(HSBA, 255, 255, 255, 100);
  this.color100 = color(red(this.color),green(this.color),blue(this.color),100);
  //this.color = color('hsba('+hue(this.color)+','+saturation(this.color)+','+brightness(this.color)+','+50+')');
  //colorMode(RGB);

  this.drawEvents.default = Beam.draw;
  this.updateEvents.areWeThereYet = Beam.areWeThereYet;
  this.updateEvents.dealDamage = Beam.dealDamage;
  this.failEvents.beamFail = Beam.fail;
  this.failEvents.destroySelf = this.destroy;
  this.finishEvents.dealDamage = undefined;
}

Beam.prototype.__proto__ = Bullet.prototype;

Beam.draw = function() {
  push();
  //var vector = this.target.pos.copy().lerp(this.source.pos,(this.source.cd)/this.source.totalcd);
  var vector = this.target.pos;

  strokeWeight(
    map(
      (this.source.totalcd - this.source.cd)/this.source.totalcd,
      0,1,0.1,0.2
    )
  );
  stroke(this.color100);
  line(this.source.pos.x,this.source.pos.y,vector.x,vector.y);
  pop();
}

Beam.areWeThereYet = function() {
  if(this.verifyTarget() == undefined)return false;
  if(this.source.cd == this.source.totalcd){this.finish();return true;}
  return false;
}

Beam.dealDamage = function() {
  //
  Bullet.dealDamage.call(this,this.damage/this.source.totalcd);
}

Beam.fail = function() {
  this.updateEvents.areWeThereYet = undefined;
  //Bullet.dealDamage.call(this,this.source.CdPercentage*this.damage);
  this.source.cd = 0;
  //delayApply(1,function() {this.source.cd = 0/*this.source.totalcd*/;},this,[]);
}

var optimizeLightningDraw = true;

function Lightning(source){
  Animation.call(this, source.pos,[{cd:2,action:''}]);

  this.source = source;
  this.target = source.target;
  if(optimizeLightningDraw){
    this.drawEvents.default = undefined;
  }else{
    this.drawEvents.default = Lightning.draw;
  }

  this.color = color('#82ffe5');

  var roughness = 10;
  this.points = [source.pos];
  for (var i = 1; i < roughness; i++) {
    var v = source.pos.copy().lerp(this.target.pos,i/roughness);
    v.add(p5.Vector.random2D().mult(0.2));
    this.points.push(v)
  }
  this.points.push(this.target.pos/*.copy()*/);

  Bullet.dealDamage.call(source);
}

Lightning.prototype.__proto__ = Animation.prototype;

Lightning.draw = function() {
  push();
  noFill();
  strokeWeight(0.1);
  stroke(this.color);
  //line(this.source.pos.x,this.source.pos.y,vector.x,vector.y);
  strokeJoin(MITER);
  beginShape();
  for (var i = 0; i < this.points.length; i++) {
    vertex(this.points[i].x,this.points[i].y);
  }
  endShape();
  pop();
}

Lightning.drawAll = function() {
  var arr = findAllGameObjectsOfType(Lightning);
  if(arr.length == 0)return;
  push();
  noFill();
  strokeWeight(0.1);
  stroke(arr[0].color);
  //line(this.source.pos.x,this.source.pos.y,vector.x,vector.y);
  strokeJoin(MITER);
  var ctx = canvas.drawingContext;
  ctx.beginPath();//beginShape();
  for (var j = 0; j < arr.length; j++) {
    var t = arr[j];
    ctx.moveTo(t.points[0].x,t.points[0].y)
    for (var i = 1; i < t.points.length; i++) {
      ctx.lineTo(t.points[i].x,t.points[i].y);
    }
  }
  ctx.stroke();//endShape();
  ctx.closePath();
  pop();
}

function Animation(x,y,rom) {
  //if(x != undefined&&y == undefined){y = x.y;x = x.x;}
  if(y != undefined&&y.length != undefined&&rom == undefined){rom = y;y = undefined;}
  if(rom == undefined || rom.length == undefined)
    throw 'trying to define an Animation with no frame array';
  GameObject.call(this, x, y);
  this.rom = rom;
  this.i = 0;
  this.cd = 0;

  this.updateEvents.animation = Animation.update;
}

Animation.prototype.__proto__ = GameObject.prototype;

Animation.update = function() {
  this.cd--;
  if(this.cd <= 0){
    //this.cd = this.totalcd;
    this.nextFrame();
  }
}

Animation.prototype.nextFrame = function() {
  var frame = this.rom[this.i];
  if(frame == undefined){this.destroy();return;}
  (this.cd = frame.cd) || (this.cd = frame.duration);
  this.cd /= _speed; 
  if(typeof frame.action == 'string')eval(frame.action);
  if(typeof frame.action == "function")frame.action.call(this);
  this.i++;
}

function Explosion(x,y) {
  Animation.call(this, x, y,[
    {cd:1,action:'this.color = this.color4;this.size += 0.5;'},
    {cd:1,action:'this.color = this.color3;this.size += 0.5;'},
    {cd:1,action:'this.color = this.color2;this.size += 0.5;'},
    {cd:1,action:'this.color = this.color1;this.size += 0.5;'},
    {cd:1,action:'this.color = this.color0;this.size -= 0.5;'}
  ]);

  this.size = 0;

  colorMode(RGB);
  this.color = color(0,0);
  this.color0 = color(66,66,66,200);
  this.color1 = color(235,33,47,200);
  this.color2 = color(250,157,28,200);
  this.color3 = color(237,233,37,200);
  this.color4 = color(252,250,201,200);
}

Explosion.flipColor = function() {
  if(this.color == this.color1){
    this.color = this.color2;
  }else{
    this.color = this.color1;
  }
}

Explosion.prototype.__proto__ = Animation.prototype;

function FadingText(x,y,rom) {
  var time = 50;
  var height = 2;
  if(y != undefined&& typeof y == 'string' &&rom == undefined){rom = y;y = undefined;}
  if(rom == undefined || rom.length == undefined)
    throw 'trying to define a FadingText with no text';
  GameObject.call(this, x, y);
  this.transparency = 1;
  this.fadeSpeed = 1/time;
  this.linearSpeed = height/time;
  this.text = rom;
  this.color = color(255);

  this.drawEvents.default = FadingText.draw;
  this./*updateEvents*/drawEvents.fade = FadingText.fade;
}

FadingText.fade = function() {
  this.y -= this.linearSpeed; 
  this.transparency -= this.fadeSpeed;
  if(this.transparency <= 0)this.destroy();
}

FadingText.draw = function() {
  var a = layer2;
  a.push();
  a.strokeWeight(0.1);
  a.textSize(1);
  a.textAlign(CENTER);
  a.textFont('lcd_solid');
  a.stroke('rgba({1},{2},{3},{0})'.format(this.transparency,255-this.color.red,255-this.color.green,255-this.color.blue));
  a.fill('rgba({1},{2},{3},{0})'.format(this.transparency,this.color.red,this.color.green,this.color.blue));
  a.text(this.text,this.pos.x,this.pos.y);
  a.pop();
}

FadingText.prototype.__proto__ = Animation.prototype;

function Entrance(x,y) {
  GameObject.call(this, x, y);

  this.cd = 0;
  this.totalcd = 8*_speed;
  this.queue = [];

  this.updateEvents.update = Entrance.update;
  this.drawEvents.default = undefined;
}

Entrance.prototype.__proto__ = GameObject.prototype;

Entrance.update = function() {
  this.cd--;
  if(this.cd <= 0){
    this.cd = this.totalcd;
    this.spawn();
  }
}

Entrance.prototype.schedule = function(thing) {
  if(!thing instanceof Enemy)throw 'trying to spawn something that is not an Enemy';
  this.queue.push(thing);
  //thing.destroy();
  GameObject.removeSelfFromGameObjectArray.call(thing);
}

Entrance.prototype.spawn = function() { 
  if(this.queue.length == 0)return undefined;
  this.queue.sort(function(a,b){return a.speed-b.speed;});
  var e = this.queue.shift();
  if(e.isDead){
    print('trying to spawn something that is already dead');
    return this.spawn();
  }
  e.gridPos = this.pos.copy();
  e.undestroy();
  return e;
}