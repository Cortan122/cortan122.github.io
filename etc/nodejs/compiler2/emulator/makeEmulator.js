const archer = require('../arch.js');
const arch = archer.arch;
const fs = require('fs');
const cp = require('child_process');

function DefaultDict(defaultInit,from={}){
  return new Proxy(from, {
    get: (target, name) => name in target ?
      target[name] :
      (target[name] = typeof defaultInit === 'function' ?
        new defaultInit().valueOf() :
        defaultInit)
  });
}

function format(_this,...args){
  return _this.replace(/{(\d+)}/g, function(match, number) { 
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
    ;
  });
}

function fixIndent(str=''){
  var lines = str.split('\n');
  var levels = lines.slice(1).filter(e=>e.match(/\S/)).map(e=>{
    var r = 0;
    for(var c of e){
      if(c!=' ')break;
      r++;
    }
    return r;
  });
  var levelDelta = Math.min(...levels);
  var r = [lines[0]].concat(lines.slice(1).map(e=>e.slice(levelDelta))).join('\n');
  while(r[0]=='\n')r = r.slice(1);
  return r;
}

function addIndent(str='',delta=0){
  var lines = str.split('\n');
  if(delta<0){
    delta = -delta;
    var r = [lines[0]].concat(lines.slice(1).map(e=>e.slice(delta))).join('\n');
  }else{
    var r = [lines[0]].concat(lines.slice(1).map(e=>' '.repeat(delta)+e)).join('\n');
  }
  while(r[0]=='\n')r = r.slice(1);
  return r;
}

function getFakeRegisters(){
  var fakeRegisters = {};
  for(let k in arch.compoundRegisters){
    let arr = arch.compoundRegisters[k];
    if(arch.endianness=='big')arr.reverse();
    let i = 0;
    for(let e of arr){
      fakeRegisters[e] = `(((uint${archer.queryRegisterLength(e)*8}_t*)(&reg_${k}))[${i}])`;
      i++;
    }
  }
  return fakeRegisters;
}

function getRegisterDeclarations(res=''){
  var fakeRegisters = getFakeRegisters();

  for(let e of arch.registers){
    var size = e[e.length-1];
    if(typeof size == 'string')throw 122;
    var name = e[0];
    if(fakeRegisters[name]){
      res += fixIndent(`
        #define reg_${name} ${fakeRegisters[name]}
      `)+'\n';
      continue;
    }
    res += fixIndent(`
      uint${8*size}_t reg_${name};
    `)+'\n';
  }

  res += fixIndent(`
    uint8_t ram_static[${arch.ramSize}];
    uint8_t* ram = (uint8_t*)&ram_static;
  `)+'\n';

  return res;
}

