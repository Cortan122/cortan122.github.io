const orderOfOperations = [
  [[','],'LtR'],
  [['=','+=','-=','*=','/=','%=','<<=','>>=','&=','^=','|='],'RtL'],
  [['?:'],'RtL'],//todo
  [['||'],'LtR'],
  [['&&'],'LtR'],
  [['|'],'LtR'],
  [['^'],'LtR'],
  [['&'],'LtR'],
  [['==','!='],'LtR'],
  [['<','<=','>','>='],'LtR'],
  [['<<','>>'],'LtR'],
  [['+','-'],'LtR'],
  [['*','/','%'],'LtR'],
  [['!','~','cast'],'RtL'],
  [['call','++','--','index'],'LtR']
];

const keywordRom = {
  return:arr=>{
    var r = arr[0];
    r.type = 'operator';
    r.p1 = parseExpression(arr.slice(1));
    return r;
  },
  //...
};

function flattenPunctuationTree(token){
  if(token.type!='punctuation')return token;
  var t = flattenPunctuationTree;
  return [].concat(t(token.p1),t(token.p2));
}

function printError(a,b){
  module.exports.printError(a,b);
}

function silent(func,err=()=>{}){
  var old = printError;
  printError = err;
  var r = func();
  printError = old;
  return r;
}

function printErrorToken(token){
  var q = token.string.length==1?"'":'"';
  printError(`unexpected ${q}${token.string}${q}`,token.pointer);
}

function expectToken(type,token,blocktype=undefined){
  if(token.type==type&&(blocktype==undefined||token.blocktype==blocktype))return true;
  var p = token.pointer;
  var s = token.string;
  if(blocktype){
    type = `'${blocktype}'`;
    s = token.blocktype;
  }
  var q = s.length==1?"'":'"';
  var n = type[0].match(/[euioa]/)?"n":'';
  printError(`unexpected ${q}${s}${q},expected a${n} ${type}`,p);
  return false;
}

function identifierMatch(code,index){
  var h = i=>code[i+index];
  var str = "";
  if(h(0).match(/[a-zA-Z_$]/)){
    str = h(0);
    for(var i = 1;i+index < code.length; i++){
      if(h(i).match(/[a-zA-Z_$0-9]/)){
        str += h(i);
      }else break;
    }
  }
  return str;
}

function numberMatch(code,index,regex=/[0-9]/){
  var h = i=>code[i+index];
  var str = "";
  for(var i = 0;i+index < code.length; i++){
    if(h(i).match(regex)){
      str += h(i);
    }else break;
  }
  return str;
}

function stringMatch(code,index){
  if(code[index]!='"')throw 122;
  var i = code.indexOf('"',index);
  return code.substring(index,i);
}

function operatorMatch(code,index){
  var h = i=>code[i+index];
  var str = "";
  for(var i = 0;i+index < code.length; i++){
    if("=-+*/?.<>&|^!~:".includes(h(i))){
      str += h(i);
    }else break;
  }
  return str;
}

/*function isTypeDescriptor(token){
  if(token.type!='identifier')return false;
  var r1 = ['void','extern'].includes(token.string);
  var r2 = ['int','byte'].includes(token.string);
  if(r1)token.isFuncProp = true;
  if(r1||r2){
    token.type1 = 'type';
    return true;
  }else return false;
}*/

function bracketLookup(strings,op='(',ed=')',start=0,lstart=0){
  var level = lstart;
  var errIndex = -1;
  for(var i = start;i < strings.length; i++){
    var b = strings[i];
    if(b==op){
      level++;
      errIndex = i;
    }
    if(b==ed){
      level--;
      if(level==0)return i;
    }
  }
  if(errIndex==-1)throw '2';
  var r = new Number(-1);
  r.errIndex = errIndex;
  return r;
}

function parseBlocks(tokens){
  var strings = tokens.map(e=>e.string);
  var res = []; 
  for(var i = 0; i < tokens.length; i++){
    var t = tokens[i];
    if(t.type!='punctuation'){
      res.push(t);
      continue;
    }
    var char = t.string;
    var ti = "[({".indexOf(char);
    if(ti!=-1){
      var char2 = "])}"[ti];
      var nexti = bracketLookup(strings,char,char2,i);
      if(nexti==-1){
        printError(`unbalanced '${char+char2}' brackets`,tokens[nexti.errIndex].pointer);
        nexti = tokens.length-1;
      }
      res.push({
        type:'block',
        blocktype:char,
        children:parseBlocks(tokens.slice(i+1,nexti)),
        pointer:t.pointer,
        endpointer:tokens[nexti].pointer
      });
      i = nexti;
    }else if(!")}]".includes(char)){
      res.push(t);
    }else{
      printErrorToken(t);
    }
  }
  return res;
}

