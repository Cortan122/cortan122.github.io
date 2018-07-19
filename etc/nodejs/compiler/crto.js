const biner = require('./binjson.js');
const fs = require('fs');
const path = require('path');
const type = biner.parse(`S({
  pic:bool,
  pos:uint16,
  externs:D([uint16]),
  globals:D(uint16)
})`);

function encode(obj){
  if(typeof obj.code == "string"){
    obj.code = Buffer.from(obj.code,'hex');
  }
  var code = obj.code;
  //delete obj.code;

  var header = Buffer.from(biner.encode(type,obj),'hex');

  var r = Buffer.concat([header,code],code.length+header.length);

  return r;
}

function decode(buf){
  if(typeof buf == "string"){
    buf = Buffer.from(buf,'hex');
  }

  var r = biner.decode_rest(type,buf);
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
