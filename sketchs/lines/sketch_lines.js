var scl = 10;
var img;
var lookRotation = 0;
var pos;
var frDiv;
var speed = 0.1;
var rotSpeed = 0.01;
var fov = 1;
var canvas;
var res = 200;

var raycastLimit = 100;
var doCalcOrientation = false;
var doProspective = 1;
var doLoop = true;
var doRotation = true;

function preload() {
  img = loadImage("img.png");
}

function setup() {
  canvas = createCanvas(1100,510);
  background(0);
  line122(1,10,3,5);
  img.loadPixels();
  frDiv = createDiv('');
  pos = getPlayerPos();
  truedraw(100);
  
  pointerLockSetup();
}

function draw() {
  frDiv.html(floor(frameRate())+" ");
  //line122((width/2)/scl,(height/2)/scl,mouseX/scl,mouseY/scl);
  
  keyboardUpdate();
  truedraw(res);
  if(true){
    var size = 100;
    var scl = (height*0.2-10)/img.height;
    fill('green');
    ellipse(pos.x*scl+width-size-10,pos.y*scl+10,10,10);
    var context = canvas.elt.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.drawImage(img.canvas,width-size-10,10,size,size);
  }
}

function calcOrientation(a,x0,y0,x1,y1){
  if(!doCalcOrientation)
    return (abs(cos(a)) < sqrt(2)/2);
  var a1 = atan2(y1-y0-.5,x1-x0-.5);
  var a2 = modulo(atan2(y1-y0+.5,x1-x0-.5),2*PI);
  var a3 = modulo(atan2(y1-y0+.5,x1-x0+.5),2*PI);
  var a4 = modulo(atan2(y1-y0-.5,x1-x0+.5),2*PI);
  var a0 = modulo(a,2*PI);
  if(a0<PI/2){
    return a0>a1;
  }else if(a0<PI){
    return a0<a4;
  }else if(a0<PI*1.5){
    return a0>a3;
  }else{
    return a0<a2||y1>-.55;
  }
}

function getDist(a,x0,y0,ray){
  var n = ray[1];

  var V = createVector;
  var x2 = cos(a)*10000+x0;
  var y2 = sin(a)*10000+y0;
  var x1 = ray[2];
  var y1 = ray[3];

  if(doProspective == 6){
    var lines = [
      [V(x1-.5,y1-.5),V(x1-.5,y1+.5)],
      [V(x1-.5,y1+.5),V(x1+.5,y1+.5)],
      [V(x1+.5,y1+.5),V(x1+.5,y1-.5)],
      [V(x1+.5,y1-.5),V(x1-.5,y1-.5)]
    ];
    var line = [V(x0,y0),V(x2,y2)];
    var t2 = lines.map(e=>intersectionChecker.point(e,line));
    var t1 = t2.filter(e=>e!=undefined);
    var t0 = t1.map(e=>dist(x0,y0,e.x,e.y));
    var pointdists = t0.sort();
    if(pointdists.length==0){
      //debugger;
      return 10000;
    }
    return pointdists[0];
  }

  var distance = dist(x0,y0,x1,y1);
  var orientation = calcOrientation(a,x0,y0,x1,y1);
  var deltax = abs(x0-x1)-.5;
  var deltay = abs(y0-y1)-.5;
  if(doProspective == 1)n = ray[1]/(orientation?sin(a):cos(a));
  if(doProspective == 2)n = distance;
  if(doProspective == 3)n = distance/(orientation?sin(a):cos(a));
  if(doProspective == 4)n = !orientation?deltax*cos(a):deltay*sin(a);
  if(doProspective == 5)n = ray[1]/(orientation?abs(sin(a)):abs(cos(a)));
  return n;
}

function truedraw(resolution){
  background(0);
  //translate(width/4,height/4);
  //scale(0.5, 0.5);
  var x0 = pos.x;
  var y0 = pos.y;
  
  for (var i = 0; i < resolution; i++) {
    var a = ((i/resolution)*fov*PI)+lookRotation;
    
    var x1 = (cos(a)*10)+x0;
    var y1 = (sin(a)*10)+y0;
    var ray = raycast(x0, y0, x1, y1);
    var c = ray[0];
    var n = getDist(a,x0,y0,ray);
    push();
    stroke(c);
    strokeWeight(width/(resolution+0));
    var y = (height-0)/2;
    var dy = y/n;
    var x = i*(width-0)/(resolution+0);
    line(x,y+dy,x,y-dy);
    
    pop();
  }
}

function dir(x,y){
  var pos1x = pos.x;
  var pos1y = pos.y;
  var c = checkimg(pos.x,pos.y);
  var b = true;
  if(alpha(c) == 255){ b = false;}
  if(!doRotation){
    pos.x += x;
    pos.y += y;
  }else{
    var r = rotation(x,y,lookRotation);
    pos.x += r.x;
    pos.y += r.y;
  }
  var c = checkimg(pos.x,pos.y);
  if(alpha(c) == 255 && b){ 
    pos.x = pos1x;
    pos.y = pos1y;
  }
  if(alpha(c) == 254){pos.x = red(c);pos.y = green(c);}
}

function rotation(x,y,a) {
  var r = sqrt(x*x+y*y);
  var a1 = a-atan2(y,x);
  return createVector(cos(a1)*r,sin(a1)*r);
}

function keyboardUpdate() {
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
    dir(0, -speed);
  } 
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) {
    dir(0, speed);
  }
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(65)) {
    dir(speed, 0);
  } 
  if (keyIsDown(LEFT_ARROW) || keyIsDown(68)) {
    dir(-speed, 0);
  } 
  if (keyIsDown(81)) {
    lookRotation -= speed;
  }
  if (keyIsDown(69)) {
    lookRotation += speed;
  }
}

