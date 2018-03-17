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

instructionDictionary1['#'] = function(data)
{return data;}

instructionDictionary1['var'] = function(data)
{
  var a = data.split(" ");
  var s = a[1];
  var i = s.indexOf('this');
  if(i != -1){
    var n = (this.r.split(" ").length-1);
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
        this.r = this.r.substring(0, num) + compileNumber(s) + this.r.substring(num+s1.length);
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
  return "01 "+compileNumber(s.slice(1));
}

instructionDictionary1['jc'] = function(s)
{
  if(s.charAt(0) != '%'){print("line "+this.i+':'+"expected % but found "+s);return "";}
  return "84 "+compileNumber(s.slice(1));
}

instructionDictionary1['mov'] = function(data)
{
  var a = data.split(" ");
  var s = a[1];
  var r = "";
  if(s.charAt(0) != '%' && s.charAt(0) != '$'){print("line "+this.i+':'+"expected % or $ but found "+s);return "";}
  if(s.charAt(0) == '$'){r = "12 "+compileNumber(s.slice(1));}else{r = "02 "+compileNumber(s.slice(1));}
  s = a[0];
  if(s.charAt(0) != '%'){print("line "+this.i+':'+"expected % but found "+s);return "";}
  r += " "+compileNumber(s.slice(1));
  return r;
}

instructionDictionary1['swp'] = function(data)
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
}

instructionDictionary1['inc'] = function(s)
{
  if(s.charAt(0) != '%'){print("line "+this.i+':'+"expected % but found "+s);return "";}
  return "03 "+compileNumber(s.slice(1));
}

instructionDictionary1['dis'] = function(s)
{return "20";}

instructionDictionary1['shw'] = function(s)
{
  if(s.charAt(0) != '%'){print("line "+this.i+':'+"expected % but found "+s);return "";}
  return "10 "+compileNumber(s.slice(1));
}

instructionDictionary1['add'] = function(data)
{
  var a = data.split(" ");
  var s = a[1];
  var r = "";
  if(s.charAt(0) != '%' && s.charAt(0) != '$'){print("line "+this.i+':'+"expected % or $ but found "+s);return "";}
  if(s.charAt(0) == '$'){r = "35 "+compileNumber(s.slice(1));}else{r = "25 "+compileNumber(s.slice(1));}
  s = a[0];
  if(s.charAt(0) != '%'){print("line "+this.i+':'+"expected % but found "+s);return "";}
  r += " "+compileNumber(s.slice(1));
  return r;
}

instructionDictionary1['xor'] = function(data)
{
  var a = data.split(" ");
  var s = a[1];
  var r = "";
  if(s.charAt(0) != '%' && s.charAt(0) != '$'){print("line "+this.i+':'+"expected % or $ but found "+s);return "";}
  if(s.charAt(0) == '$'){r = "36 "+compileNumber(s.slice(1));}else{r = "26 "+compileNumber(s.slice(1));}
  s = a[0];
  if(s.charAt(0) != '%'){print("line "+this.i+':'+"expected % but found "+s);return "";}
  r += " "+compileNumber(s.slice(1));
  return r;
}

instructionDictionary1['or'] = function(data)
{
  var a = data.split(" ");
  var s = a[1];
  var r = "";
  if(s.charAt(0) != '%' && s.charAt(0) != '$'){print("line "+this.i+':'+"expected % or $ but found "+s);return "";}
  if(s.charAt(0) == '$'){r = "37 "+compileNumber(s.slice(1));}else{r = "27 "+compileNumber(s.slice(1));}
  s = a[0];
  if(s.charAt(0) != '%'){print("line "+this.i+':'+"expected % but found "+s);return "";}
  r += " "+compileNumber(s.slice(1));
  return r;
}

instructionDictionary1['and'] = function(data)
{
  var a = data.split(" ");
  var s = a[1];
  var r = "";
  if(s.charAt(0) != '%' && s.charAt(0) != '$'){print("line "+this.i+':'+"expected % or $ but found "+s);return "";}
  if(s.charAt(0) == '$'){r = "38 "+compileNumber(s.slice(1));}else{r = "28 "+compileNumber(s.slice(1));}
  s = a[0];
  if(s.charAt(0) != '%'){print("line "+this.i+':'+"expected % but found "+s);return "";}
  r += " "+compileNumber(s.slice(1));
  return r;
}

instructionDictionary1['shr'] = function(data)
{
  var a = data.split(" ");
  var s = a[1];
  var r = "";
  if(s.charAt(0) != '%' && s.charAt(0) != '$'){print("line "+this.i+':'+"expected % or $ but found "+s);return "";}
  if(s.charAt(0) == '$'){r = "39 "+compileNumber(s.slice(1));}else{r = "29 "+compileNumber(s.slice(1));}
  s = a[0];
  if(s.charAt(0) != '%'){print("line "+this.i+':'+"expected % but found "+s);return "";}
  r += " "+compileNumber(s.slice(1));
  return r;
}

instructionDictionary1['shl'] = function(data)
{
  var a = data.split(" ");
  var s = a[1];
  var r = "";
  if(s.charAt(0) != '%' && s.charAt(0) != '$'){print("line "+this.i+':'+"expected % or $ but found "+s);return "";}
  if(s.charAt(0) == '$'){r = "3a "+compileNumber(s.slice(1));}else{r = "2a "+compileNumber(s.slice(1));}
  s = a[0];
  if(s.charAt(0) != '%'){print("line "+this.i+':'+"expected % but found "+s);return "";}
  r += " "+compileNumber(s.slice(1));
  return r;
}