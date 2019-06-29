// based on https://github.com/assister-ai/pythonic

class Iterator{
  constructor(generator){
    this[Symbol.iterator] = generator;
  }

  async *[Symbol.asyncIterator](){
    for(const element of this){
      yield await element;
    }
  }

  map(callback){
    const result = [];
    var i = 0;
    for(const element of this){
      result.push(callback(element, i, this));
      i++;
    }

    return result;
  }

  filter(callback=e=>e){
    const result = [];
    var i = 0;
    for(const element of this){
      if(callback(element, i, this)){
        result.push(element);
      }
      i++;
    }

    return result;
  }

  reduce(callback, initialValue){
    let empty = typeof initialValue === 'undefined';
    let accumulator = initialValue;
    let index = 0;
    for(const currentValue of this){
      if(empty){
        accumulator = currentValue;
        empty = false;
        continue;
      }

      accumulator = callback(accumulator, currentValue, index, this);
      index++;
    }

    if(empty){
      throw new TypeError('Reduce of empty Iterator with no initial value');
    }

    return accumulator;
  }

  some(callback=e=>e){
    var i = 0;
    for(const element of this){
      if(callback(element, i, this)){
        return true;
      }
      i++;
    }

    return false;
  }

  every(callback=e=>e){
    var i = 0;
    for(const element of this){
      if(!callback(element, i, this)){
        return false;
      }
      i++;
    }

    return true;
  }

  static fromIterable(iterable){
    if(iterable instanceof Iterator)return iterable;// todo?
    return new Iterator(function*(){
      for(const element of iterable){
        yield element;
      }
    });
  }

  toArray(){
    return Array.from(this);
  }

  next(){
    if(!this.currentInvokedGenerator){
      this.currentInvokedGenerator = this[Symbol.iterator]();
    }

    return this.currentInvokedGenerator.next();
  }

  reset(){
    delete this.currentInvokedGenerator;
  }

  slice(...a){
    return slice(this,...a);
  }
}

function rangeSimple(stop){
  return Object.assign(new Iterator(function*(){
    for(let i = 0; i < stop; i++){
      yield i;
    }
  }),{start:0,stop,step:1});
}

function rangeOverload(start, stop, step = 1){
  return Object.assign(new Iterator(function*(){
    for(let i = start; i < stop; i += step){
      yield i;
    }
  }),{start,stop,step});
}

function range(...args){
  if(args.length < 2)return rangeSimple(...args);
  return rangeOverload(...args);
}

function enumerate(iterable){
  return new Iterator(function*(){
    let index = 0;
    for(const element of iterable){
      yield [index, element];
      index++;
    }
  });
}

const zip = longest => (...iterables) => {
  if(iterables.length < 2){
    throw new TypeError(`zip takes 2 iterables at least, ${iterables.length} given`);
  }

  return new Iterator(function*(){
    const iterators = iterables.map(iterable => Iterator.fromIterable(iterable));
    while(true){
      const row = iterators.map(iterator => iterator.next());
      const check = longest ? row.every.bind(row) : row.some.bind(row);
      if(check(next => next.done)){
        return;
      }

      yield row.map(next => next.value);
    }
  });
};

function items(obj){
  let {keys, get} = obj;
  if(obj instanceof Map){
    keys = keys.bind(obj);
    get = get.bind(obj);
  }else{
    keys = function(){
      return Object.keys(obj);
    };

    get = function(key){
      return obj[key];
    };
  }

  return new Iterator(function*(){
    for(const key of keys()){
      yield [key, get(key)];
    }
  });
}

function all(iter){
  for(const element of iter){
    if(!element)return false;
  }
  return true;
}

function any(iter){
  for(const element of iter){
    if(element)return true;
  }
  return false;
}

function bin(x){
  return (x<0?'-':'')+'0b'+abs(x).toString(2);
}

function bool(x){
  return !!x;
}

function chr(i){
  return String.fromCodePoint(i);
}

function float(x){
  if(typeof x == "string"){
    x = x.replace(/inf/i,'Infinity');
    x = x.replace(/Infinity/i,'Infinity');
    return parseFloat(x);
  }else if(typeof x == "number"){
    return x;
  }
  return null;
}

function hex(x){
  return (x<0?'-':'')+'0x'+abs(x).toString(16);
}

function input(prompt=''){
  const readlineSync = require('readline-sync');
  return readlineSync.question(prompt);
}

function int(x,base=10){
  if(x == undefined)return 0;
  if(typeof x == "number")return floor(x);
  if(typeof x == "string")return parseInt(x,base);
}