function splitLines(tokens,separator=';',includeLast=false){
  if(tokens.length==0)return [];
  var r = [];
  var r1 = [];
  for(var i = 0; i < tokens.length; i++){
    var t = tokens[i];
    if(t.string==separator&&t.type=='punctuation'){
      r.push({
        type:'line',
        endpointer:t.pointer,
        children:r1
      });
      r1 = [];
    }else{
      r1.push(t);
    }
  }
  if(r1.length||includeLast){
    r.push({
      type:'line',
      endpointer:t.pointer+t.string.length,
      children:r1
    });
  }
  return r; 
}

var typedef = {};

function calcKeytype(token){
  var t = token;
  if(t.type!='identifier')return;
  const rom = {
    type:['int16','int8','void'],
    typedef:Object.keys(typedef),
    modifier:['extern','global','const','unsigned'],
    keyword:['if','for','return']
  };
  for(var k in rom){
    var v = rom[k];
    if(v.includes(t.string)){
      t.keytype = k;
      break;
    }
  }
  /*if(t.keytype=='typedef'){
    var v = typedef[t.string];
    //
  }*/
}

function parseType(tokens){
  if(tokens.length==0){
    printError(`warning: expected a type specifier (assuming int16)`,tokens.endpointer);
    return {
      type:'type',
      typetype:'int16'
    };
  }
  var last = tokens[tokens.length-1];
  if(last.type=='block'&&last.blocktype=='['){
    var block = last;
    var tkens = tokens.slice(0,tokens.length-1);
    var last1 = tkens[tkens.length-1];
    var isconstptr = false;
    if(last1.string=='const'){
      isconstptr = true;
      tkens = tkens.slice(0,tkens.length-1);
    }
    //todo: else if "func[]"
    var t = parseType(tkens);
    var isarr = block.children.length?true:false;
    r = {
      type:'type',
      typetype:isarr?'array':'pointer',
      target:t,
      const:isconstptr
    };
    if(isarr)r.length = parseExpression(block.children);
    return r;
  }
  var modifiers = tokens.slice(0,tokens.length-1);
  calcKeytype(last);
  var r;
  if(last.keytype=='typedef'){
    var t = typedef[last.string];
    r = JSON.parse(JSON.stringify(t));
  }else if(last.keytype=='type'){
    r = {
      type:'type',
      typetype:last.string
    };
  }else{
    printError(`warning: expected a type specifier (assuming int16)`,last.pointer);
    r = {
      type:'type',
      typetype:'int16'
    };
    modifiers.push(last);
  }
  var mods;
  if(r.target){
    var t = r;
    while(t.modifiers==undefined&&t.target){t = t.target;}
    mods = t.modifiers;
  }else{
    if(!r.modifiers)r.modifiers = [];
    mods = r.modifiers;
  }
  for (var i = 0; i < modifiers.length; i++) {
    var mod = modifiers[i];
    calcKeytype(mod);
    if(mod.keytype!='modifier'){
      printError(`invalid type modifier`,mod.pointer);
      continue;
    }
    var modstr = mod.string;
    if(r.target&&modstr=='const'){
      if(r.const)printError(`duplicate type modifier`,mod.pointer);
      r.const = true;
      continue;
    }
    if(mods.includes(modstr)){
      printError(`duplicate type modifier`,mod.pointer);
      continue;
    }
    mods.push(modstr);
  }
  return r;
}

