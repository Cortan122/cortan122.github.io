const fs = require('fs');
const path = require('path');
const tty = require('tty');
const assembler = require('./assembler.js');
const preprocessor = require('./preprocessor.js');
const lexer = require('./lexer.js');

const defaultCommand = "convert";
/**@type {string[]} */
var argv;
/**@type {(error: string, loc?: number) => void} */
var printError;
var command = '';
var optionArgHelper_dict = {};
var outputFile = '-';
var peOptions = {};

/**@type {{[x: string]: {l: number, f:(arr: CLIToken[],i?:number)=>string }}} */
const argvRom = {
  '-o':{l:1,f:arr=>{
    if(!optionArgHelper(arr))return null;
    outputFile = arr[1].str;
    return null;
  }},
  '-x':{l:1,f:arr=>{
    if(!optionArgHelper(arr,false,[defaultCommand]))return null;
    return getTypeOf(arr[1].str,arr[1].loc);
  }},
  '-I':{l:1,f:arr=>{
    preprocessor.getOptions().headerFilePath.push(arr[1].str);
    return null;
  }},
  '--immediateErrors':{l:0,f:arr=>{
    peOptions.cache = false;
    return null;
  }},
  '--verbosity':{l:1,f:arr=>{
    if(!["0","1","2"].includes(arr[1].str)){
      printError(`error: verbosity level must be 0, 1 or 2`,arr[1].loc);
      return null;
    }
    var t = parseInt(arr[1].str);
    if(peOptions.verbosity==undefined){
      peOptions.verbosity = t;
    }else{
      peOptions.verbosity = Math.max(t,peOptions.verbosity);
    }
    return null;
  }},
  '--panicLevel':{l:1,f:arr=>{
    if(!["0","1","2"].includes(arr[1].str)){
      printError(`error: panic level must be 0, 1 or 2`,arr[1].loc);
      return null;
    }
    var t = 2-parseInt(arr[1].str);
    if(peOptions.panicThreshold==undefined){
      peOptions.panicThreshold = t;
    }else{
      peOptions.panicThreshold = Math.min(t,peOptions.panicThreshold);
    }
    return null;
  }},
  '--fatalErrors':{l:0,f:arr=>{
    peOptions.quickPanic = true;
    return null;
  }},
  '--help':{l:0,f:arr=>{
    console.log(`
      Usage: cli.js [options] file...
      Options:
      \t--help\t\t\tDisplay this information.
      \t--immediateErrors\tDo not sort error messages.
      \t--fatalErrors\t\tExit on the first error occurred.
      \t--verbosity <0|1|2>\t(0=errors, 1=warnings, 2=messages)
      \t--panicLevel <0|1|2>\t(0=errors, 1=warnings, 2=messages)
      \t-o <file>\t\tPlace the output into <file>.
      \t-I <path>\t\tAdd <path> to search list for include directives.
      \t-x <language>\t\tSpecify the language of the following input files.
    `.replace(/ *\n */g,'\n').replace(/^\n/,''));
    process.exit();
    return null;
  }},
  //todo
};

/**@type {{[x: string]:(arr: CLIToken[])=>void}} */
const commandRom = {
  [defaultCommand]:arr=>{},//todo
  "assemble":arr=>{
    var filenames = prepareInputFiles(arr.slice(1));
    if(filenames==null)return null;

    applyPrintErrorOptions();
    var r = assembler.assembleFile(...filenames);
    writeFile(outputFile,r);
  },
  "preprocess":arr=>{
    var filenames = prepareInputFiles(arr.slice(1));
    if(filenames==null)return null;

    applyPrintErrorOptions();
    var r = preprocessor.preprocessFiles(filenames);
    writeFile(outputFile,lexer.untokenize(r)+'\n');
  },
  //todo
};

/**
 * @param {string[]} argv
 * @param {{[x: string]: {l: number, f:(arr: CLIToken[],i?:number)=>string }}} rom
 */
