const archer = require('./arch/arch.js');
const lexer = require('./lexer.js');
const printError = require('./printError.js');
const preprocessor = require('./preprocessor.js');
const crto = require('../compiler/crto.js');

/**@type {[string[],('LtR'|'RtL')][]} */
const orderOfOperations = [
  [['|'],'LtR'],
  [['^'],'LtR'],
  [['&'],'LtR'],
  [['+','-'],'LtR'],
  [['*'],'LtR'],
];
const initPointer = crto.startPos;

var undefinedTokensGlobalArray = [];
var buffer = Buffer.alloc(65536,0);
var pointer = 0;
var crtoFlag_movable = true;
/**@type {{[x: string]:{v:number,type?:"label"|"extern"}}} */
var env = {};
/**@type {{ pointer: number; value: Token; size: number; valueTokens: Token[]; }[]} */
var backfill = [];
/**@type {number[]} */
var addresses = [];
/**@type {{name:Token,arr:number[]}[]} */ //why Token?
var externs = [];
/**@type {{[x: string]:number}} */
var globals = {};

/**@type {{[x: string]:(ops:Token[],self:Token)=>void}} */
const directiveRom = {
  "define":(ops,self)=>{
    if(!directiveArgCheck(".define",self,2,ops))return;
    var name = ops[0];
    var val = ops[1];
    if(name.type!="identifier")return printError(`error: labels must be identifiers`,name);
    if(env[name.string]!=undefined)printError(`warning: redefining ${name.string}`,name);
    if(val.type!="number" || val.value instanceof Buffer)return unexpected(val);
    env[name.string] = {v:val.value};
    return true;
  },
  "byte":(ops,self)=>{
    if(!directiveArgCheck(".byte",self,1,ops))return;
    pointer = emitNumber({
      pointer,
      value:ops[0],
      size:1,
      valueTokens:[ops[0]],
    },backfill);
  },
  "word":(ops,self)=>{
    if(!directiveArgCheck(".word",self,1,ops))return;
    pointer = emitNumber({
      pointer,
      value:ops[0],
      size:2,
      valueTokens:[ops[0]],
    },backfill);
  },
  "extern":(ops,self)=>{
    if(!directiveArgCheck(".extern",self,1,ops,true))return;
    for(var name of ops){
      if(name.type!="identifier")return printError(`error: labels must be identifiers`,name);
      if(env[name.string]!=undefined)printError(`warning: redefining ${name.string}`,name);
      let t = externs.push({name,arr:[]});
      env[name.string] = {v:t-1,type:"extern"};
    }
    return true;
  },
  "global":(ops,self)=>{
    if(!directiveArgCheck(".global",self,1,ops,true))return;
    for(var name of ops){
      if(name.type!="identifier")return printError(`error: labels must be identifiers`,name);
      if(env[name.string]==undefined)return printError(`error: ${name.string} is not defined`,name);
      if(env[name.string].type!="label")return printError(`error: ${name.string} is not a label`,name);
      globals[name.string] = env[name.string].v;
    }
    return true;
  },
  "pad":(ops,self)=>{
    var t = padOrAlignHelper(".pad",ops,self);
    if(t==undefined)return;
    var [count,char] = t;
    for(var i = 0; i < count; i++){
      buffer[pointer] = char;
      pointer++;
    }
  },
  "align":(ops,self)=>{
    var t = padOrAlignHelper(".align",ops,self);
    if(t==undefined)return;
    var [target,char] = t;
    if(target<2)return true;//nothing to do here
    if(target&(target-1)){
      printError(`error: alignment target must be a power of 2`,ops[0]);
      return;
    }
    var diff = target-(pointer&(target-1));
    if(diff==target)return true;//nothing to do here
    for(var i = 0; i < diff; i++){
      buffer[pointer] = char;
      pointer++;
    }
  },
  "undefine":(ops,self)=>{
    if(!directiveArgCheck(".undefine",self,1,ops,true))return;
    doBackfill();
    for(var i = 0; i < ops.length; i++){
      var name = ops[i];
      if(name.type!="identifier")return printError(`error: labels must be identifiers`,name);
      if(ops[i+1] && (ops[i+1].string=='*' || ops[i+1].string=='.*')){
        var count = 0;
        for(var k in env){
          if(!k.startsWith(name.string))continue;
          count++;
          delete env[k];
        }
        if(count==0)printError(`warning: wildcard matched nothing`,name,ops[i+1]);
        i++;
      }else{
        if(env[name.string]==undefined)return printError(`error: ${name.string} is not defined`,name);
        delete env[name.string];
      }
    }
    return true;
  },
};

