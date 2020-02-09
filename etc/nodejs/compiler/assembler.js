const fs = require('fs');
const path = require('path');
const printer = require('./printer.js');
const parseArgv = require('./argv.js');
const crto = require('./crto.js');
const cp = require('child_process');

const argvRom = {
  "-o":[1,1,(a)=>{
    outputFilename = a;
  }],
  "-I":[1,1,(a)=>{
    pathToLibFolder = path.resolve(a);
  }],
  "--pos":[1,1,(a)=>{
    ip = startPos = parseInt(a);
  }],
  "--pic":[0,1,(a)=>{
    positionIndependentCode = true;
  }],
  "argv":(argv)=>{
    if(argv.length>1){
      console.error(`assembler.js: expects 1 or 0 non-option arguments`);
      return 1;
    }
    if(argv.length)filename = argv[0];
  }
};

const instructionRom = {
  ".define":ops=>{
    if(!directiveArgCheck(".define",2,ops))return;
    var name = ops[0];
    var val = ops[1];
    if(!isLegalLabelName(name))return;
    envlabels[name] = val;
    return true;
  },
  ".undefine":ops=>{
    if(!directiveArgCheck(".undefine",1,ops))return true;
    reeval();
    var arg = ops[0];
    if(isLegalLabelName(arg,true)){
      if(envlabels[name] === undefined){
        printError(`"${name}" is not defined`);
        return true;
      }
      delete envlabels[name];
      return true;
    }
    var re = new RegExp('^'+arg.replace(/\$/g,"\\$")+'$');
    for(var name in envlabels){
      if(name.search(re)==-1)continue;
      delete envlabels[name];
    }
    return true;
  },
  ".pad":ops=>{
    var t = padOrAlignHelper(".pad",ops);
    if(t==undefined)return;
    var count = t[0];
    var char = t[1];
    ip += count;
    result += char.repeat(count);
  },
  ".align":ops=>{
    var t = padOrAlignHelper(".align",ops);
    if(t==undefined)return;
    var target = t[0];
    var char = t[1];
    if(target<2)return true;//nothing to do here
    if(target&(target-1)){
      printError(`alignment target must be a power of 2 (fatal)`);
      return;
    }
    var diff = target-(ip&(target-1));
    if(diff==target)return true;//nothing to do here
    ip += diff;
    result += char.repeat(diff);
  },
  ".extern":ops=>{
    if(!directiveArgCheck(".extern",1,ops,true))return;
    for(var name of ops){
      if(!isLegalLabelName(name))continue;
      envlabels[name] = `{э${name}}`;
    }
    return true;
  },
  ".global":ops=>{
    if(!directiveArgCheck(".global",1,ops))return;
    var name = ops[0];
    if(!isLegalLabelName(name,true)){
      printError(`illegal identifier: "${name}"`);
      return;
    }
    var t = envlabels[name];
    if(t === undefined){
      printError(`"${name}" is not defined`);
      return;
    }
    if(!t.match(/^0x[0-9a-f]{4}$/i)){
      printError(`"${name}" is not a label`);
      return;
    }
    globals[name] = parseInt(envlabels[name],16);
    return true;
  },
  ".byte":ops=>{
    if(!directiveArgCheck(".byte",1,ops))return;
    ip += 1;
    result += assembleSymbol(ops[0],1);
  },
  ".word":ops=>{
    if(!directiveArgCheck(".word",1,ops))return;
    ip += 2;
    result += assembleSymbol(ops[0],2);
  },
  "mov":ops=>{
    if(!directiveArgCheck("mov",2,ops))return;
    var r1 = assembleRegister(ops[0]);
    var r2 = assembleRegister(ops[1]);
    if(r1.v=="num"){
      printError("cant mov into const (fatal)");
      return;
    }
    if(r2.v=="num"){
      if(r2.l>r1.l)printError("const too big");
      if(r1.t!="reg")printError("moves need to have at least 1 register");
      assembleOpcode(0x00+r1.v,[ops[1]],r1.l);
      return;
    }
    if(r1.t=="reg"&&r2.t=="reg"){
      assembleOpcode(0x08|r1.v|(r2.v<<4),[],0);
      return;
    }
    if(r1.v=="ind"){
      //"indexed moves can only be done on registers (fatal)"
      if(r2.t!="reg")printError("moves need to have at least 1 register");
      assembleOpcode(0x98+r2.v,[],0);
      return;
    }
    if(r2.v=="ind"){
      if(r1.t!="reg")printError("moves need to have at least 1 register");
      assembleOpcode(0x88+r1.v,[],0);
      return;
    }
    if(r2.v=="indnum"){
      if(r1.t!="reg")printError("moves need to have at least 1 register");
      if(r2.l==2){
        assembleOpcode(0x10+r1.v,[r2.str],2);
      }else if(r2.l==1){
        assembleOpcode(0x20+r1.v,[r2.str],1);
      }else{
        throw "What";
      }
      return;
    }
    if(r1.v=="indnum"){
      if(r2.t!="reg")printError("moves need to have at least 1 register");
      if(r1.l==2){
        assembleOpcode(0x30+r2.v,[r1.str],2);
      }else if(r1.l==1){
        assembleOpcode(0x40+r2.v,[r1.str],1);
      }else{
        throw "What";
      }
      return;
    }
    if(r1.v=="indstack"){
      //"indexed moves can only be done on registers (fatal)"
      if(r2.t!="reg")printError("moves need to have at least 1 register");
      assembleOpcode(0xb8+r2.v,[r1.str],1);
      return;
    }
    if(r2.v=="indstack"){
      if(r1.t!="reg")printError("moves need to have at least 1 register");
      assembleOpcode(0xa8+r1.v,[r2.str],1);
      return;
    }

    printError("unknown mov (fatal)");
  },
  "jmp":ops=>{
    assembleJump(0x00,ops);
  },
  "jc":ops=>{
    assembleJump(0x50,ops);
  },
  "jnc":ops=>{
    assembleJump(0x51,ops);
  },
  "jz":ops=>{
    assembleJump(0x52,ops);
  },
  "jnz":ops=>{
    assembleJump(0x53,ops);
  },
  "js":ops=>{
    assembleJump(0x54,ops);
  },
  "jns":ops=>{
    assembleJump(0x55,ops);
  },
  "jo":ops=>{
    assembleJump(0x56,ops);
  },
  "jno":ops=>{
    assembleJump(0x57,ops);
  },
  "add":ops=>{
    assembleArithmeticOpcode(0x80,ops,"add");
  },
  "and":ops=>{
    assembleArithmeticOpcode(0x90,ops,"and");
  },
  "or":ops=>{
    assembleArithmeticOpcode(0xa0,ops,"or");
  },
  "xor":ops=>{
    assembleArithmeticOpcode(0xb0,ops,"xor");
  },
  "bsh":ops=>{
    assembleArithmeticOpcode(0xc0,ops,"bsh");
  },
  "test":ops=>{
    requireRegister(ops,{
      "3":()=>assembleOpcode(0xf7,[],0),
      "1":()=>assembleOpcode(0xf8,[],0),
      "else":()=>assembleOpcode(0xf8,[],0)
    });
  },
  "hlt":ops=>{
    assembleOpcode(0xff,ops,0);
  },
  "print":ops=>{
    requireRegister(ops,3);
    assembleOpcode(0xfe,[],0);
  },
  "call":ops=>{
    //todo?
    assembleJump(0xf1,ops);
  },
  "ret":ops=>{
    assembleOpcode(0xf3,ops,0);
  },
  "nop":ops=>{
    assembleOpcode(0xf0,ops,0);
  },
  "push":ops=>{
    requireRegister(ops,{
      "indnum":reg=>assembleOpcode(0xf9,[reg.str],1),
      "1":()=>assembleOpcode(0xf5,[],0),
      "else":()=>assembleOpcode(0xf5,[],0)
    });
  },
  "pop":ops=>{
    requireRegister(ops,{
      "indnum":reg=>assembleOpcode(0xfa,[reg.str],1),
      "1":()=>assembleOpcode(0xf6,[],0),
      "else":()=>assembleOpcode(0xf6,[],0)
    });
  },
  "enter":ops=>{
    assembleOpcode(0xfb,ops,1);
  },
  "leave":ops=>{
    assembleOpcode(0xfc,ops,0);
  }
};

