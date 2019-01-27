const printer = require('./printer.js');
const tokenParser = require('./token.js');
const util = require('util');
const fs = require('fs');
const cp = require('child_process');
const { min,max,abs } = Math;

const legalRegisters = ["ip","pc","ax","ex","eax","ah","al","fl","flags","b","bl","bx","c","cl","cx","sp"];

const instructionRom = {
  '+':['call add_to_ax',2],
  '-':['call sub_to_ax',2],
  '|':['call or_to_ax',2],
  '&':['call and_to_ax',2],
  '||':['call or_to_ax',2], //temp
  '&&':['call and_to_ax',2], //temp
  '^':['call xor_to_ax',2],
  '*':['call mult_to_ax',2],
  '/':['call div_to_ax',2],
  '%':['call mod_to_ax',2],
  '==':['call equal_to_ax',2],
  '!=':['call not_equal_to_ax',2],
  '<<':token=>{
    var result = functionCallHelper([token.p1,'ax'],[token.p2,'bl']);
    result.push('bsh ax bl');
    result.v = 'ax';
    return result;
  },
  '>>':token=>{
    var result = functionCallHelper([token.p1,'ax'],[token.p2,'bl']);
    result.push('push ax','mov ax bl','call negate_ax','mov bl ax','pop ax','bsh ax bl');
    result.v = 'ax';
    return result;
  },
  '=':t=>{
    const movToAx = movToAx_operatorHelper;

    var result = [];
    var v1 = expressionToAsm(t.p1);
    var v2 = expressionToAsm(t.p2);
    if(!v1.l)v1.l = 2;
    if(!v2.l)v2.l = 2;
    if(v1.length){
      if(v1.l==1){
        result = [...v2,`mov bl ${v2.v}`,...v1,`mov ${v1.v} bl`];//todo:unsafe (kinda)
        result.v = 'bl';
      }else{
        result = [...v2,`mov [sp-4] ${v2.v}`,...v1,`call write_to_ax`];//todo:unsafe
        result.v = 'ax';
      }
    }else if(legalRegisters.includes(v1.v) && legalRegisters.includes(v2.v)){
      result = [...v2,`mov ${v1.v} ${v2.v}`];
      result.v = v1.v;
    }else if(v1.v=='ax'){
      result = movToAx(v2,min(v1.l,v2.l));
    }else if(v2.v=='ax'){
      result = [...v2,`mov ${v1.v} ${v1.l==1?'al':'ax'}`];
      result.v = v2.v;
    }else if(legalRegisters.includes(v1.v) || legalRegisters.includes(v2.v)){
      result = [...v2,`mov ${v1.v} ${v2.v}`];
      result.v = legalRegisters.includes(v1.v)?v1.v:v2.v;
    }else{
      result = movToAx(v2);
      result.push(`mov ${v1.v} ${v1.l==1?'al':'ax'}`);
    }
    return result;
  },
  'return':t=>{
    const movToAx = movToAx_operatorHelper;
    if(!t.p1)return ['leave'];
    var v1 = expressionToAsm(t.p1);
    var r = movToAx(v1);
    r.push('leave');
    return r;
  },
  'index':token=>{
    var base = getVar(token.p1.string);
    var result = [];
    var t = (base.vartype||base.type);
    result.l = t.typetype=='pointer'?getVarLength(t.target):1;
    result.v = '[ax]';
    if(token.p2==undefined||token.p2.type=='number'){
      var str = token.p2?token.p2.string:'0';
      if(isConst_asm(base.address)){
        result.push(`mov ax ${base.address}+${toInt(str)}`);//+${toInt(str)}
        return result;
      }
      if(str=='0'){
        result.push(`mov ax ${base.address}`);
        return result;
      }
    }
    result.push(...functionCallHelper([token.p2,'[sp-4]'],[token.p1,'ax']));
    result.push(instructionRom['+'][0]);
    return result;
  },
  'call':t=>{
    var list = [];
    if(t.p2&&t.p2.type == 'punctuation')list = tokenParser.flattenPunctuationTree(t.p2);
    else list[0] = t.p2;
    
    list = list.filter(e=>e!=undefined);
    var result = [];
    if(list.length){
      result = functionCallHelper(...(list.map((e,i)=>{
        if(i==0)return [e,'ax'];
        return [e,`[sp-0d${2+2*i}]`];
      }).reverse()));
    }
    var v1 = expressionToAsm(t.p1);
    result.push(...v1,`call ${v1.v}`);
    result.v = 'ax';
    return result;
  },
  'asm':t=>{
    var r = t.asm.split(';');
    if(r[r.length-1]=='')r.length--;
    return r;
  },
  'if':(t,version='if')=>{
    variableStack.push({});
    var result = [];
    var v1 = expressionToAsm(t.p1);
    var i = (variableStack.func.labelCounter++);
    var ifLabel = getScopedName('if_', i.toString() );
    var endifLabel = getScopedName('endif_', i.toString() );
    result.push(`${ifLabel}:`,...v1,'test ax',`jz ${endifLabel}`);
    result.push(...codeToAsm(t.code));
    if(version!='if')result.push(`jmp ${ifLabel}`);
    result.push(`${endifLabel}:`);
    variableStack.pop();
    variableStack.func.lastIf = {i,version};
    return result;
  },
  'while':t=>{
    return instructionRom['if'](t,'while');
  },
  'else':t=>{
    variableStack.push({});
    var result = [];
    if(!variableStack.func.lastIf){
      printError("unexpected else",t.pointer);
      return [];
    }
    var i = variableStack.func.lastIf.i;
    var endifLabel = getScopedName('endif_', i.toString() );
    var endElseLabel = getScopedName('endElse_', i.toString() );
    result.push(...codeToAsm(t.code));
    result.push(`${endElseLabel}:`);
    variableStack.regrets[`${endifLabel}:`] = `jmp ${endElseLabel}\n${endifLabel}:`;
    variableStack.pop();
    return result;
  },
  'goto':t=>{
    const movToAx = movToAx_operatorHelper;
    if(!t.p1)printError("goto is not happy",t.pointer);
    var v1 = expressionToAsm(t.p1);
    var r = movToAx(v1);
    r.push(`jmp ax`);
    return r;
  },
};

