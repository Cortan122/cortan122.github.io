const {floor,abs} = Math;
const readline = require('readline');
const fs = require('fs');
const api = require("./api.js");
const game = require("./game.js");
const Color = require("./color.js");
const boxDrawing = require("./boxdrawing.js");
const options = require("./options.js");
const huffman = require("./huffman.js");

const chixelRom = options.createProxy("chixelList");
const numericAlphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ~!@#$%^&*()_+-=`\\;',./{}|[]<>?\"";
const savegameFilePath = './save.game';

var safeCursor;
var offset = {x:1,y:1};
var size = {x:20,y:10};
var isNextClickSafe;
var oldBoxColor;
var gameStartTime;
var timerInterval;
var numberOfBombs;
var fires;
var isDead;

function smallint(n){
  n = floor(n);
  if(n<0){
    return '-'+numericAlphabet[abs(n)];
  }
  return numericAlphabet[floor(n/10)]+numericAlphabet[n%10];
}

function getUnixTime(){
  return Math.floor(+new Date());
}

function tileToChixel(x,y){
  var tile = game.getTile(x,y);
  var r;
  for(var e of fires){
    if(e.x==x&&e.y==y){
      r = chixelRom['fire'];
      break;
    }
  }
  if(r){
    //do nothing
  }else if(tile.flagged&&!isDead){
    r = chixelRom['flag'];
  }else if(!tile.visible&&!isDead){
    r = chixelRom['invisible'];
  }else if(tile.bomb){
    r = chixelRom['bomb'];
  }else{
    r = chixelRom[tile.value];
  }
  return [r.char,x+offset.x,y+offset.y,Color(r.color)];
}

function drawTileAt(x,y){
  var argc = arguments.length;
  if(argc==1){
    var {x,y} = x;
  }
  api.write( ...tileToChixel(x,y) );
}

function cleanup(){
  api.redrawMouse();
  api.setCursorPos(safeCursor);
  api.setColor(options.defaultColor);
  readline.clearScreenDown(process.stdout);
}

function init(){
  isDead = false;
  gameStartTime = getUnixTime();
  if(timerInterval)clearInterval(timerInterval);
  timerInterval = setInterval(redrawTimer,1000);
  fires = [];
  size = {x:options.width,y:options.height};
  offset = {x:options.offsetX,y:options.offsetY};
  isNextClickSafe = options.isFirstClickSafe;
  game.init(size);
  game.spreadBombs(numberOfBombs = options.numberOfBombs);
  redrawGame();
  checkLoseCondition();
}

function onGameOver(){
  if(timerInterval)clearInterval(timerInterval);
  redrawTimer();
}

function redrawTimer(){
  var t = floor((getUnixTime()-gameStartTime)/1000);
  var str = `${smallint(t/60)}:${smallint(t%60)}`;
  var cpos = api.getCursorPos();
  api.write(str,size.x+offset.x+7,offset.y,options.defaultColor);
  api.setCursorPos(cpos);
}

function redrawBombCounter(){
  checkWinCondition();
  var str = `${smallint(game.getFlagCount())}/${smallint(numberOfBombs)}`;
  var cpos = api.getCursorPos();
  api.write(str,size.x+offset.x+7,offset.y+1,options.defaultColor);
  api.setCursorPos(cpos);
}

function redrawLiveCounter(){
  if(options.numberOfLives<2)return;
  var str = `${smallint(fires.length)}/${smallint(options.numberOfLives)}`;
  var cpos = api.getCursorPos();
  api.write(str,size.x+offset.x+7,offset.y+2,options.defaultColor);
  api.setCursorPos(cpos);
}

function redrawBox(){
  var t = [Color(options.boxDrawingColor),'Ж'];
  boxDrawing.Box(
    offset.x-1,
    offset.y-1,
    size.x+offset.x,
    size.y+offset.y
  ).draw(...t);
  var doLives = options.numberOfLives>1;
  boxDrawing.Box(
    size.x+offset.x,
    offset.y-1,
    size.x+offset.x+1+11,
    offset.y+2+doLives
  ).draw(...t);
  api.write('Time: 00:00',size.x+offset.x+1,offset.y,options.defaultColor);
  api.write('Bombs:00/00',size.x+offset.x+1,offset.y+1,options.defaultColor);
  if(doLives){
    api.write('Lives:00/00',size.x+offset.x+1,offset.y+2,options.defaultColor);
  }
  redrawLiveCounter();
  redrawBombCounter();
  redrawTimer();
  if(options.showMenu){
    const menu = [
      "Controls:  ",
      "[R]estart  ",
      "[O]ptions  ",
    ];
    boxDrawing.Box(
      size.x+offset.x,
      offset.y+2+doLives,
      size.x+offset.x+1+11,
      offset.y+3+doLives+menu.length
    ).draw(...t);
    menu.map((e,i)=>{
      api.write(e,size.x+offset.x+1,offset.y+3+doLives+i,options.defaultColor);
    });
  }
  oldBoxColor = options.boxDrawingColor;
}

