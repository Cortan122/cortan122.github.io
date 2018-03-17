var frDiv;

function setup(){
  createCanvas(500,500);
  pixelPerfectRenderer.init();
  pixelPerfectRenderer.setTransform(100,0,0,100,width/2,height/2);
  frDiv = createDiv('');
}

function draw(){
  frDiv.html(floor(frameRate())+" ");
  var ppr = pixelPerfectRenderer;
  var pos = ppr.getMousePos();
  ppr.line(0,0,pos.x,pos.y);
}

var pixelPerfectRenderer = {};

pixelPerfectRenderer.init = function(){
  this.canvas = canvas;
  this.ctx = this.context = drawingContext;
  this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  this.matrix = new Matrix();
};  

pixelPerfectRenderer.line = function(x0, y0, x1, y1){
  // x0 = round(x0);x1 = round(x1);y0 = round(y0);y1 = round(y1);
  var v = this.applyTransform(x0,y0);
  x0 = v.x;y0 = v.y;
  v = this.applyTransform(x1,y1);
  x1 = v.x;y1 = v.y;
  push();
  background(0);
  fill('red');
  this.pixel(x0,y0);
  this.pixel(x1,y1);
  pop();
  var deltax = abs(x1 - x0);
  var deltay = abs(y1 - y0);
  var error = 0;
  var errorx = 0;
  var y = y0;
  var x = x0;
  while (x != x1 || y != y1){
    this.pixel(x,y);
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
  this.pixel(x1,y1);
};

pixelPerfectRenderer.pixel = function(x,y){
  x = round(x);y = round(y);
  /*var v = this.applyTransform(x,y);
  x = v.x;y = v.y;*/
  this.ctx.fillRect(x,y,1,1);
};

pixelPerfectRenderer.applyTransform = function(x,y){
  if(y == undefined){
    y = x.y;
    x = x.x;
  }
  var v = createVector(x,y,1);
  v = this.matrix.apply(v);
  v = v.map(round);
  return v;
};

pixelPerfectRenderer.setTransform = function(a, b, c, d, e, f){
  this.matrix = new Matrix([a,c,e,b,d,f,0,0,1]);
};

pixelPerfectRenderer.getMousePos = function(){
  var p = createVector(mouseX,mouseY,1);
  p = this.matrix.inverse().apply(p);
  return p;
};