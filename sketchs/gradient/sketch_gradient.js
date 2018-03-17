var list = [];
var scl = 10;
var offset;
var pos;
var step = 100;
var devy = 0;
var devx = 0;
var speed = 5;

function setup() {
  colorMode(HSB);
  noiseDetail(2,0.6)
  noiseSeed(1);
  offset = createVector(0,0);
  createCanvas(1000, 500);
  background(0);
  pos = createVector(random()*width,random()*height);
  var x = 0;
  var y = 0;
  list.push(createVector(x,y,wave(x,y)));
  x = width;
  y = height;
  list.push(createVector(x,y,wave(x,y)));
  for(var i = 0;i < 2;i++){
    x = random()*width;
    y = random()*height;
    list.push(createVector(x,y,wave(x,y)));
  }
  //ellipse(list[i].x, list[i].y, scl, scl);
}

function draw() {
  background(0);
  strokeWeight(2);
  for(var i=0;i < list.length;i++){
    stroke(list[i].z,255,255);
    translate(offset.x,offset.y);
    point(list[i].x, list[i].y);
  }
  push();
  fill('white');
  noStroke();
  ellipse(pos.x, pos.y, scl, scl);
  pop();
  coreR();
}

function wave(x,y) {
  return noise(x/width*10,y/height*10,0)*360;
}

function coreR(){
  var matingpool = [];
  list.sort(new Function ('a','b',"return a.z - b.z;")).reverse();
  if(list.length > 1000){list.splice(1000, Number.MAX_VALUE);}
  for (var i = 0; i < list.length; i++) {
    if(matingpool.length > 1000){break;}
    var n = list[i].z / 10;
    for (var j = 0; j < n; j++) {
      matingpool.push(list[i]);
    }
  }
  //var ll = list.length;
  
  for (var i = 0; i < speed; i++) {
    var parentA = random(matingpool);
    var parentB = random(matingpool);
    var child = crossover(parentB,parentA);
    child.x = modulo(child.x, width-10);
    child.y = modulo(child.y, height-10);
    list.push(mutation(child));
  }
}

function mutation(c){
  var r = p5.Vector.random2D();
  var s = (random()*step)+1
  var x = c.x + r.x*s;
  var y = c.y + r.y*s;
  return createVector(x,y,wave(x,y));
}

function crossover(p1,p2){
  var x = (random()>=0.5)?p1.x:p2.x;
  var y = (random()>=0.5)?p1.y:p2.y;
  return createVector(x,y,wave(x,y));
}

function core(){
  var l = list;
  l.sort(new Function ('a','b',"return a.x - b.x;"));
  var i=0;
  while(true){
    if(i == l.length) {break;}
    try{
      if(pos.x > l[i].x&&pos.x<=l[i+1].x) {break;}
    }catch(e){i = l.length-1; break;}
    i++;
  }
  var d = (l[i].z-l[i+1].z)/(l[i].x-l[i+1].x);
  d = (2*devx+d)/3;
  devx = d;
  var s = constrain(step/abs(d),0,10);
  var p = (d < 0)? l[i].x-s : l[i+1].x+s;
  p = modulo(p, width-10);
  pos.x = p;
  
  l.sort(new Function ('a','b',"return a.y - b.y;"));
  var i=0;
  while(true){
    if(i == l.length) {break;}
    try{
      if(pos.y > l[i].y&&pos.y<=l[i+1].y) {break;}
    }catch(e){i = l.length-1; break;}
    i++;
  }
  var d = (l[i].z-l[i+1].z)/(l[i].y-l[i+1].y);
  d = (2*devy+d)/3;
  devy = d;
  var s = constrain(step/abs(d),0,10);
  var p = (d < 0)? l[i].y-s : l[i+1].y+s;
  p = modulo(p, width-10);
  pos.y = p;
  list.push(createVector(pos.x,pos.y,wave(pos.x,pos.y)));
  
  if(abs(devx) < 0.001 && abs(devy) < 0.001){pos = createVector(random()*width,random()*height);}
}
/*
function coreHelper(pos,l){
  var i=0;
  while(true){
    if(i == l.length) {break;}
    try{
      if(pos > l[i]&&pos<=l[i+1]) {break;}
    }catch(e){i = l.length-1; break;}
    i++;
  }
  var d = (l[i].z-l[i+1].z)/(l[i].x-l[i+1].x);
  d = (2*dev+d)/3;
  dev = d;
  var s = (step/abs(d));
  var p = (d < 0)? l[i].x-s : l[i+1].x+s;
  p = modulo(p, width-10);
}

function arr_x (a1) {
    a1.sort(new Function ('a','b',"return a.x - b.x;"));
    var a = [], diff = [];
    for (var i = 0; i < a1.length; i++) {
        a[a1[i].x] = true;
    }
    for (var k in a) {
        diff.push(k);
    }
    return diff;
}

function arr_y (a1) {
    a1.sort(new Function ('a','b',"return a.y - b.y;"));
    var a = [], diff = [];
    for (var i = 0; i < a1.length; i++) {
        a[a1[i].y] = true;
    }
    for (var k in a) {
        diff.push(k);
    }
    return diff;
}
*/
function mousePressed(){
  //core();
}

function modulo(a,b){
  return a - b * floor(a/b);
}