function getPlayerPos(){
  for(var i = 0;i < img.pixels.length/4 ;i++){
    if(1 == img.pixels[i*4+3]){
      var c = img.width;
      return createVector((i%c),floor(i/c));
    }
  }
  return createVector(img.width/2,img.height/2);
}

function checkimg(x,y,offset){
  if(doLoop){x = modulo(x,img.width);y = modulo(y,img.height);}
  if(offset == undefined){offset = createVector(0,0);}
  var index = (round(x+offset.x) + round(y+offset.y) * img.width) * 4;
  var r = img.pixels[index];
  var g = img.pixels[index+1];
  var b = img.pixels[index+2];
  var a = img.pixels[index+3];
  
  return color(r,g,b,a);
}

function raycast(x0, y0, x1, y1){
  x0 = round(x0);x1 = round(x1);y0 = round(y0);y1 = round(y1);
  var deltax = abs(x1 - x0);
  var deltay = abs(y1 - y0);
  var error = 0;
  var errorx = 0;
  var y = y0;
  var x = x0;
  var n = 0;
  var offset = createVector(0,0);
  while (n < raycastLimit){
    var c = checkimg(x,y,offset);
    if(alpha(c) == 255){break;}
    if(alpha(c) == 254){offset.x = red(c)-x;offset.y = green(c)-y;}
    error += deltay;
    errorx += deltax;
    if (2 * error >= deltax){
      y += ((y1 - y0) > 0 ?1:-1);
      error = error - deltax;
    }
    if (2 * errorx >= deltay){
      x += ((x1 - x0) > 0 ?1:-1);
      errorx = errorx - deltay;
    }
    n++;
  }
  return [c,n,x,y];
}

function line122(x0, y0, x1, y1){
  x0 = round(x0);x1 = round(x1);y0 = round(y0);y1 = round(y1);
  push();
  background(0);
  fill('red');
  ellipse(x0*scl,y0*scl,15,15);
  ellipse(x1*scl,y1*scl,15,15);
  pop();
  var deltax = abs(x1 - x0);
  var deltay = abs(y1 - y0);
  var error = 0;
  var errorx = 0;
  var y = y0;
  var x = x0;
  while (x != x1 || y != y1){
    ellipse(x*scl,y*scl,10,10);
    error += deltay;
    errorx += deltax;
    if (2 * error >= deltax){
      y += ((y1 - y0) > 0 ?1:-1);
      error = error - deltax;
    }
    if (2 * errorx >= deltay){
      x += ((x1 - x0) > 0 ?1:-1);
      errorx = errorx - deltay;
    }
  }
  ellipse(x1*scl,y1*scl,10,10);
}

function modulo(a,b){
  return a - b * floor(a/b);
}

var intersectionChecker = {
  onSegment:function(p,q,r){
    return (q.x <= max(p.x, r.x) && q.x >= min(p.x, r.x) &&
      q.y <= max(p.y, r.y) && q.y >= min(p.y, r.y));
  },
  orientation:function(p,q,r){
    // See http://www.geeksforgeeks.org/orientation-3-ordered-points/
    // for details of below formula.
    var val = (q.y - p.y) * (r.x - q.x) -
              (q.x - p.x) * (r.y - q.y);
    if (val == 0) return 0;  // colinear
    return (val > 0)? 1: 2; // clock or counterclock wise
  },
  doIntersect:function(p1, q1, p2, q2){
    // Find the four orientations needed for general and
    // special cases
    var o1 = intersectionChecker.orientation(p1, q1, p2);
    var o2 = intersectionChecker.orientation(p1, q1, q2);
    var o3 = intersectionChecker.orientation(p2, q2, p1);
    var o4 = intersectionChecker.orientation(p2, q2, q1);
    // General case
    if (o1 != o2 && o3 != o4)
      return true;
    // Special Cases
    // p1, q1 and p2 are colinear and p2 lies on segment p1q1
    if (o1 == 0 && intersectionChecker.onSegment(p1, p2, q1)) return true;
    // p1, q1 and p2 are colinear and q2 lies on segment p1q1
    if (o2 == 0 && intersectionChecker.onSegment(p1, q2, q1)) return true;
    // p2, q2 and p1 are colinear and p1 lies on segment p2q2
    if (o3 == 0 && intersectionChecker.onSegment(p2, p1, q2)) return true;
    // p2, q2 and q1 are colinear and q1 lies on segment p2q2
    if (o4 == 0 && intersectionChecker.onSegment(p2, q1, q2)) return true;
    return false; // Doesn't fall in any of the above cases
  },
  doIntersectE:function(e1,e2){
    return intersectionChecker.doIntersect(e1[0],e1[1],e2[0],e2[1]);
  },
  point:function(/*line*/ e1,/*line*/ e2){
    if(!intersectionChecker.doIntersectE(e1,e2))return undefined;
    var p1 = e1[0],p2 = e1[1],p3 = e2[0],p4 = e2[1];
    return createVector(((p1.x*p2.y-p1.y*p2.x)*(p3.x-p4.x)-(p1.x-p2.x)*(p3.x*p4.y-p3.y*p4.x))/((p1.x-p2.x)*(p3.y-p4.y)-(p1.y-p2.y)*(p3.x-p4.x)),((p1.x*p2.y-p1.y*p2.x)*(p3.y-p4.y)-(p1.y-p2.y)*(p3.x*p4.y-p3.y*p4.x))/((p1.x-p2.x)*(p3.y-p4.y)-(p1.y-p2.y)*(p3.x-p4.x)));
  }
}