var variableStack;

function movToAx_operatorHelper(v2,l=v2.l){
  var r = v2;
  if(!l)l = 2;
  r.push(`mov ${l==1?'al':'ax'} ${v2.v}`);
  if(l==1)r.push(`mov ah 0`);
  r.v = 'ax';
  return r;
}

function printError(str,pointer){
  printer.print(str,pointer);
}

function redefinitionError(token1,token2){
  var name = token1.name;
  printError(`attempted redeclaration of '${name}'`,token2.pointer);
  printError(`note: previous declaration of '${name}' was here`,token1.pointer);
}

function getVar(name){
  for(var i = variableStack.length-1 ;i >= 0; i--){
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

function variableStackPop(length,isUsed=true){
  // console.log(`variableStackPop(${length},${isUsed})`);
  var f = variableStack.func;
  if(isUsed){
    f.maxU = max(f.maxU,f.val);
  }
  if(!isUsed && f.val==f.max && f.val!=f.maxU){
    f.max -= length;
  }
  //todo: more !isUsed optimization
  f.val -= length;
}

function toInt(str){
  if(!str)return 0;
  if(str[0]!='0')str = '0d'+str;
  return str;
}

function isConst(type){
  return false;//todo
  if(!type.modifiers)return false;
  return type.modifiers.includes('const');
}

function isConst_asm(str){
  if(typeof str == 'number')return true;
  return (!str.match(/[\[\]]/))&&(!str.match('ax'));//todo
}

function getVarLength(type){
  return (type.typetype=='int8')?1:2;
}

function initToNum(token){
  if(!token.init)return 0;
  if(typeof token.init == 'string')return token.init;
  var r = expressionToAsm(token.init);
  if(r.length)throw 'idk';
  if(!r.v)throw 'idk';
  if(!r.v.match(/^0?[xbdo]?[0-9a-f]+$/i))return r.v;//throw 'idk'+r.v;
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
  var word = ['','  .byte','  .word'][getVarLength(token.vartype.target)];
  var length = token.vartype.length;
  if(typeof length != 'number'){
    //todo
    length = parseInt(length.string);
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

function functionCallHelper(...arr){
  function isReg(a){
    return legalRegisters.includes(a);
  }
  var result = [];
  // result.v = 'ax';
  if(arr.length==0)return result;
  if(arr.length==1){
    var prev = expressionToAsm(arr[0][0]);
    result.push(...prev);
    var tempAcc;
    if(!isReg(prev.v)){
      tempAcc = prev.l==2?'ax':'al';
      result.push(`mov ${tempAcc} ${prev.v}`);
      if(prev.l==1)result.push(`mov ah 0`);
    }else{
      tempAcc = prev.v;
    }
    result.push(`mov ${arr[0][1]} ${tempAcc}`);
    return result;
  }
  var popArr = [];

  var next;
  for(var i = 1; i < arr.length; i++){
    var prev = (next||expressionToAsm(arr[i-1][0]));
    if(!prev.l)prev.l = 2;
    result.push(...prev);
    var safeAddr = getVariableAddress(2);
    next = expressionToAsm(arr[i][0]);
    var safeAddrNeeded = next.map(e=>e.includes(`mov ${arr[i-1][1]}`)).reduce((a,e)=>a||e,false);
    if(!safeAddrNeeded){
      variableStackPop(2,false);
    }else{
      popArr.push([arr[i-1][1],safeAddr]);
    }
    var tempDest = safeAddrNeeded?safeAddr:arr[i-1][1];
    var tempAcc;
    if(!isReg(prev.v)){
      tempAcc = prev.l==2?'ax':'al';
      result.push(`mov ${tempAcc} ${prev.v}`);
      if(prev.l==1)result.push(`mov ah 0`);
    }else{
      tempAcc = prev.v;
    }
    result.push(`mov ${tempDest} ${/* tempAcc */'ax'}`);//todo: use length of tempDest
  }
  result.push(...next);

  var extraStack = (next.v=='ax'||next.v=='al'||next.v=='[ax]');
  if(popArr.length==0){
    if(!extraStack || next.v=='[ax]'){
      var t = arr[arr.length-1][1];
      if(t=='ax' && next.l==1){
        t = 'al';
      }
      result.push(`mov ${t} ${next.v}`);
      if(t=='al')result.push(`mov ah 0`);
    }
    return result;
  }
  if(extraStack){
    var safeAddr = getVariableAddress(2);
    result.push(`mov ${safeAddr} ax`);//ax, not next.v?
    popArr.push([arr[arr.length-1][1],safeAddr]);
  }
  var index = popArr.map(e=>e[0]=='ax'||e[0]=='al').indexOf(true);
  if(index != -1){
    var t = popArr[index];
    popArr[index] = popArr[popArr.length-1];
    popArr[popArr.length-1] = t;
  }

  for(let e of popArr){
    var [destAddr,safeAddr] = e;
    if(isReg(safeAddr)||isReg(destAddr)){
      result.push(`mov ${destAddr} ${safeAddr}`);
    }else{
      result.push(`mov ax ${safeAddr}`,`mov ${destAddr} ax`);
    }
  }

  if(!extraStack || next.v=='[ax]'){
    var t = arr[arr.length-1][1];
    if(t=='ax' && next.l==1){
      t = 'al';
    }
    result.push(`mov ${t} ${next.v}`);
    if(t=='al')result.push(`mov ah 0`);
  }
  for(let i = 0; i < popArr.length; i++)variableStackPop(2,true);
  return result;
}

function expressionToAsm(token){
  var result = [];
  result.l = 2;
  if(token==undefined){
    //this is bad
    result.v = '0';
    return result;
  }
  if(token.type=='number'){
    result.v = toInt(token.string);
    return result;
  }else if(token.type=='identifier'){
    var t = getVar(token.string);
    if(t==undefined){
      printError(`${token.string} is not defined`,token.pointer);
      result.v = 'ax';
      return result;
    }
    result.l = getVarLength(t.vartype||t.type);
    result.v = t.address;
    return result;
  }else if(token.type=='string'){
    var t = getScopedName('string_', (variableStack.func.labelCounter++).toString() );
    variableStack.regrets['; global strings'] += `\n${t}:${token.string.slice(1,-1)}00`;
    result.v = t;
    result.l = 2;
    return result;
  }
  var entry = instructionRom[token.string];
  if(!entry){
  }else if(entry instanceof Function){
    return entry(token);
  }else if(entry[1]==2){
    result = functionCallHelper([token.p2,'[sp-4]'],[token.p1,'ax']);
    result.push(entry[0]);
    result.v = 'ax';
    return result;
  }
  throw `todo:${util.inspect(token)}`;
  return result;
}

function codeToAsm(tokens){
  var result = [];
  // var resultFrame = {};
  // variableStack.push({});
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
  variableStack.push({});
  var name = token.header.name;
  var mName = mangleName(name);
  var st = variableStack.func = {max:0,maxU:0,val:0,name,labelCounter:0};
  var asmCode = [];
  for(var i = 0; i < token.header.args.length; i++){
    let arg = token.header.args[i];
    addVar(arg);
    if(i==0){
      arg.address = 'ax';
    }else{
      arg.address = getVariableAddress(getVarLength(arg.type));
    }
  }
  asmCode = asmCode.concat(codeToAsm(token.code));
  var r1,r2 = [];
  if(st.max){
    r1 = [`${mName}:`,`enter 0d${st.max}`];
    if(asmCode[asmCode.length-1]!='leave')r2 = ['leave'];
  }else{
    r1 = [`${mName}:`];
    if(asmCode[asmCode.length-1]!='leave')r2 = ['ret'];
    asmCode.map((e,i)=>{
      if(e=='leave')asmCode[i] = 'ret';
    });
  }
  for (var i = 0; i < st.max-1; i++) {
    var t = getScopedName(`var_${i}`);
    r2.push(`.define ${t} 0d${st.max-i}`);
  }
  var t = getScopedName(`var_m1`);
  r2.push(`.define ${t} 0d${st.max+1}`);
  variableStack.pop();
  return r1.concat(asmCode,r2);
}

function lineToAsm(token,f){
  if(token.type=='var'){
    f(addVar(token));
    if(token.vartype.typetype=='pointer'){
      if(token.init.list){
        token.vartype.length = token.init.list.length;
        globalArrayHelper(f,token);
        return;
      }
      if(token.init.type == "string"){
        token.init.list = token.init.string.slice(3,-1).match(/../g).map(e=>'0x'+e);
        token.init.list.push('0');
        token.vartype.length = token.init.list.length;
        globalArrayHelper(f,token);
        return;
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
    token.address = mangleName(token.name);
    if(token.returntype.modifiers.includes('extern')){
      f([`.extern ${token.address}`]);
    }
  }else if(token.type=='funccode'){
    // check if already defined header
    if(getVar(token.header.name)==undefined){
      if(f(addVar(token.header))===false)return;
    }
    token.header.address = mangleName(token.header.name);
    f(funcToAsm(token));
  }
}

function toAsm(tokens){
  var result = ['.align 100 0','; global strings'];
  variableStack.regrets = {'; global strings':'; global strings'};
  var f = a=>{result = result.concat(a);return a;};
  for(var i = 0; i < tokens.length; i++){
    var token = tokens[i];
    lineToAsm(token,f);
  }

  result = result.filter(e=>e&&!e.match(/^mov ([^ ]+) \1$/ig));
  result = result.map(e=>e=='mov ax 0'?'and ax 0':e);
  result = result.map(e=>(e in variableStack.regrets)?variableStack.regrets[e]:e);

  return result;
}

function main(code){
  var tokenTree = tokenParser.main(code);
  variableStack = [{}];
  var asm = toAsm(tokenTree);
  // console.dir(tokenTree,{depth:null});
  finish(asm.join('\n'));
}

function finish(str){
  console.log(str);//temp

  var tmpfile = "temp.crta";
  fs.writeFileSync(tmpfile,str);
  var outputFilename = "examples/out.crtb";
  cp.exec("node assembler.js "+printer.argvToString([tmpfile,"-o",outputFilename]),(a,b,c)=>{
    if(a)throw a;
    console.log(b);
    console.error(c);
    fs.unlinkSync(tmpfile,()=>{});
  });
}

tokenParser.printError = printError;
printer.doPrintLinePos = true;
// printer.init(main,["examples/font/hello.crtc"]);
// printer.init(main,["examples/test.crtc"]);
printer.init(main,["examples/snake.crtc"]);