//global.markFatalErrors = false; //for some reason
const markFatalErrors = false;
var positionIndependentCode = false;

const registerRom = [
  ["ip","pc"],
  ["ax","ex","eax"],
  ["ah"],
  ["al"],
  ["fl","flags"],
  ["b","bl","bx"],
  ["c","cl","cx"],
  ["sp"]
];
const registerLengthRom = [2,2,1,1,1,1,1,2];
const abs = Math.abs;

var result = "";
var ip = crto.startPos;
var envlabels = {};
var unevaluatedStatements = [];
var globals = {};
var externs = {};
var pointer = 0;//for error messages
var startPos = crto.startPos;

function getIntegerLength(str){
  var int = assembleSymbol(str,2,e=>e);
  if(typeof int == "string"){
    if(int.includes('{'))return 2;
    return getIntegerLength(int);
  }
  if(int>0xff||int<0)return 2;
  else return 1;
}

function printError(str){
  if(markFatalErrors==false){
    str = str.replace(/\(fatal\)/g,"")
  }

  //console.log(`line ${lineNumber+1}: ${str}`);
  printer.print(str,pointer);
}

function tohex(num,len=2){
  if(num<0){
    if(num<-(1<<(len*4))){
      printError(`num too negative (-0x${abs(num).toString(16)})`);
    }
    var t = num&(parseInt("f".repeat(len),16));
    return tohex(t,len);
  }
  var s = num.toString(16);
  if(s.length>len&&len!=0){
    printError(`num too big (0x${s})`);
    s = s.substr(-len);
  }
  while(s.length<len){
    s = "0"+s;
  }
  return s;
}