function redrawGame(){
  var startTime = getUnixTime();
  var t = ()=>{
    api.clear();
    redrawBox();
    for(var x = 0;x < size.x;x++){
      for(var y = 0;y < size.y;y++){
        drawTileAt(x,y);
      }
    }
    safeCursor = {y:size.y+2+offset.y,x:/*offset.x+1*/0};
    api.setCursorPos(safeCursor);
  };
  if(options.bakeFullRedraws)api.bake(t);
  else t();
  if(options.showFunctionTimes){
    console.log(`redrawGame() took ${getUnixTime()-startTime} ms`);
  }
}

function placeFireAt(pos){
  var {x,y} = pos;
  for(var e of fires){
    if(e.x==x&&e.y==y)return;
  }
  setTimeout(()=>{
    cleanup();
    console.log('Oh no!');
  },10);
  fires.push(pos);
  redrawLiveCounter();
  if(checkLoseCondition())return;
  game.rightClick(pos);
  game.getTile(pos).visible = true;
  drawTileAt(pos);
}

function checkWinCondition(){
  var t = numberOfBombs==game.getHiddenCount();
  var r = game.getFlagCount()==game.getHiddenCount()&&t;
  r |= (t&&!options.requireAllBombsFlagged);
  if(r){
    setTimeout(()=>{
      cleanup();
      console.log("You Win!!");
    },10);
    onGameOver();
  } 
}

function checkLoseCondition(numFires=fires.length){
  if(options.numberOfLives>-1&&numFires>=options.numberOfLives){
    onGameOver();
    setTimeout(()=>{
      redrawGame();
      cleanup();
      console.log('You Lose!!');
    },10);
    isDead = true;
  }
  return isDead;
}

function load(){
  cleanup();
  console.log(`Loading game from ${savegameFilePath}`);
  fs.readFile(savegameFilePath,(err,rawdata)=>{
    if(err)throw err;
    var data64 = rawdata.toString('base64');
    var data = huffman.decode(data64);
    var [time,x,y,str] = data.split(' ');
    gameStartTime = time;
    if(timerInterval)clearInterval(timerInterval);
    timerInterval = setInterval(redrawTimer,1000);
    game.setString(`${x} ${y} ${str}`);
    fires = [];
    size = {x:parseInt(x),y:parseInt(y)};
    for(var x = 0;x < size.x;x++){
      for(var y = 0;y < size.y;y++){
        var tile = game.getTile(x,y);
        if(tile.bomb&&tile.visible)fires.push({x,y});
      }
    }
    redrawGame();
  });
}

function save(){
  cleanup();
  console.log(`Game saved to ${savegameFilePath}`);
  var data = game.getString();
  data = `${gameStartTime} `+data;
  data = huffman.encode(data);
  var mod = data.length%4;
  if(mod==1)data += 'A==';
  else if(mod)data += '='.repeat(4-mod);
  var rawdata = Buffer.from(data,'base64');
  fs.writeFile(savegameFilePath,rawdata,(err)=>{
    if(err)throw err;
  });
  // console.log("Here it is in base64");
  // console.log(data);
}

api.on('click',pos=>{
  if(isDead)return;
  var prevFC = game.getFlagCount();
  var prevHC = game.getHiddenCount();
  var r;
  if(pos.button==1){
    r = game.leftClick(pos.x-1-offset.x,pos.y-1-offset.y,isNextClickSafe);
    isNextClickSafe = false;
  }else{
    r = game.rightClick(pos.x-1-offset.x,pos.y-1-offset.y);
  }
  if(r instanceof Array){
    r.map(e=>drawTileAt(e));
  }else if(r == 'bomb'){
    var t = {x:pos.x-1-offset.x,y:pos.y-1-offset.y};
    placeFireAt(t);
  }
  if(prevFC!=game.getFlagCount()){
    redrawBombCounter();
  }else if(prevHC!=game.getHiddenCount()){
    checkWinCondition();
  }
  cleanup();
});

api.on('restart',()=>{
  init();
});

api.on('redraw',()=>{
  redrawGame();
});

api.on('options',()=>{
  console.log(`Waiting for notepad${options.openConfigInNotepad?"":" (or something)"} to exit...`);
  console.log('Press enter to unpause...');
  api.pause();
  options.open();
});

api.on('unpause',()=>{
  cleanup();
});

api.on('save',()=>{
  save();
});

api.on('load',()=>{
  load();
});

options.on('change',()=>{
  api.setMouseMode(options.mouseMode);
  var tempoffset = {x:options.offsetX,y:options.offsetY};
  if(tempoffset.x==offset.x&&tempoffset.y==offset.y){
    if(!oldBoxColor==(options.boxDrawingColor))redrawBox();
  }else{
    redrawGame();
  }
});

options.on('close',()=>{
  api.pause(false);
  cleanup();
});

init();
