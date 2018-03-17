var inp;
var func = new Function();
var frDiv;
var doUpdate = true;
var wasDragged = false;
var DragPosition;
var sliderRange = 10;

var minx = -sliderRange;
var miny = -sliderRange;
var maxx =  sliderRange;
var maxy =  sliderRange;

function setup() { 
  rectMode(CORNERS);
  createCanvas(200,200);
  createDiv('');
  inp = createInput(/*'x*x+y*y//abs( x * y ) < 0.01'*/'((x*100)**2+(y*100)**2)');
  button = createButton('click me');
  //button.position(19, 19);
  button.mousePressed(myInputEvent);
  /*
  minSlider = createSlider(-sliderRange, 0, -sliderRange, 0.01);
  maxSlider = createSlider(0, sliderRange, sliderRange, 0.01);
  var f = new Function('doUpdate = true');
  minSlider.changed( f );
  maxSlider.changed( f );
  */
  frDiv = createDiv('');
  pixelDensity(1);
}

function keyPressed() {
  if (keyCode == ENTER) {
    myInputEvent();
  }
}

function draw() {
  if(doUpdate){
    graphicUpdate();
    doUpdate = false;
  }
  frDiv.html(floor(frameRate()));
}
function graphicUpdate(){
 
  loadPixels();
  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {

      var a = map(x, 0, width, minx, maxx);
      var b = -map(y, 0, height, miny, maxy);
 
      var c = color(255);
      var r = func(a,b);
      if(typeof r == "string"){
        c = color(r);
      }else if(r === true){
        c = color(100,200,100);
      }else if(!(r === false)){
        var h =  round(modulo(r*10 , 360));
        c = color( 'hsb('+h+', 100%, 100%)');
      }

      var pix = (x + y * width) * 4;
      pixels[pix + 0] = red(c);
      pixels[pix + 1] = green(c);
      pixels[pix + 2] = blue(c);
      pixels[pix + 3] = 255;
    }
  }
  updatePixels();

  
}
function myInputEvent(){
  //console.log('you are typing: ', inp.value());
  //myScript.innerHTML = "console.log(\"hi\"); function hihi(x,y) { return "+inp.value()+" ; }"
  
  func = eval('(x,y)=>'+inp.value());//new Function ('x','y',"return "+inp.value()+" ;");
  doUpdate = true;
  
  minx = -sliderRange;
  miny = -sliderRange;
  maxx =  sliderRange;
  maxy =  sliderRange;
}

function mousePressed(){
  DragPosition = undefined;
  if(mouseX <= width && mouseY <= height){
    DragPosition = createVector(mouseX,mouseY);
  }
}

function mouseDragged(){
  if(DragPosition !== undefined){
    wasDragged = true;
    var Style = document.getElementById("div").style;
    Style.top = min(mouseY,DragPosition.y);
    Style.left = min(mouseX,DragPosition.x);
    Style.height = max(mouseY,DragPosition.y)-parseInt(Style.top);
    Style.width = max(mouseX,DragPosition.x)-parseInt(Style.left);
    /*
    push();
    fill(100,100,100,0);
    rect(DragPosition.x,DragPosition.y,mouseX,mouseY);
    pop()
    */
  }
}

function mouseReleased(){
  if(wasDragged){
    minx += (min(mouseX,DragPosition.x)/width )*(maxx-minx);
    miny += (min(mouseY,DragPosition.y)/height)*(maxy-miny);
    maxx -= (1-(max(mouseX,DragPosition.x)/width ))*(maxx-minx);
    maxy -= (1-(max(mouseY,DragPosition.y)/height))*(maxy-miny);
    
    document.getElementById("div").style = "";
    doUpdate = true;
    wasDragged = false;
  }
}

function modulo(a,b){
  return a - b * floor(a/b);
}