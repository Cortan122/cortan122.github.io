const fs = require('fs');
const vm = require('vm');
const path = require('path');
const lexer = require('./lexer.js');
const printError = require('./printError.js');

/**@type {PreprocessorOptions} */
const defaultOptions = {
  keepNewlines:true,
  headerFilePath:[path.join(__dirname,'../compiler/lib')],
};
var options = defaultOptions;

/**@type {Object.<string,(arr:Token[],i:number,env:PreprocessorEnvironment,bool?:boolean)=>{i?:number,r?:Token[]}|void>} */
const directiveRom = {
  "define":(arr,i,env)=>{
    //todo: # ...
    var line = getLine(arr,i+1);
    if(line.length == 0){
      printError("error: no macro name given in #define directive",arr[i+1]);
      return {i:line.length};
    }
    if(line[0].type != "identifier"){
      printError("error: macro names must be identifiers",line[0]);
      return {i:line.length};
    }
    var name = line[0].string;
    var args = null;
    var text = line.slice(1);
    if(line.length > 1 && line[1].string == '(' && line[1].loc.start.index == line[0].loc.end.index+1){
      args = [];
      var bool = true;
      for(var i = 2; i < line.length; i++){
        var e = line[i];
        if(e.string == ')')break;
        if(e.string == ','){
          bool = true;
        }else{
          if(e.type == "identifier"){
            if(!bool){
              printError(`error: macro parameters must be comma-separated`,e);
              return {i:line.length};
            }
            if(args.includes(e.string)){
              printError(`error: duplicate macro parameter "${e.string}"`,e);
              return {i:line.length};
            }
            args.push(e.string);
          }else{
            printError(`error: "${e.string}" may not appear in macro parameter list`,e);
            return {i:line.length};
          }
          bool = false;
        }
      }
      text = line.slice(i+1);
    }
    if(env[name]){
      printError(`warning: "${name}" redefined`,line[0]);
    }
    env[name] = {args,text};
    return {i:line.length};
  },
  "include":(arr,i,env)=>{
    var line = getLine(arr,i+1);
    var types = line.map(e=>e.type=="operator"?e.string:e.type).join(' ');
    var name = '';
    if(types=="string"){
      name = path.resolve(env.__FILE__,'..',line[0].string.slice(1,-1));
      if(!fs.existsSync(name)){
        printError(`error: ${line[0].string}:No such file or directory`,arr[i+1]);
        return {i:line.length};
      }
    }else if(types[0]=='<' && types[types.length-1]=='>'){
      name = lexer.untokenize(line).slice(1,-1);//todo: fixme: get raw code
      for(let pathToLibFolder of options.headerFilePath){
        let t = path.resolve(pathToLibFolder,name);
        if(fs.existsSync(t)){
          name = t;
          break;
        }
      }
      if(!fs.existsSync(name)){
        printError(`error: <${name}>:No such file or directory`,arr[i+1]);
        return {i:line.length};
      }
    }else{
      printError(`error: #include expects "FILENAME" or <FILENAME>`,arr[i+1]);
      return {i:line.length};
    }
    return {i:line.length,r:include(name,env,line[0])};
  },
  "if":(arr,i,env,bool)=>{
    var line = getLine(arr,i+1);
    var newline = [];
    for(let i1 = 0; i1 < line.length; i1++){
      var e = line[i1];
      if(e.type=="identifier" && e.string=="defined"){
        var t = line[++i1];
        if(t && t.type=="identifier"){
          newline.push({...t,string:`${t.string in env}`});
        }else if(t && t.string=="("){
          var t2 = line[++i1];
          if(t2.type!="identifier"){
            printError(`error: operator "defined" requires an identifier`,arr[i+1+i1]);
            return {i:line.length};
          }
          newline.push({...t2,string:`${t2.string in env}`});
          var t3 = line[++i1];
          if(t3.string!=")"){
            printError(`error: missing ')' after "defined"`,arr[i+1+i1]);
            return {i:line.length};
          }
        }else{
          printError(`error: operator "defined" requires an identifier`,arr[i+1+i1]);
          return {i:line.length};
        }
      }else{
        newline.push(e);
      }
    }
    newline = main(newline,env,false);
    if(bool===undefined)bool = true;
    try{
      bool = vm.runInNewContext(lexer.untokenize(newline),{},{"displayErrors":false}) && bool;//todo
    }catch(e){
      printError(`error: ${e.message}`,arr[i+1]);//todo
      return {i:line.length};
    }
    return endifDirectiveHelper(arr,i,env,bool,line);
  },
  "endif":(arr,i,env,bool)=>{
    var line = getLine(arr,i+1);
    if(bool === undefined){
      printError(`error: #${arr[i].string} without #if`,arr[i]);
      return {i:line.length};
    }
    if(line.length){
      printError(`warning: extra tokens at end of #${arr[i].string} directive`,arr[i+1]);
      // return {i:line.length};
    }
    if(arr[i].string!="endif")return endifDirectiveHelper(arr,i,env,bool,line);
    return {i:line.length};
  },
  "ifdef":(arr,i,env,bool)=>{
    var line = getLine(arr,i+1);
    if(line.length==0){
      printError(`error: no macro name given in #${arr[i].string} directive`,arr[i+1]);
      return {i:line.length};
    }else if(line.length>1){
      printError(`warning: extra tokens at end of #${arr[i].string} directive`,arr[i+2]);
      // return {i:line.length};
    }
    if(line[0].type!="identifier"){
      printError(`error: macro names must be identifiers`,arr[i+1]);
      return {i:line.length};
    }
    if(bool===undefined)bool = true;
    var t = line[0].string in env;
    if(arr[i].string.endsWith('ndef'))t = !t;
    bool = t && bool;
    return endifDirectiveHelper(arr,i,env,bool,line);
  },
  "message":(arr,i,env)=>{
    var line = getLine(arr,i+1);
    printError(`${arr[i].string}: ${lexer.untokenize(line)}`,arr[i]);
    return {i:line.length};
  },
  "undefine":(arr,i,env)=>{
    var line = getLine(arr,i+1);
    if(line.length == 0){
      printError(`error: no macro name given in #${arr[i]} directive`,arr[i+1]);
      return {i:line.length};
    }
    if(line[0].type != "identifier"){
      printError("error: macro names must be identifiers",line[0]);
      return {i:line.length};
    }
    if(line.length>1){
      printError(`warning: extra tokens at end of #${arr[i].string} directive`,arr[i+2]);
      // return {i:line.length};
    }
    delete env[line[0].string];
    return {i:line.length};
  },
};

