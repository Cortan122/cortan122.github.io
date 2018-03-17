var tileGraphics = [
  'lava.png',//0
  'star_on_path.png',//1
  'grass_green.png',//2
  undefined/*'tower1.png'*/,//3
  'stonebrick.png',//4
  'portal_under_path_circular.png',//5
  undefined,//6
  'path.png',//7
  'tower1.png',//8
  'crosshair.png',//9
  'demolish.png',//10
  'tile.png',//11
  'inverted_tile.png',//12
  'move.png',//13
  '$.png',//14
  'up arrows/64.png',//15
  'explosion/sinusoidal-beam.png',//16
  'explosion/cracked-ball-dunk.png',//17
  'lightning/lightning-helix.png'//18
];//listOfTileGraphics
function initTileGraphics(){
  for (var i = 0; i < tileGraphics.length; i++) {
    if(tileGraphics[i] == undefined || tileGraphics[i] == '')continue;
    tileGraphics[i] = loadImage('tileGraphics/'+tileGraphics[i]);
  }
}

var uiLayer;
var layer2;
var cursorLayer;

function draw() {
  if(tweakables.showFPS)frDiv.html(
    'FPS: '+floor(frameRate())+
    '\t\tgameObjects:'+gameObjects.length+
    '\t\tgameSpeed:'+_gameSpeed+
    '\t\tmoney:'+money
  );
  if(tweakables.balancedUndo&&!isPaused){
    undoActions = [];
    redoActions = [];
  }
  if(!tweakables.enableGraphics){updateGameObjects();return;}
  cursorLayer.drawingContext.clearRect(0, 0, this.width, this.height);

  push();
  //background(255);
  clearCanvas();
  if(mapLayer == undefined||mapLayer.isDirty)newMapImage.call(mapLayer);

  push();
  initCanvas();
  layer2.push();
  clearCanvas.call(layer2);
  updateGameObjects();
  if(optimizeLightningDraw)Lightning.drawAll();
  layer2.pop();
  if(highlightedTower != selectedTower)drawTowerRange(highlightedTower);
  if(selectedTower&&tweakables.drawSelectedTowerRange)drawTowerRange(selectedTower);
  if(buildMode == 'buildTower'&&canBuildTowerAt(highlightedTile))
    //drawTowerRange({pos:{x:highlightedTile.x,y:highlightedTile.y},Range:5});
    drawTowerRange({pos:highlightedTile,Range:sqrt(balanceData.tower.rangeSq.base)});
  drawMoveTowerArrow();
  pop();

  if(uiLayer == undefined||uiLayer.isDirty)drawUI(); 

  pop();
  cursorLayer.ellipse(mouseX,mouseY,10,10);
}

function drawMoveTowerArrow(){
  if(towerBeingMoved&&highlightedTile)
    drawArrow(towerBeingMoved.pos,highlightedTile,canBuildTowerAt(highlightedTile)?255:'red');
}

function drawArrow(x, y, x1, y1, color){
  if(arguments.length == 2||arguments.length == 3){
    color = x1;
    x1 = y.x;y1 = y.y;
    y = x.y;x = x.x;
  }
  if(color == undefined){
    color = color(255);
  }
  var headlen = 0.5;   // length of head in pixels
  var angle = Math.atan2(y1-y,x1-x);
  var context = this.drawingContext;
  this.push();
  this.strokeWeight(0.1);
  this.stroke(color);
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x1, y1);
  context.lineTo(x1-headlen*Math.cos(angle-Math.PI/6),y1-headlen*Math.sin(angle-Math.PI/6));
  context.moveTo(x1, y1);
  context.lineTo(x1-headlen*Math.cos(angle+Math.PI/6),y1-headlen*Math.sin(angle+Math.PI/6));
  context.stroke();
  this.pop();
}

function updateGameObjects(){
  if(/*updatingMode*/false){
    var gos = gameObjects.slice();
    for (var i = 0; i < gos.length; i++) {
      gos[i].tick();
    }
    return;
  }

  for (var j = 0; j < GameSpeed; j++) {
    var gos = gameObjects.slice();
    for (var i = 0; i < gos.length; i++) {
      gos[i].update();
      //gos[i].draw();
    }
  }
  //if(GameSpeed < 1){
    var gos = gameObjects.slice();
    for (var i = 0; i < gos.length; i++) {
      gos[i].draw();
    }
  //}
}

