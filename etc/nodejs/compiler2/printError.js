const Color = require("../bombsweeper/color.js");
const colorReset = '\x1b[0m\x1b[2m'; 

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
};
/**@type {PrintErrorOptions} */
var options = defaultOptions;

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
function printErrorColorHelper(name){
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
function printErrorHeaderHelper(token){
  var filename = token.loc.file;
  var headerColor = printErrorColorHelper("_header");
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
function printErrorLineHelper(token,color){
  var filename = token.loc.file;
  var t = require('./token2.js').getLineString(token.loc.start.line,filename);
  t = spliceSlice(t,token.loc.end.col-1,colorReset);
  t = spliceSlice(t,token.loc.start.col-1,color);
  return t;
}

/**
 * @param {string} string
 * @param {Object} token
 */
function printError(string,token){
  var opt = options;
  if(opt==false)return;
  var indexOfSep = string.indexOf(':');
  var errorType = string.slice(0,indexOfSep);
  if(errorType==string)errorType = 'none';
  var color = printErrorColorHelper(errorType);
  string = color+errorType+colorReset+string.slice(indexOfSep);

  console.error(`${printErrorHeaderHelper(token)} ${string}`);

  if(opt.lineStyle=="none")return;
  var t = printErrorLineHelper(token,color);
  var inc = -1;
  if(opt.lineStyle=="both"||opt.lineStyle=="tabbed"){
    t = "└─>"+t;
    inc += 3;
  }
  console.error(t);
  if(opt.lineStyle=="both"||opt.lineStyle=="highlighted"){
    var x = token.loc.start.col;
    let t = Math.max(0,token.loc.end.col-x-1);
    console.error(' '.repeat(inc+x)+color+'^'+'~'.repeat(t)+colorReset);
  }
}

function getOptions(){
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

printError.getOptions = getOptions;
printError.setOptions = setOptions;
module.exports = printError;
