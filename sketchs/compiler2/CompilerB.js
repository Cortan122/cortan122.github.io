var adressAdress = 0x7fff;

var compilerB = {
  nesting:0,
  f:0,
  run:function (data) {
    // body...
    var r = 'mov %{0} $0\n'.format(this.numToString(adressAdress));
    for (var i = 0; i < data.length; i++) {
      this.f = this[data[i]];
      if(typeof this.f == 'function'){
        r += this.f().format(this.numToString(adressAdress));;
      }else if(typeof this.f == 'string'){
        r += this.f.format(this.numToString(adressAdress));
      }else{continue;}
      r += "\n";
    }
    return r;
  }
};

compilerB.numToString = function(n){
  var s = '0x'+n.toString(16);
  /*if(s.length > 2){
    if(s.length == 3)s = '0'+s; 
    var s1 = s.substr(0,2);
    var s2 = s.substr(2,4);
    s = s1+' '+s2;
  }*/
  return s;
}

compilerB['>'] = 'inc %{0}';//'73 {0}';
compilerB['<'] = 'add %{0} $0xff';//'1f {0} ff';
compilerB['+'] = 'mov %this+6 %{0}\n inc %204';//' 72 cc';
compilerB['-'] = 'mov %this+6 %{0}\n add %204 $0xff';
compilerB['.'] = 'mov %this+6 %{0}\n shw %204';
//compilerB[','] = 'mov %this+6 %{0}\n shw %204';
compilerB['['] = function(){
  var r = "var startloop"+this.nesting+" +this \n";
  r += 'mov %this+6 %{0}\n mov acc %204\n add acc $0xff\n jnc %-endloop'+this.nesting;
  this.nesting++;
  return r;
};
compilerB[']'] = function(){
  this.nesting--;
  var r = "jmp %startloop"+this.nesting+" \nvar endloop"+this.nesting+" -this";
  return r;
};
