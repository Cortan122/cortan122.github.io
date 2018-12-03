const fs = require('fs');
const path = require('path');
const crto = require('./crto.js');
const parseArgv = require('./argv.js');
const util = require('util');
const ansi_to_html = new (require('../ansi_to_html.js'))({
  newline: true
});
const { min,max,abs } = Math;
const instructionSet = [
  "jmp ##","mov ax ##","mov ah #","mov al #","mov fl #","mov b #","mov c #","mov sp ##","nop","mov ax ip","mov ah ip","mov al ip","mov fl ip","mov b ip","mov c ip","mov sp ip",
  "jmp [##]","mov ax [##]","mov ah [##]","mov al [##]","mov fl [##]","mov b [##]","mov c [##]","mov sp [##]","jmp ax","mov ax ax","mov ah ax","mov al ax","mov fl ax","mov b ax","mov c ax","mov sp ax",
  "jmp [#]","mov ax [#]","mov ah [#]","mov al [#]","mov fl [#]","mov b [#]","mov c [#]","mov sp [#]","jmp ah","mov ax ah","mov ah ah","mov al ah","mov fl ah","mov b ah","mov c ah","mov sp ah",
  "mov [##] ip","mov [##] ax","mov [##] ah","mov [##] al","mov [##] fl","mov [##] b","mov [##] c","mov [##] sp","jmp al","mov ax al","mov ah al","mov al al","mov fl al","mov b al","mov c al","mov sp al",
  "mov [#] ip","mov [#] ax","mov [#] ah","mov [#] al","mov [#] fl","mov [#] b","mov [#] c","mov [#] sp","jmp fl","mov ax fl","mov ah fl","mov al fl","mov fl fl","mov b fl","mov c fl","mov sp fl",
  "jc ##","jnc ##","jz ##","jnz ##","js ##","jns ##","jo ##","jno ##","jmp b","mov ax b","mov ah b","mov al b","mov fl b","mov b b","mov c b","mov sp b",
  "jc ip+#","jnc ip+#","jz ip+#","jnz ip+#","js ip+#","jns ip+#","jo ip+#","jno ip+#","jmp c","mov ax c","mov ah c","mov al c","mov fl c","mov b c","mov c c","mov sp c",
  "jmp ip+#","jmp ip+##","call ip+#","call ip+##","","","","","jmp sp","mov ax sp","mov ah sp","mov al sp","mov fl sp","mov b sp","mov c sp","mov sp sp",
  "add ax ip","add ax #","add ax [##]","add ax [#]","add ax fl","add ax b","add ax c","add ax sp","jmp [ax]","mov ax [ax]","mov ah [ax]","mov al [ax]","mov fl [ax]","mov b [ax]","mov c [ax]","mov sp [ax]",
  "and ax ip","and ax #","and ax [##]","and ax [#]","and ax fl","and ax b","and ax c","and ax sp","mov [ax] ip","mov [ax] ax","mov [ax] ah","mov [ax] al","mov [ax] fl","mov [ax] b","mov [ax] c","mov [ax] sp",
  "or ax ip","or ax #","or ax [##]","or ax [#]","or ax fl","or ax b","or ax c","or ax sp","mov ip [sp+#]","mov ax [sp+#]","mov ah [sp+#]","mov al [sp+#]","mov fl [sp+#]","mov b [sp+#]","mov c [sp+#]","mov sp [sp+#]",
  "xor ax ip","xor ax #","xor ax [##]","xor ax [#]","xor ax fl","xor ax b","xor ax c","xor ax sp","mov [sp+#] ip","mov [sp+#] ax","mov [sp+#] ah","mov [sp+#] al","mov [sp+#] fl","mov [sp+#] b ","mov [sp+#] c ","mov [sp+#] sp",
  "bsh ax ip","bsh ax #","bsh ax [##]","bsh ax [#]","bsh ax fl","bsh ax b","bsh ax c","bsh ax sp","","","","","","","","",
  "","","","","","","","","","","","","","","","",
  "","","","","","","","","","","","","","","","",
  "nop","call ##","call ax","ret","mov al [ax]","push ax","pop ax","test al","test ax","push [#]","pop [#]","enter #","leave","","print al","hlt"
];
const instructionLength = instructionSet.map(e=>e.split('#').length);
var filename = "./examples/out.crtb";
var useJsonOutput = false;
var useHtml = false;
var useColor = true;
var useDataXrefs = false;
var arrowDepth = 8;

