console.log('emulator');
function cpu(){
  this.stackAddress = 0xff00;
  
  this.acc = 0;
  this.age = 0;
  this.counter = 0;
  this.carry = false;
  this.isRunning = false;
  
  this.inst;
}

cpu.prototype.clock = function()
{
  this.age++;
  var opcode = ram[this.counter];
  this.inst = instructionDictionary[opcode];
  if(this.inst != undefined){
    if(historyLength != 0){this.history.unshift([this.counter.toString(16),opcode.toString(16)]);this.history.pop();}
    this.inst();
  }else{
    this.age--;
    if((opcode & 0xf0) >= 0x80){
      instructionDictionary[opcode] = cpu.compileInstruction(
        (opcode & 0xc) >> 2,
        (opcode & 0x70) >> 4,
        (opcode & 0x3)
      );
    }else if((opcode & 0xf) == 0xa || (opcode & 0xf) == 0xf){
      instructionDictionary[opcode] = cpu.compileInstruction((opcode & 0xc) >> 2,(opcode & 0x70) >> 4,4);
    }else{
      throw ('ram['+this.counter+']: opcode:'+opcode.toString(16)+' is invalid');
    }
  }
  //fixRam();//fixme
}

cpu.compileInstruction = function(opr1code,actcode,opr2code)
{
  var length = 1;

  var t = adressingDictionary[opr1code];
  var operand1 = t.s.format(length);
  length += t.l;

  t = adressingDictionary[opr2code];
  var operand2 = t.s.format(length);
  length += t.l;

  if(operand1 == operand2 && t.l == 0){
    opr2code = 4;
    operand2 = adressingDictionary[4].s.format(length);
    length += adressingDictionary[4].l;
  }

  var action = actionDictionary[actcode];
  if(action != undefined && operand1 != undefined && operand2 != undefined){
    var r = operand1+action+operand2;//eval(operand1+action+operand2);
    if(action != '='){r += ';this.carry = false';}
    if(operand1 != 'this.counter'){
      r += `
        ;if({0} > RAMsize-1){this.carry = true;};
        {0} = {0} & RAMsize-1;
        this.counter = (this.counter+{1})&(RAMsize2-1)
      `.format(operand1,length);
    }else{
      r += ';if(this.counter > RAMsize2-1){this.carry = true;};this.counter = this.counter & RAMsize2-1';
    }
    var f = new Function(r);
    f.instructionLength = length;
    f.actionName = actionNameDictionary[actcode];
    f.op1 = opr1code;
    f.op2 = opr2code;
    return f;
  }else{
    throw 'cpu.compileInstruction: trying to compile invalid instruction';
  }
}

cpu.weirdAddition = function(a,b){
  var t = a&0xff00;
  var t2 = a&0xff;
  return t|((t2+b)&0xff);
}

cpu.prototype.run = async function()
{
  this.isRunning = true;
  this.history = [];
  for (var i = 0; i < historyLength; i++) {
    this.history[i] = 'placeholder';
  }
  while(this.isRunning){
    await sleep(clockDelay);
    this.clock();
    for(var i = 0;(i < -clockDelay)&&this.isRunning;i++){
      this.clock();
    }
  }
}

cpu.prototype.call = function(n){
  if(this.stackCounterAddress == undefined)
    this.stackCounterAddress = cpu.weirdAddition(this.stackAddress,0xff);
  var counter = (ram[this.stackCounterAddress]);
  ram[(this.stackAddress&0xff00)|counter] = ((this.counter+3)&0xff00)>>>8;
  ram[(this.stackAddress&0xff00)|(counter+1)] = (this.counter+3)&0xff;
  ram[this.stackCounterAddress] += 2;
  this.counter = n;
  this.counter = this.counter & RAMsize2-1;
}

cpu.prototype.return = function(){
  var counter = (ram[this.stackCounterAddress]-=2);
  var n = ram[(this.stackAddress&0xff00)|counter];
  n <<= 8;
  n |= ram[(this.stackAddress&0xff00)|(counter+1)];
  this.counter = n;
  this.counter = this.counter & RAMsize2-1;//useless
}

