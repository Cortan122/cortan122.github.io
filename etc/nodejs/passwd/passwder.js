var fs = require('fs');
var cp = require('child_process');

const optionFilePath = "options.json";
const awailableOptions = ["password","password_base64","doHidePassword","doShuffleInit","doSaltInit","doFlipsInit","doHopsInit","doLiveStrcmp","doStrip","doSbox","doCaller","doShuffleCaller","doMaze","doShuffleMazeInit","doShuffleMaze","doMazeOffset","doMazeVolatile","doShuffleMazeVolatile"];
const doPrintBase64 = false;
const doCleanup = false;

function mono(json){
  var keys = Object.keys(json);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if(awailableOptions.indexOf(key)==-1)continue;
    global[key] = json[key];
  }
  main();
}

function getOptions(){
  try{
    var text = fs.readFileSync(optionFilePath).toString();
    text = text.replace(/\/\/.*$/gm,"");//remove comments
    var json = JSON.parse(text);
  }catch(e){
    console.log("Warning: no option file");
    main();
    return;
  }
  if(json == undefined||(json.mode!="mono"&&json.mode!="multi")){
    main();
    return;
  }
  if(json.mode=="mono"){
    mono(json);
    return;
  }
  if(json.mode=="multi"){
    saveLocation = "examples/";
    mode = "multi";
    var keys = Object.keys(json);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if(key=="mode")continue;
      filename = key;
      mono(json[key]);
    }
    return;
  }
}

global.saveLocation = "";
global.mode = "mono";
global.filename = "passwder.exe";
global.password = "i am very hard";
global.password_base64 = undefined;
global.doHidePassword = true;//if this is false everything is irrelevant
global.doShuffleInit = true;
global.doSaltInit = true;
global.doFlipsInit = true;
global.doHopsInit = true;
global.doLiveStrcmp = true;
global.doStrip = false;//this makes it way too hard
global.doSbox = true;
global.doCaller = true;
global.doShuffleCaller = true;
global.doMaze = true;
global.doShuffleMazeInit = true;
global.doShuffleMaze = true;
global.doMazeOffset = true;
global.doMazeVolatile = true;
global.doShuffleMazeVolatile = true;

const base64Rom = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split('');

function tobase64(argument) {
  return Buffer.from(argument).toString('base64');
}

function frombase64(argument) {
  return Buffer.from(argument, 'base64').toString('ascii');
}

String.prototype.format || (String.prototype.format = function() {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number) { 
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
    ;
  });
});

Array.prototype.shuffle || (Array.prototype.shuffle = function() {
  var j, x, i;
  for (i = this.length; i; i--) {
    j = Math.floor(Math.random() * i);
    x = this[i - 1];
    this[i - 1] = this[j];
    this[j] = x;
  }
  return this;
});

function randomInteger(min, max) {
  var rand = min + Math.random() * (max + 1 - min);
  rand = Math.floor(rand);
  return rand;
}

function init_get(b64,sbox){
  var init_func = [];

  for (var i = 0; i < b64.length; i++) {
    var num = base64Rom.indexOf(b64[i]);
    var doFlip = Math.random() >= 0.5;
    if(doFlip){
      if(doFlipsInit){
        var r = 0;
        r|=(num&0b000001)<<5;
        r|=(num&0b100000)>>5;
        r|=(num&0b000010)<<3;
        r|=(num&0b010000)>>3;
        r|=(num&0b000100)<<1;
        r|=(num&0b001000)>>1;
        r|=num&0b11000000;
        num = r;
      }
      num |= 0b01000000;
    }
    var doHop = Math.random() >= 0.5;
    if(doHop){
      if(doHopsInit){
        var r = 0;
        r|=(num&0b000111)<<3;
        r|=(num&0b111000)>>3;
        r|=num&0b11000000;
        num = r;
      }
      num |= 0b10000000;
    }
    if(num==0x00){
      num |= [0b11000000,0b10000000,0b01000000][randomInteger(0,3)];
    }
    if(doSbox)num = sbox.indexOf(num);
    var str = "data[{0}] = 0x{1};".format(i,num.toString(16));
    init_func.push(str);
  }
  var str = "data[{0}] = 0x00;".format(i);
  init_func.push(str);
  if(doSaltInit){
    while(i<999){
      i++;
      var num = randomInteger(0,255);
      var str = "data[{0}] = 0x{1};".format(i,num.toString(16));
      init_func.push(str);
    }
  }
  if(doShuffleInit)init_func.shuffle();
  init_func = init_func.join('\n  ');
  return init_func;
}

function define_get(caller_len){
  var r = "";
  var f = str=>r+=(r.length?'\n':'')+str;
  f("#define doFlipsInit {0}".format(doFlipsInit));
  f("#define doHopsInit {0}".format(doHopsInit));
  f("#define doLiveStrcmp {0}".format(doLiveStrcmp));
  f("#define doSbox {0}".format(doSbox));
  f("#define doMaze {0}".format(doMaze));
  f("#define callerRomLength {0}".format(caller_len));
  f("#define doHidePassword {0}".format(doHidePassword));
  if(doHidePassword==false){
    f("#define password_base64 \"{0}\"".format(password_base64));
  }
  return r;
}

