var FragShaderTemplate = undefined;
var VertShaderSource = undefined;
var myShader;
var bounds = [-.1,-.1,.1,.1];//[minx,miny,maxx,maxy]
var isDirty = true;
var examples = undefined;

var tweakables = {
  scrollSpeed:1,
  movementSpeed:.01,
  inputRepeatDelay:5,
  inputRepeatSpeed:-1,
  templateName:"random",
  inlineTextarea:true,
  cacheFrames:true,
  showFPS:true,
  metaStart:true
};

var inputRom = [
  {keys:['W','up'],action:'move(2)',repeatable:true},
  {keys:['A','left'],action:'move(3)',repeatable:true},
  {keys:['S','down'],action:'move(0)',repeatable:true},
  {keys:['D','right'],action:'move(1)',repeatable:true},
  {keys:['R'],action:'resetView()'},
  {keys:['O','T'],action:'lib.tweaker.toggleTweakables()'},
  {keys:['Enter'],action:'updateShader()'}
];

function setup(){
  createCanvas(500, 500, WEBGL);
  $.ajax("frag.glsl").done(e => {FragShaderTemplate = e;updateShader()});
  $.ajax("vert.glsl").done(e => {VertShaderSource = e;updateShader()});
  $.ajax("examples.json").done(e => {examples = e;updateShader()});
  updateShader();
  $('body').append("<textarea></textarea>");
  var b = $('<button value="undefined" id="runButton">run</button>');
  b.on('click',updateShader);
  $('body').append(b)
  $(window).on('resize',e => updateTextarea());
  $('#pDiv').on('resize',e => updateTextarea());
  var f1 = e => {if(e.keyCode==13&&e.shiftKey){updateShader();return false;}};
  $("textarea").keyup(f1).keydown(f1).change(f1);
  lib.tweaker.events.push(updateTextarea);
  updateTextarea();
}

function updateTextarea(name){
  if(name!="inlineTextarea"&&name!="isTweakablesShown"&&name!=undefined)return;
  if(tweakables.inlineTextarea){
    var t = width;
    if(lib.tweaker.isTweakablesShown){
      t += $('#pDiv').outerWidth()+17;
    }
    $('textarea').css({top: 0, left: t, position:'absolute'});
    $('textarea').outerHeight(windowHeight);
    $('textarea').outerWidth(windowWidth-t);
    $('#runButton').css({bottom: 0, right: 0, position:'absolute',"z-index":1});
  }else{
    $('textarea').css({position:'relative',top: 0, left: 0});
    $('textarea').outerHeight(windowHeight-height);
    $('textarea').outerWidth(width);
    $('#runButton').css({bottom: 0, right: windowWidth-width, position:'absolute',"z-index":1});
  }
}

function updateShader(){
  if(VertShaderSource==undefined||FragShaderTemplate==undefined)return;
  var str = $('textarea').val();
  if(str==undefined||str==''){
    if(examples == undefined)return;
    if(tweakables.templateName=="random"||tweakables.templateName==undefined){
      var keys = Object.keys(examples);
      var key = random(keys);
    }else{
      key = tweakables.templateName;
    }
    str = examples[key].code;
    $('textarea').val(str);
  }
  myShader = createShader(VertShaderSource, FragShaderTemplate.format(str));
  var b = false;
  var old = console.error;
  console.error = e=>{b=true;old(e)};
  shader(myShader);
  if(b){
    myShader = createShader(VertShaderSource, FragShaderTemplate.format(''));
    shader(myShader);
  }
  console.error = old;
  noStroke();
  isDirty = true; 
}

function draw(){
  if(!isDirty&&tweakables.cacheFrames)return;
  isDirty = false;
  if(myShader == undefined)return; 
  myShader.setUniform('uTime',frameCount/60);
  myShader.setUniform('uBounds',bounds);
  quad(-1,-1,1,-1,1,1,-1,1);
}

function resetView(){
  bounds = [-.1,-.1,.1,.1];
  isDirty = true;
}

function move(dir){
  var sizex = bounds[2]-bounds[0];
  var sizey = bounds[3]-bounds[1];
  var v = dirToVector(dir).mult(tweakables.movementSpeed);
  bounds[0] += v.x*sizex;
  bounds[2] += v.x*sizex;
  bounds[1] += v.y*sizey;
  bounds[3] += v.y*sizey;
  isDirty = true;
}

function moveB(v){
  bounds[0] += v.x;
  bounds[2] += v.x;
  bounds[1] += v.y;
  bounds[3] += v.y;
}

function mouseWheel(event) {
  if(!isMouseOverCanvas())return;
  if(!isFocusedOnCanvas())return;
  var t = 2**(event.delta*tweakables.scrollSpeed);
  var center = createVector(bounds[0]+bounds[2],bounds[1]+bounds[3]).mult(.5);
  moveB(center.mult(-1));
  bounds = bounds.map(e => e*t);
  moveB(center.mult(-1));
  isDirty = true;
}