/** @typedef {import("p5/global")} _ */
/** @typedef {import("jquery")} _ */

var tweakables = {
  backgroundColor: "#000",
  decaySpeed: 1,
  showFPS: false,
  metaStart: true,
};

var inputRom = [
  {keys:['T'], action: 'lib.tweaker.toggleTweakables()'},
];

let inputElement;
let userImage;

function setup() {
  createCanvas(500, 500);
  background(tweakables.backgroundColor);

  inputElement = createFileInput(handleFile);
  $('input[type=file]').css("margin-top", "2em").appendTo("#pDiv");
}

function draw() {
  var c = color(tweakables.backgroundColor);
  c.setAlpha(tweakables.decaySpeed)
  background(c);

  var x = random(0, 500);
  var y = random(0, 500);
  translate(x, y);

  var angle = random(0, TWO_PI);
  rotate(angle);

  if (userImage) {
    image(userImage, 0, 0, 128, 128);
  } else {
    rect(0, 0, 100, 100);
  }
}

function handleFile(file) {
  if (file.type === 'image') {
    userImage = createImg(file.data, '');
    userImage.hide();
  } else {
    userImage = null;
  }

  isDirty = true;
}
