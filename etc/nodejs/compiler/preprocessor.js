const fs = require('fs');
const path = require('path');
const parseArgv = require('./argv.js');

const argvRom = {
  "-o":[1,1,(a)=>{
    outputFilename = a;
  }],
  "-I":[1,1,(a)=>{
    pathToLibFolder = path.resolve(a);
  }],
  "--asm":[0,1,()=>{
    isasm = true;
  }],
  "argv":(argv)=>{
    if(argv.length>1){
      console.error(`preprocessor.js: expects 1 or 0 non-option arguments`);
      return 1;
    }
    if(argv.length)filename = argv[0];
  }
};

const directiveRom = {
  "define":str=>{
    var name = str.match(/^[A-Za-z_$][A-Za-z_$0-9]*/)[0];//identifierMatch(i=>i>0?str[i]:'\n');
    if(name.length==0){
      printError("define expects an identifier");
      return;
    }
    if(environment[name]!=undefined){
      printError(`warning: trying to redefine ${name}`);
    }
    var lineNumber = getLineNumber2(pointer-str.length)[0]-1;
    var pointer1 = name.length;
    if(str[pointer1]=="("){
      var i = str.indexOf(')');
      var args = str.substring(pointer1+1,i).split(',');
      for (var j = 0; j < args.length; j++) {
        if(!isLegalIdentifier(args[j]))return;
      }
      environment[name] = {args:args,str:str.substr(i+1),line:lineNumber};
      //console.log(environment[name]);
      return;
    }
    environment[name] = {str:str.substr(pointer1),line:lineNumber};
  },
  "if":(str,startind)=>{
    var ind = str.match(/[ \n]/).index;
    var cond = str.substring(0,ind);
    /*if(cond.indexOf("@")!=-1){
      printError("useless '@'");
      return;
    }*/
    var undefs = [];
    do{
      var ii = 0;
      cond = cond.replace(/[a-zA-Z_$][a-zA-Z_$0-9]*/g,function(ide){
        if(ide==undefined)throw '122';
        if(ide=="defined")return "defined";
        ii++;
        var val = environment[ide];
        if(val==undefined){
          //console.log(envStack);
          var i = undefs.push(ide)-1;
          return `ы${i}ы`;
        }
        if(val.args){
          printError("todo: macro functions in #if statements");
          //todo
          return '';
        }
        return val.str;
      });
    }while(ii);
    cond = cond.replace(/defined\(ы[0-9]+ы\)/g,"0");
    cond = cond.replace(/defined\([^\(\)]*\)/g,"1");
    var m;
    if(m = cond.match(/ы([0-9]+)ы/)){
      printError(`"${undefs[parseInt(m[1])]}" is not defined`);
      return;
    }
    var res = last_if_result = eval(cond);
    if(!res)return;
    var strres = str.substr(ind);
    var count = strres.split('\n').length-1;
    result = result.substring(0,result.length-count);
    source = source.splice(startind-1,pointer-startind+1,strres);
    pointer = startind-1;
  },
  "undefine":str=>{
    var spaceindex = str.indexOf(" ");
    var name;
    if(spaceindex!=-1){
      name = str.substring(0,spaceindex);
      printError(`#undefine only needs 1 argument`);
    }
    var name = str;//.substring(0,spaceindex);
    if(name == "*"){
      environment = {};
      return;
    }
    if(environment[name] === undefined){
      if(!isLegalIdentifier(name))return;
      printError(`"${name}" is not defined`);
      return;
    }
    delete environment[name];
  },
  "line":str=>{
    printError(`#line is deprecated`);
    return;

    var arr = str.split(" ");
    if(arr.length==0||str==""){
      printError(`#line needs at least 1 argument`);
      return;
    }
    if(arr.length>2){
      printError(`#line only needs 2 arguments`);
      return;
    }
    var line = parseInt(arr[0]);
    var name = filename;
    if(arr.length==2){
      name = arr[1];
    }
    var _line = getLineNumber(pointer)[0];
    var diff = _line-line+2;
    lineOffset -= diff;
    envStack.map(e=>e[1]+=diff);
    var rline = getLineNumberRes();
    linebreaks[rline+2] = {name:name,line:line};
  },
  "message":str=>{
    printError("message: "+str);
  },
  "include":(str,startind)=>{
    var oldname = filename;
    var wasQuoted = undefined;

    if(str[0]=='"'){
      var i = str.indexOf('"',1);
      if(i!=str.length-1){
        printError(`#include only needs 1 argument`);
        str = str.substring(0,i);
      }
      filename = unparseEncoding(str);
      wasQuoted = true;
    }else if(str[0]=='<'){
      var i = str.indexOf('>',1);
      if(i!=str.length-1){
        printError(`#include only needs 1 argument`);
      }
      str = str.substring(1,i);
      filename = str;
      wasQuoted = false;
    }else{
      printError(`invalid #include format`);
      return;
    }

    if(filename.match(/^\.\.?(\/|\\)/)){
      //the name starts with ./ or ../
      filename = path.resolve(path.dirname(oldname),filename);
    }else{
      if(wasQuoted){
        //do nothing
      }else{
        filename = path.resolve(pathToLibFolder,filename);
      }
    }

    filename = path.resolve(filename);
    if(filename == oldname){
      printError(`warning: file "${filename}" is included recursively`);
    }
    if(includedFiles.includes(filename)&&!wasQuoted){
      //printError(`warning: file "${filename}" was already included`);
      filename = oldname;
      return;
    }

    var fileContens = main();

    pushToSource(" "+fileContens+"#]\n",1);
    pointer++;
    _state_main_is_first = true;

    var line = getLineNumber(pointer)[0];
    var line2 = getLineNumber2(pointer)[0]-1;
    envStack.push([environment,line,"useless",result.length,/*val.line*/0,line2,oldname]);
    var rline = getLineNumberRes();
    linebreaks[rline+1] = {name:filename,line:1};
  }
};

