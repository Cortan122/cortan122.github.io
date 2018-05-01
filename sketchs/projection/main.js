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

var tweakables = {
  vertexLabels:-1,
  vertexSize:-10,
  edgeThickness:-2,
  transparency:255,
  accentColor:'black',
  backgroundColor:'#666',
  shader:'texture',
  mouseSensitivity:1,
  scrollSpeed:1,
  rotationSpeed:9,
  inputRepeatDelay:5,
  inputRepeatSpeed:-1,
  defaultZoom:400,
  hashSensitivity:10,
  cacheFrames:true,
  isometric:true,
  drawInvisibleLines:false,
  useWebGL:true,
  /*usePalette:true,*/
  enableLighting:true,
  showFPS:false,
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

function setup() {
  parseInputRom();
  createCanvas(500, 500);
  pixelDensity(1);
  renderer3D = createGraphics(500,500, WEBGL);
  paletteimg = loadImage('palette.png',doUpdate);
  angleMode(DEGREES);
  background(tweakables.backgroundColor);
  lightSorce = createVector(10,10,0);

  lib.tweaker.events.push(onChangeDrawMode);
  lib.tweaker.events.push(doUpdate);
  onChangeDrawMode();

  initDOM();

  var t = getQueryParameterByName("s");
  if(t){template(t);$('#mainInput').val(t);}else{template('cube');}
} 

function initDOM(){
  $('body').append('<div id="mainInputText" style="margin-top:0px;width: fit-content;width: -moz-fit-content;">Recipe:</div>');
  $('#mainInputText').append('<input type="text" id="mainInput" style="width: {0}px;display: inline-block;margin: 0;">'
    .format(round(width-$('#mainInputText').width())))
    .append($('<div id="errorIconAnchor" style="display: inline-block;margin: 0;"></div>')
      .append('<div id="errorIcon" style="position:relative;left:-17px;top: 1px;color: white;font-weight:bold;">\u2713</div>')
    );
  $('#mainInput').val('C').keyup(function(e){
    if(e.keyCode == 13){
      readRecipe();
    }
  });
  select('#mainInput').input(e => $('#errorIcon').css('color','white').attr('title','').html('\u2713'));

  $('body').append('<div id="stats" class="stats">Stats: &nbsp;&nbsp;<div id="faces" class="stats">{0} faces<div id="faceList" class="statList">faceList</div></div>, <div id="edges" class="stats">{0} edges<div id="edgeList" class="statList">edgeList</div></div>, <div id="vertices" class="stats">{0} vertices</div></div>');
  $("#faces").click(function() {
    $("#faceList").slideToggle("fast");
  });
  $("#edges").click(function() {
    $("#edgeList").slideToggle("fast");
  });

  $('body').append(
    $('<div id="export_links">Export:</div>')
      .append($('<a>OBJ</a>').click(()=>saveObj()) )
      .append('<b>&nbsp;&#09;</b>')
      .append($('<a>PNG</a>').click(savePng) )
      .append('<b>&nbsp;&#09;</b>')
      .append($('<a id="urlDispenser">URL</a>') )  
    );
  $('body').append(
    $('<div id="view_links">View: &nbsp;</div>')
      .append($('<a>Front</a>').click(resetView) )
      .append('<b>&nbsp;&#09;</b>')
      .append($('<a>Face</a>').click(faceOnRotation) )
      .append('<b>&nbsp;&#09;</b>')
      .append($('<a>Vetr</a>').click(vertOnRotation) )
      .append('<b>&nbsp;&#09;</b>')
      .append($('<a>Planar</a>').click(planarView) )  
  );
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
  try{
    template($('#mainInput').val());
  }catch(r){
    //print(r);
    $('#errorIcon').html('\u26A0').attr('title',r).css('color','red');
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