function padOrAlignHelper(name,ops){
  if(ops.length==0){
    printError(`${name} needs at least 1 argument (fatal)`);
    return;
  }
  if(ops.length>2){
    printError(`${name} only needs 2 arguments`);
  }
  var char = "f0";
  var count = assembleSymbol(ops[0],2,e=>e);
  var padlen = name==".pad"?'padding length':'alignment target';
  if(typeof count == "string"){
    printError(`${padlen} must me a number (fatal)`);
    return;
  }
  if(count<0){
    printError(`${padlen} must be positive (fatal)`);
    return;
  }
  if(count>0xffff){
    printError(`${padlen} too big (fatal)`);
    return;
  }
  if(ops.length==2){
    var t = assembleSymbol(ops[1],1);
    if(t.match(/[^0-9a-fA-F]/)!=null){
      printError(`padding char must me a number`);
    }else{
      char = (t+char).substr(0,2);
    }
  }
  return [count,char];
}

function directiveArgCheck(name,count,ops,silent=false){
  if(ops.length<count){
    printError(`${name} needs ${count} argument${count!=1?'s':''} (fatal)`);
    return false;
  }
  if(ops.length>count&&!silent){
    printError(`${name} only needs ${count} argument${count!=1?'s':''}`);
  }
  return true;
}

function requireRegister(ops,val){
  var name = requireRegister.caller.name;
  var efunc = val["else"];
  if(efunc == undefined)efunc = ()=>{};
  if(ops.length==0){
    printError(`${name} needs a register`);
    efunc();
    return;
  }
  if(ops.length!=1){
    printError(`${name} only needs one register`);
    //return;
  }
  var reg = assembleRegister(ops[0]);
  if(typeof val == "object"){
    var func = val[reg.v];
    if(func == undefined){
      printError(`can not ${name} ${ops[0]}`);
      efunc();
      return;
    }
    func(reg);
    return;
  }
  if(reg.v!=val){
    printError(`can only ${name} ${registerRom[val][0]}`);
  }
}

function isLegalLabelName(name,silent=false){
  var print = printError;
  if(silent)print = ()=>{};
  var m = name.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
  if(!(m&&m[0]==name)){
    print(`illegal identifier: "${name}"`);
    return false;
  }
  if(envlabels[name] !== undefined){
    print(`${name} is already defined`);
  }
  return true;
}

function setHexLabel(name){
  if(!name.startsWith("0x"))throw "this is impossible";
  name = name.substr(2);
  if(name.match(/[^0-9a-fA-F]/)){
    printError("invalid hex label (fatal)");
    return;
  }
  var num = parseInt(name,16);
  if(num>0xffff||num<0){
    printError("hex label too long (fatal)");
    return;
  }
  var diff = num-ip;
  if(diff<0){
    printError("hex label too small (fatal)");
    return;
  }
  if(diff==0){
    printError("hex label unnecessary");
    return;
  }
  for (var i = 0; i < diff; i++) {
    result += "f0";
  }
  result += " ";
  ip = num;
  return;
}

