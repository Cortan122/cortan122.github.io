console.log('input.js');
var mouseMode = false;

var keyActionList = [
  'block.rotate(1)',//0
  'block.shove(1)',//1
  'drop(true)',//2
  'block.shove(-1)',//3
  'mode = (mode+1)%3;if(mode == 1){loadTileGraphics();}',//4
  'block.commit()',//5
  'if(paused == undefined){paused = "paused";}else if(paused == "paused"){paused = undefined;}',//6
  'block.rotate(-1)',//7
  'restart()',//8
  'if(paused != "help"){helpRequired = true;lastPaused = paused;paused = "help"}',//9
  'muted = !muted',//10
  'toggleTweakables()',//11
  'mouseInputs = _mouseInputs.slice();smallHelpString = _smallHelpString;smallHelpStringSize = 1',//12
  'makeDifficultyProfile();window.location += "/scoreboard";'//13
];

function trueinput(d){
  //checkWinCondition();
  dirty = true;
  eval(keyActionList[d]);
  //checkWinCondition();
}

function input(d){
  if(input.timer[d] > 0){input.timer[d]--;}else{trueinput(d);input.timer[d] = tweakables.inputRepeatSpeed;};
}

input.timer = [];
var keyList = [];

function keyPressed(){
  var defaultTimerValue = tweakables.inputRepeatDelay;
  helpRequired = false;mouseMode = false;
  for (var i = 0; i < keyList.length; i++) {
    if(keyList[i].length == undefined){if(keyCode == keyList[i]){trueinput(i);input.timer[i] = defaultTimerValue;return;}}
    for (var j = 0; j < keyList[i].length; j++) {
      if(keyCode == keyList[i][j]){trueinput(i);input.timer[i] = defaultTimerValue;return;}
    }
  }
  //helpRequired = true;dirty = true;
  //drawHelp();
}

function updateKeyboard(){
  if(mouseMode){
    if(round(mousePos.x) < block.x){
      trueinput(3);
    }else if(round(mousePos.x) > block.x){
      trueinput(1);
    }
  }
  if(mouseWheelEvent < 0){
    mouseWheelEvent++;
    trueinput(2);
  }

  for (var i = 0; i < keyList.length; i++) {
    if(keyList[i].length == undefined){if(keyIsDown(keyList[i])){input(i);}}
    for (var j = 0; j < keyList[i].length; j++) {
      if(keyIsDown(keyList[i][j])){input(i);}
    }
    //if(keyIsDown(keyList[i])){input(i);}
  }
}

function isInputAllowed(){
  if(paused == undefined||paused == ''){return true;}
  if(paused == "paused" && !tweakables.hardPausing){return true;}
  return false;
}

function getMousePos(){
  var pos = createVector(mouseX,mouseY);
  pos.add(-width/2,-height/2);
  pos.add(-offset.x,-offset.y);
  pos.mult(1/scl);
  return pos;
}

function mouseMoved(){
  var pos = mousePos = getMousePos();
  if(pos.x > -2.5 &&pos.y > -2.5 &&pos.x < grid.length+2.5 &&pos.y < grid[0].length+2.5){
    //we are inside the box
    if(tweakables.mouseControls){mouseMode = true;}else{mouseMode = 0;}
  }else{mouseMode = false;}
  if(pos.x < -2.5 && tweakables.showSmallHelp){
    highlighter = floor(((floor(pos.y*0.8)/0.8)+1.25)/1.25);
    //if(highlighter == -1)highlighter = 0;
    if(highlighter < 0)highlighter = undefined;
    dirty = true;
  }else{if(highlighter != undefined){highlighter = undefined;dirty = true;}}
}

var _mouseInputs = [
  9,10,8,6,
  {s:'⮐\nPuzzle\nConstant\nFlexable\nNormal\nHard',
  a:[12,'setDifficulty(0)','setDifficulty(1)','setDifficulty(2)','setDifficulty(3)','setDifficulty(4)'],
  size:1},
  {s:'⮐\nRandom colors{0}\nFlip mouse buttons{1}\nShow goast{2}\nShow center tiles{3}\nShow queue{4}',
  a:[12,'toggle("randomColors")','toggle("flipMouseButtons")','toggle("showGoast")','toggle("showCenter")','toggle("showQueue")'],
  size:0.5},
  13
];
var mouseInputs = _mouseInputs.slice();
var smallHelpStringBackup;
var smallHelpStringSize = 1;

function toggle(i){
  tweakables[i] = !tweakables[i];
  onChangeTweakable();
  //smallHelpStringBackup = smallHelpString;
  smallHelpString = smallHelpStringBackup.format(
    (tweakables.randomColors?'✔':'✘'),
    (tweakables.flipMouseButtons?'✔':'✘'),
    (tweakables.showGoast?'✔':'✘'),
    (tweakables.showCenter?'✔':'✘'),
    (tweakables.showQueue?'✔':'✘')
  );
}

function mousePressed(){
  if(helpRequired != false){helpRequired = false;dirty = true;return;}
  if(highlighter !== undefined){
    if(mouseInputs[highlighter] != undefined){
      if(typeof mouseInputs[highlighter] == 'object'){
        smallHelpStringBackup = smallHelpString = mouseInputs[highlighter].s;
        smallHelpString = smallHelpString.format(
          (tweakables.randomColors?'✔':'✘'),
          (tweakables.flipMouseButtons?'✔':'✘'),
          (tweakables.showGoast?'✔':'✘'),
          (tweakables.showCenter?'✔':'✘'),
          (tweakables.showQueue?'✔':'✘')
        );
        smallHelpStringSize = max(mouseInputs[highlighter].size,0.55);
        mouseInputs = mouseInputs[highlighter].a;
        dirty = true;
      }else if(typeof mouseInputs[highlighter] == 'string'){
        dirty = true;
        eval(mouseInputs[highlighter]);
      }else{
        trueinput(mouseInputs[highlighter]);
      } 
    }
  }
  if(mouseMode){
    if(mouseButton == LEFT)trueinput(tweakables.flipMouseButtons?0:5);
    if(mouseButton == RIGHT)trueinput(tweakables.flipMouseButtons?5:0);
  }
  //throw 'hi';
}

var mouseWheelEvent = 0;

function mouseWheel(event) {
  mouseWheelEvent -= event.delta/100;
  if(mouseWheelEvent > 0){mouseWheelEvent = 0;}
}