const isOp = e=>!"+-|&^*".includes(e.string);

/**
 * @param {Token} token
 */
function unexpected(token,string="error: unexpected"){
  var s,q;
  if(token.type=="operator" || token.type=="block"){
    q = '"';
    s = token.string;
  }else{
    q = '';
    s = token.type;
  }
  printError(`${string} ${q}${s}${q}`,token);
}

/**
 * @param {Token[]} tokens
 */
function splitLines(tokens,sep="\n"){
  var r = [];
  var t = [];
  for(var e of tokens){
    if(e.string==sep){
      r.push(t);
      t = [];
    }else{
      t.push(e);
    }
  }
  if(t.length)r.push(t);
  return r;
}

/**
 * @param {Token[]} tokens
 * @param {(string:string,token:Token)=>void} err
 */
function bracketLookup(tokens,err=(a,b)=>{},op='(',ed=')',start=0,level=0){
  var errIndex = -1;
  for(var i = start; i < tokens.length; i++){
    var b = tokens[i].string;
    if(b==op){
      level++;
      errIndex = i;
    }
    if(b==ed){
      level--;
      if(level==0)return i;
    }
  }
  err(`error: no '${ed}' was found to match this '${op}'`,tokens[errIndex]);
  return -1;
}

/**
 * @param {Token[]} tokens
 */
function parseBlocks(tokens){
  /** @type {Token[]} */
  var res = [];
  for(var i = 0; i < tokens.length; i++){
    var t = tokens[i];
    if(t.type!="operator"){
      res.push(t);
      continue;
    }
    var char = t.string;
    var ti = "[({".indexOf(char);
    if(ti!=-1){
      var char2 = "])}"[ti];
      var nexti = bracketLookup(tokens,printError,char,char2,i);
      if(nexti==-1){
        nexti = tokens.length-1;
      }
      res.push({
        type:"block",
        string:t.string,
        includeStack:t.includeStack,
        loc:t.loc,
        children:parseBlocks(tokens.slice(i+1,nexti)),
        end:tokens[nexti],
      });
      i = nexti;
    }else if(!")}]".includes(char)){
      res.push(t);
    }else{
      printError('error: ?',t);
    }
  }
  return res;
}

/**
 * @param {Token[]} tokens
 * @returns {Token}
 */
function parseExpression(tokens){
  /**
   * @param {Token} token
   * @param {Token=} p1
   * @param {Token=} p2
   * @returns {Token}
   */
  const wrap = (token,p1,p2)=>{
    if(p1===null || p1===null)return null;
    return Object.assign({}, token, {type: "expression", p1, p2});
  };

  if(tokens.length==0)return;
  if(tokens.length==1){
    var token = tokens[0];
    if(token.type=="block" && token.string=='('){
      return parseExpression(token.children);
    }else if(token.type=="block" && token.string=='['){
      return wrap(token,parseExpression(token.children));
    }else if(token.type=="number" || token.type=="string" || token.type=="identifier"){
      return token;
    }else if(token.string=="##" || token.string=="#"){
      return token;
    }else{
      unexpected(token);
      return null;
    }
  }
  const order = orderOfOperations;
  for (var i = 0; i < order.length; i++) {
    var [ops,dir_str] = order[i];
    var [dir,zero,len] = dir_str!='LtR'?[1,0,tokens.length]:[-1,tokens.length-1,-1];
    for (var j = zero; j != len; j+=dir) {
      var token = tokens[j];
      for(var op of ops){
        if(token.type!='operator')continue;
        if(op!=token.string)continue;
        return wrap(token, parseExpression(tokens.slice(0,j)), parseExpression(tokens.slice(j+1)));
      }
    }
  }

  unexpected(tokens[1]);
  return null;
}

/**
 * @param {Token[]|Token} tokens
 * @returns {{s:string,v?:Token|number}}
 */