function parseFuncHeader(tokens){
  var block = tokens[tokens.length-1];
  var name = tokens[tokens.length-2];
  var t = tokens.slice(0,tokens.length-2);
  t.endpointer = name.pointer;
  var type = parseType(t);
  if(!expectToken('identifier',name))return;
  if(!expectToken('block',block,'('))return;
  var argtokens = splitLines(block.children,',',true);
  var args = argtokens.map(e=>e.children);
  var rargs = [];
  for (var i = 0; i < args.length; i++) {
    var arg = args[i];
    if(arg.length==0){
      printError(`unexpected '${i==args.length-1?')':','}'`,argtokens[i].endpointer);
    }else{
      let name = arg[arg.length-1];
      let t = arg.slice(0,arg.length-1);
      t.endpointer = name.pointer;
      let type = parseType(t);
      name = name.string;
      rargs.push({type,name});
    }
  }
  return {
    type:'header',
    name:name.string,
    returntype:type,
    args:rargs,
    pointer:name.pointer
  };
}

function parseVar(tokens){
  var name = tokens[tokens.length-1];
  var t = tokens.slice(0,tokens.length-1);
  t.endpointer = name.pointer;
  var type = parseType(t);
  if(!expectToken('identifier',name))return;
  return {
    type:'var',
    vartype:type,
    name:name.string,
    pointer:name.pointer
  }; 
}

function findHiddenOperators(tokens){
  var newtokens = [];
  for (var i = 0; i < tokens.length; i++) {
    var t = tokens[i];
    var prev = tokens[i-1];
    if(!prev)prev = {};
    var next = tokens[i+1];
    if(!next)next = {};
    var str;
    if(t.type=='block'&&t.blocktype=='['){
      str = 'index';
    }else if(t.type=='block'&&t.blocktype=='('){
      if(prev.type=='identifier'){
        str = 'call';
      }else if(next.type=='identifier'){
        str = 'cast';
      }else if(prev.type=='block'&&prev.blocktype=='('){
        //todo
        var bool = true;
        var type = silent(()=>parseType(prev.children),str=>{
          if(!str.startsWith('warning:'))bool = false;
        });
        str = bool?'cast':'call';
      }
    }
    if(str){
      newtokens.push({
        type:'operator',
        string:str,
        pointer:t.pointer
      });
    }
    newtokens.push(t);
  }
  return newtokens;
}

function parseExpression(tokens){
  if(tokens.length==0)return;
  if(tokens.length==1){
    var token = tokens[0];
    if(token.blocktype=='('||token.blocktype=='['){
      return parseExpression(token.children);
    }
    //todo
    return token;
  }
  const order = orderOfOperations;
  tokens = findHiddenOperators(tokens);
  for (var i = 0; i < order.length; i++) {
    var [ops,dirstr] = order[i];
    var [dir,zero,len] = dirstr!='LtR'?[1,0,tokens.length]:[-1,tokens.length-1,-1];
    for (var j = zero; j != len; j+=dir) {
      var token = tokens[j];
      for(var op of ops){
        if(token.type!='punctuation'&&token.type!='operator')continue;
        if(op!=token.string)continue;
        //todo: printError
        token.p1 = parseExpression(tokens.slice(0,j));
        token.p2 = parseExpression(tokens.slice(j+1));
        return token;
      }
    }
  }
  throw 'todo:parseExpression';//todo: printError
}

function getLineStrings(line){
  return line.map(e=>{
    if(e.string)return e.string;
    else if(e.blocktype)return e.blocktype;
    else throw 122;
  });
}

function canBeAVariableDeclaration(tokens){
  var i = 0;
  for(var t of tokens){
    if(t.type=='identifier'){i++;continue;}
    if(t.blocktype=='[')continue;
    return false;
  }
  if(i<2)return false;
  return true;
}

function parseCodeLine(line,out){
  /*var line;
  if(linetoken instanceof Array){
    line = linetoken;
  }else{
    line = linetoken.children;
  }*/
  if(line.length==0)return;
  var keyword = line[0].string;
  var strings = getLineStrings(line);
  if(keywordRom[keyword]){
    return keywordRom[keyword](line);
  }
  if(strings[1]==':'&&line[0].type=='identifier'){
    out.unshift(parseCodeLine(line.slice(2),out));
    return {
      type:'var',
      vartype:'label',
      name:keyword,
      pointer:line[0].pointer
    };
  }
  if(canBeAVariableDeclaration(line)){
    return parseVar(line);
  }
  var index = strings.indexOf('=');
  if(index==-1){
    return parseExpression(line);
  }else if(index == line.length-1){
    printErrorToken(line[line.length-1]);
  }
  var part1 = line.slice(0,index);
  var part2 = line.slice(index+1);
  if(!canBeAVariableDeclaration(part1)){
    return parseExpression(line);
  }
  var res = parseVar(part1);
  if(part2.length){
    res.init = parseExpression(part2);
    if(res.init.type=='punctuation'){
      res.init.list = flattenPunctuationTree(res.init);
    }
  }
  return res;
}

