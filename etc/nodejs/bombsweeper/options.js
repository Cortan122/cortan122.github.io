const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const cp = require('child_process');
const json5 = require("json5");
const deepEqual = require("deep-equal");

const filename = "./options.json";
const defaultFilename = path.join(__dirname,"default.json");
const defaultFile = fs.readFileSync(defaultFilename,'utf8');
const defaultw = json5.parse(defaultFile);

const myEmitter = new EventEmitter();

var tw = {};

function isObject(o){
  return typeof o == 'object' && o != null && !(o instanceof Array);
}

function readData(data){
  try{
    var t = json5.parse(data);
    if(!deepEqual(t,tw)){
      tw = t;
      myEmitter.emit('change');
    }
  }catch(e){
    console.log(e.message);
  }
}

function readFile(){
  fs.readFile(filename,(err,data)=>{
    if(err)data = '{}';
    readData(data);
  });
}

function readFileSync(){
  try{
    data = fs.readFileSync(filename);
  }catch(e){
    data = '{}';
  }
  readData(data);
}

function open(){
  if(!fs.existsSync(filename)){
    var str = defaultFile.toString();
    var i = str.search('{');
    str = str.substr(i);
    fs.writeFileSync(filename,str);
  }
  var args;
  if(options.openConfigInNotepad){
    args = ['notepad.exe',[path.resolve(filename)]];
  }else{
    args = [path.resolve(filename),{shell:true}];
  }
  cp.spawn(...args).on('close',()=>myEmitter.emit('close'));
}

function recAssign(a,b){
  var r = {};
  for(var prop in a){
    r[prop] = a[prop];
  }
  for(var prop in b){
    if(isObject(r[prop]) && isObject(b[prop])){
      r[prop] = recAssign(r[prop],b[prop]);
    }else{
      r[prop] = b[prop];
    }
  }
  return r;
}

function createProxy(prop){
  return new Proxy({},{
    get (target, property, receiver){
      return options[prop][property];
    }
  });
}

myEmitter.open = open;
myEmitter.createProxy = createProxy;

myEmitter.on('change',()=>console.log("option.json has changed (press [R]eset to aplly)"));

fs.watch(path.join(filename,'..'),(a,name)=>{
  if(name==path.basename(filename)&&a=="change"){
    // console.log("option.json has changed (press [R]eset to apply)");
    readFile();
  }
});

readFileSync();

const options = module.exports = new Proxy(myEmitter, {
  get(target, property, receiver){
    if(property == 'tw'||property == 'tweakables'){
      return recAssign(defaultw,tw);
    }else if(property in target){
      return target[property];
    }else if(
      property in tw &&
      property in defaultw &&
      isObject(defaultw[property]) &&
      isObject(tw[property])
    ){
      return recAssign(defaultw[property],tw[property]);
    }else if(property in tw){
      return tw[property];
    }else if(property in defaultw){
      return defaultw[property];
    }
    return undefined;
  }
});
