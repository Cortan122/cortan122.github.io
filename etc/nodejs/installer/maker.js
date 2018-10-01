const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const parseArgv = require('../compiler/argv.js');

const includeDirectory = "output/";
const tmpfile = includeDirectory+"temp.c";
const includeThreshold = 1024*64;

const argvRom = {
  "--auto":[0,1,()=>{
    doAskForPremition = false;
  }],
  "--clean":[0,1,()=>{
    isClean = true;
  }],
  "--noicon":[0,1,()=>{
    doFavicon = false;
  }],
  "--selfdel":[0,1,()=>{
    doDelMe = true;
  }],
  "-o":[1,1,(a)=>{
    outputFilename = a;
    hasDefaultOutputFilename = false;
  }],
  "argv":(argv)=>{
    if(!argv.length)return;
    filenames = argv;
    if(hasDefaultOutputFilename){
      outputFilename = `output/${basename(filenames[0])}.exe`;
    }
  }
};

var filenames = ["maker.js"];
var hasDefaultOutputFilename = true;
var outputFilename = `output/${basename(filenames[0])}.exe`;
var doAskForPremition = true;
var doDelMe = false;
var isClean = false;
var doFavicon = true;
var directories = [];
var ogDirectories = [];
var newFilenames = [];

String.prototype.format || (String.prototype.format = function() {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number) { 
    return typeof args[number] != 'undefined'
    ? args[number]
    : match
    ;
  });
});

Array.prototype.remove || (Array.prototype.remove = function(e) {
  return this.remove_at(this.indexOf(e));
});

Array.prototype.remove_at || (Array.prototype.remove_at = function(index) {
  if (index > -1) {
    this.splice(index, 1);
  }
  return this;
});

// List all files in a directory in Node.js recursively in a synchronous fashion
function walkSync(dir,filelist = [],dirlist = []){
  for(var file of fs.readdirSync(dir)){
    var pathstr = path.join(dir, file);
    if(fs.statSync(pathstr).isDirectory()){
      dirlist.push(pathstr);
      walkSync(pathstr, filelist, dirlist);
    }else{
      filelist.push(pathstr);
    }
  }
  return {filelist,dirlist};
}

function escape(str){
  var nstr = "";
  for(var c of str){
    if(c=='\\'){
      nstr += '\\\\';
    }else{
      nstr += c; 
    }
  }
  return parseArgv.argvToString([nstr]);
}

function basename(name){
  return path.basename(name,path.extname(name));
}

function getDataString(filename,i,t){
  console.log(`getDataString(${filename},${i})`);
  var data = fs.readFileSync(filename);
  if(data.length>includeThreshold){
    var file = includeDirectory+`data_${i}.o`;
    cp.execSync("ld -r -b binary "+parseArgv.argvToString([filename,"-o",file]));
    var names = cp.execSync("nm "+parseArgv.argvToString([file])).toString();
    var basearr = names.split('\n')[0].split(' ')[2].split('_');
    var base = basearr.slice(1,basearr.length-1).join('_');
    var r = `
    extern char ${base}_start;
    extern char ${base}_end;
    extern int ${base}_size;
    `;
    t[0] = `&${base}_start,`;
    t[1] = '0x1337cafe,';//`(int)&${base}_end`;//`${base}_size`;
    t[2] = [file];
    t[3] = `sizes[${i}] = (int)(&${base}_end-&${base}_start);\n`;
    return r;
  }
  var data_str = "";
  for(var byte of data){
    data_str += `${byte},`;
  }
  return `char data_${i}[] = {${data_str}};\n`;
}

function getSpecialFileInfo(objects){
  var has_index_bat = true;
  var bat_str = `${ogDirectories[0]}\\index.bat`;
  if(ogDirectories.length!=1){
    has_index_bat = false;
  }else if(!newFilenames.includes(bat_str)){
    has_index_bat = false;
  }

  var has_favicon = true;
  var favicon_str = `${ogDirectories[0]}\\favicon.ico`;
  if(ogDirectories.length!=1){
    has_favicon = false;
  }else if(!newFilenames.includes(favicon_str)){
    has_favicon = false;
  }

  if(has_favicon&&doFavicon){
    var rc_path = path.resolve(includeDirectory,'icon.rc').replace(/\\/g,'/');
    var res_path = path.resolve(includeDirectory,'icon.res').replace(/\\/g,'/');
    var favicon_path = path.resolve(filenames[newFilenames.indexOf(favicon_str)]).replace(/\\/g,'/');
    fs.writeFileSync(rc_path,`1 ICON ${escape(favicon_path)}`);
    var cmd = "windres "+parseArgv.argvToString([rc_path,"-O","coff","-o",res_path]);
    console.log(`cp.execSync(${cmd})`);
    cp.execSync(cmd);
    objects.push(res_path);
  }

  return has_index_bat;
}

function main(){
  var source = fs.readFileSync("template.c").toString('ascii').replace(/\r/g,"");

  var data_str = "";
  var filename_str = "";
  var files_str = "";
  var sizes_str = "";
  var init_str = "";
  var objects = [];

  for(var i = 0; i < filenames.length; i++){
    var t = [`data_${i},`,`sizeof(data_${i}),`,[],''];
    data_str += getDataString(filenames[i],i,t);
    filename_str += escape(newFilenames[i])+',';
    files_str += t[0];
    sizes_str += t[1];
    objects = objects.concat(t[2]);
    init_str += t[3];
  }

  var destination_str = '""';
  if(filenames.length==1){
    destination_str = escape(`\\${newFilenames[0]}`);
  }else if(ogDirectories.length==1){
    destination_str = escape(`\\${ogDirectories[0]}`);
  }

  var has_index_bat = getSpecialFileInfo(objects);

  var code = source.format(
    data_str,
    filename_str,
    doAskForPremition,
    filenames.length,
    files_str,
    sizes_str,
    doDelMe,
    escape(basename(outputFilename)),
    destination_str,
    init_str,
    directories.map(e=>escape(e)+',\n').join(''),
    directories.length,
    escape(`.\\${ogDirectories[0]}\\index.bat`),
    has_index_bat,
  );
  fs.writeFileSync(tmpfile,code);
  var cmd = "gcc "+parseArgv.argvToString([...objects,tmpfile,"-o",outputFilename]);
  console.log(`cp.exec(${cmd})`);
  cp.exec(cmd,(a,b,c)=>{
    console.log(b);
    console.error(c);
    if(a)throw a;
    if(isClean){
      fs.unlinkSync(tmpfile,()=>{});
      objects.map(e=>fs.unlinkSync(e,()=>{}));
    }
  });
}

function checkDirectories(){
  var f = (path)=>fs.statSync(path).isDirectory();

  var rfiles = [];
  var nfiles = [];
  for(var i = 0; i < filenames.length; i++){
    var filename = filenames[i];
    if(f(filename)){
      filenames[i] = undefined;
      var h = e=>path.relative(path.join(filename,'../'),e);
      ogDirectories.push(path.basename(filename));
      var tfiles = [];
      var tdirs = [];
      tdirs.push(filename);
      walkSync(filename,tfiles,tdirs);
      rfiles = rfiles.concat(tfiles);
      nfiles = nfiles.concat(tfiles.map(h));
      directories = directories.concat(tdirs.map(h));
    }
  }
  filenames = filenames.filter(e=>e);//.concat(rfiles);
  newFilenames = filenames.map(e=>path.basename(e));

  filenames = filenames.concat(rfiles);
  newFilenames = newFilenames.concat(nfiles);
}

parseArgv(process.argv,argvRom);

checkDirectories();

main();