const argvRom = {
  "--json":[0,1,()=>{
    useJsonOutput = true;
  }],
  "--html":[0,1,()=>{
    useHtml = true;
  }],
  "--nocolor":[0,1,()=>{
    useColor = false;
  }],
  "--arrows":[1,1,(a)=>{
    arrowDepth = parseInt(a);
  }],
  "argv":(argv)=>{
    if(argv.length>1){
      console.error(`disasm.js: expects 1 or 0 non-option arguments`);
      return 1;
    }
    if(argv.length)filename = argv[0];
  }
};

parseArgv(process.argv,argvRom);

var ram = fs.readFileSync(filename);
var entryPoints = [0];
var resultingLines = [];
var dataLines = [];
var lineIndices = [];
var lineSizes = [];
var xrefs = [];
var externs = [];
var xrefsarr = [];
var deadends = [];
// var ip = 0;

Array.prototype.max = function(){
  return Math.max.apply(null, this);
};

Array.prototype.min = function(){
  return Math.min.apply(null, this);
};

function tohex(num,len=2){
  var s = num.toString(16);
  while(s.length<len){
    s = "0"+s;
  }
  return s;
}

function ColorRGB(mode,r,g,b){
  if(typeof r == "string"&&g==undefined&&b==undefined){
    if(r[0]!='#')throw r;
    var s = r.substr(1).match(/../g);
    r = parseInt(s.shift(),16);
    g = parseInt(s.shift(),16);
    b = parseInt(s.shift(),16);
  }
  const moderom = {fg:38,bg:48};
  return `\x1b[${moderom[mode]};2;${r};${g};${b}m`;
}

function parseNegative(val){
  if(val>=0x80){
    return val-0x100;
  }else{
    return val;
  }
}

function xrefPush(index,val){
  if(!xrefs[index])xrefs[index] = [];
  return xrefs[index].push(val);
}

function disasmData(ip,size=1){
  if(dataLines[ip])return;
  var line = "";
  var tstr = "";
  line += tohex(ip,4)+"\t";
  for (var i = 0; i < size; i++) {
    tstr += tohex(ram[ip+i],2);
  }
  line += tstr;
  line += "\t";
  line += ["byte","word"][size-1]+" "+tstr;
  dataLines[ip] = line;
}

function disasm(ip){
  if(resultingLines[ip])return [];
  var line = "";
  var opcode = ram[ip];
  if(opcode==undefined){
    console.error("out of bounds: "+tohex(ip,4));
    deadends.push(ip);
    return [];
  }
  var instruction = instructionSet[opcode];
  if(instruction=="")instruction = "invalid";
  var size = instructionLength[opcode];
  line += tohex(ip,4)+"\t";
  for (var i = 0; i < size; i++) {
    line += tohex(ram[ip+i],2);
  }
  line += "\t";

  instruction = instruction.replace(/ip\+##/,tohex(size+ip+(ram[ip+1]<<8)+ram[ip+2],4));
  instruction = instruction.replace(/ip\+#/,tohex(size+ip+parseNegative(ram[ip+1]),4));
  instruction = instruction.replace(/sp\+#/,()=>{
    var n = parseNegative(ram[ip+1]);
    if(n==0)return 'sp';
    return 'sp'+(n>0?'+':'-')+tohex(abs(n),2);
  });

  var j = 0;
  instruction = instruction.replace(/#/g,()=>{
    j++;
    return tohex(ram[ip+j],2);
  });

  if(externs[ip+3]){
    instruction = instruction.replace(/cafe/,externs[ip+3]);
  }

  line += instruction;

  resultingLines[ip] = line;

  var m;
  if(m = instruction.match(/\[([0-9a-f]{2,4})\]/i)){
    var t = parseInt(m[1],16);
    xrefPush(t,{t:"data",s:ip});
    var len = 1;
    if(instruction.match(/(jmp|ax|sp|ip)/))len = 2;
    disasmData(t,len);
  }

  if(m = instruction.match(/^jmp ([0-9a-f]{4})$/i)){
    var t = parseInt(m[1],16);
    xrefPush(t,{t:"jmp",s:ip});
    return [t];
  }
  if(instruction.match(/^jmp/)){
    deadends.push(ip);
    return [];
  }
  if(m = instruction.match(/^(call|jn?[czso]) ([0-9a-f]{4})$/i)){
    var t = parseInt(m[2],16);
    if(m[1]=="call"){
      xrefPush(t,{t:"call",s:ip});
    }else{
      xrefPush(t,{t:"jmpt",s:ip});
      xrefPush(ip+size,{t:"jmpf",s:ip});
    }
    return [t,ip+size];
  }
  if(instruction == "hlt"||instruction == "ret"||instruction == "leave"){
    deadends.push(ip);
    return [];
  }
  return [ip+size];
}

