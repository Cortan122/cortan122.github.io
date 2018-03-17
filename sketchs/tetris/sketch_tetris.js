console.log('sketch_tetris.js');
var grid = [];
var offset = {x:-45*2,y:-45*4};
var scl = 20;
var mode = 1;
var divergence = 0.5;
var frDiv;
var dirty = true;
var helpRequired = true;
var lastPaused;
var isTweakablesShown = false;
var seed;
var myip;
var highlighter = undefined;
var mousePos;
var timer = 0;

var cd = 60;
var score = 0;
var fakeScore = 0;
var paused = undefined;
var muted = false;
var difficulty;
var difficultyProfile = undefined;

var sounds = [
  'sounds/Mario-coin-sound.mp3',//0
  'sounds/bump.wav',//1
  'sounds/down.wav',//2
  'sounds/nice.wav',//3
  'sounds/bump2.wav',//4
  'sounds/pop.wav',//5
  'sounds/gameover.wav'//6
];

var img;

function preload() {
  loadTileGraphics();
  for (var i = 0; i < sounds.length; i++) {
    sounds[i] = loadSound(sounds[i]);
  }
}

function loadTileGraphics() {
  img = loadImage("tileGraphics/"+(tweakables.imageStyle%9)+".png");
}

function setup() {
  initTweakables();
  loadTileGraphics();//img = loadImage("tile"+tweakables.imageStyle+".png");
  keyList = [[UP_ARROW,87,69],[RIGHT_ARROW,68],[DOWN_ARROW,83],[LEFT_ARROW,65],84,32,[80,75,ESCAPE],[90,81,SHIFT],82,72,77,79];
  var can = createCanvas(500, 500);//.style("color", "#ff0000");;
  can.elt.addEventListener('contextmenu', function(ev) { ev.preventDefault();return false; }, false);
  frDiv = createDiv('');
  for (var i = 0; i < sounds.length; i++) {
    sounds[i].setVolume(0.1);
    sounds[i].onended(new Function('muted = false'));
  }
  //textFont('Courier New');
  if(tweakables.font == ''||tweakables.font == undefined)tweakables.font = 'monospace';
  textFont(tweakables.font);
  getIP();
  restart();
  if(tweakables.startWithHelp){paused = 'help';}else{paused = 'paused';helpRequired = false;}
}

var difficultyPresets = [
  {hardPausing:false,baseDifficulty:9999,maxDifficulty:9999,diffScaleScore:0,diffScaleTime:0      },
  {hardPausing:true ,baseDifficulty:30,maxDifficulty:30,diffScaleScore:0    ,diffScaleTime:0      },
  {hardPausing:true ,baseDifficulty:60,maxDifficulty:5 ,diffScaleScore:0.01 ,diffScaleTime:-0.0001},
  {hardPausing:true ,baseDifficulty:60,maxDifficulty:15,diffScaleScore:0.001,diffScaleTime:0.0001 },
  {hardPausing:true ,baseDifficulty:45,maxDifficulty:5 ,diffScaleScore:0.001,diffScaleTime:0.0001 }
];

function setDifficulty(n){
  tweakables = Object.assign(tweakables,difficultyPresets[n]);
  onChangeTweakable();
  restart();
  paused = 'paused';
  difficultyProfile = undefined;
}

function makeDifficultyProfile(){
  var things = {
    hardPausing:tweakables.hardPausing,
    showQueue:tweakables.showQueue,
    showGoast:tweakables.showGoast,
    randomColors:tweakables.randomColors,
    smartRotation:tweakables.smartRotation,
    blinkTime:tweakables.blinkCount*tweakables.blinkDelay
  };
  var c = 0;
  for (var i in tweakables) {
    if(c > 5){break;}
    things[i] = tweakables[i];
    c++;
  }
  if(!things.hardPausing){
    things.diffScaleTime = things.diffScaleScore = things.blinkTime = '';
  }
  var t = objToString2(things);
  localStorage["tetris_diff"] = t;
  return difficultyProfile = t;
}

function updateHighscore(){
  if(!localStorage["tetris_highscore"] || parseInt(localStorage["tetris_highscore"]) < score){
    localStorage["tetris_highscore"] = score;
    if(tweakables.publishHighscore){
      //paused = 'publishing';// 'highscore';
      dirty = true;
      pushHighscore();
      //paused = undefined;
    }
  }
}

function pushHighscore(){
  name = myip;//todo
  if(name == undefined)throw 'name == undefined';
  var o = {
    v:score/*parseInt(localStorage["tetris_highscore"])*/,
    f:floor(fakeScore),
    name:name,
    randomSeed:seed,
    difficulty:difficulty,
    date:new Date().toString().substr(4,20),
    time:timer
  };
  var s = (difficultyProfile?difficultyProfile:makeDifficultyProfile());
  //o = Object.assign(o,things);
  sendRequest(objToString([s,name,o]));
}

