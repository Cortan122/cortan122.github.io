var theThings = [];
var speed = 14;
var forceMultiplier = 5000;
var c = 1;

var tweakables = {
  initialCount:100,
  forceMultiplier:5000,
  dragMultiplier:1,
  strokeWeight:20,
  colorMode:0,
  color:'#00c864',
  scrollSpeed:.01,
  blur:true,
  draw:true,
  showFPS:true,
  metaStart:true
};

var inputRom = [
  {keys:['O','T'],action:'lib.tweaker.toggleTweakables()'},
  {keys:['D','rightarrow'],action:'dir(1)'},
  {keys:['S','downarrow'],action:'dir(2)'},
  {keys:['A','leftarrow'],action:'dir(3)'},
  {keys:['W','uparrow'],action:'dir(0)'}
];

function setup() {  
  createCanvas(windowWidth, windowHeight);
  background(0);
  fill(0);
  colorMode(HSB,255,255,255,255);
  angleMode(DEGREES);

  lib.tweaker.events.push(onChangeDrawMode);
  onChangeDrawMode();

  for(var i = 0; i < tweakables.initialCount; i++){
    theThings[i] = new Thing(floor(random(width)),floor(random(height)));
  }
}

function onChangeDrawMode(name){
  var tw = tweakables;
  forceMultiplier = tw.forceMultiplier;
  c = tw.dragMultiplier;
  strokeWeight(tw.strokeWeight);
  if(name==undefined||name=='color'||name=='colorMode'){
    stroke(tw.color);
    background(tw.color);
  }
  if(name==undefined||name=="showFPS"){
    if(tw.showFPS){
      $("#frDiv").css('display','inline');
    }else{
      $("#frDiv").css('display','none');
    }
  }
}

function draw() {
  if(tweakables.blur&&tweakables.draw){
    background(0,0,0,10);
  }

  var mspt = (new Date).getTime();
  for(var i = 0; i < theThings.length; i++){
    if(tweakables.draw&&tweakables.colorMode!=0)theThings[i].draw();
    theThings[i].update();
    theThings[i].forceUpdate();
  }

  if(tweakables.colorMode==0&&tweakables.draw){
    var ctx = drawingContext;
    ctx.beginPath();//beginShape();
    for (var j = 0; j < theThings.length; j++) {
      var t = theThings[j];
      if (10000 < distsq(t.vector.x,t.vector.y,t.pos.x,t.pos.y)){
        t.vector = createVector(t.pos.x,t.pos.y);
      }
      ctx.moveTo(t.pos.x,t.pos.y);
      ctx.lineTo(t.vector.x,t.vector.y);
      t.vector = createVector(t.pos.x,t.pos.y);
    }
    ctx.stroke();//endShape();
    ctx.closePath();
  }

  mspt -= (new Date).getTime();
  mspt = -mspt;

  if(tweakables.showFPS)
    $("#frDiv").append('\nMSPT: '+mspt).append('\ncount: '+theThings.length).append('\nspeed: '+speed);;
}

function mousePressed(){
  theThings.push(new Thing(mouseX,mouseY));
  theThings[theThings.length-1].mass = 0.01;
}

function mouseWheel(event) {
  speed -= event.delta*tweakables.scrollSpeed;
}

var dirRom = [
  [0,-1],
  [1,0],
  [0,1],
  [-1,0]
];
function dir(d){
  for(var i = 0; i < theThings.length; i++){
    theThings[i].dir(dirRom[d][0],dirRom[d][1]);
  }
}

function trueDistance(a,b){
  var dx = (a.x-b.x);
  var t = (width);
  if(abs(dx) > t/2){dx = dx-t;}
  var dy = (a.y-b.y);
  t = (height);
  if(abs(dy) > t/2){dy = dy-t;}
  //var mag = (x*x+y*y);
  return {mag:(dx*dx+dy*dy),x:dx,y:dy};
}

function distsq(x1, y1, z1, x2, y2, z2){
  return (z1-x1)*(z1-x1) + (x2-y1)*(x2-y1);
}