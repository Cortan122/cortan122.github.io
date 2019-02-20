function draw(){
  if(tweakables.useWebGL && doUpdateT){
    doUpdateT = !tweakables.cacheFrames;
    //calcFaceColors();
    trueDraw3D();
    image(renderer3D,0,0,width,height);
    return;
  }
  translate(width/2,height/2);
  translate(offset*2,offset*2);
  if(doUpdateT){trueDraw(); doUpdateT = !tweakables.cacheFrames; }
}

function trueDraw() {
  calcFaceColors();
  background(tweakables.backgroundColor);
  drawS();
}

function draw1E(e){
  strokeWeight(tweakables.edgeThickness);
  stroke(accentColor);
  var x  = _perspective(e[0]).x;var y  = _perspective(e[0]).y;
  var x1 = _perspective(e[1]).x;var y1 = _perspective(e[1]).y;
  line(x*scl,y*scl,x1*scl,y1*scl);
}

function draw1P(p){
  if(tweakables.vertexSize<=0 && tweakables.vertexLabels=="none")return;
  strokeWeight(tweakables.vertexSize);
  stroke(accentColor);
  var x = _perspective(p).x;var y = _perspective(p).y;
  point(x*scl,y*scl);
  var textP = tweakables.vertexLabels;
  if(textP!="none"){
    push();
    //noStroke();
    strokeWeight(1);
    fill(255);
    if(textP == "index")text(arrP.indexOf(p), x*scl ,y*scl);
    if(textP == "z")text(round10(p.z,-2), x*scl ,y*scl);
    pop();
  }
}

function draw1F(f){
  //return draw1TF(f);
  strokeWeight(0);
  if(arrE.length == 0){strokeWeight(2);stroke(accentColor);}
  fill(255,transparency);
  var x  = _perspective(f[0]).x;var y  = _perspective(f[0]).y;
  var x1 = _perspective(f[1]).x;var y1 = _perspective(f[1]).y;
  var x2 = _perspective(f[2]).x;var y2 = _perspective(f[2]).y;
  if(colorF){
    fill('hsba({0},{1}%,{2}%,{3})'.format((arrF.indexOf(f)*360/arrF.length)%360,100,100,transparency/255));
  }
  triangle(x*scl,y*scl,x1*scl,y1*scl,x2*scl,y2*scl);
}

function draw1TF(f){
  strokeWeight(0);
  if(arrE.length == 0){strokeWeight(2);stroke(accentColor);}
  fill(getFaceColor(f));
  ctx = drawingContext;
  ctx.beginPath();
  ctx.moveTo(_perspective(f[0]).x*scl,_perspective(f[0]).y*scl);
  for (var i = 1; i < f.length; i++) {
    ctx.lineTo(_perspective(f[i]).x*scl,_perspective(f[i]).y*scl);
  }
  ctx.stroke();
  ctx.fill();
  ctx.closePath();
}

var lineDash = [5,5];
function drawE(){
  push();
  strokeWeight(tweakables.edgeThickness);
  stroke(accentColor);
  var ctx = drawingContext;
  ctx.setLineDash(lineDash);
  ctx.beginPath();
  for(i = 0;i < arrE.length;i++){
    var x  = _perspective(arrE[i][0]).x;var y  = _perspective(arrE[i][0]).y;
    var x1 = _perspective(arrE[i][1]).x;var y1 = _perspective(arrE[i][1]).y;
    ctx.moveTo(x*scl,y*scl);
    ctx.lineTo(x1*scl,y1*scl);
  }
  ctx.stroke();
  ctx.closePath();
  pop();
}

function drawS(){
  var s = arrS = sort1();
  for (var i = 0; i < s.length; i++) {
    if(s[i].isHidden)continue;
    if(s[i].length == undefined){
      draw1P(s[i]);
    }else if(s[i].length == 2){
      draw1E(s[i]);
    }else if(s[i].length == 3 && arrTF.length == 0){
      draw1F(s[i]);
    }else{draw1TF(s[i]);}
  }
  if(tweakables.drawInvisibleLines)drawE();
}

var reverseSort = false;
var temp;
function sort1(){
  arrP.sort(function(a, b) {
    return a.z - b.z;
  });
  if(reverseSort)arrP.reverse();
  var r = [];
  var f;
  if(arrTF.length != 0){f = arrTF;}else{f = arrF;}
  for (var i = 0; i < arrP.length; i++) {
    temp = arrP[i];
    var t = [];
    t = t.concat( f.filter(function(v){return v.includes(temp)&&!r.includes(v);}) );
    t = t.concat( arrE.filter(function(v){return v.includes(temp)&&!r.includes(v);}) );
    t = t.sort(sortHelper);

    t.push(temp);
    if(reverseSort)t.reverse();
    r = r.concat(t);
  }
  if(reverseSort)r.reverse();
  return r;
}

function sortHelper(a,b){
  if(a.length == b.length){
    return getAverageOfArray(a.map(e => e.z)) - getAverageOfArray(b.map(e => e.z));
  }
  var e = (a.length == 2)?a:b;
  var f = (a.length == 2)?b:a;
  var bool = f.includes(e[0])&&f.includes(e[1]);
  if(bool)return (a.length == 2)?1:-1;
  return getAverageOfArray(a.map(e => e.z)) - getAverageOfArray(b.map(e => e.z));
}

function calcFaceColors(bool){
  /*if(!tweakables.usePalette&&!bool){
    arrTF.forEach(e => e.color = color('hsba({0},{1}%,{2}%,{3})'.format(
      getFaceHash(e)%360,100,100,transparency/255
    )));
    return;
  }*/
  var cpalette = palette.map(e => color(e));
  var hash = uniq(arrTF.map(e => e.hash = getFaceHashStr(e))).sort();
  arrTF.forEach(e => {
    e.paletteIndex = hash.indexOf(e.hash);
    e.color = cpalette[e.paletteIndex%palette.length];//color(palette[hash.indexOf(e.hash)%palette.length]);
    e.color._array[3]=transparency/255;
  });
}

function getFaceColor(f){
  if(typeof f == 'number')f = arrTF[f];
  if(tweakables.enableLighting)return calcShadow(f);
  return f.color;
}

var lightSorce;
function calcShadow(f){
  var center = getSumOfArray(f);
  var as = [];
  for (var i = 0; i < f.length; i++) {
    var a = degrees(p5.Vector.angleBetween(f[i],lightSorce));//this looks cooler
    //var a = degrees(p5.Vector.angleBetween(center,lightSorce));//this is more corect
    //if(a > 90)a = 180-a;
    as.push(a);
  }
  var maxa = getMinOfArray(as);
  //var maxa = getAverageOfArray(as);
  return color('hsba({0},{1}%,{2}%,{3})'.format(
    floor(f.color.hue),
    floor(f.color.saturation),
    floor(map(maxa,0,90,10,100)),
    (transparency/255 /*f.color.alpha*/)
  ));
}
