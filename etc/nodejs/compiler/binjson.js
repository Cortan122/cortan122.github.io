const arrayLengthLength = 4;
const tempBuffer = Buffer.alloc(8);

//todo: this is bad?
//what is this for?
var oldtoString = Array.prototype.toString;
Array.prototype.toString = function(){
  return '['+oldtoString.call(this)+']';
}

function S(obj){
  if(typeof obj == "object"){
    if(Array.isArray(obj)){
      this.isAnonymous = true;
    }else{
      this.isAnonymous = false;
    }
    this.names = Object.keys(obj);
    this.types = this.names.map(e=>obj[e]);
  }else throw 'invalid type:new S(...) expects on object';
}

S.prototype.toString = function(){
  return `S(${this.types})`;
};

function D(type){
  this.type = type;
}

D.prototype.toString = function(){
  return `D(${this.type})`;
};

function tohex(num,len=2,signed=false){
  if(typeof num != 'number')throw new TypeError('int is not a number');
  if(!Number.isInteger(num))throw new TypeError('int is a float');
  if(signed){
    tempBuffer.writeIntBE(num,0,len/2);
  }else{
    tempBuffer.writeUIntBE(num,0,len/2);
  }
  return tempBuffer.toString('hex',0,len/2);
  /*
    if(typeof num != 'number')throw new TypeError('int is not a number');
    if(!Number.isInteger(num))throw new TypeError('int is a float');
    if(num<0){
      if(!signed)throw new TypeError('unsigned int is negative');
      if(num<-(1<<(len*4)))throw new TypeError('int too negative');
      num &= parseInt("f".repeat(len),16);
      console.log(-1&parseInt("f".repeat(len),16))
    }
    if(num.toString(2).length > len*4-(+signed))throw new TypeError('int too big');
    var s = num.toString(16);
    while(s.length < len){
      s = '0'+s;
    }
    return s;
  */
}

function encode_str(str){
  if(typeof str != "string")throw new TypeError('string is not an string');
  return Buffer.from(str,'utf8').toString('hex')+'00';
}

function encode_S(type,data){
  var types = type.types;
  var names = type.names;
  var r = '';
  for(var i = 0;i < types.length;i++){
    r += encode(types[i],data[names[i]]);
  }
  return r;
}

function encode_D(type,data){
  var ks = Object.keys(data);
  var vs = ks.map(e=>data[e]);
  return encode(new S({ks:["string"],vs:[type]}),{vs,ks});
}

function encode_arr(type,data){
  if(!Array.isArray(data))throw new TypeError('array is not an array');
  var r = tohex(data.length,arrayLengthLength);
  for(var i = 0;i < data.length;i++){
    r += encode(type,data[i]);
  }
  return r;
}

function encode(type,data){
  const rom = {
    "string":encode_str,
    "bool":e=>{
      if(e===true)return '01';
      else if(e===false)return '00';
      else throw new TypeError(` not a bool (${e})`);
    },
    "uint8":e=>tohex(e,2,false),
    "int8":e=>tohex(e,2,true),
    "uint16":e=>tohex(e,4,false),
    "int16":e=>tohex(e,4,true),
    "uint24":e=>tohex(e,6,false),
    "int24":e=>tohex(e,6,true),
    "uint32":e=>tohex(e,8,false),
    "int32":e=>tohex(e,8,true),
    "uint40":e=>tohex(e,10,false),
    "int40":e=>tohex(e,10,true),
    "uint48":e=>tohex(e,12,false),
    "int48":e=>tohex(e,12,true),
    "float32":e=>{
      if(typeof e != 'number')throw new TypeError('float is not a number');
      tempBuffer.writeFloatBE(e,0);
      return tempBuffer.toString('hex',0,4);
    },
    "float64":e=>{
      if(typeof e != 'number')throw new TypeError('float is not a number');
      tempBuffer.writeDoubleBE(e,0);
      return tempBuffer.toString('hex',0,8);
    }
    // unstable:
    // "uint56":e=>tohex(e,14,false),
    // "int56":e=>tohex(e,14,true),
    // "uint64":e=>tohex(e,16,false),
    // "int64":e=>tohex(e,16,true)
  };
  if(typeof type == "string"){
    var t = rom[type];
    if(!t)throw `invalid type:${type}`;
    return t(data);
  }
  if(type instanceof S){
    return encode_S(type,data);
  }
  if(type instanceof D){
    return encode_D(type.type,data);
  }
  if(Array.isArray(type)){
    if(type.length != 1)throw `invalid type:${type}`;
    return encode_arr(type[0],data);
  }
  throw `invalid type:${type}`;
}

function fromhex(str,pb,len=2,signed=false){
  //tempBuffer.write(str.substr(pb[0],len),0,len,'hex');
  var t;
  if(signed){
    t = str.readIntBE(pb[0],len/2);
  }else{
    t = str.readUIntBE(pb[0],len/2);
  }
  pb[0] += len/2;
  return t;
  /*
    var c = str.substr(pb[0],len);
    var num = parseInt(c,16);
    if( signed && num >= 1<<(len*4-1) ){
      num = (1<<(len*4))-num;
    }
    pb[0] += len;
    return num;
  */
}

function decode_bool(str,pb){
  var c = str[pb[0]];
  pb[0] += 1;
  if(c==1)return true;
  else if(c==0)return false;
  else throw new TypeError('not a bool');
}

function decode_str(str,pb){
  for (var i = pb[0]; true ; i++) {
    var s = str[i];
    if(s=="00")break;
  }
  var r = str.toString('utf8',pb[0],i);
  pb[0] = i+1;
  return r;
}

