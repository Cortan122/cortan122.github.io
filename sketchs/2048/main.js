var gx,gy,scl;

var tweakables = {
  scale:100,
  width:4,
  height:4,
  lineWidth:10,
  lineColor:'#bbada0',
  textColor:'#776e65',
  textSize:50,
  randomString:'12',
  dragThreshold:100,
  logScale:false,
  printZeros:false,
  showFPS:true,
  metaStart:true
};

var inputRom = [
  {keys:['O','T'],action:'lib.tweaker.toggleTweakables()'},
  {keys:['D','rightarrow'],action:'move(1)'},
  {keys:['S','downarrow'],action:'move(2)'},
  {keys:['A','leftarrow'],action:'move(3)'},
  {keys:['W','uparrow'],action:'move(0)'},
  {keys:['R'],action:'reset();rand()'}
];

function setup() {
  scl = tweakables.scale;
  gx  = tweakables.width;
  gy  = tweakables.height;

  createCanvas(scl*gx,scl*gy);
  textAlign(CENTER,CENTER);
  textSize(tweakables.textSize);
  reset();
  rand();
}

var crom = ['#cdc1b4','#eee4da','#ede0c8','#f2b179','#f59563','#f65e3b','#edcf72','#edcc61','#edc850','Gold','magenta','black'];
function draw(){
  push();
  //scale(scl);
  strokeWeight(tweakables.lineWidth);
  for(var i = 0;i <larr.length;i++){
    stroke(tweakables.lineColor);
    fill(crom[larr[i]%crom.length]);
    rect((i%gx)*scl,floor(i/gy)*scl,scl,scl);
    //noFill();
    fill(tweakables.textColor);
    noStroke();
    if(tweakables.printZeros||larr[i]!=0){
      var t = larr[i];
      if(!tweakables.logScale&&t!=0){
        t = 1<<t;
      }
      text(t,((i%gx)+.5)*scl,(floor(i/gy)+.5)*scl);
    }
  }
  pop();
}

var mx,my;
function mousePressed(){
  mx = mouseX;
  my = mouseY;
}

function mouseReleased(){
  var dx,dy;
  dx = mouseX-mx;
  dy = mouseY-my;
  if(dx**2+dy**2<tweakables.dragThreshold)return;
  var dir = vectorToDir(createVector(-dx,-dy));
  move(dir);
}

function vectorToDir(v){
  var angle = -(atan2(v.y,v.x)-PI);
  var dir;
  if(angle >= PI*1.75||angle < PI*0.25)dir = 1;
  if(angle >= PI*0.25&&angle < PI*0.75)dir = 0;
  if(angle <= PI*1.25&&angle >= PI*0.75)dir = 3;
  if(angle > PI*1.25&&angle < PI*1.75)dir = 2;
  return dir;
}