function sbox_get(sbox){
  //sbox = [];
  for (var i = 0; i < 255; i++) {
    sbox[i] = i+1;
  }
  sbox.shuffle();
  var sbox1 = [0].concat(sbox);
  sbox1.forEach((e,i)=>sbox[i]=e);
  var r = "uint8_t sbox[256] = {{0}};";
  return r.format(sbox.map(e => "0x"+e.toString(16)).join(','));
}

function caller_get(source_box){
  var source = source_box[0];
  var mem = [];

  source = source.replace(/(\n[ \t]*)([a-zA-Z_][a-zA-Z_0-9]*)\(\);\/\/@/g,function(a0,a1,a2){
    var i = mem.indexOf(a2);
    if(i==-1){
      i = mem.push(a2)-1;
    }
    return a1+"caller({0});".format(i);
  });

  var map = [];
  for (var i = 0; i < mem.length; i++) {
    map[i] = i;
  }
  if(doMazeOffset)map.shuffle();

  source_box[0] = source;
  source_box[1] = mem.length;
  source_box[2] = map;

  var r = mem.map((e,i)=>"callerRom[{1}] = {0};".format(e,map[i]));
  if(doShuffleCaller)r.shuffle();
  return r.join("\n    ");
}

function maze_get(caller_len,map){
  if(!doMaze)return ["",""];
  var a1 = [];
  var a2 = [];
  var a3 = [];
  for (var i = 0; i < caller_len; i++) {
    a1[i] = "mazeRom[{0}] = &&maze_{0};".format(i);
    a2[i] = "maze_{0}:\n  if(i==0)return {1};\n  goto maze_start;".format(i,map[i]);
    a3[i] = "if(allwaysFalse=={1})goto maze_{0};".format(i,i+1);
  }
  if(doShuffleMazeInit)a1.shuffle();
  if(doShuffleMaze)a2.shuffle();
  if(doShuffleMazeVolatile)a3.shuffle();
  a3.push("goto maze_start;");
  if(doMazeVolatile)a2 = a3.concat(a2);
  return [a1.join('\n    '),a2.join('\n  ')];
}

function main(){
  var source = fs.readFileSync("source.c").toString('ascii').replace(/\r/g,"");

  var caller_str = "";
  var caller_len = 1;
  var maze_map;
  if(doCaller){
    var source_box = [source];
    caller_str = caller_get(source_box);
    source = source_box[0];
    caller_len = source_box[1];
    maze_map = source_box[2];
  }else if(doMaze){
    maze_map = [];
    for (var i = 0; i < 256; i++) {
      maze_map[i] = i;
    }
  }

  if(password_base64==undefined){
    password_base64 = tobase64(password).replace(/=/g,'');
  }

  var define_str = define_get(caller_len);
  var sbox = [];
  var sbox_str = sbox_get(sbox);
  var maze_temp = maze_get(caller_len,maze_map);
  var mazeInit_str = maze_temp[0];
  var maze_str = maze_temp[1];

  var b64 = password_base64;
  if(doPrintBase64)console.log(b64);
  var init_str = init_get(b64,sbox);

  var code = source.format(init_str,define_str,sbox_str,caller_str,mazeInit_str,maze_str);
  fs.writeFileSync("passwder.c",code);

  var t = "if errorlevel==1 (\n  echo something went horribly wrong\n  goto end_test\n)";
  var cmd = "@echo off\ngcc passwder.c -o {3}\n{1}\n{2}\n{3} {0}\n{1}\n:end_test";
  var test = "test.bat";//.format(filename.split('.')[0]);
  var filename1 = '"'+saveLocation+filename+'"';
  fs.writeFileSync(test,cmd.format(b64,t,doStrip?"strip {0}".format(filename1):"",filename1));

  if(mode == "mono"){
    const exec = cp.exec;
    exec(test,(err, stdout, stderr) => {
      if (err) {
        // node couldn't execute the command
        console.log("err:");
        console.log(err);
        return;
      }

      // the *entire* stdout and stderr (buffered)
      if(stdout.includes("something went horribly wrong")){
        console.log(`stdout:\n${stdout}`);
      }else{
        console.log("successfully created {0}".format(filename));
      }
      //if(stderr)console.log(stderr.toString('ascii'));
    });
  }else{
    const execSync = cp.execSync;
    var stdout = execSync(test);
    if(stdout.includes("something went horribly wrong")){
      console.log(`stdout:\n${stdout}`);
    }else{
      console.log("successfully created {0}".format(filename));
    }
  }
}

getOptions();

process.on('exit', (code) => {
  console.log(`About to exit with code: ${code}`);
  if(doCleanup){
    fs.unlink('passwder.c', err=>{if(err)throw err;});
    fs.unlink('test.bat', err=>{if(err)throw err;});
  }
});
