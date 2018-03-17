function setup() {
  var fontSize = 100;//does not matter
  //var font = 'Comic Sans MS';//'consolas';
  var font = $("html").css("font-family");
  var fontStyle = BOLD;


  var g = createGraphics(500,500);
  g.textFont(font);
  g.textSize(fontSize);
  g.textStyle(fontStyle);
  //textAlign();

  var name = /*'cortan122.github.io'*/window.location.hostname.toUpperCase();
  var w = g.drawingContext.measureText(name).width;
  var h = g.textSize();

  var scl = 900/w;
  var c = createCanvas(900,h*scl);
  textFont(font);
  textSize(fontSize*scl);
  textStyle(fontStyle);
  var jc = $(c.canvas);

  //background("#3C0D0A"/*"#f7d638"*/);
  //background("#f7d638");
  background("#f0db4f");
  fill('#323330');
  stroke(0);
  strokeWeight(0);
  text(name,0,height);

  $('#container').prepend(jc);
  jc.css("width","100%");

  //deAntialiasing([color("#f7d638"),color(255)]);

}

function colorDist(a,b){
  return (red(a)-red(b))**2+(green(a)-green(b))**2+(blue(a)-blue(b))**2;
}

function deAntialiasing(colors){

  loadPixels();
  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      var pix = (x + y * width) * 4;
      var cc = color(pixels[pix + 0],pixels[pix + 1],pixels[pix + 2]);
      var ii,min = -1;
      for (var i = 0; i < colors.length; i++) {
        var dist = colorDist(colors[i],cc);
        if(dist<min||min==-1){
          min = dist;
          ii = i;
        }
      }

      var c = colors[ii];
      pixels[pix + 0] = red(c);
      pixels[pix + 1] = green(c);
      pixels[pix + 2] = blue(c);
      pixels[pix + 3] = pixels[pix + 3]==0?0:255;
    }
  }
  updatePixels();

}

function draw() {
  var c = $('canvas');
  var cw = parseInt(c.css("width").replace('px',''));
  c.css("height",height*(cw/width));

  var c2 = $("#container2");
  var f = $("#footer");
  var sh = $("#shadow");
  sh.height(parseInt(f.position().top)-parseInt(c2.position().top)/*c2.height()*/+'px');
  sh.css("top",c2.position().top);

}