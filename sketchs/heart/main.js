var arr = [];
var step = 100;
var mx = 2;
var my = 2;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255);
  colorMode(HSB);
  for(var i = 0;i<step;i++){
    arr[i] = {x:sin((i*TWO_PI/step)+PI),y:cos((i*TWO_PI/step)+PI)};
  }
  drawingContext.globalCompositeOperation = 'xor';
  //draw();
}

var lock = 0;

function draw() {
  if(lock)return;
  lock = 1;
  push();
  translate(width/2,height/2);
  scale(60,60);
  strokeWeight(0.05);
  noFill();
  noStroke();
  //background(100);
  //ellipse(mouseX, mouseY, 20, 20);
  for(var i in arr){
    //stroke(i/step*360,255,255);
    //fill(i/step*360,255,255);
    fill(0);
    //if(i%2==0||true){fill('green');}else{fill('red');}
    ellipse(arr[i].x,arr[i].y,dist(arr[i].x,arr[i].y,arr[0].x,arr[0].y)*mx,dist(arr[i].x,arr[i].y,arr[0].x,arr[0].y)*my);
  }
  pop();
}