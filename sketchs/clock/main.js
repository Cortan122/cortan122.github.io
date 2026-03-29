/** @typedef {import("p5/global")} _ */

var tweakables = {
  superSpeed: false,
  showFPS: true,
  metaStart: true,
};

var inputRom = [
  {keys:['T'], action: 'lib.tweaker.toggleTweakables()'},
];

let font;
let time = 0;

function preload() {
  font = loadFont('Seven Segment.ttf');
}

function setup() {
  createCanvas(500, 500);
  background(220);
}

function draw() {
  if (tweakables.superSpeed) {
    var date = new Date(time);
  } else {
    var date = new Date();
  }
  var hours = date.getHours();
  var minutes = date.getMinutes() + date.getSeconds()/60 + date.getMilliseconds()/60/1000;

  strokeWeight(3);
  fill("#fff");
  circle(250, 250, 400);

  var hours_text = hours.toString().padStart(2, '0');
  textAlign("center");
  textSize(200);
  fill("#8DD20D");
  textFont(font);
  text(hours_text, 250, 250+20);

  var length = 180;
  var angle = -PI/2 + minutes/60*TWO_PI;
  var x = 250 + cos(angle)*length;
  var y = 250 + sin(angle)*length;
  strokeWeight(10);
  line(x,y, 250,250);

  if (tweakables.superSpeed) time += 100000;
}