const ifDirectives = ['if','ifdef','ifndef'];
const elseDirectives = ['else',...ifDirectives.map(e=>'else'+e),...ifDirectives.map(e=>'el'+e)];
ifDirectives.push(...elseDirectives);
const endifDirectives = ['endif',...elseDirectives];
for(let e of elseDirectives){
  directiveRom[e] = directiveRom["endif"];
}
directiveRom["ifndef"] = directiveRom["ifdef"];
directiveRom["error"] = directiveRom["warning"] = directiveRom["message"];
directiveRom["undef"] = directiveRom["undefine"];

/**
 * @param {Token[]} arr
 * @param {number} i
 * @param {PreprocessorEnvironment} env
 * @param {boolean} bool
 * @param {Token[]} line
 * @returns {{i?:number,r?:Token[]}}
 */
function endifDirectiveHelper(arr,i,env,bool,line){
  var next = endifDirectiveLookup(arr,i+line.length+1);
  if(next==-1){
    printError(`error: unterminated #${arr[i].string}`,arr[i]);
    return {i:line.length};
  }
  var slice = arr.slice(i+line.length+1,next-2);
  var r = {i:next-i,r:[]};
  if(bool){
    r.r = main(slice,env);
  }
  var nextString = arr[next].string;

  let t = nextString.replace('elseif','if').replace('elif','if');
  let tr = directiveRom[t](arr,next,env,!bool);
  if(tr){
    r.i += tr.i;
    if(tr.r)r.r.push(...tr.r);
  }

  return r;
}

/**
 * @param {Token[]} tokens
 * @param {number} i
 */