function setLabel(name){
  if(name.startsWith("0x")){
    setHexLabel(name);
    return;
  }
  if(!isLegalLabelName(name))return;
  var hex = tohex(ip,4);
  envlabels[name] = "0x"+hex;
  result = result.replace(new RegExp("\\{ф"+name+"\\}","g"),hex);
}

function reeval(){
  var oldpointer = pointer;
  result = result.replace(/{ы([0-9]+)}/g,(a,b)=>{
    var int = parseInt(b);
    var stat = unevaluatedStatements[int];
    pointer = stat.p;
    var str = assembleSymbol(stat.str,stat.len);
    var match;
    if(match = str.match(/{ы([0-9]+)}/)){
      str = "{щ"+unevaluatedStatements[parseInt(match[1])].str+"}";
    }
    /*if(match = str.match(/{ф([a-zA-Z_$][a-zA-Z0-9_$]*)}/)){
      str = match[0].replace('ф','я');
      console.error(`error:"${match[1]}" was never defined`);
    }*/
    return str;
  });
  result = result.replace(/{э([^{}э]+)э([0-9]+)}/g,(a,b,c)=>{
    var name = b;
    var pointer = parseInt(c);
    var t = externs[name];
    if(t==undefined)t = externs[name] = [];
    t.push(pointer);
    return 'CAFE';
  });
  pointer = oldpointer;
}

function assembleRegister(str){
  var t = envlabels[str];
  if(t)return assembleRegister(t);
  for (var i = 0; i < registerRom.length; i++) {
    if(registerRom[i].includes(str))return {v:i,l:registerLengthRom[i],t:"reg"};
  }
  if(str.match(/^\[sp[\+\-][^\[\]]*\]$/)){//this regex just matches [sp+*]
    var tempstr = str.substring(4,str.length-1);
    if(str[3]=='-')tempstr = '-'+tempstr;
    return {v:"indstack",str:tempstr};
  }
  if(str.match(/^\[[^\[\]]*\]$/)){//this regex just matches [*]
    var tempstr = str.substr(1,str.length-2);
    var reg = assembleRegister(tempstr).v;
    if(reg=="num")return {v:"indnum",l:getIntegerLength(tempstr),str:tempstr};
    if(reg==1)return {v:"ind",l:-1};
    printError("invalid indexing");
  }
  if(str.match(/^{э([a-zA-Z_$][a-zA-Z0-9_$]*)}$/)){
    return {v:"extern",l:2};
  }
  return {v:"num",l:getIntegerLength(str)};
}

function assembleSymbol(sym,len,tostr=tohex){
  var signs,match;
  var isValidIdentifier = isLegalLabelName(sym,true);
  if(signs = sym.match(/[\+\-]/g)){
    signs.unshift('+');
    var arr = sym.split(/[\+\-]/);
    if(arr[0]=="")arr[0] = "0";
    var r = 0;
    var string = "";
    for (var i = 0; i < arr.length; i++) {
      var t = assembleSymbol(arr[i]);
      if(!t.includes("{")){
        r += parseInt(t,16)*(signs[i]=='+'?1:-1);
      }else{
        string += signs[i]+t;
      }
    }
    if(string!=""){
      var a = abs(r).toString(16);
      if(a == "NaN")throw NaN;
      string = (r>=0?"0x":"0-0x")+a+string;
      var ind = unevaluatedStatements.push({str:string,len:len,p:pointer});
      return `{ы${ind-1}}`;
    }
    return tostr(r,len*2);
  }else if(sym.startsWith("0x")||sym.startsWith("0X")){
    return tostr(parseInt(sym.substr(2),16),len*2);
  }else if(sym.startsWith("0b")||sym.startsWith("0B")){
    return tostr(parseInt(sym.substr(2),2),len*2);
  }else if(sym.startsWith("0d")||sym.startsWith("0D")){
    return tostr(parseInt(sym.substr(2),10),len*2);
  }else if(sym.startsWith("0o")||sym.startsWith("0O")){
    return tostr(parseInt(sym.substr(2),8),len*2);
  }else if(isValidIdentifier&&envlabels[sym] != undefined){
    return assembleSymbol(envlabels[sym],len);
  }else if(sym.match(/[^0-9a-fA-F]/)==undefined){
    return tostr(parseInt(sym,16),len*2);
  }else if(isValidIdentifier){
    if(len==1){
      //printError("num too big");
      return assembleSymbol(`${sym}+0`,len);
    }
    return `{ф${sym}}`;
  }else if(match = sym.match(/{ф([a-zA-Z_$][a-zA-Z0-9_$]*)}/)){
    if(envlabels[match[1]]==undefined){
      return sym;
    }
    return assembleSymbol(envlabels[match[1]],len);
  }else if(match = sym.match(/{ы([a-zA-Z_$][a-zA-Z0-9_$]*)}/)){
    var stat = unevaluatedStatements[int];
    return assembleSymbol(stat.str,/*stat.*/len);
  }else if(match = sym.match(/{э([a-zA-Z_$][a-zA-Z0-9_$]*)}/)){
    return `{э${match[1]}э${ip}}`;
  }else{
    var t = assembleSymbol.prevErrorInfo;
    if(t==undefined||!(t[0]==sym&&t[1]==pointer)){
      isLegalLabelName(sym);
      assembleSymbol.prevErrorInfo = [sym,pointer];
    }
    return tostr(-1,len*2);
  }
}

