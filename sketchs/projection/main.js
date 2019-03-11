var arrP = [];
var arrE = [];
var arrF = [];
var arrTF = [];
var arrS = [];
var scl = 100;
var offset = 0;
var lastMousePos;
var doUpdateT = true;
var isDraggable = true;
var renderer3D;

var colorF = 1;
var zoom = 5;

// var palette = ['#af0','#5f0','#009dff','#f11','#ff0','#0ff','#00f'];//original
// var palette = ['#f77','#ddd','#899','#fff0e5','#a33','#f00','#fff','#aaa'];//polyhedronisme
var palette = ['#af0','#5f0','#009dff','#fa0000','#ff6a00','#ff0','#007f0e','#0ff','#004aff','#00ff90','#b970ff','#ff7fb6'];//3D

var tweakables = {
  edgeThickness:-2,
  transparency:255,
  shader:'texture',
  hashSensitivity:100,
  isometric:true,
  drawInvisibleLines:false,
  useWebGL:true,
  polyhedronisme:true,
  enableLighting:true,

  accentColor:'black',
  backgroundColor:'#666',
  vertexSize:-10,
  vertexLabels:"none",
  defaultZoom:400,
  mouseSensitivity:1,
  scrollSpeed:1,
  rotationSpeed:9,
  inputRepeatDelay:5,
  inputRepeatSpeed:-1,
  showFPS:false,
  cacheFrames:true,
  metaStart:true
};

var tweakables_name = 'polygon';

Object.defineProperty(this, "accentColor", {
  get: function() {
    if(tweakables.accentColor != 'auto')
      return tweakables.accentColor;
    return color('hsb({0},{1}%,{2}%)'.format(
      getFaceHash(arrTF[0])%360,100,100)).negative;
  }, configurable: true, enumerable: false
});
Object.defineProperty(this, "transparency", {
  get: function() {
    if(isPlanarView)return 0;
    return tweakables.transparency;
  }, configurable: true, enumerable: false
});

function setup(){
  createCanvas(500, 500);
  pixelDensity(1);
  renderer3D = createGraphics(500,500, WEBGL);
  paletteimg = createImage(20, 20);
  angleMode(DEGREES);
  background(tweakables.backgroundColor);
  lightSorce = createVector(10,10,0);

  lib.tweaker.makeEnum("shader",Object.keys(shaderRom));
  lib.tweaker.makeEnum("vertexLabels",["none","index","z"]);
  lib.tweaker.events.push(onChangeDrawMode);
  lib.tweaker.events.push(doUpdate);

  initDOM();
  onChangeDrawMode();

  var t = getQueryParameterByName("s");
  if(t){template(t);$('#mainInput').val(t);}else{template('C');}

  // fix for: tweakables not showing up (for some reason)
  setTimeout(()=>{$('#pDiv').hide().show(0);},1);
}

function initDOM(){
  $('body').append('<table id="menuContainer"></table>');

  $('#menuContainer').append('<tr id="mainInputText"><td>Recipe:</td><td id="mainInputContainer"></td></tr>');
  var inputWidth = round(width-$('#mainInputText').width());
  $('#mainInputContainer')
    .append(`<input type="text" id="mainInput" style="width: ${inputWidth}px;">`)
    .append(`<div id="errorIcon">⚠<select id="preset_list"></select></div>`)
  $('#mainInput').val('C').keyup(function(e){
    if(e.keyCode == 13){
      readRecipe();
    }
  });
  $('#mainInput').on("input",e => $('#errorIcon').css('color','white').attr('title',''));

  $('#menuContainer').append(
    $('<tr><td>Palette:</td></tr>')
    .append(`<input type="text" id="paletteInput">`)
    .append('<button id="paletteButton">random</button>')
  );
  $('#paletteInput').val(palette.join(' ')).on("input",e=>{
    palette = $(e.target).val().split(' ');
    updatePalette();
  }).css("width",inputWidth-$('#paletteButton').outerWidth());
  $('#paletteButton').click(e=>{
    palette = require('polyhedronisme').randomPalette();
    $('#paletteInput').val(palette.join(' '));
    updatePalette();
  });

  $('#menuContainer').append('<tr id="stats"><td>Stats:</td><td><div id="faces" class="stats">{0} faces<div id="faceList" class="statList">faceList</div></div>, <div id="edges" class="stats">{0} edges<div id="edgeList" class="statList">edgeList</div></div>, <div id="vertices" class="stats">{0} vertices</div></td></tr>');
  $("#faces").click(function() {
    $("#faceList").slideToggle("fast");
  });
  $("#edges").click(function() {
    $("#edgeList").slideToggle("fast");
  });

  $('#menuContainer').append(
    $('<tr><td>Export:</td></tr>').append(
      $('<td></td>')
      .append( $('<a>OBJ</a>').click(()=>saveObj()) )
      .append( $('<a>PNG</a>').click(savePng) )
      .append('<a id="urlDispenser">URL</a>')
    )
  );
  $('#menuContainer').append(
    $('<tr><td>View:</td></tr>').append(
      $('<td></td>')
      .append( $('<a>Front</a>').click(resetView) )
      .append( $('<a>Face</a>').click(faceOnRotation) )
      .append( $('<a>Vetr</a>').click(vertOnRotation) )
      .append( $('<a id="planar_atag">Planar</a>').click(planarView) )
      .append('<a id="help_atag" href="./help">Help</a>')
    )
  );

  $.ajax("./examples.txt").done(data=>{
    var t = $('#preset_list');
    t.append(`<option value="" style="display:none"></option>`);
    for(var line of data.split('\n')){
      line = line.replace(/\s/g,'');
      if(line.length==0)continue;
      t.append(`<option value="${line}">${line}</option>`);
    }
    t.on('change',()=>{
      $('#mainInput').val(t.val());
      readRecipe();
    });
  });
}