const encodingRom = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмноп░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀рстуфхцчшщъыьэюяЁёЄєЇїЎў°∙·√№¤■".split('').map(e=>e.charCodeAt(0));

String.prototype.splice || (String.prototype.splice = function(idx, rem, str) {
  return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
});

Array.prototype.remove || (Array.prototype.remove = function(e) {
  var index = this.indexOf(e);
  if (index > -1) {
    this.splice(index, 1);
  }
});

var isAsciiResult;

function isAscii(str) {
  for (var i = 0, n = str.length; i < n; i++) {
    if (str.charCodeAt( i ) > 127) {
      isAsciiResult = i;
      return false; 
    }
  }
  return true;
}

function bracketLookup(op='(',ed=')',start=0){
  var level = start;
  for (var i = 0;i+pointer < source.length; i++) {
    if(h(i)==op[0]&&(op.length==1||h(i+1)==op[1]))level++;
    if(h(i)==ed[0]&&(ed.length==1||h(i+1)==ed[1])){
      level--;
      if(level==0)return i+pointer;
    }
  }
  return -1;
}

function pushToSource(str,len=0){
  source = source.splice(pointer,len,str);
  pointer--;
}

function isLegalIdentifier(name){
  var m = name.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
  if(!(m&&m[0]==name)){
    printError(`illegal identifier: "${name}"`);
    return false;
  }
  /*if(envlabels[name] !== undefined){
    printError(`${name} is already defined`);
  }*/
  return true;
}

function parseEncoding(charCode){
  if(typeof charCode == "string"){
    charCode = charCode.charCodeAt(0);
  }
  if(charCode<0x80)return charCode;
  var t = encodingRom.indexOf(charCode);
  if(t == -1){
    printError(`'${String.fromCharCode(charCode)}' char not supported by this encoding`);
    return '?'.charCodeAt(0);
  }
  return t+0x80;
}

function unparseEncoding(string){
  var ostr = string;
  if(string[0]=='"')string = string.substr(1);
  if(string[string.length-1]=='"')string = string.substring(0,string.length-1);
  if(string[0]!='0'||string[1]!='x'){
    throw "invalid encoded str";
  }
  string = string.substr(2);
  if(string.length%2){
    console.error(`"${string}"`);
    throw "invalid encoded str";
  }
  var r = "";
  for (var i = 0; i < string.length; i+=2) {
    var hex = parseInt(string[i]+string[i+1],16);
    if(hex<0x80){
      r += String.fromCharCode(hex);
    }else{
      r += String.fromCharCode(encodingRom[hex-0x80]);
    }
  }
  return r;
}

function h(i){
  var t = pointer+i;
  if(t<0||t>=source.length)return '\n';
  return source[t];
}