function newMapImage(){
  this.isDirty = false;
  this.push();
  this.background(255);
  this.translate(offset.x,offset.y);
  this.scale(scl,scl);
  this.translate(0.5,0.5);
  this.fill(0);
  this.noStroke();//strokeWeight(0);
  for (var x = 0; x < grid.length; x++) {
    for (var y = 0; y < grid[0].length; y++) {
      if(!grid[x][y].b)continue;
      var _image = tileGraphics[grid[x][y].value];
      if(_image == undefined)continue;
      this.image(_image,x-0.5,y-0.5,1,1);
      /*push();
      translate(x,y);
      if(grid[x][y].v)drawVector(grid[x][y].v);
      pop();*/
    }
  }
  if(tweakables.drawShadows){
    this.push();
    this.stroke(tweakables.shadowColor);
    this.strokeWeight(tweakables.bigShadowSize);
    this.strokeCap(SQUARE/*PROJECT*/);
    var ctx = this.drawingContext;
    ctx.beginPath();
    for (var x = 0; x < grid.length; x++) {
      for (var y = 0; y < grid[0].length; y++) {
        if(!grid[x][y].b)continue;
        drawConectedTile.call(this,x,y,true);
      }
    }
    ctx.stroke();
    ctx.closePath();
    this.pop();
  }
  for (var x = 0; x < grid.length; x++) {
    for (var y = 0; y < grid[0].length; y++) {
      if(grid[x][y].b)continue;
      var _image = tileGraphics[grid[x][y].value];
      if(_image == undefined)continue;
      this.image(_image,x-0.5,y-0.5,1,1);
    }
  }
  this.pop();
  this.push();
    this.rectMode(CORNERS);
    this.noStroke();
    this.fill(255);
    this.rect(0,0,width,offset.y);
    this.rect(img.width*scl+offset.x,0,img.width*scl+offset.x1+offset.x,height);
    //this.rect(0,height-offset.y1,width,height);
  this.pop();
}

function drawUI(){
  uiLayer.isDirty = false;
  uiLayer.push();
  clearCanvas.call(uiLayer);

  //drawTowerRange.call(uiLayer,selectedTower);

  drawClock.call(uiLayer);
  drawBuildScreen.call(uiLayer);
  drawTowerButtons.call(uiLayer);
  drawSelectionText.call(uiLayer);
  uiLayer.pop();
  return uiLayer;
}

function drawSelectionText(){
  targetingButtonRect = undefined;
  if(!selectedTower)return;
  targetingButtonRect = {};
  var size = buildScreenSize;
  for (var i = 5; i <= 7; i++) {
    drawBuildButton.call(this,buttons[i]);
  }

  this.push();
  //this.fill(0);
  var dif = 0;
  if(tweakables.boldText)this.stroke(0);
  this.strokeWeight(0.1);
  this.textSize(1);
  this.textAlign(CENTER);
  //this.translate(img.width+buildScreenSize*3/*(width/scl-img.width)/2*/,3+buildScreenSize*2.5/*0.5*/)
  var size = 0.5;
  var yoffset = (3.5+buildScreenSize*4);
  this.push();
  if(buildMode == 'buildTower'){
    var dif = buttons[8].y-buttons[1].y;
    this.translate(0,dif);
  }
  this.scale(size,size);
  //size *= 1.25;
  this.text('Selected tower:', (img.width+buildScreenSize*3)/size, (2.75+buildScreenSize*2)/size);
  var string = /*'Selected '+*/selectedTower.toString();
  this.text(string, (img.width+buildScreenSize*3)/size, yoffset/size);
  var height = string.split('\n').length;
  this.text('targeting mode:', (img.width+buildScreenSize*3)/size, yoffset/size+height*1.25/*+1*/);
  this.text(selectedTower.mode, (img.width+buildScreenSize*3)/size, yoffset/size+height*1.25+2);
  this.pop();

  buttons[4].y = dif+yoffset+(height+0.5)*size*1.25;
  buttons[4].y1 = 2*size+buttons[4].y;
  buttons[4].draw();
  buttons[4].setTooltipPos();

  this.pop();
}

