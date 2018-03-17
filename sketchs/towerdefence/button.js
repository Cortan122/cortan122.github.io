var buttons = [];

function initButtons(){
  var a = buildBuildButton;
  var b = buildScreenSize;

  (buttons[0]=new Button('clock',img.width,-0.5,img.width+2*1,2*1-0.5)).action = 'trueinput(1)';
  buttons[1]=a('buildTower',8,img.width+b*1,2.5+b*0.5,"buildMode = 'buildTower'");
  buttons[2]=a('buildWall',4,img.width+b*3,2.5+b*0.5,"buildMode = 'buildWall'");
  buttons[3]=a('demolish',10,img.width+b*5,2.5+b*0.5,"buildMode = 'demolish'");
  (buttons[4]=new Button('targeting',img.width,0,b*6+img.width,0)).action = toggleTowerMode;
  buttons[5]=a('move',13,img.width+b*1,3+b*3,"trueinput(9)");
  buttons[6]=a('sell',14,img.width+b*3,3+b*3,"trueinput(10)");
  buttons[7]=a('upgrade',15,img.width+b*5,3+b*3,"trueinput(0)");
  buttons[8]=a('beam',16,img.width+b*1,2.5+b*3,"buildTowerMode = 'Beam'");
  buttons[9]=a('missile',17,img.width+b*3,2.5+b*3,"buildTowerMode = 'Missile'");
  buttons[10]=a('lightning',18,img.width+b*5,2.5+b*3,"buildTowerMode = 'Lightning'");

  for (var i = 4; i <= 10; i++) {
    buttons[i].isActive = false;
  }
}

function buildBuildButton(name,textureId,x,y,action){
  var size = buildScreenSize;
  var r = new Button(name,x-size,y-size,2*size,2*size,'corner');
  if(name == 'move')r.condition = 'towerBeingMoved != undefined';
  if(name == 'beam')r.condition = 'buildTowerMode == "Beam"';
  if(name == 'missile')r.condition = 'buildTowerMode == "Missile"';
  if(name == 'lightning')r.condition = 'buildTowerMode == "Lightning"';
  r.textureId = textureId;
  r.action = action;
  return r;
}

function Button(name,x,y,x1,y1,mode = 'corners',title){
  if(arguments.length == 0)throw 'waat?!';
  this._isActive = true;
  if(arguments.length == 1){Object.assign(this,name);this.enableToollip();return;}
  this.name = name;
  if(title == undefined)this.title = name;
  if(arguments.length == 4||arguments.length == 3){
    if(x1)mode = x1;
    x1 = y.x;y1 = y.y;
    y = x.y;x = x.x;
  }
  if(mode == 'corner'){
    this.x = x;this.y = y;
    this.x1 = x+x1;this.y1 = y+y1;
  }else if(mode == 'corners'){
    this.x = min(x,x1);this.y = min(y,y1);
    this.x1 = max(x,x1);this.y1 = max(y,y1);
  }else{throw '123';}
  this.enableToollip();
}

Button.prototype.includes = function(x,y){
  if(!this.isActive)return false;
  if(x != undefined&&y == undefined){y = x.y;x = x.x;}
  return x>this.x&&x<this.x1&&y>this.y&&y<this.y1;
}

Button.prototype.draw = function() {
  //if(!this.isActive)throw 'trying to draw an inactive button';
  this.isActive = true;
  var a = uiLayer;
  a.push();
  a.strokeWeight(0.1);
  a.stroke('black');
  a.noFill();
  a.rectMode(CORNERS);
  a.rect(this.x,this.y,this.x1,this.y1);
  a.pop();
}

Button.prototype.enableToollip = function() {
  if(this.title == undefined){if(!(this.title = this.name))throw '';}
  if(this.tooltip == undefined){
    var arr = tooltipContainer.elt.children;
    for (var i = 0; i < arr.length; i++) {
      if(arr[i].title == this.title){this.tooltip = arr[i];break;}
    }
  }
  if(this.tooltip != undefined){
    this.tooltip.style['z-index'] = 999;
    return;
  }
  this.tooltip = document.createElement('div')/*createDiv('').elt*/;
  this.setTooltipPos();
  this.tooltip.title = this.title;
  this.tooltip.className = "tooltip";
  tooltipContainer.elt.appendChild(this.tooltip);
}

Button.prototype.disableToollip = function() {
  if(this.tooltip == undefined)throw '122';
  this.tooltip.style['z-index'] = -1;
}

Button.prototype.getPixelCoords = function() {
  var pos = createVector(this.x,this.y);
  var pos1 = createVector(this.x1,this.y1);
  pos.add(0.5,0.5);pos1.add(0.5,0.5);
  pos.mult(scl);pos1.mult(scl);
  pos.add(offset.x,offset.y);pos1.add(offset.x,offset.y);
  return {x:pos.x,y:pos.y,x1:pos1.x,y1:pos1.y};
}

Button.prototype.setTooltipPos = function() {
  var c = this.getPixelCoords();
  this.tooltip.style.left = c.x+'px';
  this.tooltip.style.top = c.y+'px';
  this.tooltip.style.width = c.x1-c.x+'px';
  this.tooltip.style.height = c.y1-c.y+'px';
}

Button.prototype.click = function() {
  if(this.action == undefined)return false;
  if(typeof this.action == 'string'){eval(this.action);return true;}
  if(typeof this.action == 'function'){this.action();return true;}
  return false;
}

Object.defineProperty(Button.prototype, "isActive", {
  set: function(value) {
    if(this._isActive == value)return;
    this._isActive = value;
    if(value){
      this.enableToollip();
    }else{
      this.disableToollip();
    }
  },
  get: function() {
    return this._isActive;
  }, configurable: true, enumerable: false
});