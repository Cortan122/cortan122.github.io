var assignmentOperators = [];
var operators = [];
console.log('Compiler');

function Compiler(source){
  this.data;
  this.s;
  this.i;
  this.f;
  this.r = '';
  this.vars = {};
  this.source = source;
  this.nesting = 0;
  this.RAMsize = RAMsize;
  this.stackAddress = RAMsize-0x10;//0xf0;
  this.temp1 = 'ACC';//'%'+(this.stackAddress-0x2);
  this.temp2 = '%'+(this.stackAddress-0x3);
  this.freeRAM = Array.from(Array(this.RAMsize).keys()).reverse();
  if(source != undefined){
    this.nesting = source.nesting + 1;
    this.vars = clone(source.vars);
    this.freeRAM = source.freeRAM.slice();
  }else{
    ram[this.stackAddress] = this.stackAddress;
    this.vars['MAX_VALUE'] = {v:"$"+(RAMsize-1)};
    this.vars['COLOR'] = {v:"%"+(RAMsize-1)};
    this.vars['PIXEL_X'] = this.vars['PIXEL'] = {v:"%"+(RAMsize-2)};
    this.vars['INPUT'] = {v:"%"+(RAMsize-3)};
    this.vars['PIXEL_Y'] = {v:"%"+(RAMsize-4)};
    this.vars['MOUSE_X'] = {v:"%"+(RAMsize-5)};
    this.vars['MOUSE_Y'] = {v:"%"+(RAMsize-6)};
  }
}

Compiler.prototype.prep = function(data) {
  if(this.source == undefined){
    data = data.replace(new RegExp('(\\/\\/)([^\\n])*','mg'),"");
    data = data.replace(new RegExp('[\\n\\x0d]+','mg'),"");
    data = data.replace(new RegExp('([^\\*\\/])(\\*\\/)','mg'),function replacer(m,p1) { return p1+"」";});
    data = data.replace(new RegExp('([^\\*\\/])(\\/\\*)','mg'),function replacer(m,p1) { return p1+"「";});
    data = data.replace(new RegExp('(「)([^」])*(」)','mg'),"");
    data = data.replace(new RegExp('( )*([^A-Za-z0-9_ ])','mg'),function replacer(m,p1,p2,p3) { return p2;});
    data = data.replace(new RegExp('([^A-Za-z0-9_ ])( )*','mg'),function replacer(m,p1,p2,p3) { return p1;});
    
    this.freeRAM.splice(this.freeRAM.indexOf(this.stackAddress-0x2), 1);//0xee, 0xff and 0xed are used as temporary vars
    this.freeRAM.splice(this.freeRAM.indexOf(this.stackAddress-0x3), 1);
    this.freeRAM.push(this.freeRAM.splice(0, this.freeRAM.indexOf(this.stackAddress-1)));
    //this.r = "jmp %13 \nmov %this+7 {0} \nadd {0} ${1} \nmov %this+4 %0xcc \njmp %0xcc \n".format('%'+this.stackAddress,this.RAMsize-1);
  }else{this.r = "";}
  this.data = data;
  this.s = this.split(data);
}

Compiler.prototype.split = function(data) {
  var s1 = data.split(";");
  var r = [];
  for(var i1 = 0;i1 < s1.length;i1++){
    var a = s1[i1];
    if(a.length == 0){continue;}
    var s = a.split(/\b/);
    var c = [];
    for(var i in s){
      if(s[i].length != 0 && s[i] != " "){
        if(s[i].length == 2 && s[i].match(/[\\(\\)]/g) != null && s[i].match(/[\\(\\)]/g).length == 1){c.push(s[i].charAt(0));c.push(s[i].charAt(1));}
        else{c.push(s[i]);}
      }
    }
    if(c.length == 0){continue;}
    r.push(c);
  }
  return r;
}
  
