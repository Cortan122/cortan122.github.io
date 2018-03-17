var scl = 200;
var offset = {x:100,y:0};

var points = [];
var centerPoint;

var step = 0.1;

function setup(){
  createCanvas(1000,500);
  background(0);
  //updateXY();

  //points.push(new Point(0,0));
  //points.push(new Point(0,1));
  //points.push(new Point(1,0));
  centerPoint = new Point(0,0);
}

function draw(){
  updateKeyboard();
  //updateXY();
  
  background(0);
  stroke(255);
  fill(255,100);
  strokeWeight(5);
  translate(0/*width/2*/,height/2);

  beginShape();
  for (var i = 0; i < points.length; i++) {
    var point1 = points[i];
    var x = point1.x;var y = point1.y;
    vertex(x*scl+offset.x,y*scl+offset.y);
    //point(x*scl+offset.x,y*scl+offset.y);
  }
  endShape(CLOSE);
  //endShape();
  stroke('red');
  var point1 = centerPoint;
  var x = point1.x;var y = point1.y;
  //vertex(x*scl+offset.x,y*scl+offset.y);
  point(x*scl+offset.x,y*scl+offset.y);
}

function Point(xrot,yrot){
  this.xrot = (xrot !== undefined)?xrot:0;
  this.yrot = (yrot !== undefined)?yrot:0;
  this.x = 0;
  this.y = 0;
  //return this;//??
}

Point.prototype.getPos = function() {
  return createVector(this.x,this.y);
}

Point.prototype.getRot = function() {
  return createVector(this.xrot,this.yrot);
}

Point.prototype.rotate = function(x,y) {
  this.yrot += y;
  if(abs(this.yrot) > HALF_PI){
    this.yrot = (this.yrot > 0)?(PI - this.yrot):-(TWO_PI - (PI - this.yrot));
    this.xrot += PI;
    step = -step;
  }
  this.xrot += x/sin(HALF_PI-this.yrot);
  this.xrot = modulo(this.xrot,TWO_PI);
  this.x = modulo(this.xrot,TWO_PI)/HALF_PI;
  this.y = -sin(this.yrot);
  return this;//??
}

function vectorStuf(v1,v2){
  return v1.copy().rotate(atan2(v2.y,v2.x)%HALF_PI);//.mult(-1);
}

function input(dir){
  var rom = [{x:0,y:step},{x:step,y:0},{x:0,y:-step},{x:-step,y:0}];
  var rot = rom[dir];
  if(points.length > 0){
    rot.__proto__ = p5.Vector.prototype;rot.z = 0;
    var slope = p5.Vector.sub(points[dir].getRot(),points[(dir+1)&3].getRot());
    var t = slope.x;
    slope.x = slope.y;
    slope.y = -t;
    slope.setMag(rot.mag());
    rot = slope;
  }
  centerPoint.rotate(rot.x,rot.y);
  var step2 = step/2;
  var rom1 = [{x:-step2,y:step2},{x:step2,y:step2},{x:step2,y:-step2},{x:-step2,y:-step2}];
  for (var i = 0; i < rom1.length; i++) {
    rot = rom1[i];
    if(slope != undefined){
      rot.__proto__ = p5.Vector.prototype;rot.z = 0;
      rot = vectorStuf(rot,slope);
    }
    points[i] = clone(centerPoint).rotate(rot.x,rot.y);
  }
}

function keyPressed(){
  if(key == "W") {
    input(0);//point1.rotate(0,step);//yrot += step;
  }else if(key == "S") {
    input(2);//point1.rotate(0,-step);//yrot -= step;
  }else if(key == "D") {
    input(1);//point1.rotate(step,0);//xrot += step;
  }else if(key == "A") {
    input(3);//point1.rotate(-step,0);//xrot -= step;
  }
}

function updateKeyboard(){
  if (keyIsDown(LEFT_ARROW)){
    input(3);//point1.rotate(-step,0);//xrot -= step;
  }if (keyIsDown(RIGHT_ARROW)){
    input(1);//point1.rotate(step,0);//xrot += step;
  }if (keyIsDown(UP_ARROW)){
    input(0);//point1.rotate(0,step);//yrot += step;
  }if (keyIsDown(DOWN_ARROW)){
    input(2);//point1.rotate(0,-step);//yrot -= step;
  }
}

function modulo(a,b){
  return a - b * floor(a/b);
}

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = {};//obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  copy.__proto__ = obj.constructor.prototype;
  return copy;
}