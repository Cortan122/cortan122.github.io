const {floor,abs,max,min} = Math;
const cp = require('child_process');
const path = require('path');
const EventEmitter = require('events');
const options = require("./options.js");

const myEmitter = new EventEmitter();

var players = [];
var playerLists = {};
var isMute = false;

function superPush(arr,t){
  for(var i = 0;true;i++){
    var e = arr[i];
    if(e==undefined){
      arr[i] = t;
      break;
    }
  }
  return i;
}

function playFile(filename,volume){
  if(filename == undefined || volume == undefined)return;
  if(typeof volume == "number"){
    volume = min(1000,floor(volume*1000*options.masterVolume));
  }
  if(volume == 0)return;
  var t = cp.spawn(path.join(__dirname,'bin/cmdmp3.exe'),[path.join(__dirname,"sound",filename),volume]);
  var i = superPush(players,t); 
  t.on('close',()=>{
    players[i] = undefined;
    //console.log(`sound player №${i} has stopped`);
  });
  //console.log(`sound player №${i} has started`);
  return t;
}

function play(name){
  if(isMute)return;
  var t = options.sounds[name];
  if(!t)throw `sound "${name}" does not exist`;
  var {file,volume} = t;
  var player = playFile(file,volume);
  if(!player)return;
  if(!(name in playerLists))playerLists[name] = [];
  var i = superPush(playerLists[name],player);
  player.on('close',()=>{
    if(name in playerLists){
      playerLists[name][i] = undefined;
    }
    myEmitter.emit('end',name);
  });
  return player;
}

function mute(){
  if(isMute)return unmute();
  isMute = true;
  players.map(e=>{if(e)e.kill()});
  players = [];
  playerLists = {};
}

function unmute(){
  var temppath = path.resolve(__dirname,"sound");
  if(temppath[0]!='C' && temppath.match(/ /)){
    console.log("Warning: your instalation path contains a space (sound may not work)");
  }

  isMute = false;
  players = [];
  playerLists = {};
  var p;
  var f = ()=>{
    p = play("music");
    if(p)p.on('close',f);
  };
  f();
}

unmute();

if(options.startMuted)mute();

module.exports = {play,mute};