function endifDirectiveLookup(tokens,i){
  var isNewline = true;
  var level = 1;
  for(; i < tokens.length; i++){
    var e = tokens[i];
    if(e.type=="newline"){
      isNewline = true;
    }else{
      if(e.type=="operator" && e.string=="#" && isNewline){
        var next = tokens[++i];
        if(next == undefined || next.type == "newline"){
          isNewline = false;
          continue;
        }
        let t = next.string;
        if(endifDirectives.includes(t)){
          level--;
          if(level==0){
            return i;
          }
        }
        if(ifDirectives.includes(t)){
          level++;
        }
      }
      isNewline = false;
    }
  }
  return -1;
}

/**
 * @param {string} str
 */
function escapeString(str){
  return '"'+str.replace(/[\\'"]/g, "\\$&")+'"';
}

/**
 * @param {Token[]} tokens
 * @param {(string:string,token:Token)=>void} err
 */
function separatedBracketLookup(tokens,err=(a,b)=>{},op='(',ed=')',sep=',',start=0,level=0){
  var errIndex = -1;
  var r = [];
  var temp = [];
  for(var i = start; i < tokens.length; i++){
    var b = tokens[i].string;
    if(level != 0){
      if(b == sep && level == 1){
        r.push(temp);
        temp = [];
      }else if(b!=ed || level!=1){
        temp.push(tokens[i]);
      }
    }
    if(b==op){
      level++;
      errIndex = i;
    }else if(b==ed){
      level--;
      if(level==0){
        if(temp.length)r.push(temp);
        return {r,i};
      }
    }
  }
  err(`error: no '${ed}' was found to match this '${op}'`,tokens[errIndex]);
  return null;
}

/**
 * @param {Token[]} tokens
 * @param {number} i
 */
function getLine(tokens,i){
  var r = [];
  for(; i < tokens.length; i++){
    var e = tokens[i];
    if(e.type == "newline"){
      break;
    }else{
      r.push(e);
    }
  }
  return r;
}

/**
 * @param {Token[]} r
 * @param {Token} stack
 */
function assignIncludeStack(r,stack){
  if(stack){
    return r.map(e=>{
      if(e.includeStack)return {...e,includeStack:stack};
      e.includeStack = stack;
      return e;
    });
  }
  return r;
}

/**
 * @param {Token[]} tokens
 * @param {PreprocessorEnvironment} env
 * @returns {Token[]}
 */
function main(tokens,env={},allowDirectivesOnFirstLine=true){
  var r = [];
  var isNewline = allowDirectivesOnFirstLine;
  for(var i = 0; i < tokens.length; i++){
    var e = tokens[i];
    if(e.type=="newline"){
      if(options.keepNewlines)r.push(e);
      isNewline = true;
    }else{
      if(e.type=="operator" && e.string=="#" && isNewline){
        var next = tokens[++i];
        if(next == undefined || next.type == "newline"){
          isNewline = false;
          continue;
        }
        let t = directiveRom[next.string];
        if(!t){
          printError(`error: invalid preprocessing directive #${next.string}`,next);
          isNewline = false;
          continue;
        }
        var res = t(tokens,i,env);
        if(res&&res.r)r.push(...res.r);
        if(res&&res.i)i += res.i;
      }else if(e.type=="identifier"){
        let t = env[e.string];
        if(!t){
          r.push(e);
        }else if(typeof t == "string"){
          /**@type {Token} */
          let token = {type:"string",loc:e.loc,string:escapeString(t),value:Buffer.from(t)};
          r.push(token);
        }else{
          var newEnv = Object.assign({},env);
          delete newEnv[e.string];//this disallows recursive macros
          if(t.args){
            if(tokens[i+1].string != '('){
              r.push(e);
              isNewline = false;
              continue;
            }
            var bl = separatedBracketLookup(tokens,printError,'(',')',',',i);
            i = bl.i;
            if(bl.r.length != t.args.length){
              let str = '';
              if(bl.r.length < t.args.length){
                str = `error: macro "${e.string}" requires ${t.args.length} arguments, but only ${bl.r.length} given`;
              }else{
                str = `error: macro "${e.string}" passed ${bl.r.length} arguments, but takes just ${t.args.length}`;
              }
              printError(str,tokens[i]);
              isNewline = false;
              continue;
            }
            for(let i = 0; i < bl.r.length; i++){
              newEnv[t.args[i]] = {text:main(bl.r[i],env,false),eval:true};
            }
          }
          newEnv.__includeStack__я = e;
          if(t.eval){
            r.push(...assignIncludeStack(t.text,newEnv.__includeStack__я));
          }else{
            r.push(...main(t.text,newEnv,false));
          }
        }
      }else{
        r.push(e);
      }
      isNewline = false;
    }
  }
  return assignIncludeStack(r,env.__includeStack__я);
}

/**
 * @param {Token[]} tokens
 */
function stage2(tokens){
  var r = [];
  for(var i = 0; i < tokens.length; i++){
    var e = tokens[i];
    if(e.type=="string"){
      var arr = [e.value];
      let t = tokens[i+1];
      while(tokens[i+1] && t.type=="string"){
        arr.push(t.value);
        e.string += ' '+t.string;
        i++;
        t = tokens[i+1];
      }
      // @ts-ignore
      e.value = Buffer.concat(arr);
    }else if(e.type=="identifier"){
      while(tokens[i+1] && tokens[i+1].string=="##"){
        if(tokens[i+2] && (tokens[i+2].type=="identifier" || tokens[i+2].type=="number") ){
          e.string += tokens[i+2].string;
          i += 2;
        }else{
          printError(`error: stray '##' in program`,tokens[i+1]);
          i += 1;
        }
      }
    }else if(e.string=="##"){
      printError(`error: stray '##' in program`,e);
    }
    r.push(e);
  }
  return r;
}

/**
 * @param {Token[]} tokens
 * @param {PreprocessorOptions} Options
 */
function preprocess(tokens,Options=null){
  if(Options)options = Object.assign({},defaultOptions,Options);
  printError.push("preprocessor");
  var r = main(tokens);
  r = stage2(r);
  printError.pulse();
  return r;
}

/**
 * @param {string} name
 */
function simplifyFilename(name){
  //this is not canonical behavior

  var f = name;
  var t = path.relative(process.cwd(),name);
  if(t.length<f.length)f = t;
  for(let pathToLibFolder of options.headerFilePath){
    t = path.relative(pathToLibFolder,name);
    if(t.length<f.length && !t.startsWith('..'))f = `<${t}>`;
  }

  f = f.replace(/\\/g,'/');//for windows

  return f;
}

/**
 * @param {string|0} name
 * @param {PreprocessorEnvironment=} env
 * @param {Token=} includeStack
 */
function include(name,env={},includeStack=undefined){
  var code = fs.readFileSync(name,'utf-8');
  var opt = lexer.getOptions();
  var prevName = opt.filename;
  opt.filename = name==0?"stdin":simplifyFilename(name);
  var r = lexer.tokenize(code,opt);
  opt.filename = prevName;
  lexer.tokenize('',opt);
  var newEnv = Object.assign({},env);
  newEnv.__FILE__ = name==0?"stdin":path.resolve(name).replace(/\\/g,'/');
  if(includeStack)newEnv.__includeStack__я = includeStack;
  return main(r,newEnv);
}

/**
 * @param {PreprocessorOptions} Options
 */
function setOptions(Options){
  options = Object.assign({},defaultOptions,Options);
}

function getOptions(){
  return options;
}

/**
 * @param {string|0} name
 * @param {PreprocessorOptions} Options
 */
function preprocessFile(name,Options=null){
  if(Options)options = Object.assign({},defaultOptions,Options);
  printError.push("preprocessor");
  var r = include(name);
  r = stage2(r);
  printError.pulse();
  return r;
}

/**
 * @param {(string|0)[]} filenames
 * @param {PreprocessorOptions} options
 * @returns {Token[]}
 */
function preprocessFiles(filenames,options=null){
  var t = filenames.map(e=>preprocessFile(e,options));
  var r = [].concat(...t);
  return r;
}

module.exports = {preprocess,preprocessFile,preprocessFiles,getOptions,setOptions};

// @ts-ignore
if(require.main == module){
  let preprocessor = module.exports;
  lexer.setOptions({comments:false});
  let r = preprocessor.preprocessFile('../compiler/examples/pre2_test.crtc',{});
  console.log(lexer.untokenize(r));
  // console.dir(r,{"depth":null});
}
