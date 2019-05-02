/**@type {Object.<string,(code:string,index:number)=>string>} */
const tokenTypeRom = {
  'identifier':(code,index)=>{
    return doubleRegexMatch(code,index,/[a-zA-Z_$]/,/[a-zA-Z_$0-9]/);
  },
  'lineComment':(code,index)=>{
    if(stringCompare(code,index,options.lineCommentSymbol)){
      return doubleRegexMatch(code,index,/[^\n]/);
    }
    return "";
  },
  'blockComment':(code,index)=>{
    var h = i=>code[i+index];
    var str = "";
    if(h(0)=='/' && h(1)=='*'){
      str = '/*';
      for(var i = 2;i+index < code.length; i++){
        if(h(i)!='/' || h(i-1)!='*'){
          str += h(i);
        }else break;
      }
      if(i+index == code.length){
        str += '*';
        printError("warning: unterminated comment");
      }
      str += '/';
    }
    return str;
  },
  'number':(code,index)=>{
    var h = i=>code[i+index];
    if(h(0)!='0'){
      return doubleRegexMatch(code,index,/[0-9]/);
    }
    if(h(1).match(/x/i)){
      return '0x'+doubleRegexMatch(code,index+2,/[0-9a-f]/i).toLowerCase();
    }
    if(h(1).match(/d/i)){
      return '0d'+doubleRegexMatch(code,index+2,/[0-9]/);
    }
    if(h(1).match(/o/i)){
      return '0o'+doubleRegexMatch(code,index+2,/[0-7]/);
    }
    if(h(1).match(/b/i)){
      return '0b'+doubleRegexMatch(code,index+2,/[0-1]/);
    }
    return doubleRegexMatch(code,index,/[0-9]/);
  },
  'operator':(code,index)=>{
    var h = i=>code[i+index];
    main:for(var op of options.operators){
      for(var i = 0; i < op.length; i++){
        if(h(i)!=op[i])continue main;
      }
      return op;
    }
    return "";
  },
  'string':(code,index)=>{
    return stringMatch(code,index,'"');
  },
  'char':(code,index)=>{
    return stringMatch(code,index,"'");
  },
  '_backslash':(code,index)=>{
    if(options.backslashNewlines && stringCompare(code,index,'\\\n')){
      return "\\";
    }
    return "";
  },
};

/**@type {Object.<string,(token:{string:string,type:string,value?})=>void>} */
const tokenValueRom = {
  'number':(token)=>{
    var r;
    var o = token.string;
    if(o.startsWith("0x")){
      r = parseInt(o.substr(2),16);
    }else if(o.startsWith("0b")){
      r = parseInt(o.substr(2),2);
    }else if(o.startsWith("0d")){
      r = parseInt(o.substr(2),10);
    }else if(o.startsWith("0o")){
      r = parseInt(o.substr(2),8);
    }else{
      r = parseInt(o);
    }
    token.value = r;
  },
  'string':(token)=>{
    var o = token.string;
    var buf = Buffer.alloc(o.length);
    var bufferIndex = 0;
    for(var i = 1; i < o.length-1; i++){
      var char = o[i];
      if(char=='\\'){
        i++;
        var hex = escapedCharToHex(ind=>o[ind+i],e=>printError(e,token),inc=>i+=inc);
        if(hex==null)continue;
        buf[bufferIndex] = hex;
        bufferIndex++;
      }else{
        buf[bufferIndex] = char.charCodeAt(0);//todo:parseEncoding()
        bufferIndex++;
      }
    }
    token.value = buf.slice(0,bufferIndex);
  },
  'char':(token)=>{
    var opt = options.interpretSingleQuotedStringsAs;
    token.type = opt;
    if(opt=="string"){
      tokenValueRom[opt](token);
      return;
    }
    tokenValueRom["string"](token);
    if(token.value.length<1){
      printError("error: empty character constant",token);
      token.value = 0;
    }else{
      if(token.value.length>1){
        printError("warning: multi-character character constant",token);
      }
      token.value = token.value[0];
    }
  },
};