function tohex(num,len=2){
  var s = num.toString(16);
  if(s.length>len&&len!=0){
    printError("num too big");
  }
  while(s.length<len){
    s = "0"+s;
  }
  return s;
}

function getLineNumberRes(){
  var line = 0;
  for (var i = 0; i < result.length; i++) {
    if(result[i] == '\n'){
      line++;
    }
  }
  return line;
}

function getLineNumber(pos){
  var line = 0, char = 0;
  for (var i = 0; i < pos; i++) {
    char++;
    if(source[i] == '\n'){
      line++;
      char = 0;
    }
  }
  return [line,char];
}

function getLineNumber2(pos){
  var r = getLineNumber(pos);
  /*var t = linebreaks.filter(e=>e[4]<pos).sort((a,b)=>a[4]-b[4]);
  var s = 0;
  t.map(e=>s+=e[2]);*/
  var t = envStack[envStack.length-1];
  if(t){
    //console.log([r[0],t[4],t[1]]);
    r[0] += t[4]-t[1];
  }else{
    r[0] += lineOffset;
  }
  return [r[0]+1,r[1],simpleFilename(filename)];
}

function simpleFilename(name){
  var f = name;
  var t = path.relative(process.cwd(),name);
  if(t.length<f.length)f = t;
  t = path.relative(pathToLibFolder,name);
  if(t.length<f.length)f = t;

  f = f.replace(/\\/g,'/');//for windows

  return f;
}

function getLineString(pos){
  if(source[pos]=='\n')pos--;
  var prev = source.lastIndexOf('\n',pos);
  var next = source.indexOf('\n',pos);
  if(next==-1)next=source.length-1;
  return source.substring(prev+1,next);
}

var lineOffset = 0; 

function printError(str){
  if(!str.match(/(^warning: )|(^message: )/)){
    linebreaks.errors = true;
  }
  var r = getLineNumber2(pointer);
  console.error(`${r[2]}:${r[0]}:${r[1]+1}: ${str}`);
  if(doPrintLineString){
    console.error("└─>"+getLineString(pointer));
  }
}

function escapedCharToNumber(){
  if(h(0) == '"'){
    return "22";
  }else if(h(0) == 'x'){
    var str = h(1)+h(2);
    pointer += 2;
    if(str.match(/[^A-Fa-f0-9]/)){
      printError("invalid hex escape sequence");
      return -1;
    }else{
      return str;
    }
  }else if(h(0) == '0'){
    return "00";
  }else if(h(0) == 't'){
    return "09";
  }else if(h(0) == 'n'){
    return "0a";
  }else if(h(0) == 'r'){
    return "0d";
  }else if(h(0) == "e"){
    return "1b";
  }else if(h(0) == '"'){
    return "22";
  }else if(h(0) == "'"){
    return "27";
  }else if(h(0) == "\\"){
    return "5c";
  }else{
    printError("invalid escape sequence");
    return -1;
  }
}

function identifierMatch(bool=false){
  var help = h;

  if(bool&&help(0)=='0'&&"xXoOdDbB".includes(help(1))){
    var str = help(0);
    for (var i = 1;i+pointer < source.length; i++) {
      if(help(i).match(/[a-zA-Z_$0-9]/)){
        str += help(i);
      }else break;
    }
    pointer += str.length-1;
    result += str.substring(0,str.length-1);
    return "";
  }

  if(help(0).match(/[a-zA-Z_$]/)){
    if(help(-1).match(/[a-zA-Z_$]/)){
      console.error(`pointer:${pointer}{{`+source.substr(Math.max(pointer-10,0),20)+"}}");
      throw "split identifier";
    }

    var str = help(0);
    for (var i = 1;i+pointer < source.length; i++) {
      if(help(i).match(/[a-zA-Z_$0-9]/)){
        str += help(i);
      }else break;
    }
    if(help(-1).match(/[0-9]/)){
      printError(`warning: invalid suffix "${str}" on integer constant`);
    }
    return str;
  }else{
    return "";
  }
}

function state_comment_block(){
  if(h(0)=='\n'){
    result += '\n';
    return true;
  }
  if(h(0)=="/"&&h(1)=="*"){
    printError("warning: this preprocessor dose not support recursive comments");
  }
  if(h(0)=="*"&&h(1)=="/"){
    pointer++;
    functionStack.pop();
    return false;
  }
  return true;
}

function state_comment_line(){
  if(h(0)=="\n"){
    pointer--;
    functionStack.pop();
    return false;
  }
  return true;
}