function assembleOpcode(code,syms,len){
  if(len==0){
    directiveArgCheck(assembleOpcode.caller.name,0,syms);
    ip++;
    result += tohex(code,2);
    return;
  }
  if(len==undefined)throw "oh noo";
  if(!directiveArgCheck(assembleOpcode.caller.name,1,syms))return;
  ip += 1+len;
  result += tohex(code,2);
  result += assembleSymbol(syms[0],len);
}

function assembleJump(code,ops){
  var name = assembleJump.caller.name;
  if(!directiveArgCheck(name,1,ops))return;
  var r = assembleRegister(ops[0]);
  if(r.v=="extern"){
    assembleOpcode(code,ops,2);
  }else if(r.v==1){
    if(code == 0x00){
      assembleOpcode(0x18,[],0);
    }else if(code == 0xf1){
      assembleOpcode(0xf2,[],0);
    }else{
      printError(`can not conditionaly jump to ax`);
      assembleOpcode(0x18,[],0);
    }
    return;
  }else if(r.v=="num"){
    if(positionIndependentCode){
      if(code == 0x00){
        code = 0x70;
      }else if(code == 0xf1){
        code = 0x72;
      }else{
        code += 0x10;
      }
      var target = assembleSymbol(ops[0],2);
      if(target.includes("{")){
        var string = assembleSymbol(`${target}-0d${ip+3}`,2);
        if(code==0x70||code==0x72){
          ip += 3;
          result += tohex(code+1,2)+string;
          return;
        }
        string = assembleSymbol(`${target}-0d${ip+5}`,2);
        ip += 5;
        result += tohex(code^0b1,2)+"0371"+string;
      }else{
        var diff = parseInt(target,16)-ip-2;
        if(diff>=-128&&diff<=127){
          ip += 2;
          result += tohex(code,2)+tohex(diff,2);
          return;
        }
        if(code==0x70||code==0x72){
          ip += 3;
          result += tohex(code+1,2)+tohex(diff-1,4);
          return;
        }
        ip += 5;
        result += tohex(code^0b1,2)+"0371"+tohex(diff-3,4);
      }
      return;
    }
    assembleOpcode(code,ops,2);
  }else{
    printError(`can not jump to ${ops[0]}`);
  }
}

function assembleArithmeticOpcode(code,ops,name){
  if(!directiveArgCheck(name,2,ops))return;
  var r1 = assembleRegister(ops[0]);
  var r2 = assembleRegister(ops[1]);
  if(r1.v!=1){
    printError(`can only ${name} to ax`);
    r2 = r1;
    ops[1] = ops[0];
  }
  if(r2.v==1||r2.v==2||r2.v==3){
    printError(`cant ${name} whith ${ops[1]} (fatal)`);
    return;
  }
  if(r2.t=="reg"){
    assembleOpcode(code+r2.v,[],0);
    return;
  }
  if(r2.v=="num"){
    assembleOpcode(code+0x01,[ops[1]],1);
    return;
  }
  if(r2.v=="indnum"){
    //todo
    throw "todo";
  }

  printError(`unknown ${name} (fatal)`);
}

