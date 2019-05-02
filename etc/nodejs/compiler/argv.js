var path = require('path');

function parseArgv(argv,rom){
  /*const rom = {
    "-o":[1,1,(a)=>{
      outputFilename = a;
    }],
    "--asm":[0,1,()=>{
      isasm = true;
    }],
    "argv":(argv)=>{

    },
    "error":()=>{

    },
    "onerror":(str)=>{

    }
  };*/
  const name = path.basename(module.parent.filename);//'preprocessor.js';
  var status = true;
  var candoop = true;
  var args = [];
  var error = rom.onerror;
  if(error==undefined){
    error = console.error;
  }
  if(rom.error==undefined){
    rom.error = ()=>process.exit(1);
  }
  if(rom.argv==undefined){
    rom.argv = (arr)=>{
      if(arr.length){
        error(`${name}: expects 0 non-option arguments`);
        return true;//set error flag
      }
    };
  }
  for (var i = 2; i < argv.length; i++) {
    var str = argv[i];
    if(str=='--'){
      candoop=false;
    }else if(str[0]=='-'&&candoop){
      var opt = rom[str];
      if(opt==undefined){
        error(`${name}: unrecognized option '${str}'`);
        status = false;
        continue;
      }
      if(opt[1]==0){
        error(`${name}: option '${str}' used too much`);
        status = false;
        continue;
      }
      opt[1]--;
      var as = [];
      for (var j = 0; j < opt[0]; j++) {
        as.push(argv[i+j+1]);
        i++;
      }
      opt[2].apply(this,as);
    }else{
      args.push(str);
    }
  }
  if(rom.argv(args))status = true;
  if(status == false){
    rom.error();
    return -1;
  }
  return args;
}

function argvToString(argv){
  var r = "";
  for (var i = 0; i < argv.length; i++) {
    var t = argv[i];
    var tr = "";
    for (var j = 0; j < t.length; j++) {
      if(t[j]!='"'){
        tr += t[j];
      }else{
        tr += '\\'+t[j];
      }
    }
    r += ' "'+tr+'"';
  }
  r = r.substr(1);
  return r;
}

parseArgv.argvToString = argvToString;
module.exports = parseArgv;
