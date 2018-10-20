const {floor} = Math;
const cp = require('child_process');
const util = require('util');
const EventEmitter = require('events');
const readline = require('readline');
const stream = require('stream');
const path = require('path');
const ioHook = require("iohook");
const window_size = require("window-size");
const json5 = require("json5");
const Color = require("./color.js");
const boxDrawing = require("./boxdrawing.js");
const options = require("./options.js");

const mouseRom = {
  'overwrite':(prev,pos)=>{
    setCursorPos(prev);
    setColor(getColor(prev.x-1,prev.y-1));
    console.log(read(prev.x-1,prev.y-1));
    setCursorPos(pos);
    setColor(getColor(pos.x-1,pos.y-1));
    setColor(Color(mouseMode.color));
    if(mouseMode.char==null){
      console.log(read(pos.x-1,pos.y-1));
    }else{
      console.log(mouseMode.char);
    }
  },
  'negate':(prev,pos)=>{
    setCursorPos(prev);
    setColor(getColor(prev.x-1,prev.y-1));
    console.log(read(prev.x-1,prev.y-1));
    setCursorPos(pos);
    setColor(getColor(pos.x-1,pos.y-1).copy().negate());
    console.log(read(pos.x-1,pos.y-1));
  },
  'flip':(prev,pos)=>{
    setCursorPos(prev);
    setColor(getColor(prev.x-1,prev.y-1));
    console.log(read(prev.x-1,prev.y-1));
    setCursorPos(pos);
    setColor(getColor(pos.x-1,pos.y-1).copy().flip());
    console.log(read(pos.x-1,pos.y-1));
  },
  'box':(prev,pos)=>{
    var h = (x,y)=>{
      setCursorPos({x,y});
      setColor(getColor(x-1,y-1));
      console.log(read(x-1,y-1));
    };
    var {x,y} = prev;
    x = Math.clamp(x,2,stdoutBuffer.length-1);
    y = Math.clamp(y,1,stdoutBuffer[0].length-2);
    h(x-1,y-1);h(x+0,y-1);h(x+1,y-1);
    h(x-1,y+0);h(x+0,y+0);h(x+1,y+0);
    h(x-1,y+1);h(x+0,y+1);h(x+1,y+1);
    var {x,y} = pos;
    x = Math.clamp(x,2,stdoutBuffer.length-1);
    y = Math.clamp(y,1,stdoutBuffer[0].length-2);
    setColor(Color(mouseMode.color));
    console.log(boxDrawing.Box(x-1,y-1,x+1,y+1).toAnsiCode());
  }
};

const keyboardRom = {
  leftclick:()=>{
    var t = {};
    t.x = prevPos.x;t.y = prevPos.y;
    t.button = 1;
    myEmitter.emit('click',t);
  },
  rightclick:()=>{
    var t = {};
    t.x = prevPos.x;t.y = prevPos.y;
    t.button = 2;
    myEmitter.emit('click',t);
  },
  down:()=>{
    var t = {};
    t.x = prevPos.x;t.y = prevPos.y;
    t.y++;
    redrawMouse(t);
  },
  up:()=>{
    var t = {};
    t.x = prevPos.x;t.y = prevPos.y;
    t.y--;
    redrawMouse(t);
  },
  left:()=>{
    var t = {};
    t.x = prevPos.x;t.y = prevPos.y;
    t.x--;
    redrawMouse(t);
  },
  right:()=>{
    var t = {};
    t.x = prevPos.x;t.y = prevPos.y;
    t.x++;
    redrawMouse(t);
  },
  esc:()=>{
    ioHook.unload();
    process.exit();
  },
  pause:()=>{
    console.log('Press enter to unpause...');
    pause();
  },
  _redump:()=>{
    redraw();
  },
};

const inputRom = options.createProxy("keybinds");

const myEmitter = new EventEmitter();

