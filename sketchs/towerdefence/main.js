var img;
var grid = [];
var pathfinder;
var gameObjects = [];
var goals = [];//{x:0,y:0};
var entrances = [/*{x:1,y:1}*/];

var pathfindingMode = 1;
//var updatingMode = 0;
var minSpeed = 0.4;
var maxSpeed = 0.6;
//var particleCount = 100;
var _speed = 0.5;
var _gameSpeed = 1;
var isPaused = 1;//false;
Object.defineProperty(this, "GameSpeed", {
  set: function(value) {
    value = round10(value,-2)
    if(value <= 0){
      //this.isPaused = true;
    }else{
      this._gameSpeed = value;
    }
  },
  get: function() {
    if(this.isPaused)return 0;
    if(Number.isInteger(this._gameSpeed))return this._gameSpeed;
    return _gameSpeedHelper(this._gameSpeed,frameCount);
  }, configurable: true, enumerable: false
});

function _gameSpeedHelper(n,t) {
  return floor(n) + (0==floor(t%(1/(n-floor(n))))?1:0);
}

var offset = {x:10,y:10,x1:10,y1:10};
var scl;//= 490;
var canvas;
var frDiv;
var tooltipContainer;
var mapLayer;

var money = 0;

var balanceData = {
  tower:{
    upgradeCost:{
      base:10,
      escale:1.1,
      lscale:0
    },
    buildCost:1,
    rangeSq:{
      base:25,
      escale:1,
      lscale:5
    },
    damage:{
      base:2,
      escale:1.1,
      lscale:0
    },
    speed:{
      base:3,
      escale:1,
      lscale:1
    }
  },
  wallBuildCost:1
};

function Tile(o){Object.assign(this,o);}

function preload() {
  initTileGraphics();
  img = loadImage("img.png");
}

function setup() {
  initTweakables();
  initCanvases();
  toggleTooltips();
  frDiv = createDiv('');
  frDiv.position(10,height);
  rectMode(RADIUS/*CENTER*/);
  initGrid();
  //scl = 490/max(img.width,img.height);
  createVectorField();
  shuffleParticles();
  parseInputRom();
  randomTowers(tweakables.towerCount);
  increaseGameSpeed(0);
  initButtons();
}

var canvases = [];

function initCanvases(){
  var width = 600;var height = 500;
  canvases.push(mapLayer = createGraphics(width,height));
  canvases.push(canvas = createCanvas(width, height));
  canvases.push(layer2 = createGraphics(width,height));
  canvases.push(uiLayer = createGraphics(width,height));
  canvases.push(cursorLayer = createGraphics(width,height));
  /*var a = document.getElementsByTagName("canvas");
  for (var i = 0; i < a.length; i++) {
    a[i].style.display = '';
  }*/
  var container = document.getElementById('canvasContainer');
  container.style.width = width;
  container.style.height = height;
  for (var i = 0; i < canvases.length; i++) {
    container.appendChild(canvases[i].elt);
    canvases[i].elt.style['z-index'] = i;
    canvases[i].elt.style.display = '';
    canvases[i].drawingContext.imageSmoothingEnabled = tweakables.imageSmoothing;
    canvases[i].isDirty = true;
  }
  if(!tooltipContainer)tooltipContainer = select('#tooltipContainer');
  //tooltipContainer.style['z-index'] = i;

  var sclx = ((width)-(offset.x+offset.x1))/(img.width);
  var scly = ((height)-(offset.y+offset.y1))/(img.height);
  scl = min(sclx,scly);

  initCanvas.call(layer2,false);
  initCanvas.call(uiLayer,false);
  //initCanvas.call(mapLayer,false);
}

function initGrid(){
  img.loadPixels();
  goals = [];
  entrances = [];
  grid = [];
  for (var x = 0; x < img.width; x++) {
    grid[x] = [];
    for (var y = 0; y < img.height; y++) {
      var v = (img.pixels[4*(y*img.width+x)+0]!=0?1:0)
             |(img.pixels[4*(y*img.width+x)+1]!=0?2:0)
             |(img.pixels[4*(y*img.width+x)+2]!=0?4:0);
      grid[x][y] = new Tile({b:(v == 7||v == 5||v == 1),x:x,y:y,value:v});
      if(v == 1){goals.push({x:x,y:y});continue;}
      if(v == 5||(v == 7 && (x==0||y==0||x==img.width-1||y==img.height-1))){
        entrances.push({x:x,y:y});continue;
      }
    }
  }
  entrances = entrances.map(e => new Entrance(e.x,e.y).undestroy());
}

function toggleTooltips() {
  if(!tooltipContainer)tooltipContainer = select('#tooltipContainer');
  var a = width;
  if(!tweakables.showTooltips){
    tooltipContainer.style('left','-'+a+'px');
  }else{
    tooltipContainer.style('left',0+'px');
  }
}

function shuffleParticles() {
  //gameObjects = [];
  money = 0;
  randomSeed(0);
  destroyAllGameObjectsOfType(Enemy);
  forEachGameObjectOfType(Tower,'this.cd = this.totalcd;');
  for (var i = 0; i < tweakables.particleCount; i++) {
    new Enemy();//.undestroy();
  }
}

