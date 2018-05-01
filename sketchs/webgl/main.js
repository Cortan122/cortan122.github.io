var obj;
var p5obj;
var matrix;
var cellSheder;
var lastMousePos = {x:0,y:0};
var isDirty = true;
var isDraggable;
var scl = 2;
var img;

var tweakables = {
  filename:'obj/star.obj',
  shader:'texture',
  scrollSpeed:1,
  mouseSensitivity:4,
  rotationSpeed:-9,
  inputRepeatDelay:5,
  inputRepeatSpeed:-1,
  isometric:false,
  cacheFrames:false,
  showFPS:true,
  metaStart:true
};

var inputRom = [
  {keys:['W','up'],action:'rotator.applyDir(0)',repeatable:true},
  {keys:['A','left'],action:'rotator.applyDir(3)',repeatable:true},
  {keys:['S','down'],action:'rotator.applyDir(2)',repeatable:true},
  {keys:['D','right'],action:'rotator.applyDir(1)',repeatable:true},
  {keys:['Q','home'],action:'rotator.applyDir(4)',repeatable:true},
  {keys:['E','pgup'],action:'rotator.applyDir(5)',repeatable:true},
  {keys:['R'],action:'resetView()'},
  {keys:['O','T'],action:'lib.tweaker.toggleTweakables()'}
];

var shaderRom = {
  none:['stroke(0);strokeWeight(2.001);'],
  normal:['normalMaterial()'],
  texture_u:['texture(img)',resetLights],
  texture:['texture(img)',setupLights],
  light:[()=>{
    specularMaterial(color("#0f0"));
  },setupLights]
};

function setup() {
  createCanvas(500, 500, WEBGL);
  p5obj = rotate(0);
  angleMode(DEGREES);
  //noStroke();

  lib.tweaker.events.push(onChangeDrawMode);
  onChangeDrawMode();

  img = loadImage('palette.png');

  var rend = p5obj._renderer;
  //rend._defaultLightShader = new p5.Shader(rend,LightVertShaderSrc,LightFragShaderSrc);
  rend._defaultLineShader = new p5.Shader(rend,LineVertShaderSrc,LineFragShaderSrc);
  rend.setStrokeShader(rend._getLineShader());

  rotator.applyMatrixG = function(m){
    if(this.history == undefined)this.history = this.identityMatrix;
    this.history = this.genericMatrixMult(this.history,m);
    matrix = this.matrixToP5(this.history);
    //matrix.mult(matrix0);
    if(isNaN(matrix.mat4[0]))throw 11;
  };
}

function draw() {
  if(!isDirty&&tweakables.cacheFrames)return;
  isDirty = false; 
  var rend = p5obj._renderer;
  if(matrix == undefined){
    matrix = p5.Matrix.identity();
  }
  rend.uMVMatrix = matrix.copy().mult(rend.uMVMatrix);
  var sdr = shaderRom[tweakables.shader];
  if(sdr instanceof Array)sdr = sdr[0];
  else return;
  if(sdr instanceof Function)sdr();
  else if(typeof sdr == 'string')eval(sdr);
  else throw 'invalid shader';
  if(obj.vertices.length == 0)return;
  scale(scl);

  background(100);
  model(obj);
  //sphere(100);
  //box(100);
}

function setupLights(){
  ambientLight(100);
  pointLight(color(250), -250, -250, 0);
  directionalLight(color(250), .25, .25, 0);
}

function resetLights(){
  var shader =  p5obj._renderer._useLightShader();
  shader.setUniform('uAmbientLightCount',0);
  shader.setUniform('uUseLighting',false);
  shader.setUniform('uDirectionalLightCount',0);
  shader.setUniform('uPointLightCount',0);
}

function onChangeDrawMode(name){
  var tw = tweakables;
  isDirty = true;
  if(name==undefined||name=="showFPS"){
    if(tw.showFPS){
      $("#frDiv").css('display','inline');
    }else{
      $("#frDiv").css('display','none');
    }
  }
  if(name==undefined||(name=="filename"&&lib.isLocalhost)){
    let m = $('#object.invalid.message');
    obj = loadModel(tweakables.filename,true,()=>{m.css('display','none')},()=>{m.css('display','inline')});
  }
  if(name==undefined||name=="shader"){
    let m = $('#shader.invalid.message');
    var sdr = shaderRom[tweakables.shader];
    if(sdr instanceof Array){
      m.css('display','none');
      sdr = sdr[1];
      if(sdr != undefined){
        if(sdr instanceof Function)sdr();
        else if(typeof sdr == 'string')eval(sdr);
        else throw 'invalid shader';
      }
    }else{
      m.css('display','inline');
    }
  }
  if(name==undefined||name=="isometric"){
    if(tw.isometric){
      ortho(-width / 2, width / 2, -height / 2, height / 2,0,5000);
    }else{
      perspective();
    }
  }
}

function mousePressed() {
  if(isMouseOverCanvas()){
    lastMousePos = createVector(mouseX,mouseY);
    isDirty = true;
    isDraggable = true;
  }else{
    isDraggable = false;
  }
}

function mouseDragged(){
  if(!isDraggable)return; 
  var currentMousePos = createVector(mouseX,mouseY);
  var mouseMovement = createVector(currentMousePos.x - lastMousePos.x,currentMousePos.y - lastMousePos.y,0);
  if(mouseMovement.equals(0,0,0))return;
  rotator.applyQuaternion(
    rotator.makeQuaternion(
      createVector(mouseMovement.y,-mouseMovement.x,0).normalize(),
      (mouseMovement.mag()*tweakables.mouseSensitivity)%360
    )
  );
  lastMousePos = currentMousePos;
  isDirty = true;
}

function mouseWheel(event) {
  if(!isMouseOverCanvas())return;
  if(keyIsDown(SHIFT)){
    /*var r = meshProperties().maxRadius;
    zoom += event.delta*tweakables.scrollSpeed*(zoom-r)/250;
    var limit = 100;
    if(zoom>limit)zoom = limit;
    if(zoom<r+0.1)zoom = r+0.1;*/
  }else{
    scl -= event.delta*tweakables.scrollSpeed*scl/25/50;
  }
  isDirty = true;
}

function resetView(){
  isDirty = true;
  scl = 2;
  rotator.history = matrix = undefined;
}