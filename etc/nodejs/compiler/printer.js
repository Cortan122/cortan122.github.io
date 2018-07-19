//var t = require('./module.js')

var path = require('path');
var cp = require('child_process');
const exec = cp.exec;

function getLineNumber(pos){
  var line = 0,line1 = 0,char = 0,name = "undefined";
  for (var i = 0; i < pos; i++) {
    char++;
    if(source[i] == '\n'){
      line++;
      line1++;
      char = 0;
    }
    var t = linebreaks[line];
    if(t){
      line1 = t.line;
      name = t.sname;
    }
  }
  return [name,line1,char];
}

function getLineString(pos){
  if(source[pos]=='\n')pos--;
  var prev = source.lastIndexOf('\n',pos);
  var next = source.indexOf('\n',pos);
  if(next==-1)next=source.length-1;
  return source.substring(prev+1,next);
}

function printError(str,pointer){
  var r = getLineNumber(pointer);
  console.error(`${r[0]}:${r[1]}: ${str}`);
  if(doPrintLineString){
    console.error("└─>"+getLineString(pointer));
  }
}

function main(_source,func){
  var ind = _source.indexOf('\n');
  linebreaks = JSON.parse(_source.substring(0,ind));
  if(linebreaks.errors){
    //return;
  }
  var code = source = _source.substr(ind);

  func(code);
}

var doPrintLineString = true;

var linebreaks;
//var pointer = 0;
var source;

function argvToString(argv){
  var r = "";
  for (var i = 0; i < argv.length; i++) {
    var t = argv[i];
    var tr = "";
    for (var j = 0; j < t.length; j++) {
      if(t[j]!='"'){
        tr += t[j];
      }else{
        tr += '\\"';
      }
    }
    r += ' "'+tr+'"';
  }
  r = r.substr(1);
  return r;
}

function init(func,argv) {
  var cmd = `node preprocessor.js ${argvToString(argv)}`;
  exec(cmd,(err, stdout, stderr) => {
    if (err) {
      process.stderr.write(stdout.toString('ascii'));
      console.log("error in nodejs:");
      console.log(err);
      return;
    }

    if(stderr){
      console.log("<error in preprocessor>");
      process.stderr.write(stderr.toString('ascii'));
      console.log("</error in preprocessor>");
      main(stdout.toString('ascii'),func);
      return;
    }

    main(stdout.toString('ascii'),func);
  });
}

module.exports.init = init;
module.exports.print = printError;
module.exports.argvToString = argvToString;

Object.defineProperty(module.exports, "linebreaks", {
  get:()=>linebreaks
});

Object.defineProperty(module.exports, "doPrintLineString", {
  get:()=>doPrintLineString,
  set:a=>{doPrintLineString=a;}
});

