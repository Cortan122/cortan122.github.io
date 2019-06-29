var inputRom = [
  {keys:['W','up'],action:'doUpdate();rotator.applyDir(0)',repeatable:true},//0
  {keys:['A','left'],action:'doUpdate();rotator.applyDir(3)',repeatable:true},//1
  {keys:['S','down'],action:'doUpdate();rotator.applyDir(2)',repeatable:true},//2
  {keys:['D','right'],action:'doUpdate();rotator.applyDir(1)',repeatable:true},//3
  {keys:['Q','home'],action:'doUpdate();rotator.applyDir(4)',repeatable:true},//4
  {keys:['E','pgup'],action:'doUpdate();rotator.applyDir(5)',repeatable:true},//5
  {keys:['R'],action:'doUpdate();resetView()'},//6
  {keys:['O','T'],action:'doUpdate();lib.tweaker.toggleTweakables()'},//7
  {keys:['enter'],action:'doUpdate();readRecipe()'}//8
];

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
  if(mouseMovement.equals(0,0,0))return;
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
  var mp = meshProperties();
  doUpdate();
  isPlanarView = false;
  rotator.returnToInit();
  rotator.history2 = rotator.identityMatrix;
  var mr = mp.maxRadius;
  scl = tweakables.defaultZoom/(2*mr);
  zoom = mr+3;
}