function main(){
  var r = entryPoints;
  do{
    var r2 = [];
    while(r.length){
      r2 = r2.concat(disasm(r.shift()));
    }
    r = r2;
  }while(r2.length)
}

function calcempty(){
  var ls = resultingLines;
  var r = Array(ls.length).fill(false);
  for (var i = 0; i < ls.length; i++) {
    var line = ls[i];
    if(line==undefined){
      r[i] = true;
      continue;
    }
    var size = lineSizes[i];
    if(size==undefined){
      size = lineSizes[i] = line.split('\t')[1].length/2;
      if(!Number.isInteger(size))throw line.split('\t')[1];
    }
    i += size-1;
  }
  return r;
}

function color(){
  const colors = {
    no:"\x1b[0m",
    bold:"\x1b[1m",
    addr:ColorRGB("fg",166,226,44),
    opcode:ColorRGB("fg",103,216,239),
    data:ColorRGB("fg",172,128,255),
    invalid:"\x1b[1m"+ColorRGB("fg",255,12,57)/*+ColorRGB("bg",255,255,255)*/,
    keyword:ColorRGB("fg",249,36,114),
    register:ColorRGB("fg",253,150,33),
    comment:ColorRGB("fg","#ff0000")
  };
  for(let i in colors){
    if(i == 'no')continue;
    colors[i] = colors.no+colors[i];
  }
  var isemptyarr = calcempty();
  for (var i = 0; i < dataLines.length; i++) {
    var line = dataLines[i];
    if(line==undefined)continue;
    var size = line.split('\t')[1].length/2;
    if(isemptyarr[i]&&isemptyarr[i+size-1]){
      var arr = line.split('\t');
      line = colors.addr+arr[0]+'\t'+colors.data+arr[1]+'\t'+
        arr[2].replace(/^([a-z]*) ([0-9a-f]{2,4})/,
          `${colors.keyword}$1${colors.no} ${colors.data}$2${colors.no}`
      );
      resultingLines[i] = line;
      lineSizes[i] = size;
    }
  }
  isemptyarr = calcempty();
  // console.log(isemptyarr);
  var unexplore = (i)=>{
    var c = colors;
    var h = tohex;
    var j = 0;
    var v = ram[i];
    while(isemptyarr[i+j]){
      j++;
      if(ram[i+j]!=v)break;
    }
    var t = `${j} unexplored byte${j==1?"":"s"}`;
    resultingLines[i] = 
      `${c.addr}${h(i,4)}\t${c.no}${h(v,2)}\t${c.invalid}${t}${c.no}`;
    return i+j-1;
  };
  for (var i = 0; i < resultingLines.length; i++) {
    var line = resultingLines[i];
    if(line==undefined){
      if(isemptyarr[i]){
        i = unexplore(i);
      }
      continue;
    }
    if(line[0]=='\x1b')continue;
    line = colors.addr+line;
    if(line.match(/invalid/)){
      line = line.replace(/\t/,`\t${colors.no}`);
      resultingLines[i] = line.replace(/\b(invalid)\b/g,`${colors.invalid}$1${colors.no}`);
      continue;
    }
    line = line.replace(/\t([0-9a-f]{2})([0-9a-f]*)\t([^ ]*) ?/i,
      `\t${colors.opcode}$1${colors.data}$2\t${colors.opcode}$3${colors.no} `
    );
    line = line.replace(/\b(ax|sp|ip|al|ah|c|b|fl)\b/g,`${colors.register}$1${colors.no}`);
    line = line.replace(/([ \[+-])([0-9a-f]{2,4})([ \]+-]|$)/g,
      `${colors.no}$1${colors.data}$2${colors.no}$3`
    );
    //todo
    resultingLines[i] = line;
  }

  var r = [];
  for(var i = 0; i < resultingLines.length; i++){
    var line = resultingLines[i];
    if(line==undefined)continue;
    var j;
    var refs = xrefs[i];
    if(refs == undefined)refs = [];
    for (var n = 0; n < refs.length; n++) {
      var ref = refs[n];
      if(!ref)continue;
      var c = colors;
      let line;
      if(ref.t == "call"||(ref.t == "data"&&useDataXrefs)){
        line = `${c.comment}; ${ref.t.toUpperCase()} XREF from ${tohex(ref.s,4)}${c.no}`;
      }else if(ref.t == "global"){
        line = `${c.comment}; global ${ref.name}()${c.no}`;
      }else continue;
      j = r.push(line);
      lineIndices[j-1] = i-.5;
    }
    j = r.push(line);
    lineIndices[j-1] = i;
  }
  resultingLines = r;
}

