const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const cp = require('child_process');
const json5 = require("json5");

const filename = `./options.json`;
const defaultFilename = path.join(__dirname,"default.json");
const defaultFile = fs.readFileSync(defaultFilename);
const defaultw = json5.parse(defaultFile);

const myEmitter = new EventEmitter();

var tw = {};

function readFile(){
  fs.readFile(filename,(err,data)=>{
    if(err)data = '{}';
    tw = json5.parse(data);
    myEmitter.emit('change');
  });
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
    if(typeof r[prop] == 'object' && typeof b[prop] == 'object' && b[prop]!=null && r[prop]!=null){
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

fs.watch(path.join(filename,'..'),(a,name)=>{
  if(name==path.basename(filename)){
    console.log("option.json has changed (press [R]eset to aplly)");
    readFile();
  }
});

readFile();

const options = module.exports = new Proxy(myEmitter, {
  get(target, property, receiver){
    if(property == 'tw'||property == 'tweakables'){
      return recAssign(defaultw,tw);
    }else if(property in target){
      return target[property];
    }else if(
      property in tw &&
      property in defaultw &&
      typeof defaultw[property] == 'object' &&
      typeof tw[property] == 'object'
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
