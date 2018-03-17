console.log('Assembler');
function Assembler(){
  this.data;
  this.s;
  this.i;
  this.f;
  this.r;
  
  this.run = function(data) {
    this.data = data.split("\n").join(" \n ");
    this.s = data.split("\n");
    this.r = "";
    for(this.i = 0;this.i < this.s.length;this.i++){
      var a = this.s[this.i].split("//")[0];
      if(a.length == 0){continue;}
      var s = a.split(" ");
      var c = [];
      for(var i in s){if(s[i].length != 0){c.push(s[i]);};}
      if(c.length == 0){continue;}
      
      this.f = instructionDictionary1[c[0]/*a.substr(0,3)*/];
      if(this.f == undefined){print("line "+this.i+':'+c[0]+" is not a valid instruction");continue;}
      c.shift();
      var b = this.f(c.join(" "));
      if(b != ""){this.r += b+" \n";}
    }
    this.r += "00";
    return this.r;
  }
}

Assembler.differentiateInstructionLength = function(shortopcode,longopcode,value){
  if(value.match(/[^0-9a-fA-F]/) != null){return longopcode+" "+value+" placeholder";}
  if(value.length > 2){
    if(value.length == 3){value = "0"+value;}
    return longopcode+" "+value.slice(0,2)+" "+value.slice(2,Number.MAX_VALUE);
  }
  return shortopcode+" "+value;
}

Assembler.differentiateNumberLength = function(value){
  if(value.match(/[^0-9a-fA-F]/) != null){return value+" placeholder";}
  if(value.length > 2){
    if(value.length == 3){value = "0"+value;}
    return value.slice(0,2)+" "+value.slice(2,Number.MAX_VALUE);
  }
  return value;
}

Assembler.getOperandType = function(op){
  if(op == 'ACC'||op == 'acc'){return 0;}
  if(op == 'PC'||op == 'pc'){return 1;}
  if(op.charAt(0) == '%'){
    if(compileNumber(op.slice(1)).length > 2){return 3;}else{return 2;}
  }
  if(op.charAt(0) == '$'){return 4;}
  print("line "+this.i+':'+"Operand:"+op+" is invalid");
}

Assembler.getInstructionType = function(op1,op2){
  var op1type = Assembler.getOperandType(op1);
  var op2type = Assembler.getOperandType(op2);
  if(op1type == op2type && (op1type <= 1)){print("line "+this.i+':'+"Assembler.getInstructionType:op1type == op2type");return;}
  if(op1type == 4){print("line "+this.i+':'+"immediate values cant be set");return;}
  var result = (op1type << 2)|0x80;
  if(op2type == 4){
    result |= op1type;
    if(op1type >= 2){result &= 0x7f;}
  }else{result |= op2type;}
  return {r:result,op1:op1type,op2:op2type};
}

Assembler.assembleMathInstruction = function(data,opcode){
  var a = data.split(" ");
  var type = Assembler.getInstructionType(a[0],a[1]);
  var r = (type.r | opcode).toString(16);
  if(type.op1 >= 2){r += " "+Assembler.differentiateNumberLength(compileNumber(a[0].slice(1)));}
  if(type.op2 >= 2){r += " "+Assembler.differentiateNumberLength(compileNumber(a[1].slice(1)));}
  return r;
}

instructionDictionary1['#'] = function(data)
{return data;}