function parseExpressionSignature(tokens){
  if(tokens instanceof Array){
    var token = parseExpression(tokens);
  }else{
    var token = tokens;
  }
  if(!token)return null;
  if(token.type=="operator"){
    return {s:token.string};
  }else if(token.type=="identifier"){
    let t = archer.queryRegister(token.string);
    if(t)return {s:t.name};
    return {s:"*",v:token};
  }else if(token.type=="number"){
    if(token.value instanceof Buffer)throw 122;
    return {s:"*",v:token.value};
  }else if(token.type=="expression"){
    if(token.string=="["){
      let t = parseExpressionSignature(token.p1);
      if(t==null)return null;
      return {s:`[${t.s}]`,v:t.v};
    }else if(token.string=="-" && token.p1==undefined && token.p2!=undefined){
      let t = parseExpressionSignature(token.p2);
      if(t.s!='*'){
        unexpected(token.p2);
        return null;
      }
      return {s:'*',v:token};
    }else if(token.p1!=undefined && token.p2!=undefined){
      let t1 = parseExpressionSignature(token.p1);
      let t2 = parseExpressionSignature(token.p2);
      if(t1==null||t2==null)return null;
      let s,v,str=token.string.replace('-','+');
      if(t1.v==undefined){
        s = `(${t1.s}${str}${t2.s})`;
        if(token.string=='-'){
          v = Object.assign({},token,{p1:null});
        }else{
          v = t2.v;
        }
      }else if(t2.v==undefined){
        s = `(${t2.s}${str}${t1.s})`;
        v = t1.v;
      }else{
        s = "*";
        v = token;
      }
      return {s,v};
    }else{
      printError(`error: '${token.string}' is not a unary operator`,token);
      return null;
    }
  }else{
    unexpected(token);
    return null;
  }
}

/**
 * @param {Token[]} tokens
 */
function parseInstructionSignature(tokens){
  const breakExpressions = tokens=>{
    var r = [];
    var t = [];
    for(var i = 0; i < tokens.length; i++){
      var e = tokens[i];
      t.push(e);
      if(isOp(e) && tokens[i+1] && isOp(tokens[i+1])){
        r.push(t);
        t = [];
      }
    }
    if(t.length)r.push(t);
    return r;
  };

  if(tokens.length==0)throw RangeError("tokens.length==0");
  var mnemonic = tokens[0].string;
  if(tokens[0].type!="identifier"){
    unexpected(tokens[0]);
    return null;
  }
  const realTokens = tokens;
  tokens = tokens.slice(1);
  tokens = parseBlocks(tokens);

  var first,second;
  var numCommas = tokens.reduce((a,e)=>a+(e.string==','?1:0),0);
  if(numCommas>1){
    unexpected(tokens.filter(e=>e.string==',')[1]);
    return null;
  }else if(numCommas==1){
    [first,second] = splitLines(tokens,',');
  }else if(tokens.length<=2 && tokens.every(isOp)){
    first = tokens[0]?[tokens[0]]:null;
    second = tokens[1]?[tokens[1]]:null;
  }else{
    var expressions = breakExpressions(tokens);
    if(expressions.length!=0 && expressions.length<=2){
      [first,second] = expressions;
    }else{
      printError(`error: can not parse instruction structure`,tokens[0],tokens[tokens.length-1]);
      return null;
    }
  }

  //fix for: "mov sp -1" is interpreted as "mov sp-1"
  if(instructionSizes && instructionSizes[mnemonic][0]==2 && first && !second){
    var ind = realTokens.findIndex(e=>e.string=='-');
    if(ind!=-1){
      let t = realTokens.slice();
      let comma = lexer.tokenize(' , ')[0];
      t.splice(ind,0,comma);
      return parseInstructionSignature(t);
    }
  }

  var value = [];
  /**@type {Token[][]} */
  var valueTokens = [];
  for(let e of [first,second]){
    if(!e)continue;
    var t = parseExpressionSignature(e);
    if(t==null)return null;
    mnemonic += `_${t.s}`;
    if(t.v==undefined)continue;
    value.push(t.v);
    if(e.length>1){
      valueTokens.push([e[0],e[e.length-1]]);
    }else{
      if(e[0].type=="block"){
        valueTokens.push([e[0],e[0].end]);
      }else{
        valueTokens.push(e);
      }
    }
  }

  return {s:mnemonic,v:value,valueTokens};
}