adressingDictionary = [
  {s:'this.acc',l:0},
  {s:'this.counter',l:0},
  {s:'ram[ram[this.counter+{0}]]',l:1},
  {s:'ram[(ram[this.counter+{0}]<<8)+(ram[this.counter+{0}+1])]',l:2},
  {s:'ram[this.counter+{0}]',l:1}
];

actionDictionary = ['=','+=','&=','|=','^=','<<=','>>>='];
actionNameDictionary = ['mov','add','and','or','xor','lsh','rsh'];

function initInstructionDictionary(){
  var a = instructionDictionary;
  f = a[0x0] = function()//halt ()
  {this.isRunning = false;/*this.counter = 0;*/print('halt '+this.age);this.age = 0;};

  f = a[0x1] = function()//jump ()
  {
    this.counter = (ram[this.counter+1]<<8)+(ram[this.counter+2]);//ram[this.counter+1];
    this.counter = this.counter & RAMsize2-1;
  };
  f.actionName = 'jmp';
  f.op1 = 5;

  f = a[0x70] = function()//inc acc ()
  {
    this.carry = false;
    this.acc++;
    if(this.acc > RAMsize-1){this.carry = true;};
    this.acc = this.acc & RAMsize-1;
    this.counter += 1;
  };
  f.actionName = 'inc';
  f.op1 = 0;

  f = a[0x71] = function()//nop ()
  {
    this.counter = (this.counter+1)&(RAMsize2-1);
  };
  f.actionName = 'nop';

  f = a[0x72] = function()//inc zpg ()
  {
    this.carry = false;
    ram[ram[this.counter+1]]++;
    if(ram[ram[this.counter+1]] > RAMsize-1){this.carry = true;};
    ram[ram[this.counter+1]] = ram[ram[this.counter+1]] & RAMsize-1;
    this.counter += 2;
  };
  f.actionName = 'inc';
  f.op1 = 2;

  f = a[0x73] = function()//inc abs ()
  {
    this.carry = false;
    ram[(ram[this.counter+1]<<8)+(ram[this.counter+2])]++;
    if(ram[(ram[this.counter+1]<<8)+(ram[this.counter+2])] > RAMsize-1){this.carry = true;};
    ram[(ram[this.counter+1]<<8)+(ram[this.counter+2])] = ram[(ram[this.counter+1]<<8)+(ram[this.counter+2])] & RAMsize-1;
    this.counter += 3;
  };
  f.actionName = 'inc';
  f.op1 = 3;

  f = a[0x10] = function()//display ()
  {
    displayString += String.fromCharCode(ram[ram[this.counter+1]]);
    this.counter += 2;
  };
  f.actionName = 'print';
  f.op1 = 2;

  f = a[0x20] = function()//graphic display ()
  {
    drawC();
    this.counter += 1;
  };
  f.actionName = 'draw';

  f = a[0x2] = function()//jump carry (todo)
  {
    if(this.carry){this.counter = ram[this.counter+1];}else{this.counter += 2;}
  };
  f.actionName = 'jc';
  f.op1 = 4;

  f = a[0x12] = function()//jump carry (todo)
  {
    if(this.carry){this.counter = (ram[this.counter+1]<<8)+(ram[this.counter+2]);}else{this.counter += 3;}
  };
  f.actionName = 'jc';
  f.op1 = 5;

  f = a[0x3] = function()//jump !carry (todo)
  {
    if(!this.carry){this.counter = ram[this.counter+1];}else{this.counter += 2;}
  };
  f.actionName = 'jnc';
  f.op1 = 4;

  f = a[0x13] = function()//jump !carry (todo)
  {
    if(!this.carry){this.counter = (ram[this.counter+1]<<8)+(ram[this.counter+2]);}else{this.counter += 3;}
  };
  f.actionName = 'jnc';
  f.op1 = 5;

  f = a[0x11] = function()//call ()
  {
    this.call((ram[this.counter+1]<<8)+(ram[this.counter+2]));
  };
  f.actionName = 'call';
  f.op1 = 5;

  f = a[0x21] = function()//return ()
  {
    this.return();
  };
  f.actionName = 'return';
}
initInstructionDictionary();