var scl = 30;
var Offset = 100;
var Plane,p1,p2;
var turtles = [];var t1 = [];var t2 = [];
var s;
var us;
//var sortByTime = true;
var speed = 1;
var inc = 0;

function setup() {
  p1 = new Wplane(20);
  p2 = new Wplane(20);
  createCanvas(2*Offset+p1.tiles.length*scl*2,Offset+p1.tiles.length*scl+Offset/2);
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET",'../data.txt',false);
  xmlHttp.setRequestHeader('Expires',' Tue, 03 Jul 2001 06:00:00 GMT');
  xmlHttp.setRequestHeader('Last-Modified','{now} GMT');
  xmlHttp.setRequestHeader('Cache-Control','max-age=0, no-cache, must-revalidate, proxy-revalidate')
  xmlHttp.send();
  us = xmlHttp.responseText.split("\\n");
  //if(sortByTime){
  s = us.slice().sort(/*function(a, b) {
    return parseInt(a.split(":")[0]) - parseInt(b.split(":")[0]);
  }*/);
  //}
}

function draw() {
  background(255);
  Plane = p1;
  offset = createVector(Offset,Offset);
  turtles = t1;
  
  Plane.draw();
  for(i = 0;i < turtles.length;i++){
    turtles[i].draw();
  }
  
  if(inc < s.length){
  //for(j = 0;j < speed;j++){
    var c = s[inc].split(":");
    eval(c[c.length-1]);
    //inc++;
  //}
  }
  
  Plane = p2;
  offset = createVector(Offset+Plane.tiles.length*scl+Offset/2,Offset);
  turtles = t2;
  
  Plane.draw();
  for(i = 0;i < turtles.length;i++){
    turtles[i].draw();
  }
  
  if(inc < s.length){
  //for(j = 0;j < speed;j++){
    var c = us[inc].split(":");
    eval(c[c.length-1]);
    inc++;
  //}
  }
}