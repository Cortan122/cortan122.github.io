console.log('tweakables.js');
var tweakables = {
  healthBarWidth:0.1,
  buttonColorOn:'#88f',
  buttonColorOff:'#fff',
  shadowColor:'rgba(0,0,0,1)',
  bigShadowSize:0.2,
  smallShadowSize:0.1,
  particleCount:100,//temporary
  towerCount:10,//temporary
  showFPS:true,//debug
  showFullHealthBar:false,
  showTowerTarget:true,
  drawHealthBarOnLayer2:true,
  coverClockWhenPaused:true,
  invertMouseWheel:false,
  imageSmoothing:false,
  balancedUndo:true,//debug
  buttonMode:false,
  enableGraphics:true,//debug
  drawShadows:true,
  showTooltips:true,
  boldText:false,
  negativeMoney:false,//debug
  drawSelectedTowerRange:false,
  resizeTextboxes:true
};

function onChangeTweakable() {
  localStorage["towerdefence_tweakables"] = JSON.stringify(tweakables);
  uiLayer.isDirty = true;
  mapLayer.isDirty = true;
  toggleTooltips();
}

function initTweakables(){
  try{
    if(localStorage["towerdefence_tweakables"]){
      var t = JSON.parse(localStorage["towerdefence_tweakables"]);//var t = {};
      //eval('t = '+localStorage["tetris_tweakables"])
      tweakables = Object.assign(tweakables,t)
    }
    localStorage["towerdefence_tweakables"] = JSON.stringify(tweakables);
  }catch(e){localStorage["towerdefence_tweakables"] = '';}
  displayTweakables();
  delayEval(1,'toggleTweakables()');
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
  for(var name in tweakables){
    var text = createP(name+':');
    text.class('tweakables');
    var li = createElement('li','');
    li.child(text);
    //li.class('tweakables');
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
    }
    inp.elt.className += (' tweakables');
    li.child(inp);
    pdiv.child(li);
    //tweakables[name]
  }
  var li = createElement('li','');
  var button = createButton('reset');
  button.mousePressed(new Function('localStorage["towerdefence_tweakables"] = "";'));
  li.child(button);
  pdiv.child(li);

  if(tweakables.resizeTextboxes)
    $(".input.tweakables")
    .keydown(resizeTextbox)
    .keyup(resizeTextbox)
    .change(resizeTextbox)
    .click(resizeTextbox)
    .each(function(i,e) {
      resizeTextbox.call(e);
    });
}

function resizeTextbox() {
  var t = 10;
  this.style.width = 0;
  var newWidth = this.scrollWidth + t;
  //if( this.scrollWidth >= this.clientWidth )newWidth += t;
  this.style.width = newWidth + 'px';
}