/**@type {TokenOptions} */
const defaultOptions = {
  interpretSingleQuotedStringsAs:"number",
  filename:false,
  comments:true,
  newlines:true,
  operators:[
    '=',
    '+=',
    '-=',
    '*=',
    '/=',
    '%=',
    '<<=',
    '>>=',
    '&=',
    '^=',
    '|=',
    '<',
    '<=',
    '>',
    '>=',
    '?',
    ':',
    '<<',
    '>>',
    ',',
    '||',
    '&&',
    '|',
    '&',
    '^',
    '*',
    '/',
    '%',
    '==',
    '!=',
    '+',
    '-',
    '!',
    '~',
    '++',
    '--',
    ';',
    '(',
    ')',
    '[',
    ']',
    '{',
    '}',
    '#',
    '##',
    '.',
    '...',
  ],
  lineCommentSymbol:'//',
  backslashNewlines:true,
};
var options = defaultOptions;

/**@type {Object.<string,string>} */
var globalCode = {};
var line = 1;
var col = 1;

/**
 * @param {string} string
 * @param {Object=} token
 */
function printError(string,token){
  if(token == undefined){
    var name = options.filename?options.filename:"";
    token = {loc:{start:{line,col},end:{line,col:col+1},file:name}};
  }
  require('./printError.js')(string,token);
}