var muteStdout = true;
var windowMoveListner;
var prevPos = {x:1,y:1};
var cachedWindowDimentions;
var stdoutBuffer;
var colorBuffer;
var prevColor = Color();
var stdoutBufferCoords = {x:0,y:0};
var mouseMode = {mode:'overwrite',char:null,color:{fg:"transparent",bg:'orange'}};
var prevMouseClicks = [0,0,0,0,0];

var writeToStdout = (...a)=>process.stdout.write(...a);

Math.clamp = (a,b,c)=>Math.max(b,Math.min(c,a));

function getUnixTime(){
  return Math.floor(+new Date());
}

function init2dArray(x,y,fill,usefunc){
  if(usefunc){
    var r = new Array(x).fill().map(e=>new Array(y).fill().map(fill));
  }else{
    var r = new Array(x).fill().map(e=>new Array(y).fill(fill));
  }
  return r;
}

function stratMoveHandler(){
  if(process.platform == "win32"){
    windowMoveListner = cp.spawn(path.join(__dirname,'bin/winmoved.exe'));
    windowMoveListner.stdout.on('data',(data)=>{
      // console.log(`stdout: ${data}`);
      if(data=='fail\r\n')return;
      var [x,y] = JSON.parse(data);
      if(!cachedWindowDimentions)return;
      cachedWindowDimentions.x += x;
      cachedWindowDimentions.y += y;
    });
  }else{
    //todo
  }
}

function getWindowDimentions(){
  if(cachedWindowDimentions){
    if(!windowMoveListner)stratMoveHandler();
    return cachedWindowDimentions;
  }
  var r = {x:100,y:100,w:30,h:30};
  if(process.platform == "win32"){
    // var hwnd = Window.getHwnd();
    var j = json5.parse(
      cp.execSync(path.join(__dirname,'bin/wininfo.exe')).toString()//this causes lag
    );
    r.h = j.clientRect.h;
    r.w = j.clientRect.w;
    r.x = j.windowRect.x;//+j.windowRect.w-j.clientRect.w;
    r.y = j.windowRect.y+j.windowRect.h-j.clientRect.h;
    cachedWindowDimentions = r;
    return r;
  }
  var str = cp.execSync("xwininfo -id $(xdotool getactivewindow)").toString();
  str.split('\n').map(e=>{
    var m = e.match(/Absolute upper-left X:  ([0-9]*)/);
    if(m){
      r.x = parseInt(m[1]);
      return;
    }
    m = e.match(/Absolute upper-left Y:  ([0-9]*)/);
    if(m){
      r.y = parseInt(m[1]);
      return;
    }
    m = e.match(/Height: ([0-9]*)/);
    if(m){
      r.h = parseInt(m[1]);
      return;
    }
    m = e.match(/Width: ([0-9]*)/);
    if(m){
      r.w = parseInt(m[1]);
      return;
    }
  });
  cachedWindowDimentions = r;
  return r;
}

function getRealPos({x,y}){
  var dim = getWindowDimentions();
  x -= dim.x;
  y -= dim.y;
  x = floor(x/dim.w*(window_size.width+1));
  y = floor(y/dim.h*(window_size.height));
  x += 1;
  y += 1;
  if(process.platform == "win32"){
    y += 1;
  }
  x = Math.clamp(x,0,window_size.width);
  y = Math.clamp(y,0,window_size.height-1);
  return {x,y};
}

function setMouseMode(mode){
  if(typeof mode == 'string'){
    mouseMode = {mode,char:undefined,color:'orange'};
  }else if(typeof mode == 'object'){
    if(mode.mode==undefined)mode.mode = 'overwrite';
    if(mode.color==undefined)mode.color = 'orange';
    mouseMode = mode;
  }else{
    //invalid
    return 'invalid mouse mode';
  }
}

function setCursorPos({x,y}){
  process.stdout.write(`\x1b[${y};${x}H`);
}

function setColor(color,bool=false){
  if(!(color instanceof Color)){
    color = Color(color);
  }
  if(prevColor.equals(color)&&!bool)return;
  prevColor = color;
  writeToStdout(color.toAnsiCode());
}