function drawTowerButtons(){
  if(buildMode != 'buildTower'){
    if(buttons[8].isActive == false)return;
    for (var i = 8; i <= 10; i++) {
      buttons[i].isActive = false;
    }
    var dif = buttons[8].y-buttons[1].y;
    for (var i = 4; i <= 7; i++) {
      buttons[i].y -= dif;
      buttons[i].y1 -= dif;
      buttons[i].setTooltipPos();
    }
  }else{
    if(buttons[8].isActive == false){
      var dif = buttons[8].y-buttons[1].y;
      for (var i = 4; i <= 7; i++) {
        buttons[i].y += dif;
        buttons[i].y1 += dif;
        buttons[i].setTooltipPos();
      }
    }
    for (var i = 8; i <= 10; i++) {
      drawBuildButton.call(this,buttons[i]);
    }
    this.push();
    this.strokeWeight(0.1);
    this.stroke(0);
    this.line(buttons[1].x,buttons[1].y1,buttons[8].x,buttons[8].y);
    this.line(buttons[1].x1,buttons[1].y1,buttons[10].x1,buttons[10].y);
    this.pop();
  }
}

function initCanvas(b){
  if(b == undefined)b = (this != window);
  if(b)this.drawingContext.clearRect(0, 0, this.width, this.height);
  if(this.drawingContext.globalAlpha != 1.0)this.drawingContext.globalAlpha = 1.0;
  this.translate(offset.x,offset.y);
  this.scale(scl,scl);
  this.translate(0.5,0.5);
}

function clearCanvas(){
  //this.drawingContext.clearRect(0,0, (this.width), (this.height));
  if(this.drawingContext.globalAlpha != 1.0)this.drawingContext.globalAlpha = 1.0;
  this.drawingContext.clearRect(-offset.x/1,-offset.y/1, (this.width+offset.x), (this.height+offset.y));
}

function drawTowerRange(a) {
  //a||(a = highlightedTower)||(a = selectedTower);
  if(!a)return;
  this.push();
  this.noFill();
  this.strokeWeight(0.1);
  this.stroke('white');
  this.ellipse(a.pos.x,a.pos.y,a.Range*2,a.Range*2);
  /*if(tweakables.showTowerTarget){
    selectedTower.onTargetChangedEvents.highlightTarget = Tower.highlightTarget;
  }*/
  this.pop();
}

function drawClock(){
  var size = 1;
  this.push();
  this.noFill();
  this.translate(img.width+size*1/*3*/ /*uixcoord-size-0.6*/,size-0.5);
  this.strokeWeight(0.1);
  this.stroke('black');
  this.ellipse(0,0,size*2,size*2);
  this.push();
  this.rotate(_gameSpeed1*PI/4);
  var arrowScl = 0.8;
  this.line(0,0,0,-size*arrowScl);
  this.ellipse(0,0,0.2,0.2);
  var dy = size*0.1;
  var dx = size*0.1;
  this.triangle(0,-size*arrowScl,dx,-size*arrowScl+dy,-dx,-size*arrowScl+dy);
  this.pop();
  if(isPaused){
    var dx1 = 0.3;
    var dy1 = 0.3;
    if(tweakables.coverClockWhenPaused){
      this.noStroke();
      this.fill('white');
      this.rectMode(CORNERS);
      this.rect(-dx1,-dy1,dx1,dy1);
    }
    this.stroke('red');
    this.strokeWeight(0.3);
    this.strokeCap(PROJECT);
    this.line(-dx1,-dy1,-dx1,dy1);
    this.line(dx1,-dy1,dx1,dy1);
  }
  this.pop();
  /*uiLayer.rectMode(CORNERS);
  uiLayer.strokeWeight(0.1);
  uiLayer.noFill();
  uiLayer.rect(img.width,-0.5,img.width+2*size,2*size-0.5);*/
}

var buildScreenSize = 0.63;//if you need 3 items
//var buildScreenSize = 0.95;//if you need 2 items

function drawBuildScreen(){
  var size = buildScreenSize;
  for (var i = 1; i <= 3; i++) {
    drawBuildButton.call(this,buttons[i]);
  }
}

