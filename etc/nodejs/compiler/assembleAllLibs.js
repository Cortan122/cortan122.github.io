const fs = require('fs');
const path = require('path');
const {argvToString} = require('./printer.js');
const cp = require('child_process');
var pathToLibFolder = path.resolve(__dirname,"./lib");

function replaceExt(npath,ext){
  if(typeof npath !== 'string')return npath;
  if(npath.length === 0)return npath;
  var nFileName = path.basename(npath, path.extname(npath)) + ext;
  return path.join(path.dirname(npath), nFileName);
}

function main(files,callback=()=>{}){
  if(!files){
    files = fs.readdirSync(pathToLibFolder);
    files = files.filter(e=>path.extname(e)=='.crta');
  }
  var ofiles = files;
  files = files.map(e=>path.resolve(pathToLibFolder,e));
  console.log(`assembling ${files.length} library files`);
  var r = [];
  var count = 0;
  for(var i = 0;i<files.length;i++){
    var file = files[i];
    let outputFilename = replaceExt(file,'.crto');
    let resultFilename = replaceExt(ofiles[i],'.crto');
    r.push(resultFilename);
    cp.exec("node assembler.js "+argvToString([file,"-o",outputFilename,'--pic']),(a,b,c)=>{
      if(a)throw a;
      if(c)console.error(c);
      console.log(`${resultFilename} finished`);
      count++;
      if(count==files.length)callback();
    });
  }
  return r;
}

module.exports = main;

if(require.main == module)main();
