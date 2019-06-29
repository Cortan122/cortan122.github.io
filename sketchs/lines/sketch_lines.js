var scl = 10;
var img;
var lookRotation = Math.PI;
var pos;
var fov = 1;
var canvas;
var res = 200;
var showMapScreen = true;

var raycastLimit = 100;

var tweakables = {
  movementSpeed:0.1,
  rotationSpeed:0.01,
  inputRepeatDelay:5,
  inputRepeatSpeed:-1,
  showFPS:true,
  metaStart:false,
};

var inputRom = [
  {keys:['O','T'],action:'lib.tweaker.toggleTweakables()'},
  {keys:['M'],action:'showMapScreen = !showMapScreen'},
  {keys:['W','up'],action:'move(0)',repeatable:true},
  {keys:['A','left'],action:'move(3)',repeatable:true},
  {keys:['S','down'],action:'move(2)',repeatable:true},
  {keys:['D','right'],action:'move(1)',repeatable:true},
  {keys:['E','pgup'],action:'lookRotation += tweakables.movementSpeed;',repeatable:true},
  {keys:['Q','home'],action:'lookRotation -= tweakables.movementSpeed;',repeatable:true},
];

function preload(){
  img = loadImage("img.png");
}

function setup(){
  canvas = createCanvas(1100,510);
  background(0);
  img.loadPixels();
  pos = getPlayerPos();

  pointerLockSetup();
}

function draw(){
  if(showMapScreen){
    debug_draw();
  }else{
    truedraw(res);

    var size = 100;
    var scl = size/img.height;
    var context = canvas.elt.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.drawImage(img.canvas,width-size-10,10,size,size);
    fill('green');
    ellipse(pos.x*scl+width-size-10,pos.y*scl+10,scl,scl);
  }
}

function debug_draw(){
  if(height!=500)resizeCanvas(500,500);
  background(0);

  var size = height-20;
  scl = size/img.height;
  var context = canvas.elt.getContext('2d');
  context.imageSmoothingEnabled = false;
  context.drawImage(img.canvas,10,10,size,size);

  push();
  translate(scl/2,scl/2);
  var a = atan2(mouseY/scl-pos.y-1,mouseX/scl-pos.x-1);
  var ray = raycast_3(a,pos.x,pos.y);
  stroke('green');
  scale(scl);
  strokeWeight(.1);
  if(ray)line(pos.x,pos.y,ray.x,ray.y);
  pop();
}

function truedraw(resolution){
  if(height!=510)resizeCanvas(1100,510);
  background(0);
  //translate(width/4,height/4);
  //scale(0.5, 0.5);
  var x0 = pos.x;
  var y0 = pos.y;

  for(var i = 0; i < resolution; i++){
    var a = ((i/resolution)*fov*PI)+lookRotation;

    var ray = raycast_3(a, x0, y0);
    if(ray==null)continue;
    var {c} = ray;
    var d = dist(x0,y0,ray.x,ray.y);
    push();
    stroke(c);
    strokeWeight(width/(resolution+0));
    var y = (height-0)/2;
    var dy = y/d;
    var x = i*(width-0)/(resolution+0);
    line(x,y+dy,x,y-dy);

    pop();
  }
}

function move(n){
  var v = dirToVector(n).mult(tweakables.movementSpeed);
  dir(v.x,-v.y);
}

function dir(x,y){
  var pos1x = pos.x;
  var pos1y = pos.y;
  var c = checkMap(pos.x,pos.y);
  var prevA = alpha(c);
  var r = rotation(x,y,lookRotation);
  pos.x += r.x;
  pos.y += r.y;

  var offset = createVector(0,0);
  var c = checkMap(pos.x,pos.y,offset);
  if(prevA != 254)pos.add(offset);
  if(alpha(c) == 255 && prevA != 255){
    pos.x = pos1x;
    pos.y = pos1y;
  }
  pos.x = modulo(pos.x,img.width);
  pos.y = modulo(pos.y,img.height);
}

function rotation(x,y,a){
  a -= Math.PI;
  var r = sqrt(x*x+y*y);
  var a1 = a-atan2(y,x);
  return createVector(cos(a1)*r,sin(a1)*r);
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

function checkMap(x,y,offset=createVector(0,0),dir=null){
  x = floor(x+offset.x);
  y = floor(y+offset.y);
  x = modulo(x,img.width);
  y = modulo(y,img.height);
  var index = (x + y*img.width) * 4;
  var r = img.pixels[index];
  var g = img.pixels[index+1];
  var b = img.pixels[index+2];
  var a = img.pixels[index+3];

  if(a == 254 && (b==dir || dir==null))offset.add(r-x,g-y+1);
  return color(r,g,b,a);
}

function raycast_3(angle,x,y){
  x = round(x*1000)/1000;
  y = round(y*1000)/1000;
  if(tan(angle)<0)angle += PI;
  var V = createVector;
  var tileStepY = (cos(angle)>0?1:-1);
  var tileStepX = (sin(angle)>0?1:-1);
  var dx = modulo(x,1);
  var dy = modulo(y,1);
  var Dx = 1/abs(tan(angle))*tileStepX;
  var Dy = 1*abs(tan(angle))*tileStepY;
  var p1 = V(x+(1-dy)/tan(angle), ceil(y+.0001), 0);
  var p2 = V(ceil(x+.0001), y+(1-dx)*tan(angle), 1);
  if(tileStepY<0){
    if(dy==0)dy = 1;
    var p1 = V(x-dy/tan(angle), floor(y-.0001), 0);
  }
  if(tileStepX<0){
    if(dx==0)dx = 1;
    var p2 = V(floor(x-.0001), y-dx*tan(angle), 1);
  }
  var offset = createVector(0,0);

  for(var i = 0; i < raycastLimit; i++){
    while((p1.x < p2.x)==(Dx > 0)){
      var c = checkMap(p1.x, p1.y+.0001*tileStepY, offset, 0);
      if(alpha(c) == 255)return p1.c = c, p1;
      p1.x += Dx;
      p1.y += tileStepY;
      i++;
      if(i>raycastLimit)return null;
    }
    while((p2.y < p1.y)==(Dy > 0)){
      var c = checkMap(p2.x+.0001*tileStepX, p2.y, offset, 1);
      if(alpha(c) == 255)return p2.c = c, p2;
      p2.x += tileStepX;
      p2.y += Dy;
      i++;
      if(i>raycastLimit)return null;
    }
  }
  return null;
}
