function setup() {
  createCanvas(windowWidth, windowHeight); 
  background(100);  
  angleMode(DEGREES);
  colorMode(HSB);
  noStroke();
  //angle = PI;
} 
var c = 5;
var n = 0;
var angle = 137.5;
function draw() {
  for(var i = 0 ; i < 10;i++){
  n++;
  var a = n * angle;
  var r = c * sqrt(n);
  var x = sin(a) * r;
  var y = cos(a) * r;
  
  push();
  fill((a-r)%360,255,100,255);
  //fill(0);
  translate(windowWidth/2,windowHeight/2);
  ellipse(x, y, c, c);
  pop();
  }
}