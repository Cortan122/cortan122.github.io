console.log('tweakables.js');
var tweakables = {
  vertexLabels:-1,
  vertexSize:-1,
  edgeThickness:2,
  transparency:255,
  accentColor:'black',
  backgroundColor:'#666',
  mouseSensitivity:1,
  scrollSpeed:1,
  rotationSpeed:9,
  inputRepeatDelay:5,
  inputRepeatSpeed:-1,
  defaultZoom:400,
  cacheFrames:true,
  isometric:true,
  drawInvisibleLines:false,
  useWebGL:false,
  usePalette:true,
  enableLighting:true
};

function initTweakables(){
  try{
    if(localStorage["polygon_tweakables"]){
      var t = JSON.parse(localStorage["polygon_tweakables"]);//var t = {};
      //eval('t = '+localStorage["tetris_tweakables"])
      tweakables = Object.assign(tweakables,t)
    }
    localStorage["polygon_tweakables"] = JSON.stringify(tweakables);
  }catch(e){localStorage["polygon_tweakables"] = '';}
  if(!select('#pDiv')){
    $('body').append('<ul id="pDiv" style="list-style-type:none;font-size: 20;text-decoration:;position: absolute;left: -500px;overflow-y: scroll;resize: vertical;height: 95%;margin-top: 0px;"><li style="margin-top: 20px;" class="tweakables"></li></ul>');
  }
  if(!styleExists(/.*\.tweakables/)){
    $('head').append('<style>:not(li).tweakables {display: inline-block; *display: inline; zoom: 1; vertical-align: top;margin: 0;}.input.tweakables {width: 50;}.checkbox.tweakables {position: relative;margin: 0;top: 5px;}li.tweakables {margin-bottom: 5px;}</style>')
  }
  //tweakables = Object.assign({metaResize:true,metaStart:false,metaSort:false},tweakables);
  if(tweakables.metaResize === undefined)tweakables.metaResize = true;
  if(tweakables.metaStart === undefined)tweakables.metaStart = false;
  if(tweakables.metaSort === undefined)tweakables.metaSort = false;

  displayTweakables();
  if(tweakables.metaStart)delayEval(1,'toggleTweakables()');
}

var isTweakablesShown = false;

function toggleTweakables() {
  pdiv = select('#pDiv');
  var a = width;
  if(isTweakablesShown){pdiv.style('left','-'+a+'px');}else{pdiv.style('left',a+'px');}
  isTweakablesShown = !isTweakablesShown;
}

function displayTweakables() {
  pdiv = select('#pDiv');
  //for(var name in tweakables){
  var keys = Object.keys(tweakables);
  if(tweakables.metaSort)keys = keys.sort();
  for (var i = 0; i < keys.length; i++) {
    var name = keys[i];
    var text = createP(name+':');
    text.class('tweakables');
    var li = createElement('li','');
    li.child(text);
    li.class('tweakables');
    if(typeof tweakables[name] == 'number'){
      var inp = createInput(tweakables[name]);
      inp.input(new Function('tweakables["'+name+'"] = parseFloat(this.value());onChangeTweakable()'));
      inp.class('input');
    }else if(typeof tweakables[name] == 'string'){
      var inp = createInput(tweakables[name]);
      inp.input(new Function('tweakables["'+name+'"] = this.value();onChangeTweakable()'));
      inp.class('input');
    }else if(typeof tweakables[name] == 'boolean'){
      var inp = createCheckbox('',tweakables[name]);
      inp.changed(new Function('tweakables["'+name+'"] = this.checked();onChangeTweakable()'));
      inp.class('checkbox');
    }else{
      localStorage["polygon_tweakables"] = undefined;
      throw 'invalid tweakables';
    }
    inp.elt.className += (' tweakables');
    li.child(inp);
    pdiv.child(li);
    //tweakables[name]
  }
  var li = createElement('li','');
  var button = createButton('reset');
  button.mousePressed(new Function('localStorage["polygon_tweakables"] = "";'));
  li.child(button);
  pdiv.child(li);

  if(tweakables.metaResize)
    $(".input.tweakables")
    .keydown(resizeTextbox)
    .keyup(resizeTextbox)
    .change(resizeTextbox)
    .click(resizeTextbox)
    .each(function(i,e) {
      resizeTextbox.call(e);
    });
}

function onChangeTweakable() {
  localStorage["polygon_tweakables"] = JSON.stringify(tweakables);
  doUpdate();
  if(tweakables.metaResize)
    $(".input.tweakables").each(function(i,e) {resizeTextbox.call(e);});
}

function resizeTextbox() {
  var t = 10;
  this.style.width = 0;
  var newWidth = this.scrollWidth + t;
  //if( this.scrollWidth >= this.clientWidth )newWidth += t;
  this.style.width = newWidth + 'px';
}