Compiler.prototype.run = function(data) {
  this.prep(data);
  
  for(this.i = 0;this.i < this.s.length;this.i++){
    var c = this.s[this.i];
    
    var v = this.vars[c[0]];
    if(v != undefined){
      if(c[1] == '['){
        if(c[3][0] == ']'){
          if(v.type != 'array'){print("line "+this.i+':'+c[0]+"is not a array");continue;}
          var f = operators['_arrayset'].format(this.compileVariable(c[0]),this.compileVariable(c[2]),/*this.math(c.slice(4,Number.MAX_VALUE))*/);
          var o = assignmentOperators[c[3].substring(1)];
          if(o == undefined){print("line "+this.i+':'+c[3].substring(1)+" is not a valid assignmentOperator");continue;}
          f += " \n"+o.format("%0xcc",this.math(c.slice(4,Number.MAX_VALUE)));
        }else{print("line "+this.i+':'+"expected ] but found "+c[3]);continue;}
      }else if(c[1] == '()'){
        if(v.type != 'function'){print("warning:line "+this.i+':'+c[0]+"is not an function");}
        var f = operators['_functioncall'].format(this.compileVariable(c[0]),'%'+this.stackAddress);
      }else{
        var o = assignmentOperators[c[1]];
        if(o == undefined){print("line "+this.i+':'+c[1]+" is not a valid assignmentOperator");continue;}
        var f = o.format(this.compileVariable(c[0]),this.math(c.slice(2,Number.MAX_VALUE)),undefined,undefined,this.RAMsize-1);
      }
      if(f.match(/\{[0-9]+\}/) != null){print('wat!?');continue;}
      
      this.r += f+" \n";
      continue;
    }
    
    this.f = keywordDictionary[c[0]];
    if(this.f == undefined){print("line "+this.i+':'+c[0]+" is not a valid keyword");continue;}
    c.shift();
    var b = this.f(c);
    if(b != ""){this.r += b+" \n";}
    
  }
  if(this.source != undefined){this.source.i += this.i;}
  return this.r;
}

Compiler.prototype.math = function(data) {
  var temp1 = this.temp1;var temp2 = this.temp2;
  if(data.length == 1){return this.compileVariable(data[0]);}
  if(data.length == 3){
    var o;
    if((o = operators[data[1]]) != undefined){
      //var temp1 = '%0xee';var temp2 = '%0xed';
      var v1 = this.compileVariable(data[0]);
      var v2 = this.compileVariable(data[2]);
      if(v1[0] == '$' && v2[0] == '$'){
        v1 = v1.substr(1,9999);v2 = v2.substr(1,9999);
        return this.compileVariable(eval(v1+data[1]+v2).toString());
      }
      var f = o.format(v1,v2,temp1,temp2,this.RAMsize-1);
      if(f.match(/\{[0-9]+\}/) != null){return undefined;}
      
      this.r += f+" \n";
      return temp1;
    }
    else{print("line "+this.i+':'+data[1]+" is not a valid operator");return undefined;}
  }else if(data.length == 4){
    if(data[1] == '['){
      if(data[3] == ']'){
        var v = this.vars[data[0]];
        if(v.type != 'array'){print("line "+this.i+':'+data[0]+"is not a array");return undefined;}
        if(!v.hardness){
          var f = operators['_arrayget'].format(
            this.compileVariable(data[0]),this.compileVariable(data[2]),temp1);
        }else{
          var f = operators['_arrayget2'].format(
            v.v1,this.compileVariable(data[2]),temp1,v.v0);
        }
      }else{print("line "+this.i+':'+"expected ] but found "+data[3]);return undefined;}
    }
    //todo
    if(f.match(/\{[0-9]+\}/) != null){return undefined;}
    this.r += f+" \n";
    return temp1;
  }
  //todo
  return undefined;
}
  
Compiler.prototype.compileVariable = function(data) {
  if(this.vars[data] != undefined){return this.vars[data].v;}
  else if(data.charAt(0) == '%'||data.charAt(0) == '$'){return data;}
  else if(data.startsWith('0b')){return '$'+(parseInt(data.slice(2),2).toString(10));}
  else if(data.startsWith('0x')){return '$'+(parseInt(data.slice(2),16).toString(10));}
  else if(data.search(/[^0-9]/) == -1){return '$'+(parseInt(data,10).toString(10));}
  else {print(data +"is not a variable");return undefined;}
}

Compiler.prototype.brackets = function(data) {
  var p;
  var c = 0;
  var i = 0;
  var r = [];
  while((p = data.indexOf('(',i)) != -1){
  for(i = p;i < data.length;i++){
    if(data[i] == '('){c++;}
    if(data[i] == ')'){c--;}
    if(c == 0){break;}
  }
  r.push(data.slice(p+1, i));
  }
  return r;
}