function chooseIndex(headers,start,end){
  const spaces = headers[0].length-1;
  var sums = Array(spaces).fill(0);

  for(var i = start; i < end; i++){
    var h = headers[i];
    for(var j = 0; j < spaces; j++){
      sums[j] += h[j]==' '?1:0;
    }
  }

  return sums.lastIndexOf(sums.max());
}

const boxChars = [
  ' ',//0
  '╵',//1
  '╶',//2
  '└',//3
  '╷',//4
  '│',//5
  '┌',//6
  '├',//7
  '╴',//8
  '┘',//9
  '─',//10
  '┴',//11
  '┐',//12
  '┤',//13
  '┬',//14
  '┼' //15
];
const outArrowChar = '<';
const inArrowChar = '>';
const verticalChar = boxChars[5];
const horizontalChar = boxChars[10];
const crossChar = boxChars[15];
const topCornerChar = boxChars[6];
const bottomCornerChar = boxChars[3];

function addBoxChars(a,b){
  var ia = boxChars.indexOf(a);
  var ib = boxChars.indexOf(b);
  var ir = ia|ib;
  return boxChars[ir];
}

function makexrefsarr(){
  xrefsarr = [];
  for (var i = 0; i < xrefs.length; i++) {
    var x = xrefs[i];
    if(x == undefined)continue;
    for (var j = 0; j < x.length; j++) {
      var ref = x[j];
      ref.d = lineIndices.indexOf(i);
      if(ref.d==-1)ref.d = `{${i}}`;
      ref.s = lineIndices.indexOf(ref.s);
      xrefsarr.push(ref);
    }
  }
  deadends = deadends.map(e=>lineIndices.indexOf(e));
}

function drawArrows(){
  const spaces = arrowDepth;
  var headers = resultingLines.map(e=>Array(spaces).fill(" "));

  for (var i = 0; i < xrefsarr.length; i++) {
    var ref = xrefsarr[i];
    if(!(ref.t=='jmp'||ref.t=='jmpt'))continue;
    headers[ref.s][spaces-1] = outArrowChar;
    headers[ref.d][spaces-1] = inArrowChar;
    var start = min(ref.s,ref.d);
    var end = max(ref.s,ref.d);
    var ind = chooseIndex(headers,start,end);

    for(var j = ind+1; j < spaces-1; j++){
      var c = headers[start][j];
      headers[start][j] = addBoxChars(c,horizontalChar);
      c = headers[end][j];
      headers[end][j] = addBoxChars(c,horizontalChar);
    }
    headers[start][ind] = addBoxChars(headers[start][ind],topCornerChar);
    headers[end][ind] = addBoxChars(headers[end][ind],bottomCornerChar);
    for(var j = start+1; j < end; j++){
      var c = headers[j][ind];
      headers[j][ind] = addBoxChars(c,verticalChar);
    }
  }

  resultingLines.map((e,i)=>resultingLines[i]=headers[i].join('')+e);
}

