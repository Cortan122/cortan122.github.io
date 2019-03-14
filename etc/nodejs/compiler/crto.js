const bin = require('./binjson.js');
const fs = require('fs');
const path = require('path');
const type = bin.parse(`S({
  headerLength:uint16,
  pic:bool,
  pos:uint16,
  externs:D([uint16]),
  globals:D(uint16),
})`);

//externs actually point to the address right after their destination (offset by 2)

//should be named Object.map
function sortObject(unordered,map=(e,k)=>e,filter=(e,k)=>true){
  var ordered = {};
  Object.keys(unordered).sort().forEach(function(key) {
    if(filter(unordered[key],key))ordered[key] = map(unordered[key],key);
  });
  return ordered;
}

function encode(obj){
  if(typeof obj.code == "string"){
    obj.code = Buffer.from(obj.code,'hex');
  }
  var code = obj.code;

  obj.externs = sortObject(obj.externs,e=>e.sort((a,b)=>a-b),e=>e.length);
  obj.globals = sortObject(obj.globals);

  obj.headerLength = 0xf00d;
  var header = Buffer.from(bin.encode(type,obj),'hex');
  header.writeInt16BE(header.length,0);

  var r = Buffer.concat([header,code],code.length+header.length);

  return r;
}

function decode(buf){
  if(typeof buf == "string"){
    buf = Buffer.from(buf,'hex');
  }

  var r = bin.decode_rest(type,buf);
  r.code = r.rest;
  delete r.rest;

  return r;
}

function read(filename){
  var t = decode(fs.readFileSync(filename));
  if(t==undefined)throw "why";
  t.length = t.code.length;
  t.name = path.basename(filename);
  return t;
}

function write(filename,data){
  fs.writeFile(filename,encode(data),e=>{if(e)throw e;});
}

module.exports = {decode,encode,read,write,startPos:4,entryPoint:"start"};

// @ts-ignore
if(require.main == module){
  var files = process.argv.slice(2);
  for(var name of files){
    var t = read(name);
    delete t.code;
    console.log(JSON.stringify(t,null,2));
  }
}
