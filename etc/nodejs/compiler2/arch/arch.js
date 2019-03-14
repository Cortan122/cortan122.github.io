const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const gApi = require('./googleApiWrapper.js');

/** @type {Arch} */
const Default = {
  "table":{
    "type":"Default",
  },
  "additionalTableEntries":[],
  "endianness":"big",
  // "instructionPointer":"ip",
  "startOfExecution":0,
  "registers":[],
  "compoundRegisters":{},
  "additionalEmulatorCode":[],
  "instructions":[],
  // "ramSize":0x10000,
};

var arch = Object.assign({},Default);

/**
 * @param {string} name
 */
function queryRegister(name){
  for(var arr of arch.registers){
    if(arr[0].includes(name)){
      var size = arr[1];
      let name = arr[0][0];
      return {size,name};
    }
  }
  return null;
}

/**
 * @param {string} name
 * @returns {number}
 */
function queryRegisterLength(name){
  var t = queryRegister(name);
  if(t)return t.size;
  return null;
}

/**
 * @param {string} name
 * @returns {string}
 */
function queryRegisterName(name){
  var t = queryRegister(name);
  if(t)return t.name;
  return null;
}

/**
 * @param {string} name
 * @returns {(...arr:string[])=>string}
 */
function queryInstruction(name){
  for(var arr of arch.instructions){
    if(arr.includes(name)){
      var t = arr[arr.length-1];
      if(typeof t == 'string')throw 122;
      return t;
    }
  }
  return null;
}

/**
 * @param {string} name
 * @param {()=>void} callback
 */
function init(name,callback=()=>{}){
  Object.assign(arch,require(name));
  arch.name = name;
  if(!arch.instructionPointer){
    var t = arch.registers[0][0][0];
    arch.instructionPointer = t;
  }
  if(arch.ramSize == undefined){
    arch.ramSize = 1<<(queryRegisterLength(arch.instructionPointer)*8);
  }
  arch.maxRegisterSize = Math.max( ...arch.registers.map(e=>e[1]) );

  if(arch.table.arr){
    callback();
    return;
  }
  arch.table.arr = readTables()[name];
  if(arch.table.arr){
    callback();
    return;
  }

  cp.execFileSync("node",[__filename,name]);
  arch.table.arr = readTables()[name];
  if(!arch.table.arr){
    throw Error("the execFileSync trick did not work 😭");
  }

  callback();
}

function readTables(){
  var p = path.join(__filename,"./tables.json");
  if(!fs.existsSync(p))fs.writeFileSync(p,"{}");
  return JSON.parse(fs.readFileSync(p,'utf-8'));
}

function parseArchTable(callback,name=undefined){
  if(name){
    Object.assign(arch,require(name));
    arch.name = name;
  }else{
    name = arch.name;
  }

  const callback2 = ()=>{
    var json = readTables();
    json[name] = arch.table.arr;
    var p = path.join(__filename,"./tables.json");
    fs.writeFile(p,JSON.stringify(json),()=>callback());
  };

  var type = arch.table.type.toLowerCase();
  if(type=="google"){
    gApi.getSpreadsheetValues({spreadsheetId:arch.table.id,range:arch.table.range},(err,res)=>{
      if(err)throw err;
      const rows = res.data.values;
      if(!rows.length)throw Error('No data found.');
      var arr = [].concat(...rows.map(e=>{
        while(e.length<16){
          e.push('');
        }
        return e;
      }));
      arch.table.arr = arr;
      setTimeout(callback2,1);
    });
  }else{
    //todo
    throw "unknown arch table type";
  }
}

var exportedObject = {
  init,
  queryRegister,
  queryRegisterLength,
  queryRegisterName,
  queryInstruction,
  arch,
  parseArchTable,
};

module.exports = exportedObject;

// @ts-ignore
if(require.main == module){
  parseArchTable(()=>{},process.argv[2]||"crtb.arch.js");
}

/**
 * @typedef {object} Arch
 * @property {{type:string,id?:string,range?:string,arr?:string[]}} table
 * @property {[string[],number][]} registers
 * @property {string=} instructionPointer
 * @property {"big"|"little"} endianness
 * @property {number=} ramSize
 * @property {number} startOfExecution
 * @property {number=} maxRegisterSize
 * @property {[RegExp,string][]} additionalTableEntries
 * @property {string[]} additionalEmulatorCode
 * @property {Object<string,string[]>} compoundRegisters
 * @property {[string,((...arr:string[])=>string)][]} instructions
 * @property {string=} name
 */