var extension = path.extname(filename);
if(extension=='.crto'){
  var o = crto.decode(ram);
  var offset = 0;
  if(o.pos==0||o.pic){
    ram = o.code;
    offset = -o.pos;
  }else{
    var l = o.code.length+o.pos;
    ram = Buffer.alloc(l,0xf0);
    o.code.copy(ram,o.pos);
  }
  for(var k in o.globals){
    var g = o.globals[k]+offset;
    entryPoints.push(g);
    xrefPush(g,{t:'global',name:k});
  }
  for(var k in o.externs){
    var e = o.externs[k];
    for (var i = 0; i < e.length; i++) {
      externs[e[i]+offset] = k;
    }
  }
}

main();

color();

if(!useColor){
  resultingLines = resultingLines.map(line=>{
    return line.replace(/\x1b\[[0-9;]*m/g,'');
  });
}

makexrefsarr();

if(arrowDepth>0)drawArrows();

if(!useJsonOutput){
  if(useHtml){
    console.log(ansi_to_html.toHtml(resultingLines.join('\n')));
  }else{
    console.log(resultingLines.join('\n'));
  }
}else{
  var blocks = [];
  var linetoblock = []; 
  xrefsarr = xrefsarr.filter(e=>e.t.startsWith('jmp'));
  var breaks = [];
  for(var ref of xrefsarr){
    breaks.push({v:ref.s,t:'s',ref});
    breaks.push({v:ref.d,t:'d',ref});
  }
  for(var end of deadends){
    breaks.push({v:end,t:'end'});
  }
  breaks = breaks.sort((a,b)=>a.v-b.v||b.t=='d');
  
  var index = 0;
  var blockindex = 0;
  for(var brk of breaks){
    var code = resultingLines.slice(index,brk.v+(brk.t!='d'?1:0));
    var b = {code,out:[],in:[]};
    blocks.push(b);
    if(brk.t=='s'){
      b.out.push({v:brk.ref.d,t:brk.ref.t});
    }else if(brk.t=='end'){
      b.out.push({v:-1,t:'end'});
    }
    linetoblock[index] = blockindex;
    index += code.length;
    if(code.length)blockindex++;
  }
  linetoblock[index] = blockindex;
  var code = resultingLines.slice(index);
  blocks.push({code,out:[],in:[]});

  var previndex; 
  for (var i = 0; i < blocks.length; i++) {
    var b = blocks[i];
    if(b.code.length){
      previndex = i;
      continue;
    }
    blocks[i] = null;
    blocks[previndex].out = blocks[previndex].out.concat(b.out);
  }
  blocks = blocks.filter(e=>e);

  for(var i = 0; i < blocks.length; i++){
    var b = blocks[i];
    if(b.out.length==0&&i!=blocks.length-1){
      b.out.push({v:i+1,t:'fall'});
    }
    b.out = b.out.map(e=>{
      var prevv = e.v;
      if(e.t=='end')return;
      if(e.t!='fall')e.v = linetoblock[e.v];
      if(e.v==undefined)return console.error(
        `linetoblock mismatch: line ${prevv} not maped to any block\n`,
        ' avalible lines are:\n ',
        linetoblock.map((e,i)=>i).filter(e=>e!=undefined));//wtf
      if(blocks[e.v]==undefined)return console.error(e.v),e;//wtf
      blocks[e.v].in.push({v:i,t:e.t});
      return e;
    }).filter(e=>e);
  }

  // console.error(util.inspect(blocks,{depth:null}));
  blocks.map(e=>e.html=ansi_to_html.toHtml(e.code.join('\n')));
  blocks.map(e=>{delete e.code;delete e.in;});

  console.log(JSON.stringify(blocks));
}

//node disasm.js --json --arrows 0 > ../../../sketchs/flowchart/example.json