/**
 * @param {Token[]} tokens
 */
function parseLine(tokens){
  if(tokens.length==0)return null;

  var bits = splitLines(tokens,':');
  var instruction = bits[bits.length-1];
  if(tokens[tokens.length-1].string==':'){
    bits.push([]);
    instruction = null;
  }
  var labels = bits.slice(0,-1).map((e,i)=>{
    if(e.length==0){
      unexpected(tokens.filter(e=>e.string==':')[i]);
      return "???";
    }else if(e.length>1){
      unexpected(e[1]);
      return "???";
    }else if(e[0].type!="identifier"){
      printError(`error: labels must be identifiers`,e[0]);
      return "???";
    }
    return e[0].string;
  });
  if(instruction==null)return {labels,r:null};

  var r,instruction0 = instruction[0];
  if(instruction.length==1 && instruction0.type=="string"){
    r = instruction0.value;
    if(typeof r == "number")throw 122;
    r = Buffer.concat([r, Buffer.from("\0")]);
  }else if(instruction0.type=="number"){
    let t = instruction0.string.slice(0,2)
    if(t!='0x' && t!='0X'){
      unexpected(instruction0);
      return null;
    }
    r = Buffer.from(instruction0.string.slice(2),'hex');
  }else{
    var t = parseInstructionSignature(instruction);
    if(t==null)return null;
    r = {sig:t.s,val:t.v,valueTokens:t.valueTokens};
  }
  return {labels,r};
}

/**
 * @param {Token} token
 * @param {{[x: string]:{v:number,type?:"label"|"extern"}}} env
 * @returns {{v:Token | number,type?:"label"|"extern"}}
 */
function evalExpression(token,env){
  if(!token)return null;

  if(token.type=="identifier"){
    if(env[token.string]==undefined){
      undefinedTokensGlobalArray.push(token.string);
      return {v:token};
    }
    return env[token.string];
  }else if(token.type=="number"){
    if(token.value instanceof Buffer)throw 122;
    return {v:token.value};
  }else if(token.type=="expression" && token.p1==undefined){
    var fake0 = lexer.tokenize(' 0 ')[0];
    return evalExpression(Object.assign({},token,{p1:fake0}),env);
  }else if(token.type=="expression"){
    let t1 = evalExpression(token.p1,env);
    let t2 = evalExpression(token.p2,env);
    if(typeof t1.v == "number" && typeof t2.v == "number"){
      let v = eval(`(${t1.v}${token.string}${t2.v})`);

      if(t1.type=="extern" || t2.type=="extern"){
        printError(`error: extern arithmetic is not supported`,token);
        return null;
      }else if(t1.type=="label" && t2.type=="label"){
        if(token.string!='-' && crtoFlag_movable){
          printError(`warning: address link broken (position independent code impossible)`,token);
          crtoFlag_movable = false;
        }
      }else if(t1.type=="label" || t2.type=="label"){
        if(token.string=='+' || token.string=='-'){
          return {v,type:"label"};
        }else if(crtoFlag_movable){
          printError(`warning: address link broken (position independent code impossible)`,token);
          crtoFlag_movable = false;
        }
      }

      return {v};
    }else{
      return {v:token};
    }
  }

  unexpected(token);
  return null;
}

function printBackfillErrors(backfill,env){
  var undefinedTokens = new Set();
  for(var e of backfill){
    var {value,valueTokens} = e;
    undefinedTokensGlobalArray = [];
    evalExpression(value,env);
    let [t1,t2] = valueTokens;
    let arr = undefinedTokensGlobalArray.filter(e=>!undefinedTokens.has(e)).map(e=>`'${e}'`);
    if(arr.length==0)continue;
    let str;
    if(arr.length==1){
      str = arr[0];
    }else{
      str = arr.slice(0,-1).join(', ');
      str += " and "+arr[arr.length-1];
    }
    printError(`error: ${str} ${arr.length==1?"was":"were"} never defined`,t1,t2);
    undefinedTokensGlobalArray.map(e=>undefinedTokens.add(e));
  }
}

