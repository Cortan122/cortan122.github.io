const printer = require('./printer.js');
const tokenParser = require('./token.js');
const util = require('util');
const { min,max,abs } = Math;

const instrucrionRom = {
  '+':['call add_to_ax',2],
  '-':['call sub_to_ax',2],
  '|':['call or_to_ax',2],
  '&':['call and_to_ax',2],
  '^':['call xor_to_ax',2],
  '=':t=>{
    var v1 = expressionToAsm(t.p1);
    if(v1.length)throw 'printError';//todo:index
    var v2 = expressionToAsm(t.p2);
    result = [...v2,`mov ${v1.v} ${v2.v}`];
    result.v = v1.v;//or v2.v?
    return result;
  },
  'return':t=>{
    if(!t.p1)return ['leave'];
    var v1 = expressionToAsm(t.p1);
    return [`mov ax ${v1.v}`,'leave'];
  }
};

var variableStack;

function printError(str,pointer){
  printer.print(str,pointer);
}

function redefinitionError(token1,token2){
  var name = token1.name;
  printError(`attempted redeclaration of '${name}'`,token2.pointer);
  printError(`note: previous declaration of '${name}' was here`,token1.pointer);
}

function getVar(name){
  for(var i = variableStack.length-1;i >= 0;i--){
    var frame = variableStack[i];
    var v = frame[name];
    if(v)return v;
  }
  return undefined;
}

function addVar(token){
  var last = variableStack.length-1;
  var lastf = variableStack[last];
  var name = token.name;
  var token1;
  if(token1 = lastf[name]){
    redefinitionError(token1,token);
    return false;
  }
  lastf[name] = token;
  token.stackLevel = last;
}

function mangleName(name,bool=false){
  name = name.replace(/\$/g,'$$');
  name = name.replace(/_/g,'$_');
  if(bool)return name;
  return `_u${name}`;
}

function getScopedName(payload,payload1){
  var fname = mangleName(variableStack.func.name,true);//todo:c++
  if(payload1)payload += mangleName(payload1,true);
  return `__${fname}_${payload}`;
}

function getVariableAddress(length){
  var f = variableStack.func;
  var num = f.val-(length==1);
  f.val += length;
  f.max = max(f.val,f.max);
  if(num==-1)num = 'm1';
  var name = getScopedName(`var_${num}`);
  return `[sp+${name}]`;
}

function toInt(str){
  if(!str)return 0;
  if(str[0]!='0')str = '0d'+str;
  return str;
}

function isConst(type){
  //todo
  return false;
}

function getVarLength(type){
  return type.typetype=='int8'?1:2;
}

function initToNum(token){
  if(!token.init)return 0;
  if(typeof token.init == 'string')return token.init;
  var r = expressionToAsm(token.init);
  if(r.length)throw 'idk';
  if(!r.v)throw 'idk';
  if(!r.v.match(/^0?[xbdo]?[0-9a-f]+$/i))throw 'idk'+r.v;
  return r.v;
}

function globalVarHelper(f,token){
  var t = mangleName(token.name);
  token.address = `[${t}]`;
  f([`${t}:`]);
  f([`${['','.byte','.word'][getVarLength(token.vartype)]} ${initToNum(token)}`]);
}

function globalArrayHelper(f,token){
  //todo
  var name = '_a'+mangleName(token.name,true);
  f([`${name}:`]);
  var word = ['','.byte','.word'][getVarLength(token.vartype.target)];
  var length = token.vartype.length;
  if(typeof length != 'number'){
    //todo
    length = pasrseInt(length.string);
  }
  var init = [];
  if(token.init)init = token.init.list;
  for (var i = 0; i < length; i++) {
    var t = 0;
    if(init[i]!=undefined)t = initToNum({init:init[i]});
    f([`${word} ${t}`]);
  }
  if(token.vartype.const){
    token.address = name;
  }else{
    token.init = name;
    globalVarHelper(f,token);
  }
}

function expressionToAsm(token){
  var result = [];
  if(token.type=='number'){
    result.v = toInt(token.string);
    return result;
  }else if(token.type=='identifier'){
    result.v = getVar(token.string).address;
    return result;
  }
  var entry = instrucrionRom[token.string];
  if(!entry){
  }else if(entry instanceof Function){
    return entry(token);
  }else if(entry[1]==2){
    var v1 = expressionToAsm(token.p2);
    var v2 = expressionToAsm(token.p1);
    result = [...v1,`mov ax ${v1.v}`,'mov [sp-4] ax',...v2,`mov ax ${v2.v}`,entry[0]];
    result.v = 'ax';
    return result;
  }
  throw `todo:${util.inspect(token)}`;
  return result;
}

function codeToAsm(tokens){
  var result = [];
  // var resultFrame = {};
  variableStack.push({});
  var f = a=>{if(a)result = result.concat(a);return a;};
  for(var i = 0;i<tokens.length;i++){
    var token = tokens[i];
    if(token.type=='var'){
      f(addVar(token));
      if(token.vartype=='label'){
        token.address = getScopedName('label_',token.name);
        result.push(`${token.address}:`);
        continue;
      }else if(!isConst(token.vartype)){
        token.address = getVariableAddress(getVarLength(token.vartype));
        if(token.init){
          var t = {type:'identifier',string:token.name};
          f(expressionToAsm({type:'operator',string:'=',p1:t,p2:token.init}));
        }
      }else{
        //todo:check for pointers
        token.address = initToNum(token.init);
      }
    }else if(token.type=='operator'){
      f(expressionToAsm(token));
    }
  }
  // throw 'todo';
  // Object.assign(resultFrame,variableStack.pop());
  // result.frame = resultFrame;
  return result;
}

function funcToAsm(token){
  var name = token.header.name;
  var mname = mangleName(name);
  var st = variableStack.func = {max:0,val:0,name};
  var acode = codeToAsm(token.code);
  var r1 = [`${mname}:`,`enter ${st.max}`];
  var r2 = ['leave'];
  for (var i = 0; i < st.max-1; i++) {
    var t = getScopedName(`var_${i}`);
    r2.push(`.define ${t} 0d${st.max-i}`);
  }
  var t = getScopedName(`var_m1`);
  r2.push(`.define ${t} 0d${st.max+1}`);
  return r1.concat(acode,r2);
}

function toAsm(tokens){
  var result = [];
  var f = a=>{if(a)result = result.concat(a);return a;};
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    if(token.type=='var'){
      f(addVar(token));
      if(token.vartype.typetype=='pointer'){
        if(token.init.list){
          token.vartype.length = token.init.list.length;
          globalArrayHelper(f,token);
          continue;
        }
        if(token.vartype.const){
          token.address = initToNum(token.init);
        }
      }else if(token.vartype.typetype=='array'){
        globalArrayHelper(f,token);
      }else if(!isConst(token.vartype)){
        globalVarHelper(f,token);
      }else{
        token.address = initToNum(token.init);
      }
    }else if(token.type=='header'){
      f(addVar(token));
    }else if(token.type=='funccode'){
      //todo: check if already defined header
      if(f(addVar(token.header))===false)continue;
      f(funcToAsm(token));
    }
  }
  return result;
}

function main(code){
  var tokenTree = tokenParser.main(code);
  variableStack = [{}];
  var asm = toAsm(tokenTree);
  // console.log(util.inspect(tokenTree,{depth:null}));
  console.log(asm.join('\n'));
}

tokenParser.printError = printError;
printer.doPrintLinePos = true;
printer.init(main,["examples/test.crtc"]);
