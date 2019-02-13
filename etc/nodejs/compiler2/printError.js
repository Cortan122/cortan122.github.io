const Color = require("../bombsweeper/color.js");
const colorReset = '\x1b[0m\x1b[2m';
const includeStackBracket = [' ','│',' '];//['╱','▏','╲']

/**@type {PrintErrorOptions} */
const defaultOptions = {
  lineStyle:"both",
  includeStack:true,
  colors:{
    error:"#e74856",
    warning:"#b4009e",
    message:"#61d6d6",
    _header:"\x1b[1m\x1b[38;2;255;255;255m",
  },
  verbosity:2,
  panicThreshold:1,
  quickPanic:false,
  cache:false,
};
/**@type {PrintErrorOptions} */
var options = defaultOptions;

var cache = [];
var isPanicking = false;

/**
 * @param {string} str
 * @param {number} index
 * @param {string} add
 */
function spliceSlice(str, index, add){
  return str.slice(0, index) + (add || "") + str.slice(index);
}

/**
 * @param {string} name
 */
function colorHelper(name){
  var opt = options;
  if(opt==false)return;
  var color = '';
  if(opt.colors){
    color = opt.colors[name];
    if(color[0]!='\x1b'){
      color = new Color(opt.colors[name],'transparent').toAnsiCode();
    }
  }
  return color;
}

/**
 * @param {Token} token
 */
function headerHelper(token){
  var filename = token.loc.file;
  var headerColor = colorHelper("_header");
  var filenameString = headerColor;
  if(filename!=""){
    filenameString += filename+':';
  }
  return `${filenameString}${token.loc.start.line}:${token.loc.start.col}:${colorReset}`;
}

/**
 * @param {Token} token
 * @param {string} color
 */
function lineHelper(token,color){
  var filename = token.loc.file;
  var t = require('./lexer.js').getLineString(token.loc.start.line,filename);
  t = spliceSlice(t,token.loc.end.col-1,colorReset);
  t = spliceSlice(t,token.loc.start.col-1,color);
  return t;
}

/**
 * @param {Token} token
 * @returns {Token[]}
 */
function getIncludeStack(token){
  if(!token.includeStack)return [];
  var t = getIncludeStack(token.includeStack);
  t.push(token.includeStack);
  return t;
}

/**
 * @param {string} string
 * @param {Token} token
 */
function main(string,token){
  var opt = options;
  if(opt==false)return;
  var res = '';
  var indexOfSep = string.indexOf(':');
  var errorType = string.slice(0,indexOfSep);
  if(errorType==string)errorType = 'message';
  var color = colorHelper(errorType);
  string = color+errorType+colorReset+string.slice(indexOfSep);

  res += (`${headerHelper(token)} ${string}`)+'\n';

  if(opt.lineStyle=="none")return [res,errorType];
  var t = lineHelper(token,color);
  var inc = -1;
  if(opt.lineStyle=="both"||opt.lineStyle=="tabbed"){
    t = "└─>"+t;
    inc += 3;
  }
  res += (t)+'\n';
  if(opt.lineStyle=="both"||opt.lineStyle=="highlighted"){
    var x = token.loc.start.col;
    let t = Math.max(0,token.loc.end.col-x-1);
    let str = ' '.repeat(inc+x)+color+'^'+'~'.repeat(t)+colorReset;
    if(opt.includeStack && token.includeStack)str = includeStackBracket[0]+str.slice(1);
    res += (str)+'\n';
  }else if(opt.includeStack && token.includeStack){
    if(includeStackBracket[0]!=' ')res += (includeStackBracket[0])+'\n';
  }

  if(!opt.includeStack || token.includeStack==undefined)return [res,errorType];
  var stack = getIncludeStack(token);
  for(var e of stack){
    res += (`${includeStackBracket[1]}${headerHelper(e)} ${lineHelper(e,colorHelper("message"))}`)+'\n';
  }
  if(includeStackBracket[2])res += (includeStackBracket[2])+'\n';

  return [res,errorType];
}

function flush(){
  if(cache.length==0)return;
  cache.sort((a,b) => (a.k>b.k)?1:-1 );
  for(var e of cache){
    process.stderr.write(e.v);
  }
  cache = [];
}

function panic(){
  flush();
  console.error("compilation aborted");
  process.exit(1);
}

function pulse(){
  if(isPanicking)panic();
}

/**
 * @param {string} string
 * @param {Token} token
 */
function printError(string,token){
  var opt = options;
  if(opt==false)return;
  const errorLevels = {error:2,warning:1,message:0};
  var t = main(string,token);
  var i = errorLevels[t[1]];
  if(i<=opt.verbosity){
    if(opt.cache){
      var k = token.loc.file+'\n';
      k += token.loc.start.line.toString().padStart(100,'0');
      k += token.loc.start.col.toString().padStart(100,'0');
      cache.push({k,v:t[0]});
    }else{
      process.stderr.write(t[0]);
    }
  }
  if(i>opt.panicThreshold){
    if(opt.quickPanic){
      panic();
    }else{
      isPanicking = true;
    }
  }
}

function getOptions(){
  if(!options)return options;
  return Object.assign({},options);//todo: fixme: you can edit nested objects
}

/**
 * @param {PrintErrorOptions} Options
 */
function setOptions(Options){
  if(Options==false){
    options = false;
    return;
  }
  options = Object.assign(defaultOptions,Options);
}

process.on('exit', (code)=>{
  flush();
});

printError.getOptions = getOptions;
printError.setOptions = setOptions;
printError.pulse = pulse;
module.exports = printError;
