console.log('emulator');
function cpu(){
  
  this.a = 0;
  this.b = 0;
  this.counter = 0;
  this.carry = false;
  this.isRunning = false;
  
  this.inst;
  
}

cpu.prototype.clock = function()
{
  this.inst = instructionDictionary[ram[this.counter]];
  this.inst();
  fixRam();//fixme
}

cpu.prototype.run = async function()
{
  this.isRunning = true;
  while(this.isRunning){
    await sleep(clockDelay);
    this.clock();
    //if(clockDelay > 0){ await sleep(clockDelay);this.clock();}else{
    for(var i = 0;(i < -clockDelay)&&this.isRunning;i++){
      this.clock();
    }
    //}
  }
}

instructionDictionary[0b0] = function()//halt ()
{this.isRunning = false;/*this.counter = 0;*/print('halt');}

instructionDictionary[0b1] = function()//jump ()
{this.counter = ram[this.counter+1];}

instructionDictionary[0b10] = function()//move ()
{
  this.a = ram[ram[this.counter+1]];
  ram[ram[this.counter+2]] = this.a;
  this.counter += 3;
}

instructionDictionary[0x12] = function()//move number (mov $42 %0)
{
  this.a = ram[this.counter+1];
  ram[ram[this.counter+2]] = this.a;
  this.counter += 3;
}

instructionDictionary[0x22] = function()//swap  (todo)
{
  this.a = ram[ram[this.counter+1]];
  this.b = ram[ram[this.counter+2]];
  ram[ram[this.counter+2]] = this.a;
  ram[ram[this.counter+1]] = this.b;
  this.counter += 3;
}

instructionDictionary[0b11] = function()//++ ()
{
  this.carry = false;
  ram[ram[this.counter+1]]++;
  this.counter += 2;
}

instructionDictionary[0x10] = function()//display ()
{
  print(ram[ram[this.counter+1]]);
  this.counter += 2;
}

instructionDictionary[0x20] = function()//graphic display ()
{
  drawC();
  this.counter += 1;
}

instructionDictionary[0x81] = function()//save a ()
{
  this.a = ram[ram[this.counter+1]];
  this.counter += 2;
}

instructionDictionary[0x91] = function()//save b ()
{
  this.b = ram[ram[this.counter+1]];
  this.counter += 2;
}

instructionDictionary[0x82] = function()//load a  (todo)
{
  ram[ram[this.counter+1]] = this.a;
  this.counter += 2;
}

instructionDictionary[0x92] = function()//load b  (todo)
{
  ram[ram[this.counter+1]] = this.b;
  this.counter += 2;
}

instructionDictionary[0x84] = function()//jump carry (todo)
{
  if(this.carry){this.counter = ram[this.counter+1];}else{this.counter += 2;}
}

instructionDictionary[0x85] = function()//sum ()
{
  this.carry = false;
  ram[ram[this.counter+1]] = this.b+this.a;
  this.counter += 2;
}

instructionDictionary[0x05] = function()//sum % + % = %  (todo)
{
  this.carry = false;
  this.a = ram[ram[this.counter+1]];
  this.b = ram[ram[this.counter+2]];
  ram[ram[this.counter+3]] = this.b+this.a;
  this.counter += 4;
}

instructionDictionary[0x15] = function()//sum $ + % = %  (todo)
{
  this.carry = false;
  this.a = ram[this.counter+1];
  this.b = ram[ram[this.counter+2]];
  ram[ram[this.counter+3]] = this.b+this.a;
  this.counter += 4;
}

instructionDictionary[0x25] = function()//sum % += %  (todo)
{
  this.carry = false;
  this.a = ram[ram[this.counter+1]];
  this.b = ram[ram[this.counter+2]];
  ram[ram[this.counter+2]] = this.b+this.a;
  this.counter += 3;
}

instructionDictionary[0x35] = function()//sum % += $  (todo)
{
  this.carry = false;
  this.a = ram[this.counter+1];
  this.b = ram[ram[this.counter+2]];
  ram[ram[this.counter+2]] = this.b+this.a;
  this.counter += 3;
}

instructionDictionary[0x26] = function()//xor % += %  (todo)
{
  this.carry = false;
  this.a = ram[ram[this.counter+1]];
  this.b = ram[ram[this.counter+2]];
  ram[ram[this.counter+2]] = this.b^this.a;
  this.counter += 3;
}

instructionDictionary[0x36] = function()//xor % += $  (todo)
{
  this.carry = false;
  this.a = ram[this.counter+1];
  this.b = ram[ram[this.counter+2]];
  ram[ram[this.counter+2]] = this.b^this.a;
  this.counter += 3;
}

instructionDictionary[0x27] = function()//or % += %  (todo)
{
  this.carry = false;
  this.a = ram[ram[this.counter+1]];
  this.b = ram[ram[this.counter+2]];
  ram[ram[this.counter+2]] = this.b|this.a;
  this.counter += 3;
}

instructionDictionary[0x37] = function()//or % += $  (todo)
{
  this.carry = false;
  this.a = ram[this.counter+1];
  this.b = ram[ram[this.counter+2]];
  ram[ram[this.counter+2]] = this.b|this.a;
  this.counter += 3;
}

instructionDictionary[0x28] = function()//and % += %  (todo)
{
  this.carry = false;
  this.a = ram[ram[this.counter+1]];
  this.b = ram[ram[this.counter+2]];
  ram[ram[this.counter+2]] = this.b&this.a;
  this.counter += 3;
}

instructionDictionary[0x38] = function()//and % += $  (todo)
{
  this.carry = false;
  this.a = ram[this.counter+1];
  this.b = ram[ram[this.counter+2]];
  ram[ram[this.counter+2]] = this.b&this.a;
  this.counter += 3;
}

instructionDictionary[0x29] = function()//>> % += %  (todo)
{
  this.carry = false;
  this.a = ram[ram[this.counter+1]];
  this.b = ram[ram[this.counter+2]];
  ram[ram[this.counter+2]] = this.b>>>this.a;
  this.counter += 3;
}

instructionDictionary[0x39] = function()//>> % += $  (todo)
{
  this.carry = false;
  this.a = ram[this.counter+1];
  this.b = ram[ram[this.counter+2]];
  ram[ram[this.counter+2]] = this.b>>>this.a;
  this.counter += 3;
}

instructionDictionary[0x2a] = function()//<< % += %  (todo)
{
  this.carry = false;
  this.a = ram[ram[this.counter+1]];
  this.b = ram[ram[this.counter+2]];
  ram[ram[this.counter+2]] = this.b<<this.a;
  this.counter += 3;
}

instructionDictionary[0x3a] = function()//<< % += $  (todo)
{
  this.carry = false;
  this.a = ram[this.counter+1];
  this.b = ram[ram[this.counter+2]];
  ram[ram[this.counter+2]] = this.b<<this.a;
  this.counter += 3;
}