function drawBuildButton(button){
  button.isActive = true;
  var name = button.name;var textureId = button.textureId;var x = button.x;var y = button.y;
  var b = (buildMode == name);
  if(button.condition)var b = eval(button.condition);
  this.push();
  this.strokeWeight(0.1);
  this.stroke('black');
  this.rectMode(RADIUS);
  var size = buildScreenSize;
  if(x != undefined && y != undefined)this.translate(x+size,y+size);
  if(!tweakables.buttonMode){
    if(!b){this.fill(tweakables.buttonColorOff);}else{this.fill(tweakables.buttonColorOn);}
    this.rect(0,0,size,size);
  }else{
    if(!b){var t = 11;}else{var t = 12;}
    this.image(tileGraphics[t],-size,-size,2*size,2*size);
  }
  this.image(tileGraphics[textureId],-0.5,-0.5,1,1);
  this.pop();
}

function drawBuildPreview(){
  if((buildMode == 'demolish'||buildMode == 'undefined')&&!towerBeingMoved)return;
  if(!highlightedTile)return;
  var x = highlightedTile.x;var y = highlightedTile.y;
  var context = uiLayer.drawingContext;
  if(buildMode == 'buildWall'){
    var _image = tileGraphics[4];
    if(highlightedTile.value != 7)return;
  }
  if(buildMode == 'buildTower'||towerBeingMoved){
    var _image = tileGraphics[8];
    if(highlightedTile.value != 2)return;
  }
  var t = context.globalAlpha;
  context.globalAlpha = 0.5;
  uiLayer.image(_image,x-0.5,y-0.5,1,1);
  context.globalAlpha = 1.0;
}

function undrawBuildPreview(){
  if((buildMode == 'demolish'||buildMode == 'undefined'||buildMode == undefined)&&!towerBeingMoved)return;
  if(buildMode == 'buildWall'&&highlightedTile.value != 7)return;
  if((buildMode == 'buildTower'||towerBeingMoved)&&highlightedTile.value != 2)return;
  var x = highlightedTile.x;var y = highlightedTile.y;
  uiLayer.drawingContext.clearRect(x-0.5,y-0.5, 1, 1);
  //drawTowerRange.call(uiLayer,selectedTower);
}

function drawVector(v) {
  push();
  var dir = vectorToDir(v);
  rotate(dir/4*2*PI);
  fill('green');
  stroke('green');
  strokeWeight(0.2);
  scale(0.5,0.5); 
  line(0,0,0,-1);
  ellipse(0,0,0.1,0.1);
  var dy = 0.1;
  var dx = 0.1;
  triangle(0,-1,dx,-1+dy,-dx,-1+dy);
  pop();
}

function drawConectedTile(x,y,b){
  if(!peek(x,y))return;
  var dirToVectorRom = [{x:0,y:-1},{x:1,y:-1},{x:1,y:0},{x:1,y:1},{x:0,y:1},{x:-1,y:1},{x:-1,y:0},{x:-1,y:-1}];
  var bits = [];
  for (var i = 0; i < 8; i++) {
    var v = dirToVectorRom[i];
    bits[i] = peek(x+v.x,y+v.y);
  }
  this.line1 = line1;
  this.push();
  this.translate(x,y);
  /*if(b){this.stroke(0);}else{this.stroke(255);}
  this.strokeWeight(0.1);
  this.strokeCap(SQUARE/*PROJECT);*/
  if(!b)this.drawingContext.setLineDash([0.2,0.2]);
  //if(b)this.strokeWeight(0.2);
  var s1 = tweakables.smallShadowSize;
  var s2 = tweakables.bigShadowSize;
  var s0 = (s2-s1)/2;
  if(!bits[0])this.line1(-0.5,-0.5,0.51,-0.5);
  if(!bits[6])this.line1(-0.5,-0.51,-0.5,0.5+s2/2);
  //if(b)this.strokeWeight(0.1);
  if(!bits[2])this.line1(0.5+s0,-0.51,0.5+s0,0.5+s2/2);
  if(!bits[4])this.line1(-0.5-s1/2,0.5+s0,0.5+s2/2,0.5+s0);
  if(!b)this.drawingContext.setLineDash([]);
  this.pop();
}

function line1(x,y,x1,y1){
  var ctx = this.drawingContext;
  ctx.moveTo(x,y);
  ctx.lineTo(x1,y1);
}

function peek(x,y){
  try{
    return grid[x][y].b;
  }catch(e){return true;}
}