Compiler.prototype.brackets2 = function(data,char1,char2) {
  if(char1 == undefined){char1 = '(';}
  if(char2 == undefined){char2 = ')';}
  var p;
  var c = 0;
  var i = 0;
  
  p = data.indexOf(char1,i)
  for(i = p;i < data.length;i++){
    if(data[i] == char1){c++;}
    if(data[i] == char2){c--;}
    if(c == 0){break;}
  }
  return data.slice(p+1, i);
}

Compiler.prototype.allocate = function() {
  var v = this.freeRAM.shift();
  return {v : '%0x'+v.toString(16)};
}

operators['_arrayget2'] = "mov %-_arrayget ${0} \nadd %-_arrayget {1} \nvar _arrayget -this+2 \nvar _arrayget -this+2 \nmov {2} %{3}";//(array,index,out value,array part 2)
operators['_arrayget'] = "mov %this+9 {0} \nadd %this+5 {1} \nmov {2} %0xcc";//(array,index,out value)
//operators['_arrayset'] = "mov %this+7 {0} \nadd %this+4 {1}";// \nmov %0xcc {2}";//(array,index,value)
operators['_arrayset'] = "mov %-_arrayset {0} \nadd %-_arrayset {1} \nvar _arrayset -this+1 \nvar _arrayset -this+1";// \nmov %0xcc {2}";//(array,index,value)
//operators['_functioncall'] = "inc {1} \nmov %this+5 {1} \nmov %0xcc $this+5 \njmp {0}";
operators['_functioncall'] = "call {0}";
//operators['_return'] = "mov %this+7 {0} \nadd {0} ${1} \nmov %this+4 %0xcc \njmp %0xcc";
//operators['_return'] = "jmp %2";
operators['_return'] = "return";

operators['*'] = "mov {2} $0 \nmov {3} {1} \nadd {3} ${4} \nvar m +this \nadd {2} {0} \nadd {3} ${4} \njc %m";//fixme: a*0 takes a ton of time to compute (but 0*a is fine)
operators['>='] = "mov {2} {1} \nxor {2} ${4} \ninc {2}\nadd {2} {0}";//fixme: if a == 0||b == 0 it returns true
operators['<='] = "mov {2} {0} \nxor {2} ${4} \ninc {2}\nadd {2} {1}";//fixme: if a == 0||b == 0 it returns true
operators['!='] = "mov {2} {0} \nxor {2} ${4} \ninc {2}\nadd {2} {1} \nadd {2} ${4}";

operators['-'] = "mov {2} {0} \nmov {3} {1} \nxor {3} ${4} \nadd {2} {3}";//not tested

operators['+'] = "mov {2} {0} \nadd {2} {1}";
operators['^'] = "mov {2} {0} \nxor {2} {1}";
operators['|'] = "mov {2} {0} \nor  {2} {1}";
operators['&'] = "mov {2} {0} \nand {2} {1}";
operators['>>'] = "mov {2} {0} \nshr {2} {1}";
operators['<<'] = "mov {2} {0} \nshl {2} {1}";

assignmentOperators['=']  = "mov {0} {1}";
assignmentOperators['+='] = "add {0} {1}";
assignmentOperators['++'] = "inc {0}";
assignmentOperators['--'] = "add {0} ${4}";
assignmentOperators['^='] = "xor {0} {1}";
assignmentOperators['|='] = "or  {0} {1}";
assignmentOperators['&='] = "and {0} {1}";
assignmentOperators['>>='] = "shr {0} {1}";
assignmentOperators['<<='] = "shl {0} {1}";

operators = Object.assign(operators, assignmentOperators);

keywordDictionary['eval'] = function(data)
{eval(data.join(' '));return "";}

keywordDictionary['#'] = function(data)
{return data.join(' ').replace(/([\$\%])( )\b/g,function replacer(m,p1) { return p1;});}

