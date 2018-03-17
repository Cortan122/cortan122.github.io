var inputRom = [
  {keys:['U'],action:'if(selectedTower)selectedTower.upgrade();uiLayer.isDirty = true;'},//0
  {keys:[' '],action:'isPaused = !isPaused;uiLayer.isDirty = true;'},//1
  {keys:['+','numpad+'],action:'increaseGameSpeed(0.5)'},//2
  {keys:['-','numpad-'],action:'increaseGameSpeed(-0.5)'},//3
  {keys:['S'],action:'shuffleParticles()'},//4
  {keys:['O','T'],action:'toggleTweakables()'},//5
  {keys:['esc'],action:'selectedThing = undefined;buildMode = undefined;towerBeingMoved = undefined;'},//6
  {keys:['ctrl','Z'],action:'if(isPaused||!tweakables.balancedUndo)undo();',simultaneous:true},//7
  {keys:['ctrl','Y'],action:'if(isPaused||!tweakables.balancedUndo)redo();',simultaneous:true},//8
  {keys:['M'],action:'if(selectedTower)towerBeingMoved = selectedTower;uiLayer.isDirty = true;'},//9
  {keys:['del'],action:'destroyTower(selectedTower)'}//10
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
  //
  eval(inputRom[i].action);
}

function keyPressed(){
  for (var i = 0; i < inputRom.length; i++) {
    if(inputRom[i].keys == undefined && inputRom[i].key != undefined){
      if(keyCode == inputRom[i].key){trueinput(i);return;}
    } else if(inputRom[i].keys != undefined){
      if(!inputRom[i].simultaneous){
        for (var j = 0; j < inputRom[i].keys.length; j++) {
          if(keyCode == inputRom[i].keys[j]){trueinput(i);return;}
        }
      }else{
        if(inputRom[i].keys[inputRom[i].keys.length - 1] != keyCode)continue;
        for (var j = inputRom[i].keys.length - 2; j >= 0; j--) {
          if(!keyIsDown(inputRom[i].keys[j])){j = -2;break;}
        }
        if(j == -1){trueinput(i);return;}
      }
    }
  }
}

var _gameSpeed1 = 0;
function increaseGameSpeed(c){
  uiLayer.isDirty = true;
  _gameSpeed1 += c;
  _gameSpeed1 = constrain(_gameSpeed1, -3, 3);
  /*if(_gameSpeed1 > 0){GameSpeed = _gameSpeed1+1;}else{
    GameSpeed = -1/(_gameSpeed1-1);
  }*/
  GameSpeed = 2**_gameSpeed1;
}

var _selectedTower = undefined;
Object.defineProperty(this, "selectedTower", {
  set: function(value) {
    if(!(value instanceof Tower)&&value != undefined)return;
    if(_selectedTower != value){
      //uiLayer = undefined;
      if(_selectedTower != undefined){
        _selectedTower.onTargetChangedEvents.highlightTarget = undefined;
        if(_selectedTower.target)_selectedTower.target.drawEvents.highlightTarget = undefined;
      }
      if(value == undefined){
        for (var i = 4; i <= 7; i++) {
          buttons[i].isActive = false;
        }
      }
      selectedThing = _selectedTower = value;
    }
  },
  get: function() {
    return _selectedTower = (selectedThing instanceof Tower)?selectedThing:undefined;
  }, configurable: true, enumerable: false
});
var _selectedThing = undefined;
Object.defineProperty(this, "selectedThing", {
  set: function(value) {
    if(_selectedThing != value){
      uiLayer.isDirty = true;
      _selectedThing = value;
      if(_selectedThing instanceof Tower){selectedTower = value;}else{selectedTower = undefined;}
    }
  },
  get: function() {
    return _selectedThing;
  }, configurable: true, enumerable: false
});

var towerBeingMoved;

function canBuildTowerAt(x,y){
  if(arguments.length == 0||x === undefined)return false;
  if(y == undefined&&x.y != undefined&&x.x != undefined){
    y = x.y;
    x = x.x;
  }
  return (grid[x][y].value == 2 || grid[x][y].value == 4) &&!grid[x][y].tower;
}