function restart(){
  if(tweakables.randomSeed != -1){
    randomSeed(seed = tweakables.randomSeed);
  }else{
    randomSeed(seed = floor(Math.random()*100000));
  }
  queue.type = undefined;
  paused = undefined;
  if(score != 0 ||fakeScore != 0)pushHighscore();//updateHighscore();
  score = 0;
  fakeScore = 0;
  timer = 0;
  difficulty = tweakables.baseDifficulty;
  cd = floor(difficulty);
  if(tweakables.magentaBG){background('magenta');}else{background(0);}
  grid = [];
  for (var i = 0; i < tweakables.boardWidth; i++) {
    grid[i] = [];
    for (var j = 0; j < tweakables.boardHeight; j++) {
      grid[i][j] = {v:0};//{v:random([0,1])};
    }
  }
  offset.x = -0.45*scl*(tweakables.boardWidth+1);
  offset.y = -0.45*scl*tweakables.boardHeight;
  block.init();
}

var clearsInRow = 0;
var fakeScoreRom = [1,2,1,4];

function checkWinCondition(){
  //var y = grid[0].length-1;
  if(paused == 'animation'){return;}
  for (var y = grid[0].length - 1; y >= 0; y--) {
    var r = 0;
    for (var x = 0; x < grid.length; x++) {
      if(grid[x][y].v == 1){r++;}else{break;}
    }
    if(r == grid.length){break;}
  }
  if(r == grid.length){
    clearsInRow++;
    score++;
    fakeScore += (fakeScoreRom[clearsInRow-1]*100*tweakables.maxDifficulty/difficulty);
    updateHighscore();
    if(!tweakables.soundOverlap){
      sounds[4].stop();
      sounds[5].stop();
    }
    playSound(3);
    difficulty = max(1/(1/difficulty+tweakables.diffScaleScore),tweakables.maxDifficulty);
    removeRow(y);
    //checkWinCondition();
  }else{
    clearsInRow = 0;
  }
}

async function removeRow(y){
  //while(paused == 'animation'){await sleep(10);}
  if(paused == 'animation'){return;}
  var backup = paused;
  paused = 'animation';
  var list = [];
  for (var i = 0; i < grid.length; i++) {
    list.push(grid[i][y]);
    grid[i][y].c = color('white');
  }
  for (var i = 0; i < tweakables.blinkCount; i++) {
    dirty = true;
    for (var j = 0; j < list.length; j++) {
      if(i%2 == 1){list[j].c = color('white');}else{list[j].c = color(0);}
    }
    await sleep(tweakables.blinkDelay);
  }
  //await sleep(5000);
  for (var i = 0; i < grid.length; i++) {
    //await sleep(10);
    //grid[i].pop();
    grid[i].splice(y,1);
    grid[i].unshift({v:0});
  }
  paused = backup;
  block.y++;//fixme
  goast.y++;
  dirty = true;
  checkWinCondition();
}

function getIP(){
  //if(myip != undefined){pushHighscore(myip);}
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET",'../../getIP.php',true);
  xmlHttp.setRequestHeader('Expires',' Tue, 03 Jul 2001 06:00:00 GMT');
  xmlHttp.setRequestHeader('Last-Modified','{now} GMT');
  xmlHttp.setRequestHeader('Cache-Control','max-age=0, no-cache, must-revalidate, proxy-revalidate');
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState === 4) {
      //pushHighscore(myip = xmlHttp.responseText);
      myip = xmlHttp.responseText
    }
  }
  xmlHttp.send();
}

function sendRequest(data){
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("POST",'score.php',true);
  xmlHttp.send(data);
}

function playSound(id,rate,volume){
  if(rate == undefined)rate = 1;
  if(volume == undefined){volume = tweakables.masterVolume;}else{volume *= tweakables.masterVolume;}
  if(!muted){muted = !tweakables.soundOverlap;sounds[id].play(0,rate,volume);}
}

function drop(manual){
  if(!isInputAllowed()){return;}
  if(manual){fakeScore += tweakables.maxDifficulty/difficulty;}
  dirty = true;
  cd = floor(difficulty);
  //difficulty = max(1/(1/difficulty+tweakables.diffScaleTime),tweakables.maxDifficulty);
  block.drop();
}

function peek(x,y){
  try{
    return grid[x][y].v;
  }catch(e){return 0;}
}

function peek2(x,y){
  try{
    var r = grid[x][y];
    if(r != undefined)return r;
    throw 'catch';
  }catch(e){return {v:0,f:1};}
}

function objToString(o){
  return JSON.stringify(o);
  /*var r = '{';
  for(var name in o){
    r += name+':'+o[name]+',';
  }
  return r.substr(0,r.length-1)+'}';*/
}

function objToString2(o){
  var r = '';
  for(var name in o){
    if(typeof o[name] == 'boolean'){r += (o[name])?0:1;continue;}
    r += 'a'+o[name];
  }
  return r;
}

function getRandomInt(min, max) {
  return Math.floor(random(0,1) * (max - min)) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function round10(value,exp){
  value = +value;
  exp = +exp;
  value = value.toString().split('e');
  value = round(+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
  value = value.toString().split('e');
  return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
}

// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}