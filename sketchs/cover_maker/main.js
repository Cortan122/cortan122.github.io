/** @typedef {import("p5/global")} _ */
/** @typedef {import("jquery")} _ */

var tweakables = {
  numberFontSize: 160,
  bottomFontSize: 100,
  topFontSize: 62,
  topTextMargin: 13,
  bottomTextMargin: 10,
  lineHeight: 1,
  shadowOffset: 10,
  shadowBlur: 5,
  topText: "John Johnson",
  bottomText: "Hello World",
  numberText: "7",
  numberX: 510,
  numberY: 560,
  invert: false,
  hideEverything: false,
  showFPS: false,
  metaStart: true,
};

var inputRom = [
  {keys:['T'], action: 'lib.tweaker.toggleTweakables()'},
];

let inputElement;
let userImage;
/** @type {CanvasRenderingContext2D} */
let ctx;
let isDirty = true;

function setup() {
  pixelDensity(1);
  createCanvas(565, 700);

  inputElement = createFileInput(handleFile);
  $('input[type=file]').css("margin-top", "2em").appendTo("#pDiv");
  ctx = document.querySelector("canvas").getContext("2d");

  lib.tweaker.events.push(() => {isDirty = true});
}

function getLines(ctx, text, maxWidth) {
  var words = text.split(" ");
  var lines = [];
  var currentLine = words[0];

  for (var i = 1; i < words.length; i++) {
    var word = words[i];
    var width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

function draw() {
  if (!isDirty) return;
  isDirty = false;

  if (userImage) {
    image(userImage, 0, 0, width, height);
  } else {
    background(tweakables.invert ? "#ddd" : "#666");
  }

  if (tweakables.hideEverything) return;

  if (tweakables.invert) {
    var colors = ["#afafaf", "#d8d8d8", "white"];
  } else {
    var colors = ["black", "#272727", "#505050"];
  }
  const grad = ctx.createLinearGradient(0,0, 0,height);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(45/700, colors[2]);
  grad.addColorStop(90/700, colors[0]);
  grad.addColorStop(460/700, colors[1]);
  grad.addColorStop(580/700, colors[2]);
  grad.addColorStop(1, colors[1]);


  ctx.shadowOffsetX = -tweakables.shadowOffset;
  ctx.shadowOffsetY = tweakables.shadowOffset;
  ctx.shadowBlur = tweakables.shadowBlur;
  ctx.shadowColor = tweakables.invert ? 'black' : 'white';
  ctx.fillStyle = grad;
  ctx.textAlign = "center";

  ctx.textBaseline = "bottom";
  ctx.font = `bold ${tweakables.bottomFontSize}px Theano Didot`;
  const lines = getLines(ctx, tweakables.bottomText, width-50);
  for (var i = 0; i < lines.length; i++) {
    ctx.fillText(
      lines[lines.length-i-1],
      width/2,
      height - tweakables.bottomFontSize*i*tweakables.lineHeight - tweakables.bottomTextMargin
    );
  }

  ctx.textBaseline = "alphabetic";
  ctx.font = `bold ${tweakables.numberFontSize}px Theano Didot`;
  ctx.fillText(tweakables.numberText, tweakables.numberX, tweakables.numberY);

  ctx.textBaseline = "top";
  ctx.font = `bold ${tweakables.topFontSize}px Theano Didot`;
  ctx.fillText(tweakables.topText, width/2, tweakables.topTextMargin);
}

function handleFile(file) {
  if (file.type === 'image') {
    userImage = createImg(file.data, '');
    userImage.hide();
    setTimeout(() => {
      resizeCanvas(userImage.width, userImage.height);
      lib.tweaker.toggleTweakables();
      lib.tweaker.toggleTweakables();
    }, 200);
  } else {
    userImage = null;
  }

  isDirty = true;
}
