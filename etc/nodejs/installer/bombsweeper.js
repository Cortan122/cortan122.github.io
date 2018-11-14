const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const copydir = require("copy-dir");
const UglifyJS = require("uglify-es");
const rimraf = require("rimraf");

if(!Array.prototype.subtract){
  Array.prototype.subtract = function (array) {
    var hash = Object.create(null);
    array.forEach(function (a) {
      hash[a] = (hash[a] || 0) + 1;
    });
    return this.filter(function (a) {
      return !hash[a] || (hash[a]--, false);
    });
  };
}

const copyRom = [
  "default.json",
  "run.bat",
  "index.bat",
  "favicon.ico",
];

const copyRomDir = [
  "sound",
  "bin",
];

const options = {
  ecma:8,
  mangle:{
    toplevel:true,
  },
  parse:{
    bare_returns: true,
  },
};

const path1 = '../bombsweeper';
const path2 = './bombsweeper';

function mkdir(path){
  try{
    fs.mkdirSync(path);
  }catch(e){
    if(e.code!='EEXIST'){
      throw e;
    }
  }
}

function rec(arr,path0,level=0){
  if(level==1)console.log(`rec("${path0}")`);
  var path01 = path.join(path1,path0);
  var path02 = path.join(path2,path0);
  if(typeof arr == "string"){
    arr = fs.readdirSync(path.join(path01,arr));
  }
  for(var file of arr){
    if(fs.statSync(path.join(path01,file)).isDirectory()){
      mkdir(path.join(path02,file));
      rec('.',path.join(path0,file),level+1);
      continue;
    }
    var ext = path.extname(file);
    if(ext=='.js'){
      var t = UglifyJS.minify({
        [file]: fs.readFileSync(path.join(path01,file), "utf8"),
      },options);
      if(t.error){
        console.error(t.error);
      }
      fs.writeFileSync(path.join(path02,file), t.code, "utf8");
    }else if(ext=='.md' || ext==".markdown" || file=="LICENSE" || file=="license" || file==".travis.yml"){
      //do nothing
    }else{
      fs.copyFileSync(path.join(path01,file),path.join(path02,file));
    }
  }
}

mkdir(path2);

for(var e of copyRom){
  fs.copyFileSync(path.join(path1,e),path.join(path2,e));
}

for(var e of copyRomDir){
  mkdir(path.join(path2,e));
  copydir.sync(path.join(path1,e),path.join(path2,e));
}

var otherFiles = fs.readdirSync(path1);
otherFiles = otherFiles.subtract(copyRom).subtract(copyRomDir);

for(var file of otherFiles){
  var ext = path.extname(file);
  if(ext=='.js'){
    var t = UglifyJS.minify({
      [file]: fs.readFileSync(path.join(path1,file), "utf8"),
    },options);
    if(t.error){
      console.error(t.error);
    }
    fs.writeFileSync(path.join(path2,file), t.code, "utf8");
  }
}

var mods = fs.readdirSync(path.join(path1,"node_modules")).subtract([".bin","@types"]);
mkdir(path.join(path2,"node_modules"));
rec(mods,"node_modules");

var temppath = "node_modules/segfault-handler/build/Release";
fs.readdirSync(path.join(path2,temppath)).map(e=>{
  var f = path.join(path2,temppath,e);
  if(e=='obj')return rimraf.sync(f);
  if(e!="segfault-handler.node")fs.unlinkSync(f);
});

var proc = cp.spawn('node',["maker.js",path2,"-o","output/bombsweeper installer.exe"],{stdio:'inherit'});

proc.on('close',()=>{
  fs.renameSync("output/bombsweeper installer.exe", "output/bombsweeper instаller.exe");
});