function directiveArgCheck(name,self,count,ops,silent=false){
  if(ops.length<count){
    printError(`error: ${name} needs ${count} argument${count!=1?'s':''}`,ops[ops.length-1]||self);
    return false;
  }
  if(ops.length>count&&!silent){
    printError(`warning: ${name} only needs ${count} argument${count!=1?'s':''}`,ops[count]);
  }
  return true;
}

function padOrAlignHelper(name,ops,self){
  if(ops.length==0){
    printError(`error: ${name} needs at least 1 argument`,self);
    return;
  }
  if(ops.length>2){
    printError(`warning: ${name} only needs 2 arguments`,ops[2]);
  }
  var char = "f0";
  var padLength = name==".pad"?'padding length':'alignment target';
  if(ops[0].type!="number"){
    printError(`error: ${padLength} must me a number`,ops[0]);
    return;
  }
  var count = ops[0].value;
  if(count<0){
    printError(`error: ${padLength} must be positive`,ops[0]);
    return;
  }
  if(count>0xffff){
    printError(`error: ${padLength} is too big`,ops[0]);
    return;
  }
  if(ops.length==2){
    if(ops[1].type!="number"){
      printError(`error: padding char must me a number`,ops[1]);
      return;
    }
    char = ops[1].value;
  }
  return [count,char];
}

/**
 * @param {{ pointer: number; value: number|Token; size: number; valueTokens: Token[]; }} e
 * @param {{ pointer: number; value: Token; size: number; valueTokens: Token[]; }[]} backfill
 */
function emitNumber(e,backfill,exp=undefined){
  var {pointer,value,size:valueSize,valueTokens} = e;
  if(!exp){
    if(typeof value == "number"){
      exp = {v:value};
    }else{
      exp = evalExpression(value,env);
    }
  }
  var {v:val,type:valType} = exp;

  let [t1,t2] = valueTokens;
  if(valType=="label"){
    addresses.push(pointer);
    if(valueSize==1 && crtoFlag_movable){
      printError(`warning: address assigned to 8bit value (position independent code impossible)`,t1,t2);
      crtoFlag_movable = false;
    }
  }
  if(valType=="extern"){
    externs[val].arr.push(pointer+2);// "+2" is legacy code for "etc/nodejs/compiler" compatibility
    val = 0xcafe;
    if(valueSize==1)printError(`error: extern assigned to 8bit value`,t1,t2);
  }
  if(typeof val == "number" && valueSize==2){
    if(Math.abs(val)>0xffff)printError(`warning: 16bit integer overflow`,t1,t2);
    buffer.writeUInt16BE(val&0xffff,pointer);
    pointer += 2;
  }else if(typeof val == "number" && valueSize==1){
    if(Math.abs(val)>0xff)printError(`warning: 8bit integer overflow`,t1,t2);
    buffer[pointer] = val&0xff;
    pointer++;
  }else if(typeof val == "object"){
    // @ts-ignore
    backfill.push(e);
    buffer.writeUInt16BE(0xdead,pointer);
    pointer += valueSize;
  }

  return pointer;
}

/**
 * @param {{ sig: string, val: (number|Token)[], valueTokens:Token[][] }} arr
 */
function emitInstruction(arr,line,nLabels){
  if(arr.val.length>1){
    // throw "panic";
    printError(`error: too many non register args`,line[nLabels*2]);
    return;
  }
  var {sig,val:[val],valueTokens} = arr;
  if(typeof sig != "string" || typeof val == "string")throw 122;
  if(val && typeof val != "number"){
    let t = evalExpression(val,env);
    if(t==null){
      return;
    }
    val = t.v;
    var valType = t.type;
  }

  var valueSize = 0;
  if(sig.includes('*')){
    let t1 = sig.replace('*','#');
    let t2 = sig.replace('*','##');
    if(typeof val == "number" && Math.abs(val)<256 && instructionRom[t1]!=undefined){
      sig = t1;
      valueSize = 1;
    }else if(instructionRom[t2]!=undefined){
      sig = t2;
      valueSize = 2;
    }else{
      sig = t1;
      valueSize = 1;
    }
  }
  if(instructionRom[sig]==undefined){
    printError(`error: invalid instruction (${sig})`,line[nLabels*2],line[line.length-1]);
    return;
  }
  //todo: something about relative jumps
  buffer[pointer] = instructionRom[sig];
  pointer++;

  if(val==null)return;
  if(valueSize==0)throw "how?";

  pointer = emitNumber({
    pointer,
    value:val,
    size:valueSize,
    valueTokens:valueTokens[0],
  },backfill,{v:val,type:valType});
}