function len(s){
  if(s instanceof Set)return s.size();
  if(s instanceof Map)return s.size();
  if(Array.isArray(s))return s.length;
  if(s && typeof s == "object")return Object.keys(s).length;
  return null;
}

function list(iter){
  if(iter == undefined)return [];
  if(Array.isArray(iter))return iter; // todo?
  return Array.from(iter);
}

function min(...arr){
  if(arr.length==1 && typeof arr[0][Symbol.iterator] == "function"){
    return Math.min(...arr[0]);
  }
  return Math.min(...arr);
}

function max(...arr){
  if(arr.length==1 && typeof arr[0][Symbol.iterator] == "function"){
    return Math.max(...arr[0]);
  }
  return Math.max(...arr);
}

function oct(x){
  return (x<0?'-':'')+'0o'+abs(x).toString(8);
}

function ord(s){
  return s.codePointAt(0);
}

function pow(x,y,m){
  if(m == undefined)return x**y;
  return x**y % m; //todo
}

function print_overloaded(arr,{sep=' ', end='\n', file=process.stdout}={}){
  const util = require('util');
  return file.write(arr.map(e=>{
    if(typeof e == "string")return e;
    return util.inspect(e);
  }).join(sep)+end, 'utf8');
}

function print(...a){
  if(a.length==2 && Array.isArray(a[0]) && a[1] && typeof a[1] == "object")return print_overloaded(...a);
  return print_overloaded(a,{});
}

function slice(iter,...a){
  var r = range(...a);
  return new Iterator(function*(){
    var i = 0;
    for(var e of iter){
      if(i >= r.start && (i-r.start) % r.step == 0)yield e;
      i++;
      if(i == r.stop)break;
    }
  });
}

function filter(iter,callback=e=>e){
  return new Iterator(function*(){
    var i = 0;
    for(var e of iter){
      if(callback(e,i,iter))yield e;
      i++;
    }
  });
}

function map(iter,callback){
  return new Iterator(function*(){
    var i = 0;
    for(var e of iter){
      yield callback(e,i,iter);
      i++;
    }
  });
}

function str(x,...a){
  if(x == undefined)return '';
  if(typeof x.toString != "function")return JSON.stringify(x);
  return x.toString(...a);
}

function sum(iter,start){
  return Iterator.fromIterable(iter).reduce((a,e)=>a+e,start);
}

function callable(func){
  return typeof func == "function";
}

function bytearray(iter, enc='utf8'){
  if(iter == undefined)return null;
  if(typeof iter == "number")return Buffer.alloc(iter);
  if(typeof iter == "string")return Buffer.from(iter, enc);
  if(typeof iter[Symbol.iterator] == 'function')return Buffer.from(list(iter));
  return null;
}

function dir(o){
  return Object.getOwnPropertyNames(o).concat(Object.getOwnPropertySymbols(o));
}

const {abs,round,floor,ceil} = Math;

module.exports = {
  Iterator,
  zipLongest: zip(true), // itertools.zip_longest
  items, // dict.prototype.items
  False: false,
  None: null,
  True: true,

  abs,
  all,
  any,
  //todo: ascii,
  bin,
  bool,
  //todo: breakpoint,
  bytearray,
  //todo: bytes,
  callable,
  chr,
  //todo: classmethod,
  //todo: compile,
  //todo: complex,
  //todo: delattr,
  //todo: dict,
  dir,
  //todo: divmod,
  enumerate,
  //todo: eval,
  //todo: exec,
  filter, // argument order reversed
  float,
  //todo: format,
  //todo: frozenset,
  //todo: getattr,
  //todo: globals,
  //todo: hasattr,
  //todo: hash,
  //todo: help,
  hex,
  //todo: id,
  //todo: __import__,
  input,
  int,
  //todo: isinstance,
  //todo: issubclass,
  //todo: iter,
  len,
  list,
  //todo: locals,
  map, // argument order reversed
  max,
  //todo: memoryview,
  min,
  //todo: next,
  //todo: object,
  oct,
  //todo: open,
  ord,
  pow,
  print,
  //todo: property,
  range,
  //todo: repr,
  //todo: reversed,
  round,
  //todo: set,
  //todo: setattr,
  slice, // itertools.islice
  //todo: sorted,
  //todo: staticmethod,
  str,
  sum,
  //todo: super,
  //todo: tuple,
  //todo: type,
  //todo: vars,
  zip: zip(false),
};

// DEBUG
// node -r "./pythonic.js"
items(module.exports).map(([k,e])=>global[k]=e);
global.py = module.exports;
