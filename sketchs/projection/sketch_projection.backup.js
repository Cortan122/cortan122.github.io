var arrP = [];
var arrE = [];
var arrF = [];
var scl = 50;
var offset = 0;
var sliderA;
var sliderB;
var sliderC;
var lastMousePos;
var a = 180;
var b = 90;
var c = 90;
var doUpdateT = true;

var colorF = false;
var textP = false;
var doUpdateG = true;
var sliderMode = 0;
var zoom = 10;

function setup() {
  createCanvas(500, 500);
  sliderA = createSlider(0, 360,180);
  sliderA.position(width+25, 25);
  sliderA.changed(doUpdate);
  sliderB = createSlider(0, 360,90);
  sliderB.position(width+25, 50);
  sliderB.changed(doUpdate);
  sliderC = createSlider(0, 360,90);
  sliderC.position(width+25, 75);
  sliderC.changed(doUpdate);
  angleMode(DEGREES);
  strokeWeight(10);
  background(100);
  
  arrP.push(createVector(1,1,1));//arrP.push(createVector(2,1,1));
  arrP.push(createVector(1,1,-1));
  arrP.push(createVector(1,-1,-1));
  arrP.push(createVector(1,-1,1));
  arrP.push(createVector(-1,-1,1));
  arrP.push(createVector(-1,-1,-1));
  arrP.push(createVector(-1,1,-1));
  arrP.push(createVector(-1,1,1));
  arrP.push(createVector(0,0,0));
  
  arrE.push([arrP[0],arrP[7]]);
  arrE.push([arrP[0],arrP[3]]);
  arrE.push([arrP[0],arrP[1]]);
  arrE.push([arrP[5],arrP[4]]);
  arrE.push([arrP[5],arrP[6]]);
  arrE.push([arrP[5],arrP[2]]);
  arrE.push([arrP[4],arrP[7]]);
  arrE.push([arrP[6],arrP[7]]);
  arrE.push([arrP[4],arrP[3]]);
  arrE.push([arrP[2],arrP[3]]);
  arrE.push([arrP[2],arrP[1]]);
  arrE.push([arrP[6],arrP[1]]);
  
  arrF.push([arrP[0],arrP[1],arrP[3]]);
  arrF.push([arrP[0],arrP[1],arrP[7]]);
  arrF.push([arrP[0],arrP[3],arrP[7]]);
  arrF.push([arrP[5],arrP[2],arrP[4]]);
  arrF.push([arrP[5],arrP[2],arrP[6]]);
  arrF.push([arrP[5],arrP[4],arrP[6]]);
  arrF.push([arrP[6],arrP[1],arrP[7]]);
  arrF.push([arrP[2],arrP[1],arrP[3]]);
  arrF.push([arrP[7],arrP[6],arrP[4]]);
  arrF.push([arrP[1],arrP[2],arrP[6]]);
  arrF.push([arrP[2],arrP[3],arrP[4]]);
  arrF.push([arrP[7],arrP[3],arrP[4]]);
  
} 

function draw() {
  //background(100);
  if((sliderMode >>> 0)%2 == 1){a++;}else{a = sliderA.value();}
  if((sliderMode >>> 1)%2 == 1){b++;}else{b = sliderB.value();}
  if((sliderMode >>> 2)%2 == 1){c++;}else{c = sliderC.value();}
  ellipse(mouseX, mouseY, 20, 20);
  translate(width/2,height/2);
  if(doUpdateT){trueDraw(); doUpdateT = doUpdateG; }
}

function trueDraw() {
  background(100);
  drawF(a,b);
  drawP(a,b);
  drawE(a,b);
}

function drawE(a,b){
  push();
  strokeWeight(2);
  stroke(0,100);
  for(i = 0;i < arrE.length;i++){
    var x  = arrE[i][0].x;var y  = arrE[i][0].y;var z  = arrE[i][0].z;
    var x1 = arrE[i][1].x;var y1 = arrE[i][1].y;var z1 = arrE[i][1].z;
    //line(x*scl,y*scl,x1*scl,y1*scl);
    line(rotation3d(x,y,z,a,b).x*scl+offset*2,rotation3d(x,y,z,a,b).y*scl,rotation3d(x1,y1,z1,a,b).x*scl+offset*2,rotation3d(x1,y1,z1,a,b).y*scl);
  }
  pop();
}