function moveTower(){
  if(canBuildTowerAt(highlightedTile)){
    var t;
    undoActions.push({
      un:`
        selectedTower = grid[`+highlightedTile.x+`][`+highlightedTile.y+`].tower;
        grid[`+highlightedTile.x+`][`+highlightedTile.y+`].tower.move(
        `+towerBeingMoved.pos.x+`,`+towerBeingMoved.pos.y+`);
        uiLayer.isDirty = true;
      `,
      re:t = `
        selectedTower = grid[`+towerBeingMoved.pos.x+`][`+towerBeingMoved.pos.y+`].tower;
        grid[`+towerBeingMoved.pos.x+`][`+towerBeingMoved.pos.y+`].tower.move(
        `+highlightedTile.x+`,`+highlightedTile.y+`);
        uiLayer.isDirty = true;
      `
    });
    eval(t);
    //towerBeingMoved.move(highlightedTile);
    //selectedTower = towerBeingMoved;
    towerBeingMoved = undefined;
    uiLayer.isDirty = true;
  }else{print('cant move here');}
}

function destroyTower(x,y){
  if(x == undefined)return;
  if(x instanceof Tower){y = x.pos.y;x = x.pos.x;}
  var t;
  undoActions.push({
    re:t = 'grid['+x+']['+y+'].tower.destroy();',
    un:'gameObjects.push(selectedTower = new Tower('+x+','+y+'));'
  });
  eval(t);
}

function buildTower(x,y){
  if((!tweakables.negativeMoney)&&money<balanceData.towerBuildCost)return;
  //money -= balanceData.towerBuildCost;
  var t;
  undoActions.push({
    un:'grid['+x+']['+y+'].tower.destroy();',
    re:t = 'gameObjects.push(selectedTower = new Tower('+x+','+y+'));'
  });
  eval(t);
}

function mousePressed(){
  if(towerBeingMoved&&highlightedTile){moveTower();return;}
  if(buildMode&&(highlightedTile||highlightedTower)){
    build(highlightedThing.x,highlightedThing.y);
    return;
  }
  if(highlightedTower||highlightedTile){if(selectedTower = highlightedTower)return;}
  if(!highlightedButton)return;
  if(highlightedButton.click())return;
}

var _highlightedThing = undefined;
Object.defineProperty(this, "highlightedThing", {
  set: function(value) {
    if(_highlightedThing != value){
      if(_highlightedThing instanceof Tile){undrawBuildPreview();}
      _highlightedThing = value;
      if(value instanceof Tile){drawBuildPreview();}
    }
  },
  get: function() {
    return _highlightedThing;
  }, configurable: true, enumerable: false
});
Object.defineProperty(this, "highlightedTower", {
  get: function() {
    return (highlightedThing instanceof Tower)?highlightedThing:undefined;
  }, configurable: true, enumerable: false
});
Object.defineProperty(this, "highlightedTile", {
  get: function() {
    return (highlightedThing instanceof Tile)?highlightedThing:undefined;
    /*try{
      return (grid[highlightedThing.x][highlightedThing.y] == highlightedThing)?highlightedThing:undefined;
    }catch(e){return undefined;}*/
  }, configurable: true, enumerable: false
});
Object.defineProperty(this, "highlightedButton", {
  get: function() {
    return (highlightedThing instanceof Button)?highlightedThing:undefined;
  }, configurable: true, enumerable: false
});

function mouseMoved(){
  var pos = getMousePos();
  var _pos = pos.copy().floor();
  highlightedThing = undefined;
  try{
    if(grid[_pos.x][_pos.y].tower != undefined){
      highlightedThing = grid[_pos.x][_pos.y].tower;
    }else{
      highlightedThing = grid[_pos.x][_pos.y];
    }
  }catch(e){
    pos = getMousePos();
    var x = pos.x-0.5;var y = pos.y-0.5;
    for (var i = 0; i < buttons.length; i++) {
      if(!buttons[i].includes(x,y))continue;
      highlightedThing = buttons[i];
      return;
    }
  }
}

