console.log('tweakables.js');
var tweakables = {
  boardWidth:10,
  boardHeight:20,
  baseDifficulty:60,
  maxDifficulty:15,
  diffScaleScore:0.001,
  diffScaleTime:0.0001,
  randomSeed:-1,
  imageStyle:6,
  font:'monospace',
  gridThickness:0.1,
  blinkCount:10,
  blinkDelay:25,
  masterVolume:1,
  inputRepeatDelay:11,
  inputRepeatSpeed:3,
  randomColors:false,
  drawBox:true,
  showQueue:true,
  showCenter:false,
  showGoast:true,
  goastMode:true,
  showSmallHelp:true,
  showDifficulty:true,
  showPeriod:false,
  showHighscore:true,
  showFPS:false,
  drawGridFirst:true,
  hardPausing:true,
  soundOverlap:true,
  magentaBG:false,
  publishHighscore:true,
  startWithHelp:true,
  mouseControls:true,
  flipMouseButtons:false,
  smartRotation:true
};

function initTweakables(){
  try{
    if(localStorage["tetris_tweakables"]){
      var t = JSON.parse(localStorage["tetris_tweakables"]);//var t = {};
      //eval('t = '+localStorage["tetris_tweakables"])
      tweakables = Object.assign(tweakables,t)
    }
    localStorage["tetris_tweakables"] = objToString(tweakables);
  }catch(e){localStorage["tetris_tweakables"] = '';}
  displayTweakables();
}

function toggleTweakables() {
  pdiv = select('#pDiv');
  if(isTweakablesShown){pdiv.style('left','-'+width+'px');}else{pdiv.style('left',width+'px');}
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
  button.mousePressed(new Function('localStorage["tetris_tweakables"] = "";'));
  li.child(button);
  pdiv.child(li);
}

function onChangeTweakable() {
  localStorage["tetris_tweakables"] = objToString(tweakables);
  difficultyProfile = undefined;
  dirty = true;
}