function isObject(o){
  return typeof o == 'object' && o != null && !(o instanceof Array);
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

/**
 * @param {number} lineNumber
 * @param {string} filename
 */
function getLineString(lineNumber,filename){
  var gCode = globalCode[filename];
  var res = "";
  for(let i = 0; i < gCode.length; i++){
    const char = gCode[i];
    if(char=='\n'){
      lineNumber--;
    }else if(lineNumber==1){
      res += char;
    }
    if(lineNumber==0){
      return res;
    }
  }
  if(lineNumber==1){
    return res;
  }
  throw Error('hi'+lineNumber);
}

/**
 * @param {string} code
 * @param {number} index
 * @param {string} quote
 */
function stringMatch(code,index,quote){
  var h = i=>code[i+index];
  if(h(0)!=quote)return "";
  var str = quote;
  var state = false;
  var hasMultilineWarning = false;
  for(var i = 1;i+index < code.length; i++){
    if(h(i)==quote && !state)break;
    str += h(i);
    if(h(i)=='\n'){
      if(!state && !hasMultilineWarning){
        printError(`warning: multiline string`);
        hasMultilineWarning = true;
      }
    }
    if(h(i)=='\\'&&!state){
      state = true;
    }else{
      state = false;
    }
  }
  if(i+index == code.length){
    printError(`warning: missing terminating ${quote} character`);
  }
  return str+quote;
}

/**
 * @param {string} code
 * @param {number} index
 * @param {string} string
 */
function stringCompare(code,index,string){
  return code.slice(index,string.length+index)==string;
}

/**
 * @param {(index:number)=>string} h Helper function for indexing
 * @param {(message:string)=>void} e Error function
 * @param {(delta:number)=>void} inc Helper function for incrementing the index
 */
function escapedCharToHex(h,e,inc){
  if(h(0) == '"'){
    return 0x22;
  }else if(h(0) == 'x'){
    var str = h(1)+h(2);
    inc(2);
    if(str.match(/[^A-Fa-f0-9]/)){
      e("error: \\x used with no following hex digits");//todo:unclear error (it must have 2)
      return null;
    }else{
      return parseInt(str,16);
    }
  }else if(h(0) == '0'){
    return 0x00;
  }else if(h(0) == 't'){
    return 0x09;
  }else if(h(0) == 'n'){
    return 0x0a;
  }else if(h(0) == 'r'){
    return 0x0d;
  }else if(h(0) == "e"){
    return 0x1b;
  }else if(h(0) == '"'){
    return 0x22;
  }else if(h(0) == "'"){
    return 0x27;
  }else if(h(0) == "\\"){
    return 0x5c;
  }else if(h(0) == "\n"){
    return null;
  }else{
    var t = h(0);
    var code = t.charCodeAt(0);
    if(code<=0x20 || code>=0x7f){
      t = h(0).charCodeAt(0).toString(16);
      if(t.length!=2){
        t = '0'+t;
      }
      t = 'x'+t;
    }
    e(`warning: unknown escape sequence: '${'\\'+t}'`);
    return code;
  }
}

/**
 * @param {string} code
 * @param {number} index
 * @param {RegExp} re1
 * @param {RegExp=} re2
 */
function doubleRegexMatch(code,index,re1,re2){
  if(re2==undefined){
    re2 = re1;
  }
  var h = i=>code[i+index];
  var str = "";
  if(h(0).match(re1)){
    str = h(0);
    for(var i = 1;i+index < code.length; i++){
      if(h(i).match(re2)){
        str += h(i);
      }else break;
    }
  }
  return str;
}

/**
 * @param {string} code
 * @returns {Token[]}
 */
function main(code){
  var filename = options.filename;
  if(!filename){
    filename = "";
  }
  if(globalCode[filename])filename = '\0'+filename;
  globalCode[filename] = code;
  var tokens = [];
  line = 1;
  col = 1;
  main:for(var i = 0; i < code.length; i++){
    var char = code[i];
    if(char=='\n'){
      if( !(options.backslashNewlines && tokens[tokens.length-1].string=='\\') ){
        tokens.push({
          type:'newline',
          string:'\n',
          loc:{
            file:filename,
            start:{line,col,index:i},
            end:{line,col,index:i},
          },
        });
      }
      line++;
      col = 1;
      continue;
    }
    for(var key in tokenTypeRom){
      var func = tokenTypeRom[key];
      var match = func(code,i);
      if(!match)continue;
      var loc = {start:{line,col,index:i},file:filename};
      var tempArr = match.split('\n');
      if(tempArr.length-1){
        line += tempArr.length-1;
        col = tempArr[tempArr.length-1].length+1;
      }else{
        col += match.length;
      }
      loc.end = {line,col,index:i+match.length-1};
      var token = {
        type:key,
        string:match,
        loc,
      };
      var valFunc = tokenValueRom[key];
      if(valFunc)valFunc(token);
      tokens.push(token);
      i += match.length-1;
      continue main;
    }
    if(!char.match(/\s/)){
      printError(`error: stray '${char}' in program`);
    }
    col++;
  }
  // @ts-ignore
  return tokens;
}

/**
 * @param {string} code
 * @param {TokenOptions=} Options
 * @returns {Token[]}
 */
function tokenize(code,Options){
  if(Options)setOptions(Options);
  require('./printError.js').push('lexer');

  var r = main(code);
  var specialArray = ['_backslash'];
  if(!options.comments)specialArray.push("blockComment","lineComment");
  if(!options.newlines)specialArray.push("newline");
  var res = r.filter(e=>!specialArray.includes(e.type));

  require('./printError.js').pulse();
  return res;
}

/**
 * @param {Token[]} tokens
 * @returns {string}
 */
function untokenize(tokens){
  var r = "";
  var tempBool = false;
  for(var t of tokens){
    if((t.type=="identifier"||t.type=="number") && tempBool)r += ' ';
    tempBool = (t.type=="identifier"||t.type=="number");
    r += t.string;
  }
  return r;
}

function getOptions(){
  return options;
}

/**
 * @param {TokenOptions} Options
 */
function setOptions(Options){
  options = recAssign(defaultOptions,Options);
  options.operators.sort((b,a)=>a.length-b.length);
}

module.exports = {tokenize,getLineString,untokenize,getOptions,setOptions};

// @ts-ignore
if(require.main == module){
  const fs = require('fs');
  var buff = fs.readFileSync('../compiler/examples/token2.crtc')
  var r = tokenize(buff.toString());
  console.dir(r,{depth:null});
  console.log(untokenize(r));
}
