var Plane;
var offset;
var scl = 30;
var frDiv;
var Dtime;
var can;
var tool = 0;
var tools = [];
var pos;
var dragMode = 0;
var DragPosition;
var wasDragged;
var selection = [];
var buffer;
var delay = 1;

var doClockCicle = true;
var clockEvents = []; 

function setup() {
  offset = createVector(20,20);
  pos = createVector(5,5);
  can = createCanvas(510,510);
  Plane = new Wplane(50);
  frDiv = createDiv('');
  can.elt.addEventListener('contextmenu', function(ev) { ev.preventDefault();return false; }, false);
  
  tools.push(Block1);
  tools.push(Block2);
  tools.push(Block3);
  tools.push(Block4);
  tools.push(Block5);
  
  clock(50);
}

async function clock(delay) {
  while(doClockCicle){
    //print('clock');
    for(var i = 0;i < clockEvents.length;i++){
      clockEvents[i].clockUpdate();
    }
    await sleep(delay);
  }
}

function draw() {
  frDiv.html(floor(frameRate())+" "+floor(millis()-Dtime));//print(floor(frameRate())+" "+floor(millis()-Dtime));//temp
  background(255,100);
  Plane.smartDraw(pos.x,pos.y,round(((500/scl)/2)-1));
  //Plane.draw();
  
  Dtime = millis();
  if(dragMode == 1){
    if(wasDragged){
      push();
      //translate(-scl/2,-scl/2);
      rectMode(CORNERS);
      fill(100,100,0,200);
      var c = getMouseCords();
      var x = round(c.x);
      var y = round(c.y);
      rect(DragPosition.x*scl+offset.x,DragPosition.y*scl+offset.y,x*scl+offset.x,y*scl+offset.y);
      pop();
    }
  }
}

function mouseWheel(event) {
  if(!keyIsDown(SHIFT)){
    tool -= (event.delta > 0)? 1:-1;
    if(tool<0){tool = 0;}
    if(tool>tools.length-1){tool = tools.length-1;}
  }else{
    scl -= (event.delta > 0)? 1:-1;
    if(scl<5){scl = 5;}
    if(scl>30){scl = 30;}
  }
}

function mousePressed(){
  DragPosition = undefined;
  var c = getMouseCords();
  var x = round(c.x);
  var y = round(c.y);
  
  if(Plane.tiles[x] !== undefined){
    if(Plane.tiles[x][y] !== undefined){
      if(dragMode == 0){
        if (mouseButton == LEFT){
          Plane.tiles[x][y].click(new tools[tool]);
        }else if(mouseButton == RIGHT){
          Plane.tiles[x][y].removeBlock();
        }else{Plane.tiles[x][y].click();}
      }else if(dragMode == 1){
        selection = [];
        DragPosition = createVector(x,y);
      }
    }
  }
}

function mouseDragged(){
  if(dragMode == 1){
    if(DragPosition !== undefined){
      wasDragged = true;
    }
  }
}

function mouseReleased(){
  var c = getMouseCords();
  var x = round(c.x);
  var y = round(c.y);
  if(dragMode == 1){
    if(wasDragged){
      selection = [];
      selection.push(max(min(x,DragPosition.x),0));
      selection.push(max(min(y,DragPosition.y),0));
      selection.push(min(max(x,DragPosition.x),Plane.tiles.length-1));
      selection.push(min(max(y,DragPosition.y),Plane.tiles.length-1));
      
      wasDragged = false;
      //dragMode = 0;//maybe
      Plane.highlight(selection[0],selection[1],selection[2],selection[3]);
    }
  }
}

function dir(x,y){
  pos.x += x;
  pos.y += y;
}

function clearSelection(){
  selection = [];
  Plane.highlight();
  dragMode = 0;
}

function getMouseCords(){
  if(true){
    var ux = (mouseX - width /2 + pos.x*scl)/scl;
    var uy = (mouseY - height/2 + pos.y*scl)/scl;
  }else{
    var ux = (mouseX - offset.x)/scl;
    var uy = (mouseY - offset.y)/scl;
  }
  return createVector(ux,uy);
}

function keyPressed() {
  if (keyCode === UP_ARROW || key == "W") {
    dir(0, -1);
  }else if (keyCode === DOWN_ARROW || key == "S") {
    if(keyIsDown(SHIFT)){
      localStorage["buffer"] = Plane.encode(0,0,Plane.tiles.length-1,Plane.tiles.length-1);
    }else{
      dir(0, 1);
    }
  }else if (keyCode === RIGHT_ARROW || key == "D") {
    dir(1, 0);
  }else if (keyCode === LEFT_ARROW || key == "A") {
    dir(-1, 0);
  }else if (keyCode === ESCAPE) {
    clearSelection();
  }else if (keyCode === DELETE) {
    Plane.resetArea(selection[0],selection[1],selection[2],selection[3]);
    //clearSelection();//maybe
  }else if (key == "C") {
    buffer = Plane.encode(selection[0],selection[1],selection[2],selection[3]);
  }else if (key == "L") {
    if(localStorage["buffer"] !== undefined){Plane.decode(0,0,localStorage["buffer"]);}
  }else if (key == "V") {
    var c = getMouseCords();
    Plane.decode(round(c.x),round(c.y),buffer);
  }else if (key == "Z") {
    if(dragMode == 0){dragMode = 1;}else{dragMode = 0;/*clearSelection();*/}
  }else if (key == "1") 
  {tool = 0;}else if (key == "2") 
  {tool = 1;}else if (key == "3") 
  {tool = 2;}else if (key == "4") 
  {tool = 3;}else if (key == "5") 
  {tool = 4;}else if (key == "6") 
  {tool = 5;}else if (key == "7") 
  {tool = 6;}else if (key == "8") 
  {tool = 7;}else if (key == "9") 
  {tool = 8;}
}

async function delayEval(ms,str) {
  await sleep(ms);
  eval(str);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}