function decode_arr(type,str,pb){
  var r = [];
  var len = fromhex(str,pb,arrayLengthLength,false);
  //pb[0] += arrayLengthLength;
  for (var i = 0; i < len; i++) {
    r.push(decode(type,str,pb));
  }
  return r;
}

function decode_S(type,str,pb){
  var types = type.types;
  var names = type.names;
  var r = {};
  for(var i = 0;i < types.length;i++){
    r[names[i]] = decode(types[i],str,pb);
  }
  if(type.isAnonymous){
    var rr = [];
    for (var i = 0;i < types.length; i++){
      rr[i] = r[i];
    }
    r = rr;
  }
  return r;
}

function decode_D(type,str,pb){
  var {ks,vs} = decode(new S({ks:["string"],vs:[type]}),str,pb);
  var r = {};
  for (var i = 0; i < ks.length; i++) {
    r[ks[i]] = vs[i];
  }
  return r;
}

function decode(type,data,pb){
  if(!pb)pb = [0];
  if(typeof data == "string"){
    data = Buffer.from(data,'hex');
  }
  const rom = {
    "string":decode_str,
    "bool":decode_bool,
    "uint8":(a,b)=>fromhex(a,b,2,false),
    "int8":(a,b)=>fromhex(a,b,2,true),
    "uint16":(a,b)=>fromhex(a,b,4,false),
    "int16":(a,b)=>fromhex(a,b,4,true),
    "uint24":(a,b)=>fromhex(a,b,6,false),
    "int24":(a,b)=>fromhex(a,b,6,true),
    "uint32":(a,b)=>fromhex(a,b,8,false),
    "int32":(a,b)=>fromhex(a,b,8,true),
    "uint40":(a,b)=>fromhex(a,b,10,false),
    "int40":(a,b)=>fromhex(a,b,10,true),
    "uint48":(a,b)=>fromhex(a,b,12,false),
    "int48":(a,b)=>fromhex(a,b,12,true),
    "float32":(str,pb)=>{
      //tempBuffer.write(str.substr(pb[0],8),0,8,'hex');
      pb[0] += 8/2;
      var t = tempBuffer.readFloatBE(pb[0]);
      return t;
    },
    "float64":(str,pb)=>{
      //tempBuffer.write(str.substr(pb[0],16),0,16,'hex');
      pb[0] += 16/2;
      var t = tempBuffer.readDoubleBE(pb[0]);
      return t;
    }
    // unstable:
    // "uint56":(a,b)=>fromhex(a,b,14,false),
    // "int56":(a,b)=>fromhex(a,b,14,true),
    // "uint64":(a,b)=>fromhex(a,b,16,false),
    // "int64":(a,b)=>fromhex(a,b,16,true)
  };
  if(typeof type == "string"){
    var t = rom[type];
    if(!t)throw `invalid type:${type}`;
    return t(data,pb);
  }
  if(type instanceof S){
    return decode_S(type,data,pb);
  }
  if(type instanceof D){
    return decode_D(type.type,data,pb);
  }
  if(Array.isArray(type)){
    if(type.length != 1)throw `invalid type:${type}`;
    return decode_arr(type[0],data,pb);
  }
  throw `invalid type:${type}`;
}

function guess_arr(arr){
  var types = [];
  var bool = false;
  for (var i = 0; i < arr.length; i++) {
    types[i] = guess(arr[i]);
    if(i != 0&&!bool){
      if(types[0].toString()!=types[i].toString())bool = true;
    }
  }
  if(bool){
    return new S(types);
  }
  return [types[0]];
}

function guess_obj(obj){
  var types = [];
  var typeo = {};
  var bool = false;
  var arr = Object.keys(obj);
  for (var i = 0; i < arr.length; i++) {
    types[i] = guess(obj[arr[i]]);
    typeo[arr[i]] = types[i];
    if(i != 0&&!bool){
      if(types[0].toString()!=types[i].toString())bool = true;
    }
  }
  if(bool){
    return new S(typeo);
  }
  return new D(types[0]);
}

function guess(obj){
  if(Array.isArray(obj)){
    return guess_arr(obj);
  }
  if(typeof obj == "string"){
    return "string";
  }
  if(typeof obj == "boolean"){
    return "bool";
  }
  if(typeof obj == "number"){
    if(Number.isInteger(obj))return "int48";
    return "float64";
  }
  if(typeof obj == "object"){
    return guess_obj(obj);
  }
  throw obj;//can not guess
}

function parse(type){
  const vm = require('vm');
  var sandbox = {};

  sandbox.S = a=>new S(a);
  sandbox.D = a=>new D(a);
  const __types = ["string","bool","uint8","int8","uint16","int16","uint24","int24","uint32","int32","uint40","int40","uint48","int48","float32","float64"];
  for(var i = 0; i < __types.length; i++){
    sandbox[__types[i]] = __types[i];
  }
  var t = vm.runInNewContext(type,sandbox);
  return t;
}

function decode_rest(type,data){
  if(typeof data == "string"){
    data = Buffer.from(data,'hex');
  }
  var pb = [0];
  var r = decode(type,data,pb);
  r.rest = data.slice(pb[0]);
  return r;
}

/*var o = [[1,1,3,44,4567,-1],'hi',[{n:'122'},{m:'12'}]];
var t = guess(o);
var h = encode(t,o);
var r = decode(t,h);
console.log(r);*/

module.exports = {parse,guess,decode,encode,decode_rest};