function assembleInstruction(line){
  if(line.match(/\S/)==undefined){
    //this is an empty line
    return true;
  }

  line = line.replace(/\s$/g,"");
  var ops = line.split(' ');
  var cmd = ops.shift();
  var func = instructionRom[cmd];
  var bool = false;
  if(func){
    bool = func(ops)?true:false;
  }else{
    printError(`${cmd} instruction dose not exist (fatal)`);
  }
  return !bool;
}

function assembleLine(line){
  var bool = true;
  if(line.match(/\S/)==undefined){
    //this is an empty line
    return;
  }
  //line = line.split(';')[0];
  var labels = line.split(':');
  line = labels.pop();
  for (var i = 0; i < labels.length; i++) {
    setLabel(labels[i]);
  }

  if(line[0] == '"'){
    if(!line.endsWith('"')){
      throw "that should never happen";
      printError("missing quote");
      line = line.substr(1,line.length-1);
    }else{
      line = line.substr(1,line.length-2);
    }
    if(!line.startsWith('0x')){
      throw "that should never happen";
    }else{
      line = line.substr(2);
    }
    if(line.length%2){
      throw "that should never happen";
    }

    result += line;
    result += "00";
    ip += line.length/2+1;
  }else if(line.startsWith("0x")){
    line = line.substr(2);
    if(line.match(/[^0-9a-fA-F]/)){
      printError("invalid data (fatal)");
    }else{
      if(line.length%2==1){
        line = '0'+line;
      }
      result += line;
      ip += line.length/2;
    }
  }else{
    bool = assembleInstruction(line);
  }

  if(line.match(/\S/)&&bool)result += ' ';
}

function finish(){
  var extension = path.extname(outputFilename);
  if(extension=='.crtb'){
    if(Object.keys(externs).length==0){
      result = "f0".repeat(startPos) + result;
      var buff = Buffer.from(result, 'hex');
      var addr = globals[crto.entryPoint];
      if(addr!=undefined&&addr>crto.startPos){
        buff[0] = 0xf1;
        buff.writeUInt16BE(addr,1);
        buff[3] = 0xff;
      }
      fs.writeFileSync(outputFilename,buff,"binary");
    }else{
      var tmpfile = "temp.crto";
      while(fs.existsSync(tmpfile)){
        tmpfile = "_"+tmpfile;//todo: random
      }
      crto.write(tmpfile,{
        pic:positionIndependentCode,
        pos:startPos,
        externs,
        globals,
        code:result
      });
      cp.exec("node linker.js "+printer.argvToString([tmpfile,"-o",outputFilename]),(a,b,c)=>{
        if(a)throw a;
        console.log(b);
        console.error(c);
        fs.unlinkSync(tmpfile,()=>{});
      });
    }
  }else if(extension=='.crto'){
    crto.write(outputFilename,{
      pic:positionIndependentCode,
      pos:startPos,
      externs,
      globals,
      code:result
    });
  }else{
    //todo: guess
    console.error(`unknown file extension : "${extension}"`);
  }
}

function main(code){
  var lines = code.split('\n');

  for (var lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    var i = lineNumber;
    assembleLine(lines[i]);
    pointer += lines[i].length+1;
  }

  reeval();

  result = result.replace(/{ф([a-zA-Z_$][a-zA-Z0-9_$]*)}/,(a,b)=>{
    console.error(`error:"${b}" was never defined`);
    return "DEAD";//a.replace('ф','');
  });

  console.log(result);
  //console.log(envlabels);

  result = result.replace(/[ \n]/g,"");
  if(result.match(/[^0-9a-fA-F]/)==null){
    finish();
  }else{
    console.log('unevals:');
    console.log(unevaluatedStatements);
    console.log("cant writeFileSync (but why?)");
  }
}

var filename = "examples/test.crta";
var outputFilename = "examples/out.crtb";
var pathToLibFolder = path.resolve(__dirname,"./lib");
parseArgv(process.argv,argvRom);

printer.init(main,["--asm","-I",pathToLibFolder,filename]);
