//<generic>

var inputRom = [
  {keys:['W','up'],action:'rotator.applyDir(0)',repeatable:true},//0
  {keys:['A','left'],action:'rotator.applyDir(3)',repeatable:true},//1
  {keys:['S','down'],action:'rotator.applyDir(2)',repeatable:true},//2
  {keys:['D','right'],action:'rotator.applyDir(1)',repeatable:true},//3
  {keys:['Q','home'],action:'rotator.applyDir(4)',repeatable:true},//4
  {keys:['E','pgup'],action:'rotator.applyDir(5)',repeatable:true},//5
  {keys:['R'],action:'resetView()'},//6
  {keys:['O','T'],action:'toggleTweakables()'},//7
  {keys:['enter'],action:'readRecipe()'}//8s
];

function parseInputRom() {
  for (var i = 0; i < inputRom.length; i++) {
    var t;
    (t = inputRom[i].keys) || (t = inputRom[i].key);
    if(t.length == undefined){inputRom[i].key = getKeyCodeOf(t);inputRom[i].keys = undefined;continue;}
    if(t.length == 1){inputRom[i].key = getKeyCodeOf(t[0]);inputRom[i].keys = undefined;continue;}
    if(t.length == 0)throw 'waaat';
    inputRom[i].keys = [];
    inputRom[i].key = undefined;
    for (var j = 0; j < t.length; j++) {
      inputRom[i].keys[j] = getKeyCodeOf(t[j]);
    }
  }
}

function trueinput(i) {
  doUpdate();
  eval(inputRom[i].action);
}

function longinput(d){
  if(longinput.timer[d] > 0){
    longinput.timer[d]--;
  }else{
    trueinput(d);longinput.timer[d] = tweakables.inputRepeatSpeed;
  }
}

longinput.timer = [];

function shortinput(d){
  trueinput(d);
  longinput.timer[d] = tweakables.inputRepeatDelay;
}

function keyPressed(){
  if(!isFocusedOnCanvas())return;
  for (var i = 0; i < inputRom.length; i++) {
    if(inputRom[i].keys == undefined && inputRom[i].key != undefined){
      if(keyCode == inputRom[i].key){shortinput(i);return;}
    } else if(inputRom[i].keys != undefined){
      if(!inputRom[i].simultaneous){
        for (var j = 0; j < inputRom[i].keys.length; j++) {
          if(keyCode == inputRom[i].keys[j]){shortinput(i);return;}
        }
      }else{
        if(inputRom[i].keys[inputRom[i].keys.length - 1] != keyCode)continue;
        for (var j = inputRom[i].keys.length - 2; j >= 0; j--) {
          if(!keyIsDown(inputRom[i].keys[j])){j = -2;break;}
        }
        if(j == -1){shortinput(i);return;}
      }
    }
  }
}

function updateKeyboard(){
  if(!isFocusedOnCanvas())return;
  for (var i = 0; i < inputRom.length; i++) {
    if(!inputRom[i].repeatable)continue;
    if(inputRom[i].keys == undefined && inputRom[i].key != undefined){
      if(keyIsDown(inputRom[i].key)){longinput(i);continue;}
    } else if(inputRom[i].keys != undefined){
      if(!inputRom[i].simultaneous){
        for (var j = 0; j < inputRom[i].keys.length; j++) {
          if(keyIsDown(inputRom[i].keys[j])){longinput(i);break;}
        }
      }else{
        for (var j = inputRom[i].keys.length - 1; j >= 0; j--) {
          if(!keyIsDown(inputRom[i].keys[j])){j = -2;break;}
        }
        if(j == -1){longinput(i);continue;}
      }
    }
  }
}

//</generic>

function mousePressed() {
  if(isMouseOverCanvas()){
    lastMousePos = createVector(mouseX,mouseY);
    doUpdate();
    isDraggable = true;
  }else{
    isDraggable = false;
  }
}

function mouseDragged(){
  if(!isDraggable)return; 
  var currentMousePos = createVector(mouseX,mouseY);
  var mouseMovement = createVector(currentMousePos.x - lastMousePos.x,currentMousePos.y - lastMousePos.y,0);
  rotator.applyQuaternion(
    rotator.makeQuaternion(
      createVector(-mouseMovement.y,mouseMovement.x,0).normalize(),
      (mouseMovement.mag()*tweakables.mouseSensitivity)%360
    )
  );
  lastMousePos = currentMousePos;
  doUpdate();
}

function mouseWheel(event) {
  if(!isMouseOverCanvas())return;
  if(keyIsDown(SHIFT)){
    var r = meshProperties().maxRadius;
    zoom += event.delta*tweakables.scrollSpeed*(zoom-r)/250;
    var limit = 100;
    if(zoom>limit)zoom = limit;
    if(zoom<r+0.1)zoom = r+0.1;
  }else{
    scl -= event.delta*tweakables.scrollSpeed*scl/25/50;
  }
  doUpdate();
}

function resetView(){
  doUpdate();
  isPlanarView = false;
  rotator.returnToInit();
  var mr = meshProperties().maxRadius;
  scl = tweakables.defaultZoom/(2*mr);
  zoom = mr+3;
}