function state_string_escaped(){
  result += escapedCharToNumber();
  functionStack.pop();
  return false;
}

function state_string(){
  if(h(0) == '\n'){
    printError("unclosed string");
    result += "\"\n";
    functionStack.pop();
    return false;
  }
  if(h(0) == '\\'){
    functionStack.push(state_string_escaped);
    return false;
  }
  if(h(0) == '"'){
    result += h(0);
    functionStack.pop();
    return false;
  }
  result += tohex(parseEncoding(h(0)),2);
  return true;
}

function state_char_escaped(){
  result += "0x"+escapedCharToNumber();
  functionStack.pop();
  return false;
}

function state_char(){
  _state_char_counter++;
  if(h(0) == "'"){
    functionStack.pop();
    return false;
  }
  if(_state_char_counter==2){
    printError("char too long");
    for (;pointer < source.length; pointer++) {
      if(h(0)=="'"||h(0)=='\n')break;
    }
    functionStack.pop();
    return false;
  }
  if(h(0) == '\\'){
    functionStack.push(state_char_escaped);
    return false;
  }
  if(h(0) == '\n'){
    printError("unclosed char");
    result += "0\n";
    functionStack.pop();
    return false;
  } 
  result += "0x"+tohex(parseEncoding(h(0)),2);
  return true;
}

function state_main(){
  if(!isasm && h(0) == "/" && h(1) == "/"){
    pointer++;
    functionStack.push(state_comment_line);
    return false;
  }
  if(isasm && h(0) == ";"){
    functionStack.push(state_comment_line);
    return false;
  }
  if(!isasm && h(0) == "/" && h(1) == "*"){
    pointer++;
    functionStack.push(state_comment_block);
    return false;
  }
  if(h(0) == '"'){
    result += h(0)+"0x";
    functionStack.push(state_string);
    return false;
  }
  if(h(0) == "'"){
    _state_char_counter = 0;
    functionStack.push(state_char);
    return false;
  }
  result += h(0);
  return true;
}

function mainClean(){
  result = result.replace(/[ \t]+/g," ");
  result = result.replace(/( )*\n( )*/g,"\n");
  result = result.replace(/^( )*/g,"");
  result = result.replace(/( )*$/g,"");
}

function main(){
  var oldsource = source;
  var oldpointer = pointer;
  var oldresult = result;
  result = "";
  var oldstack = functionStack;
  functionStack = [state_main];

  filename = path.resolve(filename);

  if(!fs.existsSync(filename)){
    source = "";
    printError(`file "${filename}" dose not exist`);
  }else{
    source = fs.readFileSync(filename).toString();
  }
  source = source.replace(/\r/g,"");
  if(source[source.length-1]!='\n')source += '\n';

  for (pointer = 0; pointer < source.length; pointer++) {
    functionStack[functionStack.length-1]();
    //result += source[pointer];
  }

  if(!isAscii(result)){
    pointer = isAsciiResult;
    printError("code contains non ascii characters");
    //console.log('{"errors":true}');
    //return "";
    result = "";
  }

  mainClean();

  var r = result;
  source = oldsource;
  pointer = oldpointer;
  result = oldresult;
  functionStack = oldstack;
  includedFiles.push(filename);
  return r;
}