function setCursorPos_public(x,y){
  var argc = arguments.length;
  if(argc==1){
    var {x,y} = x;
  }
  if(argc==0){
    console.error("setCursorPos_public");
    return;
  }
  stdoutBufferCoords = {x,y};
  process.stdout.write(`\x1b[${y};${x}H`);
}

function getCursorPos(){
  var {x,y} = stdoutBufferCoords;
  return {x,y};
}

function getColor(x,y){
  var argc = arguments.length;
  if(argc==0)return prevColor;
  if(argc==1){
    var {x,y} = x;
  }
  x = Math.clamp(x,0,stdoutBuffer.length-1);
  y = Math.clamp(y,0,stdoutBuffer[0].length-1);
  return colorBuffer[x][y];
}

function write(str,x,y,color){
  var argc = arguments.length;
  var argv = [];
  if(argc != 4){
    for(var arg of arguments){
      if(arg instanceof Color){
        color = arg;
        argc--;
      }else{
        argv.push(arg);
      }
    }
    argv.length = 3;
    [str,x,y] = argv;
  }else{
    if(!(color instanceof Color)){
      color = Color(color);
    }
    argc = 3;
  }
  if(argc==2){
    var {x,y} = x;
  }
  if(argc!=1){
    stdoutBufferCoords = {x,y};
    setCursorPos({x:x+1,y:y+1});
  }else{
    var {x,y} = stdoutBufferCoords;
  }
  if(color&&!color.equals(prevColor)){
    setColor(color);
  }else{
    color = prevColor;
  }
  writeToStdout(str);
  var w = stdoutBuffer.length;
  var h = stdoutBuffer[0].length;
  for(var c of str){
    if(c=='\n'){
      x = 0;
      y++;
    }else if(c=='\r'){
      x = 0;
    }else if(c=='\x0a' || c=='\x0b' || c=='\x0c'){
      y++;
    }else if(c=='\x08'){
      x--;
    }else if(c=='\t' || c=='\x1b' || c=='\x07'){
      console.error(c,"is not a suported char");
    }else{
      stdoutBuffer[x][y] = c;
      colorBuffer[x][y] = color;
      x++;
    }
    if(x>=w){
      x = 0;
      y++; 
    }
    if(y>=h)break;
  }
  stdoutBufferCoords = {x,y};
}

function read(x,y){
  var argc = arguments.length;
  if(argc==1){
    var {x,y} = x;
  }
  x = Math.clamp(x,0,stdoutBuffer.length-1);
  y = Math.clamp(y,0,stdoutBuffer[0].length-1);
  return stdoutBuffer[x][y];
}

function clear(){
  var {width:x,height:y} = window_size.get();
  stdoutBuffer = init2dArray(x,y-1,' ');
  colorBuffer = init2dArray(x,y-1,()=>Color(),true);
  console.clear();
  setColor(Color(),true);
  console.log("\x1B[?0m\x1B[?25l");
  setCursorPos_public(0,0);
}

function redraw(){
  setCursorPos({x:0,y:0});
  var t = "";
  var prev = prevColor;
  for(var x = 0; x < stdoutBuffer[0].length; x++){
    for(var y = 0; y < stdoutBuffer.length; y++){
      var c = colorBuffer[y][x];
      if(!c.equals(prev)){
        prev = c;
        t += c.toAnsiCode();
      }
      t += stdoutBuffer[y][x];
    }
    t += '\n';
  }
  process.stdout.write(t);
  redrawMouse();
}

function redrawMouse(t){
  if(t){
    t.x = Math.clamp(t.x,0,window_size.width);
    t.y = Math.clamp(t.y,0,window_size.height-1);
    mouseRom[mouseMode.mode](prevPos,t);
    prevPos = t;
  }else{
    mouseRom[mouseMode.mode](prevPos,prevPos);
  }
  setCursorPos(stdoutBufferCoords);
  setColor(Color());
}

