function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  var d = new Date();
  background(255);
  textFont('monospace');
  textAlign(CENTER);
  textSize(100);
  text(setsize(d.getHours())+":"+setsize(d.getMinutes())+":"+setsize(d.getSeconds())+"."+setsize1(d.getMilliseconds()) ,width/2,height/2);
}

function setsize(s){
  s = s.toString();
  if(s.length == 1)s = "0"+s;
  return s;
}

function setsize1(s){
  s = s.toString();
  if(s.length == 1)s = "00"+s;
  if(s.length == 2)s = "0"+s;
  return s;
}