function parseCode(tokens){
  var lines = splitLines(tokens);
  var result = [];
  for(var i = 0; i < lines.length; i++){
    var out = [];
    var t = parseCodeLine(lines[i].children,out);
    if(t)result.push(t);
    out.map(e=>result.push(e));
  }
  return result;
  //throw 'todo:parseCode';
}

function parseTree(tokens){
  //tokens.forEach(calcKeytype);
  var tree = parseBlocks(tokens);
  var lines = splitLines(tree);
  var result = [];
  for(var i = 0; i < lines.length; i++){
    var linetoken = lines[i];
    var line = linetoken.children;
    var strings = getLineStrings(line);
    var first = line[0];
    var last = line[line.length-1];
    if(first.string=='typedef'){
      var name = last;
      if(name.type!='identifier'){
        printError(`expected an identifier`,name.pointer);
        continue;
      }
      calcKeytype(name);
      if(name.keytype){
        printError(`trying to redifine "${name.string}"`,name.pointer);
        continue;
      }
      typedef[name.string] = parseType(line.slice(1,line.length-1));
      continue;
    }else if(last.blocktype=='('&&!strings.includes('=')){
      result.push(parseFuncHeader(line));
      continue;
    }else if(last.blocktype=='{'){
      var t = parseFuncHeader(line.slice(0,line.length-1));
      //result.push(t);
      result.push({
        type:'funccode',
        header:t,
        code:parseCode(last.children)
      });
      continue;
    }else/* if(strings.includes('='))*/{
      var index = strings.indexOf('=');
      if(index==-1)index = line.length;
      else if(index == line.length-1){
        printErrorToken(last);
      }
      var part1 = line.slice(0,index);
      var part2 = line.slice(index+1);
      var res = parseVar(part1);
      if(part2.length){
        res.init = parseExpression(part2);
        if(res.init.type=='punctuation'){
          res.init.list = flattenPunctuationTree(res.init);
        }
      }
      result.push(res);
    }
  }
  /*
  for(var i = 0; i < tokens.length; i++){
    var t = tokens[i];
    var b = isTypeDescriptor(t);
    if(!b)printErrorToken(t);
  }*/
  return result;
}

function main(code){
  var tokens = [];
  for(var i = 0; i < code.length; i++){
    var idm = identifierMatch(code,i);
    if(idm!=''){
      tokens.push({
        type:'identifier',
        string:idm,
        pointer:i
      });
      i += idm.length-1;
      continue;
    }
    var char = code[i];
    if(char=='"'){
      var str = stringMatch(code,index);
      tokens.push({
        type:'string',
        string:str,
        pointer:i
      });
      i += str.length-1;
      continue;
    }
    if(char=='0'&&code[i+1].match(/[xodb]/i)){
      var str = code.substr(i,2)+numberMatch(code,i+2,/[0-9a-f]/i);
      tokens.push({
        type:'number',
        string:str,
        pointer:i
      });
      i += str.length-1;
      continue;
    }
    var numm = numberMatch(code,i);
    if(numm!=''){
      tokens.push({
        type:'number',
        string:numm,
        pointer:i
      });
      i += numm.length-1;
      continue;
    }
    if("[](){};,".includes(char)){
      tokens.push({
        type:'punctuation',
        string:char,
        pointer:i
      });
      if(char=='}'){
        tokens.push({
          type:'punctuation',
          string:';',
          pointer:-1
        });
      }
      continue;
    }
    var opm = operatorMatch(code,i);
    if(opm!=''){
      tokens.push({
        type:'operator',
        string:opm,
        pointer:i
      });
      i += opm.length-1;
      continue;
    }
    if(char.match(/[\n ]/))continue;
    printError(`unexpected '${char}'`,i);
    var t = {
      type:'unknown',
      string:char,
      pointer:i
    };
    printErrorToken(t);
    tokens.push(t);
  }
  var tree = parseTree(tokens);
  return tree;
}

module.exports.main = main;
