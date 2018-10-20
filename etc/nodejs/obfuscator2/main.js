const fs = require('fs');
const compressor = require("uglify-es");
const esprima = require("esprima");

function doubleShuffle(a,b){
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
    [b[i], b[j]] = [b[j], b[i]];
  }
  return [a,b];
}

function randomRange(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function minify(code){
  const options = {
    ecma:8,
    mangle:{
      properties:true,
      toplevel:true,
      // reserved:['o'],
    },
    compress:{
      unsafe_undefined:true,
      unsafe:true,
      unsafe_arrows:true,
      unsafe_comps:true,
      unsafe_Function:true,
      unsafe_math:true,
      unsafe_methods:true,
      unsafe_proto:true,
      unsafe_regexp:true,
      passes:3,
      toplevel:true,
      // top_retain:['code'],
      keep_fargs:false,
    }
  };
  var r = compressor.minify(code,options);
  if(r.error)console.error(r.error);
  return r.code;
}

function escape(str){
  return str.replace(/[\\"']/g,'\\$&').replace(/[\n]/g,'\\n');
}

function randomChar(i){
  var t = Math.max(126,i+0x20);
  return String.fromCharCode(randomRange(0x20,t));
}

function generateObfuscatedStringPair(string){
  var _rhelp = randomChar;
  var rhelp = (i,s)=>{
    var r = _rhelp(i);
    while(s.includes(r)||r==""){
      r = _rhelp(i);
    }
    return r;
  }
  var str21 = "";
  var str22 = "";
  var str1 = "";
  for(var i = 0; i < string.length; i++){
    var c = string[i];
    var ind = str22.indexOf(c);
    var cy;
    if(ind==-1){
      ind = str22.length;
      str22 += c;
      cy = rhelp(ind,str21);
      str21 += cy;
    }else{
      cy = str21[ind];
    }
    str1 += cy;
  }
  if(str21.length!=str22.length)throw 122;
  [str21,str22] = doubleShuffle(str21.split(''),str22.split(''));
  return [escape(str1),escape(str21.join('')+str22.join(''))];
}

function tokenMatch(pattern,line){
  //if(pattern.length!=line.length)return false;
  var r = [];
  for(var i = 0; i < line.length; i++){
    var t = line[i];
    var c = pattern[i];
    if(t==undefined || c==undefined){
      return false;
    }
    var bool = (c=='S' && t.type=='String');
    bool |= (c=='I' && t.type=='Identifier');
    if(bool){
      r.push(t.value);
    }else if(c==t.value && t.type=='Punctuator'){
      //do nothing
    }else if(c=='K' && t.type=='Keyword'){
      var ind = pattern.indexOf(')',i);
      var str = pattern.substring(i+1,ind);
      if(t.value!=str)return false;
      pattern = pattern.substr(ind-i);
    }else{
      return false;
    }
  }
  return r;
}

function reverseObject(json){
  var ret = {};
  for(var key in json){
    ret[json[key]] = key;
  }
  return ret;
}

function alloc_helper(env){
  var k;
  var set = env['@rev'];
  var len = Object.keys(set).length;
  do{
    k = randomChar(len);
  }while(k in set);
  return k;
}

function alloc(env,name=undefined){
  var k = alloc_helper(env);
  if(name){
    if(name in env)return env[name];
    env[name] = k;
  }
  env['@rev'][k] = name;
  return k;
}

function free(env,key){
  var rev = env['@rev'];
  var name = rev[key];
  if(name){
    delete env[name];
  }
  delete rev[key];
  env['@res'] += env['@tkey']+'4'+key+'0';
}

function assert(env,key,val){
  var k = key[val];
  if(k[0]=='$' && k.length==2){
    return k[1];
  }
  if(!(k in env)){
    console.error(`${k} is not defined`);
    return env['@tkey'];
  }
  /*if(val!=oval && env[key[val]]){
    console.error(`${key[val]} is not a function`);
    return env['@tkey'];
  }*/
  return env[k];
}

function newString(name,raw,env){
  var notraw = esprima.parse(raw).body[0].expression.value;
  if(notraw.length==0)throw 1;
  var key = alloc(env,name);
  var tkey = alloc(env);

  env['@res'] += key+'1'+notraw[0]+'0';
  for (var i = 1; i < notraw.length; i++) {
    env['@res'] += tkey+'1'+notraw[i]+'0'+key+'3'+key+tkey;//t1e0 r3rt
  }

  free(env,tkey);
}

function parseSourceLine(line,env,index){
  if(line.length==0)return;

  const tokenRom = {
    'I=S':m=>{newString(...m,env);},
    'Kreturn)I':m=>env['@tkey']+"0"+assert(env,m,0)+"0",
    'Kdelete)I':m=>{free(env,assert(env,m,0));},
    'I=I+I':m=>alloc(env,m[0])+"3"+assert(env,m,1)+assert(env,m,2),
    'I=I[I]':m=>alloc(env,m[0])+"2"+assert(env,m,1)+assert(env,m,2),
    'I=I()':m=>alloc(env,m[0])+assert(env,m,1)+"00",
    'I=I(I)':m=>alloc(env,m[0])+assert(env,m,1)+assert(env,m,2)+"0",
    'I=I(I,I)':m=>alloc(env,m[0])+assert(env,m,1)+assert(env,m,2)+assert(env,m,3),
  };

  var bool = false;
  for(var key in tokenRom){
    var m = tokenMatch(key,line);
    if(m){
      var t = tokenRom[key](m);
      if(t){
        env['@res'] += t;
      }
      bool = true;
      break;
    }
  }
  if(!bool){
    console.error(`unknown line pattern at line `+index);
  }

  var arr = env['@usage'][index-1];
  if(arr&&line[0].value!='return'){
    for(var name of env['@usage'][index-1]){
      free(env,env[name]);
    }
  }
}

function getUsageData(lines,env){
  var identifiers = lines.map(e=>e.filter(e=>e.type=='Identifier'&&e.value[0]!='$').map(e=>e.value));
  var res = {};
  identifiers.map((e,i)=>{
    e.map(e=>{
      if(!(e in res))res[e] = 0;
      res[e] = Math.max(res[e],i);
    });
  });
  var ret = {};
  for(var key in res){
    if(!(res[key] in ret))ret[res[key]] = [];
    ret[res[key]].push(key);
  }
  env['@usage'] = ret;
}

function parseSource(string){
  var tokens = esprima.tokenize(string);
  var env = {"global":9,"getenv":8,"delete":4,"add":3,"index":2,"quote":1,"identity":0};
  env['@rev'] = reverseObject(env);
  env['@res'] = '';
  env['@tkey'] = alloc(env);
  var arr = [];
  var lines = [];
  for(var t of tokens){
    if(t.value != ";"){
      arr.push(t);
    }else{
      lines.push(arr);
      arr = [];
    }
  }
  lines.push(arr);

  getUsageData(lines,env);
  lines.map((e,i)=>{
    parseSourceLine(e,env,i+1);
  });

  return env['@res'];
}

var recursive_file = fs.readFileSync("./recursive.js").toString();
var vm_file = fs.readFileSync("./vm.js").toString();
var code_file = fs.readFileSync("./source.js").toString();

var code = parseSource(code_file);

var f1 = `var code = "${escape(code)}";`;
var vm_string = minify({f1,vm_file});

var strings = generateObfuscatedStringPair(vm_string);
var f2 = `var str1 = "${strings[0]}";var str2 = "${strings[1]}"`;
var r = minify({f2,recursive_file});

// console.log(r);

console.log( eval(eval(r)) );