function findAllGameObjectsOfType(t){
  if(t == undefined)t = GameObject;
  var r = [];
  for (var i = 0; i < gameObjects.length; i++) {
    if(gameObjects[i] instanceof t)r.push(gameObjects[i]);
  }
  return r;
}

function destroyAllGameObjectsOfType(t){
  if(t == undefined)t = GameObject;
  var gos = gameObjects.slice();
  for (var i = 0; i < gos.length; i++) {
    if(gos[i] instanceof t)gos[i].destroy();
  }
}

function forEachGameObjectOfType(t,action){
  if(t == undefined)t = GameObject;
  if(typeof action == 'string'){
    action = new Function(action);
  }
  var gos = gameObjects.slice();
  for (var i = 0; i < gos.length; i++) {
    if(gos[i] instanceof t)action.call(gos[i]);
  }
}

/*function randomVectorField(){
  do{
    x = floor(random(0,grid.length));
    y = floor(random(0,grid[0].length));
  }while(!grid[(x)][(y)].b)
  createVectorField({x:x,y:y});
}*/

function randomTowers(n){
  destroyAllGameObjectsOfType(Tower);
  if(n > 238)n = 238;
  for (var i = 0; i < n; i++) {
    do{
      x = floor(random(0,grid.length));
      y = floor(random(0,grid[0].length));
    }while(!(grid[x][y].value == 2&&grid[x][y].tower == undefined))
    gameObjects.push( new Tower(x,y));
  }
}

function createVectorField(end){
  if(pathfinder == undefined){
    pathfinder = new Pathfinder({
      checkForWall:function(x,y,dir)
      { 
        var v = dirToVector(dir);
        return (this.tiles[x+v.x][y+v.y].b && this.tiles[x][y].b);
      },
      tiles:grid
    })
  }else{pathfinder.isValid = false;}
  if(end == undefined)end = goals[0];//end = simplifyP5Vector(end);
  //goal = end;
  var list = [end];
  for (var i = 1; i < goals.length; i++) {
    list.push(goals[i]);
  }
  for (var x = 0; x < grid.length; x++) {
    for (var y = 0; y < grid[0].length; y++) {
      grid[x][y].v = undefined;
    }
  }
  if(!grid[end.x][end.y].b)return false;
  var res = true;
  for (var i = 0; i < entrances.length; i++) {
    if(calcPathTo(entrances[i].x,entrances[i].y,list)==false)res=false;
  }
  for (var x = 0; x < grid.length; x++) {
    for (var y = 0; y < grid[0].length; y++) {
      calcPathTo(x,y,list);
      //if(calcPathTo(x,y,list)==false)res=false;
    }
  }
  mapLayer.isDirty = true;
  return res;
}

function calcPathTo(x,y,list){
  if(grid[x][y].v != undefined)return true;
  if(!grid[x][y].b)return true;
  //if(asyncVectors)await sleep(1);
  var path = pathfinder.findVectors({x:x,y:y},list);
  if(path.length == 0){
    var t = 0;
    for (var i = 0; i < goals.length; i++) {
      if(goals[i].x == x&&goals[i].y == y){t = 1;break;}
    }
    if(t == 0){return false;}
  }
  path.unshift({x:x,y:y});
  for (var i = 0; i < path.length-1; i++) {
    var p1 = path[i];var p2 = path[i+1];
    if(pathfindingMode)list.push(p1);
    grid[p1.x][p1.y].v = {x:-(p1.x-p2.x),y:-(p1.y-p2.y)};
  }
  return true;
}

var dirToVectorRom = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
function dirToVector(dir){
  return dirToVectorRom[dir];
}

function vectorToDir(v){
  if(v.x == 0&&v.y < 0){
    return 0;
  }else if(v.x > 0&&v.y == 0){
    return 1;
  }else if(v.x == 0&&v.y > 0){
    return 2;
  }else if(v.x < 0&&v.y == 0){
    return 3;
  }
}

function convertCanvasToImage(canvas) {
  //return canvas;
  var image = new Image();
  image.src = canvas.canvas.toDataURL("image/png");
  return image;
}

function convertVectorToP5(v){
  //if(!v.z)return createVector(v.x,v.y);
  if(v == undefined)return createVector(0,0);
  return createVector(v.x,v.y,v.z);
}

function simplifyP5Vector(v){
  //if(!v.z)return createVector(v.x,v.y);
  if(v == undefined)return {x:0,y:0};
  return {x:v.x,y:v.y};
}

function doubleProgression(a0,n,e,l){
  if(n == 0||(l == 0&&e == 1))return a0;
  if(l == 0)return a0*e**n;
  if(e == 1)return a0+l*n;
  var r = 0;
  for (var i = 0; i < n-1; i++) {
    r += e**i;
  }
  r *= l;
  if(a0)r += a0*e**n;
  return r;
}

function doubleProgressionSum(a0,n,e,l){
  if(n == -1)return 0;
  var r = 0;
  n++;
  while(n--){
    r += doubleProgression(a0,n,e,l);
  }
  return r;
}