instructionDictionary1['var'] = function(data)
{
  var a = data.split(" ");
  var s = a[1];
  var i = s.indexOf('this');
  if(i != -1){
    var n = (this.r.split(" ").length-1)+startPos;
    if(s.length > 4+i){n += eval(s.slice(4+i));}
    var m = (i > 0)?(s.charAt(0)):"";
    var c = s.charAt(i-1);
    s = m +'0x'+ n.toString(16);
    if(c == '+'){ 
      var s1 = a[0];
      if(s.charAt(0) == c){s = s.substr(1);}
      if(s1.charAt(0) == '%' || s1.charAt(0) == '$'){print("line "+this.i+':'+"warning :expected name but found "+s);s1 = "////"+s1;}
      var index = this.data.split("\n", this.i+1).join("\n").length;
      this.data = this.data.slice(0,index) + this.data.slice(index).replace(new RegExp('([^A-Za-z0-9_])('+s1+')([^A-Za-z0-9_])'),new Function('m','p1','n','p3','return p1+"'+s+'"+p3;'))
      this.s = this.data.split("\n");
      return "";
    }
    if(c == '-'){
      if(s.charAt(0) == c){s = s.substr(1);}
      var s1 = a[0];
      var num = this.r.lastIndexOf(s1);
      if (num >= 0) {
        var value = compileNumber(s);
        if(value.length <= 2){value = "00 "+value;}
        this.r = this.r.substring(0, num) + Assembler.differentiateNumberLength(value) + this.r.substring(num+s1.length+" placeholder".length);
      }
      return "";
    }
  }
  else if(s.charAt(0) != '%' && s.charAt(0) != '$'){print("line "+this.i+':'+"warning :expected % or $ but found "+s);/*return "";*/}
  var s1 = a[0];
  if(s1.charAt(0) == '%' || s1.charAt(0) == '$'){print("line "+this.i+':'+"warning :expected name but found "+s);s1 = "////"+s1;}
  this.data = this.data.replace(new RegExp('([^A-Za-z0-9_])('+s1+')([^A-Za-z0-9_])','mg'),new Function('m','p1','n','p3','return p1+"'+s+'"+p3;')/*function replacer(m,p1,n,p3) { return p1+"hi"+p3;}*/)
  this.s = this.data.split("\n");
  return "";
}

instructionDictionary1['jmp'] = function(s)
{
  if(s.charAt(0) != '%'){print("line "+this.i+':'+"expected % but found "+s);return "";}
  return Assembler.differentiateInstructionLength('85','01',compileNumber(s.slice(1)));
}

instructionDictionary1['jc'] = function(s)
{
  if(s.charAt(0) != '%'){print("line "+this.i+':'+"expected % but found "+s);return "";}
  return Assembler.differentiateInstructionLength('02','12',compileNumber(s.slice(1)));//"2 "+compileNumber(s.slice(1));
}

instructionDictionary1['jnc'] = function(s)
{
  if(s.charAt(0) != '%'){print("line "+this.i+':'+"expected % but found "+s);return "";}
  return Assembler.differentiateInstructionLength('03','13',compileNumber(s.slice(1)));//"2 "+compileNumber(s.slice(1));
}

instructionDictionary1['mov'] = function(data)
{return Assembler.assembleMathInstruction(data,0);}

/*instructionDictionary1['swp'] = function(data)
{
  var a = data.split(" ");
  var s = a[1];
  var r = "";
  if(s.charAt(0) != '%'){print("line "+this.i+':'+"expected % but found "+s);return "";}
  r = "22 "+compileNumber(s.slice(1));
  s = a[0]; 
  if(s.charAt(0) != '%'){print("line "+this.i+':'+"expected % but found "+s);return "";}
  r += " "+compileNumber(s.slice(1));
  return r;
}*/

instructionDictionary1['inc'] = function(s)
{
  var t = Assembler.getOperandType(s);
  if(t == 4){print("line "+this.i+':'+"immediate values cant be set");return "";}
  var r = (t|0x70).toString(16);
  if(t == 2){r += " "+compileNumber(s.slice(1));}
  if(t == 3){r += " "+Assembler.differentiateNumberLength(compileNumber(s.slice(1)));}
  return r;//"03 "+compileNumber(s.slice(1));
}

instructionDictionary1['dis'] = function(s)
{return "20";}

instructionDictionary1['shw'] = function(s)
{
  if(s.charAt(0) != '%'){print("line "+this.i+':'+"expected % but found "+s);return "";}
  return "10 "+compileNumber(s.slice(1));
}

instructionDictionary1['add'] = function(data)
{return Assembler.assembleMathInstruction(data,1<<4);}

instructionDictionary1['xor'] = function(data)
{return Assembler.assembleMathInstruction(data,4<<4);}

instructionDictionary1['or'] = function(data)
{return Assembler.assembleMathInstruction(data,3<<4);}

instructionDictionary1['and'] = function(data)
{return Assembler.assembleMathInstruction(data,2<<4);}

instructionDictionary1['shr'/*'rsh'*/] = function(data)
{return Assembler.assembleMathInstruction(data,6<<4);}

instructionDictionary1['shl'/*'lsh'*/] = function(data)
{return Assembler.assembleMathInstruction(data,5<<4);}