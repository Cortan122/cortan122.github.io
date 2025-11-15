/** @typedef {import("p5/global")} _ */

var tweakables = {
  showFPS: true,
  metaStart: true,
};

var inputRom = [
  {keys:['T'], action: 'lib.tweaker.toggleTweakables()'},
];

function setup() {
  createCanvas(500, 500);
  background(220);
}

function draw() {
  circle(mouseX, mouseY, 10);
}