function doBackfill(){
  var newBackfill = [];
  for(var e of backfill){
    emitNumber(e,newBackfill);
  }
  backfill = newBackfill;
}

/**
 * @param {Token[]} tokens
 */
function main(tokens){
  var lines = splitLines(tokens);
  buffer.fill(0);
  pointer = initPointer;
  env = {};
  backfill = [];
  addresses = [];
  externs = [];
  globals = {};

  for(var line of lines){
    if(line[0] && line[0].string=='.'){
      if(line[1]==undefined){
        unexpected(line[0]);
        continue;
      }
      if(line[1].type!="identifier"){
        unexpected(line[1]);
        continue;
      }
      let t = directiveRom[line[1].string];
      if(t==undefined){
        printError(`error: unknown directive`,line[1]);
        continue;
      }
      t(line.slice(2),line[1]);
      continue;
    }

    var parsed = parseLine(line);
    if(parsed==null || parsed.labels.includes("???"))continue;
    parsed.labels.map((e,i)=>{
      if(env[e]!=undefined)printError(`warning: redefining ${e}`,line[i*2]);
      env[e] = {v:pointer,type:"label"};
    });
    if(parsed.r instanceof Buffer){
      parsed.r.copy(buffer,pointer);
      pointer += parsed.r.length;
    }else if(parsed.r!=null){
      var nLabels = parsed.labels.length;
      emitInstruction(parsed.r,line,nLabels);
    }
  }
  doBackfill();
  printBackfillErrors(backfill,env);

  return buffer.slice(initPointer,pointer);
}

function assemble(filename){
  var r = preprocessor.preprocessFile(filename,{});
  var code = main(r);
  var realExterns = {};
  externs.map(e=>{
    realExterns[e.name.string] = e.arr;
  });
  return {
    code,
    pos:initPointer,
    globals,
    externs:realExterns,
    pic:(addresses.length==0 && crtoFlag_movable),
  };
}

archer.init("./crtb.arch.js");
const arch = archer.arch;
arch.table.arr = arch.table.arr.map((e,i)=>e==""?"illegal":e);
lexer.setOptions({
  "comments":false,
  "filename":"list of instructions",
  "lineCommentSymbol":";",
  "newlines":true,
  "operators":[
    ',',
    '|',
    '&',
    '^',
    '*',
    '+',
    '-',
    '(',
    ')',
    '[',
    ']',
    '#',
    '##',
    '.',
    ':',
    '.*',
  ],
});
const tokenizedInstructions = splitLines(lexer.tokenize(arch.table.arr.join('\n')));
const parsedInstructions = tokenizedInstructions.map(e=>parseInstructionSignature(e).s);
const instructionRom = {};
parsedInstructions.map((e,i)=>instructionRom[e] = i);
lexer.getOptions().filename = "extra instructions";
for(let rule of arch.additionalTableEntries){
  arch.table.arr.map((e,i)=>{
    return {m:e.match(rule[0]),i,e:e.replace(rule[0],rule[1])};
  }).filter(e=>e.m).map(e=>{
    instructionRom[parseInstructionSignature(lexer.tokenize(e.e)).s] = e.i;
  });
}
var instructionSizes = {};
for(let k in instructionRom){
  let arr = k.split('_');
  let t = instructionSizes[arr[0]];
  if(!t)instructionSizes[arr[0]] = t = [];
  if(!t.includes(arr.length-1)){
    t.push(arr.length-1);
    t.sort();
  }
}

// @ts-ignore
if(require.main == module){
  // const file = '../compiler/examples/helloworld.crta';
  // const file = '../compiler/examples/snake.crta';
  const file = '../compiler/lib/mult.crta';
  let r = assemble(process.argv[2] || file);
  console.dir(r.code.toString('hex'));
  let o = crto.encode(r);
  require('fs').writeFileSync('../compiler/examples/snake2.crto',o);
}

//node assembler.js ./examples\snake.crta -o ./examples\snake.crto
