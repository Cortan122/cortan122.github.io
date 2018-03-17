var img;
var grid = [];
var pathfinder;
var particles = [];

var pathfindingMode = 1;
var drawVectors = true;
var minSpeed = 0.6;
var maxSpeed = 0.4;
var asyncVectors = 0;
var particleCount = 100;

var offset = {x:10,y:10};
var scl = 49;
var canvas;
var mapImage;
var vectorImage;

function preload() {
  img = loadImage("img.png");
}

function setup() {
  canvas = createCanvas(500, 500);
  rectMode(RADIUS/*CENTER*/);
  img.loadPixels();
  for (var x = 0; x < img.width; x++) {
    grid[x] = [];
    for (var y = 0; y < img.height; y++) {
      grid[x][y] = {b:(img.pixels[4*(y*img.width+x)] != 0),x:x,y:y};
    }
  }
  scl = scl*10/max(img.width,img.height);
  createVectorFeld();
  shuffleParticles();
}

function draw() {
  push();
  background(255);
  if(mapImage == undefined)newMapImage();
  canvas.drawingContext.drawImage(mapImage,0,0,width,height);
  ellipse(mouseX,mouseY,10,10);
  pop();

  translate(offset.x,offset.y);
  scale(scl,scl);
  for (var i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();
  }
}

function newMapImage(){
  push();
  background(255);
  translate(offset.x,offset.y);
  scale(scl,scl);
  fill(0);
  noStroke();//strokeWeight(0);
  for (var x = 0; x < grid.length; x++) {
    for (var y = 0; y < grid[0].length; y++) {
      //fill(!grid[x][y].b?0:'rgba(0,0,0,0)');
      if(!grid[x][y].b)rect(x,y,0.5,0.5);
      push();
      translate(x,y);
      if(grid[x][y].v && drawVectors)drawVector(grid[x][y].v);
      pop()
    }
  }
  pop();
  return mapImage = convertCanvasToImage(canvas);
}

function keyPressed(){
  var t = true;
  if(key == ' '){
    randomVectorFeld();//createVectorFeld({x:img.width-1,y:img.height-1});
  }else if(key == 'R'){
  }else if(key == 'S'){
    shuffleParticles();
  }else if(key == 'V'){
    drawVectors = !drawVectors;
  }else{t = false;}
  if(t)mapImage = undefined;
}

function mousePressed(){
  if(keyIsDown(SHIFT)){
    var pos = getMousePos();
    createVectorFeld(createVector(floor(pos.x),floor(pos.y)));
    mapImage = undefined;
  }
}

function getMousePos(){
  var pos = createVector(mouseX,mouseY);
  //pos.add(-width/2,-height/2);
  pos.add(-offset.x,-offset.y);
  pos.mult(1/scl);
  return pos;
}

function shuffleParticles() {
  colorMode(HSB, 255, 255, 255);
  particles = [];
  for (var i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  colorMode(RGB)
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
  /*if(vectorImage == undefined){
    vectorImage = createGraphics(50,50);
    //vectorImage.background('magenta');
    vectorImage.push();
    vectorImage.translate(vectorImage.width/4,vectorImage.height/4);
    vectorImage.fill('green');
    vectorImage.stroke('green');
    vectorImage.strokeWeight(0.2);
    vectorImage.scale(7,7); 
    vectorImage.line(0,0,0,-1);
    vectorImage.ellipse(0,0,0.1,0.1);

    //vectorImage.ellipse(0,-2,0.1,0.1);
    var dy = 0.4;
    var dx = 0.2;
    vectorImage.triangle(0,-1,dx,-1+dy,-dx,-1+dy);
    vectorImage.pop();
  }
  push();
  var dir = vectorToDir(v);
  rotate(dir/4*2*PI);
  image(vectorImage,-1,-1,2,2);
  pop();*/
}

function randomVectorFeld(){
  do{
    x = floor(random(0,grid.length));
    y = floor(random(0,grid[0].length));
  }while(!grid[(x)][(y)].b)
  createVectorFeld({x:x,y:y});
}

async function createVectorFeld(end){
  if(pathfinder == undefined){
    pathfinder = new Pathfinder({
      checkForWall:function(x,y,dir)
      { 
        var v = dirToVector(dir);
        return (this.tiles[x+v.x][y+v.y].b && this.tiles[x][y].b);
      },
      tiles:grid
    })
  }
  if(end == undefined)end = {x:0,y:0};//end = simplifyP5Vector(end);
  var list = [end];
  for (var x = 0; x < grid.length; x++) {
    for (var y = 0; y < grid[0].length; y++) {
      grid[x][y].v = undefined;
    }
  }
  if(!grid[end.x][end.y].b)return;
  for (var x = 0; x < grid.length; x++) {
    for (var y = 0; y < grid[0].length; y++) {
      if(grid[x][y].v != undefined)continue;
      if(!grid[x][y].b)continue;
      if(asyncVectors)await sleep(1);
      var path = pathfinder.findVectors({x:x,y:y},list);
      path.unshift({x:x,y:y});
      for (var i = 0; i < path.length-1; i++) {
        var p1 = path[i];var p2 = path[i+1];
        if(pathfindingMode)list.push(p1);
        grid[p1.x][p1.y].v = {x:-(p1.x-p2.x),y:-(p1.y-p2.y)};
      }
    }
    mapImage = undefined;
  }
}

var dirToVectorRom = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
function dirToVector(dir){
  return dirToVectorRom[dir];
}

function vectorToDir(v){
  if(v.x == 0&&v.y < 0){
    return 0;
  }else if(v.x > 0&&v.y == 0){
    return 1;
  }else if(v.x == 0&&v.y > 0){
    return 2;
  }else if(v.x < 0&&v.y == 0){
    return 3;
  }
}

function convertCanvasToImage(canvas) {
  //return canvas;
  var image = new Image();
  image.src = canvas.canvas.toDataURL("image/png");
  return image;
}

function convertVectorToP5(v){
  //if(!v.z)return createVector(v.x,v.y);
  if(v == undefined)return createVector(0,0);
  return createVector(v.x,v.y,v.z);
}

function simplifyP5Vector(v){
  //if(!v.z)return createVector(v.x,v.y);
  if(v == undefined)return {x:0,y:0};
  return {x:v.x,y:v.y};
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}