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

var doProspective = 2;
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
    var n = ray[1];//*cos(a);//(abs(cos(a)) > sqrt(2)/2)?abs(sin(a)):abs(cos(a));
    if(doProspective == 1){n = ray[1]/((abs(cos(a)) < sqrt(2)/2)?sin(a):cos(a));/*n = dist(x0,y0,ray[2],ray[3]);*/}
    if(doProspective == 2){n = dist(x0,y0,ray[2],ray[3]);}
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
  while (n < 100){
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