const path = require('path');
const fs = require('fs');
const parseArgv = require('./argv.js');
const crto = require('./crto.js');

const argvRom = {
  "-o":[1,1,(a)=>{
    outputFilename = a;
  }],
  "-I":[1,1,(a)=>{
    pathToLibFolder = path.resolve(a);
  }],
  "argv":(argv)=>{
    if(argv.length){
      filenames = argv;
    }else{
      console.error(`${path.basename(__filename)}: missing filename`);
    }
  }
};

var filenames = ["examples/out.crto"];
var outputFilename = "examples/out.crtb";
var pathToLibFolder = path.resolve(__dirname,"./lib");
parseArgv(process.argv,argvRom);

var r = {
  pic:true,
  pos:/*crto.startPos*/0,
  externs:{},
  globals:{},
  code:undefined
};

var crtos = [];
var mimage = [{v:0x10000}];
var globalSource = {};//for error messages

function clean(){
  var prev = undefined;
  for(var i = 0; i < mimage.length; i++){
    var t = mimage[i];
    if(t.name){
      prev = undefined;
      continue;
    }
    if(prev){
      prev.v += t.v;
      t.v = 0;
    }else{
      prev = t; 
    }
  }
  mimage = mimage.filter(e=>e.v!=0);
}

function alloc(o){
  var name = o.name;
  var pos = o.pos;
  var len = o.length;
  var acc = 0;
  for(var i = 0; true; i++){
    if(i >= mimage.length)throw 1;
    var t = mimage[i];
    acc += t.v;
    if(acc>pos){
      var d = acc-pos;
      if(t.name){
        console.error(`colision: ${t.name} and ${name}`);
        return;
      }
      t.v -= d;
      var d2 = d-len;
      if(d2<0){
        if(!mimage[i+1])throw 'ohnoh';
        console.error(`colision: ${mimage[i+1].name} and ${name}`);
        return;
      }
      mimage.splice(i+1,0,{v:len,name,code:o.code},{v:d2});
      break;
    }
  }
  clean();
}

function apply(o,offset=0){
  var exs = o.externs;
  var rx = r.externs;
  for(var k in exs){
    var t = rx[k];
    if(t==undefined)t = rx[k] = [];
    rx[k] = t.concat(exs[k].map(e=>e+offset));
  }
  var gls = o.globals;
  var rg = r.globals;
  for(var k in gls){
    var t = rg[k];
    if(t!=undefined){
      console.error(`global colision("${k}"): ${globalSource[k]} and ${o.name}`);
    }
    rg[k] = gls[k]+offset;
    globalSource[k] = o.name;
  }
}

function find(o){
  var len = o.length;
  var name = o.name;
  var acc = 0;
  for(var i = 0; true; i++){
    if(i >= mimage.length){
      console.error(`no space to put ${name}`);
      return 0;
    }
    var t = mimage[i];
    if(t.v>=len){
      return acc;
    }
    acc += t.v;
  }
}

function assign(crtos){
  for(var i = 0; i < crtos.length; i++){
    var t = crtos[i];
    var addr = find(t);
    var diff = addr-t.pos;
    t.pos = addr;
    alloc(t);
    apply(t,diff);
  }
}

function getMismatch(){
  var res = [];
  var gl = r.globals;
  var xs = Object.keys(r.externs);
  for (var i = 0; i < xs.length; i++) {
    if(gl[xs[i]]==undefined)res.push(xs[i]);
  }
  return res;
}

function getLength(){
  clean();
  var r = 0;
  mimage.slice(0,mimage.length-1).map(e=>r+=e.v);
  return r;
}

function link(){
  var len = getLength();
  r.code = Buffer.alloc(len);
  var index = 0;
  for(var i = 0; i < mimage.length-1; i++){
    var t = mimage[i];
    if(t.code){
      t.code.copy(r.code,index);
      index += t.v;
    }else{
      r.code.fill(0xf0,index,t.v+index);
      index += t.v;
    }
  }
  for(var k in r.externs){
    var ex = r.externs[k];
    var gl = r.globals[k];
    for (var i = 0; i < ex.length; i++) {
      r.code.writeUInt16BE(gl,ex[i]-2);
    }
  }
}

function finish(){
  var extension = path.extname(outputFilename);
  if(extension=='.crtb'){
    var addr = r.globals[crto.entryPoint];
    var buff = r.code;
    if(addr!=undefined&&addr>crto.startPos){
      buff[0] = 0xf1;
      buff.writeUInt16BE(1,addr);
      buff[3] = 0xff;
    }
    fs.writeFileSync(outputFilename,buff,"binary");
  }else if(extension=='.crto'){
    var t = mimage[0];
    if(t.name){
      r.pos = t.v;
      r.code = r.code.slice(r.pos);
    }
    crto.write(outputFilename,r);
  }else{
    //todo: guess
    console.error(`unknown file extension : "${extension}"`);
  }
}

for(var i = 0; i < filenames.length; i++){
  var t = crto.read(filenames[i]);
  r.pic = r.pic&&t.pic;
  if(!t.pic){
    alloc(t);
    apply(t);
  }else{
    crtos.push(t);
  }
}

assign(crtos);

var mismatch = getMismatch();
var liblist = fs.readdirSync(pathToLibFolder);

if(mismatch.length){
  var crtos = [];
  for(var i = 0; i < mismatch.length; i++){
    var name = mismatch[i]+'.crto';
    if(liblist.indexOf(name)==-1){
      console.error(`${name} not avalible`);
      //r.globals[mismatch[i]] = 0xcafe;
      continue;
    }
    var p = path.resolve(pathToLibFolder,name);
    crtos.push(crto.read(p));
  }
  assign(crtos);
  mismatch = getMismatch();
  //if(mismatch.length)throw 122;
}

link();

finish();