function getOperandCode(str=''){
  var r = archer.queryRegister(str);
  if(r)return {size:[r.size],strings:{[r.size]:`reg_${r.name}`}};
  var m = str.match(/^#+$/);
  if(m){
    var size = m[0].length;
    return {size:[size],strings:{[size]:`createProxy_inc(${size},&reg_ip)`}};
  }
  m = str.match(/^\[([^\[\]]+)\]$/);
  if(m){
    let r = {size:[],strings:{}};
    var rec_obj = getOperandCode(m[1]);
    if(rec_obj==null)return null;
    var rec = rec_obj.strings[rec_obj.size[rec_obj.size.length-1]];
    for(let i = 1; i <= arch.maxRegisterSize; i++){
      r.size.push(i);
      r.strings[i] = `createProxy(${i},${rec})`;
    }
    return r;
  }
  m = str.match(/^([^\+]+)\+([^\+]+)$/);
  if(m){
    var rec_obj = getOperandCode(m[1]);
    if(rec_obj==null)return null;
    let size = rec_obj.size[rec_obj.size.length-1];
    var rec = rec_obj.strings[size];
    var rec_obj2 = getOperandCode(m[2]);
    if(rec_obj2==null)return null;
    let size2 = rec_obj2.size[rec_obj2.size.length-1];
    var rec2 = rec_obj2.strings[size2];
    return {size:[size],strings:{[size]:`(${rec}+(int${size2*8}_t)(${rec2}))`}};
  }
  return null;
}

function getSwitchCase([instruction='',opcode=0]){
  var func;
  var errors = [];
  var words = instruction.split(' ');
  if(!(func = archer.queryInstruction(instruction))){
    func = archer.queryInstruction(words[0]);
    if(func==undefined)return `//todo: instruction "${words[0]}" not implemented`;
  }
  var operands = words.slice(1).map(getOperandCode);
  var i = operands.indexOf(null);
  if(i!=-1)return `//todo: operand "${words[i+1]}" not implemented`;

  var sizeSet = DefaultDict(0);
  operands.map(e=>e.size.map(e=>sizeSet[e]++));
  var sizes = Object.entries(sizeSet).filter(e=>e[1]==operands.length).map(e=>+e[0]);
  if(sizes.length>1){
    sizes = [sizes[0]];
    errors.push("uncertain");
  }
  var size = sizes[0];
  if(size==undefined){
    var args = operands.map(e=>e.strings[e.size[0]]);
    errors.push("mismatch");
  }else{
    var args = operands.map(e=>e.strings[size]);
  }

  if(words.length==1){
    errors = [];
  }

  return fixIndent(`
    case 0x${opcode.toString(16)}:; // ${instruction}${errors.length?` (${errors.join(', ')})`:''}
      ${func(...args)}
      break;
  `);
}

function getProxyCode(){
  return format(fs.readFileSync('./Proxy.cpp','utf8'),
    archer.queryRegisterLength(arch.instructionPointer)*8,
    arch.maxRegisterSize*8,
    arch.endianness=='big'?'':'// ',
  );
}

function getDumpableRegisters(){
  var fakeRegisters = getFakeRegisters();
  var dumpableRegisters = [];
  for(let e of arch.registers){
    var name = e[0];
    if(name in fakeRegisters)continue;
    if(typeof name == 'number')throw 122;
    dumpableRegisters.push(name);
  }
  return dumpableRegisters;
}

function getRegisterDump(){
  var dumpableRegisters = getDumpableRegisters();
  var arr = [];
  dumpableRegisters.map((e,i)=>{
    arr.push(fixIndent(`
      case ${i-2}:
        if(!force)printf("${' '.repeat(+(i-2<0)+2-e.length)}");
        printf(" ${e}:%0${2*archer.queryRegisterLength(e)}x",reg_${e});
        break;
    `));
  });
  return fixIndent(`
    bool dumpOneRegister(int num,bool force){
      switch(num){
        case -3:
          printf("[${arch.instructionPointer}]:%02x",ram[reg_${arch.instructionPointer}]);
          break;
        ${addIndent(arr.join(''),8)}
        default:
          return true;
      }
      return false;
    }
  `);
}

function main(){
  var res = fixIndent(`
    #include <stdio.h>
    #include <stdint.h>
    #include <stdbool.h>
  \n`);
  res += getRegisterDeclarations();
  res += getProxyCode();
  res += getRegisterDump();
  res += '\n';
  for(let e of arch.additionalEmulatorCode){
    res += fixIndent(e)+'\n\n';
  }
  var arr = arch.table.arr.map((e,i)=>[e,i]).filter(e=>e[0]!='').map(getSwitchCase);
  arr = arr.map(e=>e[e.length-1]!='\n'?e+'\n':e);
  res += fixIndent(`
    bool exec(){
      uint8_t opcode = ram[reg_${arch.instructionPointer}];
      reg_${arch.instructionPointer}++;
      switch(opcode){
        ${addIndent(arr.join(''),8)}
        default:
          fprintf(stderr,"%s:%02x\\n","invalid instruction?",opcode);
          break;
      }
      return false;
    }

    void registerReset(){
      ${getDumpableRegisters().map(e=>'reg_'+e).join(' = ')} = 0;
      reg_${arch.instructionPointer} = ${arch.startOfExecution};
    }

    uint64_t getInstructionPointer(){
      return reg_${arch.instructionPointer};
    }

    uint64_t getRamSize(){
      return ${arch.ramSize};
    }
  `);

  // console.dir(arch.table.arr,{maxArrayLength:null});
  fs.writeFileSync("./res.cpp",res,'utf8');
  // cp.execSync("g++ -c res.cpp",{"stdio":'inherit'});
}

archer.init("./crtb.arch.js",main);