function findNextDirective(){
  var match = source.substr(pointer).match(/((\n|^)( )*#( )*)([\{\]]|([A-Za-z_$][A-Za-z_$0-9]*))/);
  var ind = match[1].length+match.index+pointer;
  var name = match[5];
  pointer = ind+name.length;
  var str;
  if(name=="{"){
    while(h(0)==" ")pointer++;
    name = identifierMatch();
    var argendind = bracketLookup("#{","#}",1);
    pointer += name.length;
    str = source.substring(pointer,argendind);
    pointer = argendind+2;
    var numlines = str.split("\n").length-1;
    result += "\n".repeat(numlines);
  }else if(name=="]"){
    var frame = envStack.pop();
    environment = frame[0];
    var line = getLineNumber(pointer)[0];
    //console.log(`{{${line}-${frame[1]}}}`);
    var diff = line-frame[1];
    lineOffset -= diff;
    envStack.map(e=>e[1]+=diff);
    filename = frame[6];
    if(doRemoveNewlines){
      var newres = result.substr(frame[3]).replace(/\n/g," ");
      result = result.splice(frame[3],newres.length,newres);
    }else{
      var rline = getLineNumberRes();
      linebreaks[rline+1] = {name:filename,line:frame[5]+1};
    }
    return;
  }else{
    var t = source.indexOf("\n",pointer);
    str = source.substring(pointer,t);
    pointer = t;
  }
  str = str.replace(/^( )*/,'');
  var dir = directiveRom[name];
  if(dir==undefined){
    printError("invalid directive");
    return;
  }
  dir(str,ind);
  //console.log(str);
}

var _state_main_is_first = true;

function replacer_state_main(){
  if(h(0) == "#"&&_state_main_is_first){
    _state_main_is_first = false;
    findNextDirective();
    pointer--;
    return false;
  }
  if(h(0) == "\n")_state_main_is_first = true;
  if(h(0).match(/\S/))_state_main_is_first = false;
  var str = identifierMatch(true);
  if(str.length){
    var prevpointer = pointer; 
    pointer += str.length-1;
    var val = environment[str];
    if(val === undefined){
      result += str;
    }else if(val.str&&!val.args){
      pointer = prevpointer;
      var tval = val.str;
      if(tval.indexOf("\n")!=-1){
        var line = getLineNumber(pointer)[0];
        var line2 = getLineNumber2(pointer)[0]-1;
        envStack.push([environment,line,prevpointer,result.length,val.line,line2,filename]);
        tval += "\n#]";
        var rline = getLineNumberRes();
        linebreaks[rline+1] = {name:filename,line:val.line+1};
      }
      pushToSource(tval,str.length);
      //console.log(`{{${source.substr(pointer,10)}}}`);
    }else{
      if(h(1)!="("){
        printError("missing argument list:"+h(1));
        return true;
      }
      var argendind = bracketLookup();
      var argstr = source.substring(pointer+2,argendind);
      var argarr = argstr.split(',');
      if(argstr=="")argarr = [];
      if(argarr.length!=val.args.length){
        if(argarr.length>val.args.length)
          printError(`macro "${str}" passed ${argarr.length} arguments, but takes just ${val.args.length}`);
        if(argarr.length<val.args.length)
          printError(`macro "${str}" requires ${val.args.length} arguments, but only ${argarr.length} given`);
        return true;
      }
      var oldenv = environment;//Object.assign({},environment);
      var line = getLineNumber(pointer)[0];
      var line2 = getLineNumber2(pointer)[0]-1;
      envStack.push([oldenv,line,prevpointer,result.length,val.line,line2,filename]);
      var strcopy = val.str;
      for (var i = 0; i < argarr.length; i++) {
        //environment[val.args[i]] = argarr[i];
        strcopy = strcopy.replace(new RegExp("\\b"+val.args[i]+"\\b","g"),argarr[i]);
      }
      var rline = getLineNumberRes();
      linebreaks[rline+1] = {name:filename,line:val.line+1};

      pointer = prevpointer;
      pushToSource(strcopy+"\n#]",str.length+argstr.length+2);
    }
    return true;
  }
  result += h(0);
  return true;
}

function replacer(){
  pointer = 0;
  source = result;
  result = "";
  functionStack = [replacer_state_main];
  linebreaks = {1:{name:filename,line:1},errors:false};

  for (pointer = 0; pointer < source.length; pointer++) {
    functionStack[functionStack.length-1]();
  }

  var keys = Object.keys(linebreaks).filter(e=>!isNaN(e)).map(e=>parseInt(e));
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    linebreaks[k].sname = simpleFilename(linebreaks[k].name);
  }

  mainClean();
}

var isasm = false;
const doRemoveNewlines = false;
const doPrintLineString = true;

var last_if_result = undefined;//for the #else directive

var pathToLibFolder = path.resolve(__dirname,"./lib");
var filename = "examples/pre_test.crtc";
var outputFilename = undefined;
parseArgv(process.argv,argvRom);

var pointer;
var result;
var functionStack;

var envStack = [];//[environment,line,pointer,result.length,val.line,line2,filename]
var environment = {};
var linebreaks = {};
var includedFiles = [];

var source;

result = main();
var realsource = source;

if(result == ""){
  result = '{"errors":true}';
}else{
  replacer();
  result = JSON.stringify(linebreaks)+"\n"+result;
}

console.log(result);

if(outputFilename){
  fs.writeFileSync(outputFilename,result);
}