keywordDictionary['var'] = function(data)
{
  var v = data[0];
  if(data[1] == 'array'){
    if(data[2] == '(' && data[4] == ')'){
      var l = parseInt(compileNumber(data[3]),16);
      if(data[5] == 'as'){
        var b = data[6]+data[7];
        if(b[0] != '%'){print("line "+this.i+':expected % but found '+data[6]);return "";}
        a = compileNumber(data[7]);
        this.freeRAM.splice(this.freeRAM.indexOf(a),l);
      }else{
        a = this.freeRAM.splice(0,l);
        a = a[a.length-1];
      }
      var s = a.toString(16);
      if(s.length == 3){s = '0'+s;}
      var v1 = s[s.length-2]+s[s.length-1];
      this.vars[v] = {v:'$0x'+s,type:'array',v1:'0x'+v1,v0:'0x'+s,hardness:(s.length>2)}
    }else{print("line "+this.i+':array needs length');}
    return "";
  }
  if(data[1] == 'as'){
    var a = data[2]+data[3];
    var r = this.freeRAM;
    if( (!r.includes(compileNumber(a))) || a[0] != '%'){this.vars[v] = {v:a};data.splice(1,3);if(a[0] == '%'){r.splice(r.indexOf(compileNumber(a)), 1);this.freeRAM = r;}}
    else{print("line "+this.i+':'+a+' is already occupied by a variable');}
  }else{this.vars[v] = this.allocate();}
  if(data[1] == '='){return assignmentOperators['='].format(this.vars[v].v,this.math(data.splice(2,Number.MAX_VALUE)));}
  return "";
}

keywordDictionary['if'] = function(data)
{
  var index = this.data.split(";", this.i).join(";").length;
  if(index > 0){index++;}
  var rb = this.brackets2(this.data.substring(index),'(',')');
  var cb = this.brackets2(this.data.substring(index),'{','}');
  this.math(this.split(rb)[0]);
  //this.r += "jc %this+4 \njmp %-endif"+this.nesting+" \n\n"; //"jnc %-endif"
  this.r += "jnc %-endif"+this.nesting+" \n\n"; //"jnc %-endif"
  var c = new Compiler(this);
  this.r += c.run(cb);
  if(this.data.substring(index+cb.length+rb.length+6).startsWith('else')){
    this.r += "jmp %-endelse"+this.nesting+" \n";
    this.r += "var endif"+this.nesting+" -this \n\n";
    cb = this.brackets2(this.data.substring(index+cb.length+rb.length+6),'{','}');
    var c = new Compiler(this);
    this.r += c.run(cb);
    this.r += "var endelse"+this.nesting+" -this \n\n";
  }else{
    this.r += "var endif"+this.nesting+" -this \n\n";
  }
  return "";
}

keywordDictionary['while'] = function(data)
{
  var index = this.data.split(";", this.i).join(";").length;
  var rb = this.brackets2(this.data.substring(index),'(',')');
  var cb = this.brackets2(this.data.substring(index),'{','}');
  this.r += "var startloop"+this.nesting+" +this \n";
  this.math(this.split(rb)[0]);
  //this.r += "jc %this+4 \njmp %-endloop"+this.nesting+" \n\n"; //"jnc %-endif"
  this.r += "jnc %-endloop"+this.nesting+" \n\n";
  var c = new Compiler(this);
  this.r += c.run(cb);
  this.r += "jmp %startloop"+this.nesting+" \nvar endloop"+this.nesting+" -this \n\n";
  return "";
}

keywordDictionary['do'] = function(data)// do{}while()
{
  var index = this.data.split(";", this.i).join(";").length;
  var cb = this.brackets2(this.data.substring(index),'{','}');
  this.r += "var startloop"+this.nesting+" +this \n\n";
  var c = new Compiler(this);
  this.r += c.run(cb);
  var rb = this.brackets2(this.data.substring(index+cb.length+4),'(',')');//fixme: it Doesn't care if 'while' is actually there
  if(rb == "true"){
    this.r += "jmp %startloop"+this.nesting+" \n\n";
    return "";
  }
  this.math(this.split(rb)[0]);
  this.r += "jc %startloop"+this.nesting+" \n\n";
  return "";
}

keywordDictionary['function'] = function(data)
{
  var name = data[0];
  var index = this.data.split(";", this.i).join(";").length;
  var cb = this.brackets2(this.data.substring(index),'{','}');
  this.r += "jmp %-startfunc"+this.nesting+" \nvar func"+name+" this \n\n";
  this.vars[name] = {v:'%func'+name,type:'function'}
  var c = new Compiler(this);
  this.r += c.run(cb);
  this.r += operators['_return'].format('%'+this.stackAddress,this.RAMsize-1) + "\n";
  this.r += "var startfunc"+this.nesting+" -this \n\n";
  return "";
}

keywordDictionary['return'] = function(data)
{
  return operators['_return'].format('%'+this.stackAddress,this.RAMsize-1);
}

//keywordDictionary['call'] = function(data)
//{
//  var name = data[0];
//  return ("inc {0} \nmov %this+5 {0} \nmov %placeHolder $this+5 \njmp %func"+name+"\n").format('%'+this.stackAddress);
//}