function setupMutableStdout(){
  var mutableStdout = new stream.Writable({
    write: function(chunk, encoding, callback) {
      if(!muteStdout){
        process.stdout.write(chunk, encoding);
      }
      callback();
    }
  });

  var rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true
  });

  rl.on('line',data=>{
    pause(false);
    myEmitter.emit('unpause');
  });
}

function setupEvents(){
  var mousemove = event => {
    var t = getRealPos(event);
    mouseRom[mouseMode.mode](prevPos,t);
    prevPos = t;
    setCursorPos(stdoutBufferCoords);
    setColor(Color());
    myEmitter.emit('move',t);
  };

  ioHook.on('mousemove',mousemove);
  ioHook.on('mousedrag',mousemove);

  ioHook.on('mousedown',event => {
    prevMouseClicks[event.button] = getUnixTime();
  });

  ioHook.on('mouseup',event => {
    if(prevMouseClicks[event.button]-getUnixTime()<-options.longClickThreshold){
      event.button = 2;
    }
    var t = getRealPos(event);
    t.button = event.button;
    myEmitter.emit('click',t);
    //redraw();//debug
  });

  ioHook.on('keydown',event => {
    var action = inputRom[event.keycode];
    var r = [];
    if(!action){
      if(options.showUnknownKeyCodes){
        console.log('unknown key code:',event.keycode);
      }
      myEmitter.emit('unknown key',event);
    }else if(action instanceof Array){
      action.map(e=>{
        if(keyboardRom[e])
          keyboardRom[e]();
        else
          r.push(e);
      });
    }else{
      if(keyboardRom[action])
        keyboardRom[action]();
      else
        r.push(action);
    }
    r.map(e=>{ 
      myEmitter.emit(e,event);
    });
  });

  ioHook.registerShortcut([56,15], (keys) => { //alt+tab
    keyboardRom.pause();
  });

  //this disables key Propagation unconditionly (useless)
  //ioHook.disableClickPropagation();

  // Register and start hook
  ioHook.start();

  // Alternatively, pass true to start in DEBUG mode.
  // ioHook.start(true);

  process.stdout.on('resize', () => {
    cachedWindowDimentions = undefined;
    var t = window_size.get();
    window_size.height = t.height;
    window_size.width = t.width;
    stdoutBuffer.length = t.width;
    colorBuffer.length = t.width;
    for (var i = 0; i < stdoutBuffer.length; i++) {
      if(!stdoutBuffer[i]){
        stdoutBuffer[i] = [];
        colorBuffer[i] = [];
      }
      stdoutBuffer[i].length = t.height-1;
      colorBuffer[i].length = t.height-1;
      for (var j = 0; j < stdoutBuffer[i].length; j++) {
        if(!stdoutBuffer[i][j]){
          stdoutBuffer[i][j] = ' ';
          colorBuffer[i][j] = Color();
        }
      }
    }
    // Hide the cursor 
    console.log("\x1B[?25l");
    redraw();
  });

  cp.spawn(path.join(__dirname,'bin/quickEdit.exe'),['2'],{stdio:'inherit'}).on('close',setupMutableStdout);

  clear();
}

function pause(bool=true){
  ioHook.active = !bool;
  myEmitter.emit('pause');
}

function bake(fn){
  var old = writeToStdout;
  writeToStdout = ()=>{};
  fn();
  writeToStdout = old;
  redraw();
}

setupEvents();

module.exports = {
  write,
  read,
  setCursorPos:setCursorPos_public,
  getCursorPos,
  clear,
  setColor,
  redraw,
  getColor,
  setMouseMode,
  redrawMouse,
  on:(...a)=>myEmitter.on(...a),
  emit:a=>{
    if(keyboardRom[a]){
      return keyboardRom[a]();
    }
    myEmitter.emit(a);
  },
  pause,
  bake,
};

boxDrawing.init(module.exports);