function drawP(a,b){
  for(i = 0;i < arrP.length;i++){
    var x = arrP[i].x;var y = arrP[i].y;var z = arrP[i].z;
    //point(x*scl,y*scl);
    point(rotation3d(x,y,z,a,b).x*scl+offset*2,rotation3d(x,y,z,a,b).y*scl);
    if(textP){
      push();
      noStroke();
      fill(255);
      text(i, rotation3d(x,y,z,a,b).x*scl+offset*2 ,rotation3d(x,y,z,a,b).y*scl);
      pop();
    }
  }
}

function drawF(a,b){
  push();
  colorMode(HSB,255,255,255,255);
  strokeWeight(0);
  if(arrE.length == 0){strokeWeight(2);stroke(0,100);}
  fill(255,50);
  //stroke(0,100);
  for(i = 0;i < arrF.length;i++){
    if(colorF){
      fill((i*10)%255,255,255,50);
    }
    var x  = arrF[i][0].x;var y  = arrF[i][0].y;var z  = arrF[i][0].z;
    var x1 = arrF[i][1].x;var y1 = arrF[i][1].y;var z1 = arrF[i][1].z;
    var x2 = arrF[i][2].x;var y2 = arrF[i][2].y;var z2 = arrF[i][2].z;
    //triangle(x*scl,y*scl,x1*scl,y1*scl,x2*scl,y2*scl);
    triangle(rotation3d(x,y,z,a,b).x*scl+offset*2,rotation3d(x,y,z,a,b).y*scl,rotation3d(x1,y1,z1,a,b).x*scl+offset*2,rotation3d(x1,y1,z1,a,b).y*scl,rotation3d(x2,y2,z2,a,b).x*scl+offset*2,rotation3d(x2,y2,z2,a,b).y*scl);
  }
  pop();
  colorMode(RGB);
}

function loadMesh(data) {
  arrF = [];
  arrP = [];
  arrE = [];
  var s = data.split("\n");
  arrP.push(createVector(0,0,0));
  for(i = 0;i < s.length;i++){
    if(s[i][0] == 'v'){
      var c = s[i].split(" ").filter(isNotEmpty);
      arrP.push(createVector(c[1],c[2],c[3]));
    }
    if(s[i][0] == 'f'){
      var c = s[i].split(" ").filter(isNotEmpty);
      arrF.push([arrP[c[1]],arrP[c[2]],arrP[c[3]]]);
    }
  }
  doUpdate();
}

function doUpdate() {doUpdateT = true;}

function isNotEmpty(value) {
  return (value != "");
}

function mousePressed() {
  lastMousePos = createVector(mouseX,mouseY);
}

function mouseDragged(){
  //var sensitivity = 1; 
  //var currentMousePos = createVector(mouseX,mouseY);
  //var mouseMovement = createVector(currentMousePos.x - lastMousePos.x,currentMousePos.y - lastMousePos.y,0);
  ////mouseMovement = rotation3d(mouseMovement.x,mouseMovement.y,0,a,b);
  //a += mouseMovement.y * sensitivity;
  //b += -mouseMovement.x * sensitivity;
  //lastMousePos = currentMousePos;
}

function mouseWheel(event) {
  scl -= event.delta/50;
  doUpdate();
}

function project(x,y,a) {
  return rotation(x,y,a).y;
  return (x*sin(a) - y*cos(a));
}

function rotation(x,y,a) {
  var r = sqrt(x*x+y*y);
  var a1 = a-atan2(y,x);
  return createVector(sin(a1)*r,cos(a1)*r);
}

function rotation3d(x,y,z,a,b) {
  var d = x*x+y*y+z*z; 
  var r1 = rotation(x,y,a);
  var r2 = rotation(z,r1.y,c);
  var r3 = rotation(r1.x,r2.x,b);
  var m = 1;
  if(zoom != 0){m = (r3.y + zoom)/zoom;}
  return createVector(r3.x*m,r2.y*m,r3.y);
}