function parseArgv(argv,rom){
  // const name = path.basename(module.parent.filename);
  const name = "cli.js";

  const _pe = require('./printError.js');
  _pe.setOptions(false);
  lexer.setOptions({filename:name});
  const templateToken = lexer.tokenize(argv.join(' ')+'\n')[0].loc;
  _pe.setOptions({header:false});
  const nullToken = {string:'',loc:Object.assign({},templateToken,{end:templateToken.start})};

  /**
   * @param {string} error
   * @param {number?} loc
   */
  function printError(error,loc){
    if(loc==undefined){
      var t = _pe.getOptions();
      _pe.setOptions(Object.assign({},t,{lineStyle:"none"}));
      _pe(error,nullToken);
      _pe.setOptions(t);
      return;
    }
    var index = argv.slice(0,loc).map(e=>e.length+1).reduce((a,e)=>e+a,0)+1;
    _pe(error,{
      string:argv[loc],
      loc:{
        file:templateToken.file,
        start:{
          col:index,
          line:templateToken.start.line,
          index:templateToken.start.index,
        },
        end:{
          col:index+argv[loc].length,
          line:templateToken.end.line,
          index:templateToken.end.index,
        },
      },
    });
  }

  // the stack is not the standard way to parse options
  var stack = [];
  /**@type {(CLIToken|CLIToken[])[]} */
  var args = [];

  /**
   * @param {string} str
   * @param {number} i
   */
  function push(str,i){
    if(rom[str]==undefined){
      printError(`error: unrecognized command line option '${str}'`,i);
      return;
    }
    let len = rom[str].l;
    let arr = [{str,loc:i}];
    args.push(arr);
    if(len)stack.push({len,arr});
  }

  for(var i = 2; i < argv.length; i++){
    var str = argv[i];
    if(str=='--'){
      argv.slice(i+1).map((e,i1)=>{
        args.push({str:e,loc:i+1+i1});
      })
      break;
    }else if(str.startsWith('--')){
      push(str,i);
    }else if(str[0]=='-'&&str!='-'){
      for(var char of str.slice(1)){
        push(`-${char}`,i);
      }
    }else if(stack.length==0){
      args.push({str,loc:i});
    }else{
      var stackFrame = stack[stack.length-1];
      stackFrame.len--;
      if(stackFrame.len==0)stack.pop();
      stackFrame.arr.push({str,loc:i});
    }
  }

  if(stack.length){
    printError(`error: not enough arguments`,stack[stack.length-1].arr[0].loc);
    return null;
  }

  return Object.assign(args,{printError});
}

/**
 * @param {(CLIToken | CLIToken[])[]} args
 * @param {{[x: string]: {l: number, f:(arr: CLIToken[],i?:number)=>string }}} rom
 */
function evalArgv(args,rom){
  var flags = {};
  var t = args.map(e=>{
    if(e instanceof Array){
      let t = rom[e[0].str].f(e);
      if(t!=null){
        flags[e[0].str] = t;
      }
      return null;
    }
    e.flags = Object.assign({},flags);
    return e;
  }).filter(e=>e!=null);

  return t;
}

function canReadFile({str,loc}){
  if(str=='-'){
    if(tty.isatty(0)){
      printError("stdin is a tty",loc);
      return false;
    }
    return true;
  }
  return true;
}

/**
 * @param {string} str
 * @param {Buffer|string} buffer
 */
function writeFile(str,buffer){
  if(str=='-'){
    fs.writeSync(1,buffer);
  }else{
    fs.writeFileSync(str,buffer);
  }
}

/**
 * @param {CLIToken[]} arr
 * @param {string[]} commands
 */
function optionArgHelper(arr,isSingle=true,commands=null){
  var name = arr[0].str;
  if(isSingle && optionArgHelper_dict[name]){
    printError(`warning: overwriting ${name}`,arr[0].loc);
  }
  optionArgHelper_dict[name] = true;
  if(commands!=null && !commands.includes(command)){
    printError(`error: ${name} can not be used with the '${command}' command`,arr[0].loc);
    return false;
  }
  return true;
}

/**
 * @param {string} extension
 * @param {number} loc
 */
function getTypeOf(extension,loc){
  var t = extension;
  t = t.replace(/crtc|h/,'c');
  t = t.replace(/crta|assembler|asm/,'a');
  t = t.replace('crto','o');
  t = t.replace('crtb','b');
  if(["c","a","o","b"].includes(t))return t;
  printError(`error: ${extension} is not a valid language`,loc);
  return null;
}

function applyPrintErrorOptions(){
  const pe = require('./printError.js');
  pe.setOptions(peOptions);
  pe.pulse();
}

/**
 * @param {CLIToken[]} files
 */
function prepareInputFiles(files){
  var filenames = files.map(file=>{
    if(!canReadFile(file))return null;
    if(file.str=='-')return 0;
    if(!fs.existsSync(file.str)){
      printError(`error: file "${file.str}" does not exist`,file.loc);
      return null;
    }
    return file.str;
  }).filter(e=>e!=null);
  if(filenames.length==0){
    printError(`error: no input files`);
    return null;
  }
  return filenames;
}

function main(localArgv=process.argv){
  require('./printError.js').push('cli');
  argv = localArgv;
  command = argv[2];
  optionArgHelper_dict = {};
  if(commandRom[command]==undefined)command = defaultCommand;

  const parsedArgv = parseArgv(argv,argvRom);
  if(parsedArgv==null)return;
  printError = parsedArgv.printError;
  const parsedArgv2 = evalArgv(parsedArgv,argvRom);

  commandRom[command](parsedArgv2);
}

// @ts-ignore
if(require.main == module){
  main();
}