var _buildMode = 'buildTower';//tower,wall
Object.defineProperty(this, "buildMode", {
  set: function(value) {
    uiLayer.isDirty = true;
    if(_buildMode != value){
      _buildMode = value;
    }else{_buildMode = undefined;}
  },
  get: function() {
    return _buildMode;
  }, configurable: true, enumerable: false
});
var _buildTowerMode = 'Missile';
Object.defineProperty(this, "buildTowerMode", {
  set: function(value) {
    if(_buildTowerMode != value){
      uiLayer.isDirty = true;
      _buildTowerMode = value;
    }//else{_buildTowerMode = undefined;}
  },
  get: function() {
    return _buildTowerMode;
  }, configurable: true, enumerable: false
});
var _defaultTowerMode = 'weakest';
Object.defineProperty(this, "defaultTowerMode", {
  set: function(value) {
    if(_defaultTowerMode != value){
      uiLayer.isDirty = true;
      var arr = findAllGameObjectsOfType(Tower);
      for (var i = 0; i < arr.length; i++) {
        if(arr[i].mode == _defaultTowerMode)arr[i].mode = value;
      }
      _defaultTowerMode = value;
    }
  },
  get: function() {
    return _defaultTowerMode;
  }, configurable: true, enumerable: false
});

function build(x,y){
  if(buildMode == undefined)return;
  if(x == undefined&&y == undefined){var pos = getMousePos().floor();x = pos.x;y = pos.y;}
  if(buildMode == 'buildTower'){
    if(canBuildTowerAt(x,y)){
      buildTower(x,y);
      return;
    }
    if(grid[x][y].tower)selectedTower = grid[x][y].tower;
  }
  if(buildMode == 'buildWall'){
    if(grid[x][y].value == 7){
      var t;
      undoActions.push({
        un:'setGridValue('+x+','+y+',7)',
        re:t = 'temp = setGridValue('+x+','+y+',4)'
      });
      eval(t);
      if(!temp/*createVectorField()*/){
        undo();
        redoActions.pop();
        gameObjects[gameObjects.length-1].destroy();//destroys price tags
        gameObjects[gameObjects.length-1].destroy();
        new FadingText(getMousePos(),'Blocking!!').undestroy();//.color = color('pink');
      }
    }
  }
  if(buildMode == 'demolish'){
    if(grid[x][y].value == 4){
      var t;
      undoActions.push({
        re:t = 'setGridValue('+x+','+y+',7)',
        un:'setGridValue('+x+','+y+',4)'
      });
      eval(t);
    }
    if(grid[x][y].tower){
      destroyTower(x,y);
    }
  }
}

function setGridValue(x,y,v){
  var tile = grid[x][y];
  if(tile.value == v)return;
  var price = 0;
  if(tile.value == 4)price = balanceData.wallBuildCost;
  if(v == 4)price = -balanceData.wallBuildCost;
  if(price != 0){
    money += price;
    new FadingText(x,y,'{1}{0}$'.format(price,price>0?'+':'')).undestroy();
  }
  tile.value = v;
  tile.b = (v == 7);
  return createVectorField();
}

function toggleTowerMode(){
  if(!selectedTower)return;
  uiLayer.isDirty = true;
  var i = Tower.modes.indexOf(selectedTower.mode);
  selectedTower.mode = Tower.modes[(i+1)%Tower.modes.length];
}

var undoActions = [];

function undo(){
  try{
    var action = undoActions.pop();
    if(typeof action.un == 'string')eval(action.un);
    if(typeof action.un == "function")action.un.call(this);
    redoActions.push(action);
  }catch(e){}
}

var redoActions = [];

function redo(){
  try{
    var action = redoActions.pop();
    if(typeof action.re == 'string')eval(action.re);
    if(typeof action.re == "function")action.re.call(this);
    undoActions.push(action);
  }catch(e){}
}

function mouseWheel(event) {
  if(tweakables.invertMouseWheel)event.delta = -event.delta;
  var pos = getMousePos();
  var x = pos.x+0.5;var y = pos.y;
  if(highlightedButton&&highlightedButton.name == 'clock'){
    increaseGameSpeed(-event.delta/500);
  }
  if(highlightedTower){
    highlightedTower.adjustRange(-event.delta/500)
  }
}

function getMousePos(){
  var pos = createVector(mouseX,mouseY);
  //pos.add(-width/2,-height/2);
  pos.add(-offset.x,-offset.y);
  pos.mult(1/scl);
  return pos;
}