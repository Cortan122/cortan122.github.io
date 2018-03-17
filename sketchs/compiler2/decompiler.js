function decompile(start){
  var r = '';
  var c = ram[start];
  var f = instructionDictionary[c];
  if(f == undefined){
    var opcode = c;
    if((opcode & 0xf0) >= 0x80){
      instructionDictionary[opcode] = cpu.compileInstruction(
        (opcode & 0xc) >> 2,
        (opcode & 0x70) >> 4,
        (opcode & 0x3)
      );
    }else if((opcode & 0xf) == 0xa || (opcode & 0xf) == 0xf){
      instructionDictionary[opcode] = cpu.compileInstruction((opcode & 0xc) >> 2,(opcode & 0x70) >> 4,4);
    }else{
      return r+undefined+'({0})'.format(c.toString(16));
    }
    f = instructionDictionary[c];
  }
  if(c == 0)return r+'';
  r += f.actionName;
  var le = 1;
  if(f.op1 !== undefined){
    var o1 = decompile.rom[f.op1]
      .format('0x'+ram[start+1].toString(16),'0x'+((ram[start+1]<<8)+(ram[start+1+1])).toString(16));
    r += ' '+o1;
    var l = decompile.rom1[f.op1];
    le += l;
    if(f.op2 !== undefined){
      var o2 = decompile.rom[f.op2]
        .format('0x'+ram[start+l+1].toString(16),'0x'+((ram[start+l+1]<<8)+(ram[start+l+1+1])).toString(16));
      r += ','+o2;
      le += decompile.rom1[f.op2]; 
    }
  }
  if(f.instructionLength == undefined||f.instructionLength == 0){
    f.instructionLength = le;
  }else if(f.instructionLength != le){
    return r+' error';//throw 'f.instructionLength != le';
  }
  return r+'\n'+decompile(start+f.instructionLength);
}

decompile.rom = ['ACC','PC','%{0}','%{1}','${0}','${1}'];
decompile.rom1 = [0,0,1,2,1,2];