function updatePalette(){
  paletteimg.loadPixels();

  function writePixel(x, y, c){
    if(x<0 || y<0)return;
    const width = 20;
    const index = (x + y * width) * 4;
    const img = paletteimg.pixels;
    img[index] = c.red;
    img[index + 1] = c.green;
    img[index + 2] = c.blue;
    img[index + 3] = tweakables.transparency;//c.alpha;
  }

  function writeColor(x, y, c){
    x *= 2;
    y *= 2;
    writePixel(x,y,c);
    writePixel(x-1,y,c);
    writePixel(x,y-1,c);
    writePixel(x-1,y-1,c);
  }

  for(var i = 0; i < 100; i++){
    writeColor(i%10,floor(i/10),color(palette[i%palette.length]));
  }

  paletteimg.updatePixels();
  if(renderer3D)renderer3D.texture(paletteimg);
  doUpdate();
}

function updateStats(data){
  if(data == undefined){
    data = meshProperties();
  }
  $('#faces')[0].firstChild.data = '{0} faces'.format(data.numFaces);
  $('#edges')[0].firstChild.data = '{0} edges'.format(data.numEdges);
  $('#vertices')[0].firstChild.data = '{0} vertices'.format(data.numVerts);
  var r = '';
  for (var i in data.edgeLengths) {
    r += data.edgeLengths[i]+':'+i+'m\n';
  }
  $("#edgeList").html(r);
  r = '';
  for (var i in data.faceLengths) {
    r += (data.faceLengths[i]+':'+i+'-gon{0}\n').format(data.faceLengths[i]>1?'s':'');
  }
  $("#faceList").html(r);
}

function readRecipe(){
  if($('#preset_list').val()!=$('#mainInput').val()){
    $('#preset_list').val('');
  }
  try{
    template($('#mainInput').val());
  }catch(r){
    //print(r);
    $('#errorIcon').attr('title',r).css('color','red');
  }
}

function getFaceId(e) {
  return '['+e.map(e1 => arrP.indexOf(e1)).join(',')+']';
}

function getFaceHash(f) {
  var es = arrE.filter(e => f.includes(e[0])&&f.includes(e[1]));
  var r = 0;
  for (var i = 0; i < es.length; i++) {
    r += p5.Vector.convert(es[i][0]).dist(p5.Vector.convert(es[i][1]))*4567;
  }
  return round(r*es.length);
}

function getFaceHashStr(f) {
  var r = [];//f.length-1;
  f = f.map(p5.Vector.convert);
  for (var i = 0; i < f.length; i++) {
    var t = round(p5.Vector.angleBetween(f[i],f[(i+1)%f.length])/PI*tweakables.hashSensitivity).toString(36);
    r.push(t);
  }
  return (f.length-1).toString(36)+r.sort().join();
}

function _targetRotation(pos){
  for (var i = 1; i < 100; i++) {
    var mouseMovement = createVector(-pos.x,-pos.y);
    if(mouseMovement.mag()<0.01)break;
    rotator.applyQuaternion(
      rotator.makeQuaternion(
        createVector(-mouseMovement.y,mouseMovement.x,0).normalize(),
        (mouseMovement.mag()*100/i)%360
      )
    );
  }
  doUpdate();
}

function targetRotation(pos){
  var target = createVector(0,0,1);
  rotator.applyQuaternion(
    rotator.makeQuaternion(
      target.cross(pos).normalize(),
      -p5.Vector.angleBetween(target,pos)*180/PI
    )
  );
  doUpdate();
}

function doUpdate() {doUpdateT = true;}

function isNotEmpty(value) {
  return (value != "");
}

function _perspective(p){
  if((!isPlanarView)&&tweakables.isometric){return p;}
  //m = (p.z + zoom)/zoom;
  m = zoom/(-p.z+zoom);
  if(m < 0)return {x:0,y:0,z:0};
  var x = p.x * m;
  var y = p.y * m;
  return {x:x,y:y,z:p.z};
}

function uniq(a) {
  return Array.from(new Set(a));
}

function vertOnRotation(){
  resetView();
  //rotator.applyMatrixG(_edgeOnRotation);
  targetRotation(arrP[0]);
  doUpdate();
}

function faceOnRotation(i){
  resetView();
  if(i == undefined||isNaN(i))i = 0;
  i = abs(floor(i)) % arrTF.length;
  var f = arrTF.sort((b,a) => a.length-b.length)[i];
  var p = meshProperties().maxRadius;
  var center = getSumOfArray(f);
  arrP.push(center);
  targetRotation(center);
  arrP.remove(center);
  doUpdate();
  return p;
}

function randomRotation(){
  doUpdate();
  rotator.applyQuaternion(rotator.makeQuaternion(p5.Vector.random3D(),random(500)));
}

function saveObj(precision){
  if(objString == undefined)objString = makeObj();
  saveStrings(objString.split('\n'), $('#mainInput').val().replace(/[0-9\,\.\-\(\)]/g,''),'obj');
}

function savePng(){
  var name = $('#mainInput').val().replace(/[0-9\,\.\-\(\)]/g,'');//+".png";
  saveCanvas(canvas,name,"png");
}
