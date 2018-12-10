const gApi = require('./googleApiWrapper.js');

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

/** @type {Arch} */
var arch = Object.assign({},Default);

/** @type {number} */
var asyncCounter;
var callback_global;

/**
 * @param {string} name
 */
function queryRegister(name){
  for(var arr of arch.registers){
    if(arr.includes(name)){
      var size = arr[arr.length-1];
      let name = arr[0];
      if(typeof size == 'string')throw 122;
      if(typeof name != 'string')throw 122;
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
function init(name,callback){
  arch = Object.assign(arch,require(name));
  if(!arch.instructionPointer){
    var t = arch.registers[0][0];
    if(typeof t == 'number')throw 122;
    arch.instructionPointer = t;
  }
  if(arch.ramSize == undefined){
    arch.ramSize = 1<<(queryRegisterLength(arch.instructionPointer)*8);
  }
  arch.maxRegisterSize = Math.max( ...arch.registers.map(e=>e[e.length-1]).map(e=>typeof e=='number'?e:-1) );

  callback_global = callback;
  asyncCounter = 1;
  parseArchTable(arch);
  asyncCounter--;
  asyncEnd();
}

function asyncEnd(){
  if(asyncCounter!=0)return;
  callback_global();
}

function parseArchTable(arch){
  if(arch.table.arr)return;
  var type = arch.table.type.toLowerCase();
  if(type=="google"){
    asyncCounter++;
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
      asyncCounter--;
      setTimeout(asyncEnd,1);
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
};

module.exports = exportedObject;

/** 
 * @typedef {object} Arch
 * @property {{type:string,arr?:string[]}} table
 * @property {(string|number)[][]} registers
 * @property {string=} instructionPointer
 * @property {string} endianness
 * @property {number=} ramSize
 * @property {number} startOfExecution
 * @property {number=} maxRegisterSize
 * @property {string[][]} additionalTableEntries
 * @property {string[]} additionalEmulatorCode
 * @property {Object<string,string[]>} compoundRegisters
 * @property {(string|((...arr:string[])=>string))[][]} instructions
 */
