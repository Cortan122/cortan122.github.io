var ram = [];
var RAMsize = 0x400;
var cpu1;
var compiler;
var instructionDictionary = [];
var instructionDictionary1 = [];
var keywordDictionary = [];
var clockDelay = -10;
var drawMode = true;
var drawMode1 = true;
var fileName = "fakeCode/snake.js";
var pdiv;
console.log('sketch_compiler');

function setup() {
  print('setup');
  pdiv = select('#pDiv');
  createCanvas(windowWidth,max(windowHeight,550));
  cpu1 = new cpu();
  background(0);
  for(var i = 0;i < RAMsize;i++){
    //ram[i] = i;
    ram[i] = 0;
  }
  fill(255);
  textFont('Courier New');
  //blendMode(MULTIPLY);
  compiler = new Assembler();
  
}

function draw() {
  if(drawMode){
    //drawC();
    background(0,0,0,1);
    return;
  }
  background(0);
  text(ramString(), 50, 50);
  push();
  blendMode(MULTIPLY);
  fill('green');
  noStroke();
  var w = textSize()*2.333;//*1.75;
  var h = textSize()*1.25;
  var x = 50 + (cpu1.counter%sqrt(RAMsize))*w;
  var y = 40 + floor(cpu1.counter/sqrt(RAMsize))*h;
  rect(x,y,w,h);
  pop();
}

function drawC() {
  push();
  //background(0,0,0,1);
  colorMode(HSB,255,255,255);
  rectMode(RADIUS);
  var c = ram[RAMsize-1];
  fill(c,255,255);
  if(c == 0){fill('black');}else if(c == 255){fill('white');}
  strokeWeight(0);
  var i = ram[RAMsize-2];
  if(drawMode1){var x = floor(i%sqrt(255))*10;var y = floor(i/sqrt(255))*10;}
  else{var x = floor(i%sqrt(RAMsize))*10;var y = floor(i/sqrt(RAMsize))*10;}

  rect(x+50,y+50,5,5);//point(x+50,y+50);
  pop();
}

function keyPressed() {
  if(keyIsDown(SHIFT)){
    if (key == "1") {
     drawMode = !drawMode;
     background(0);
    }
    if (key == "C") {
      resetRam();
      background(0);
    }
    if (key == "R") {
      runCFromFile();
    }
    if (key == "H") {
      halt();
    }
    if (key == "S") {
      search();
    }
  }else{
    //var c = key.charCodeAt(0)-0x2f;
    var c = keyCode-47;
    if(true/*c > 0*/){
      if(c > 48){c -= 48;}
      if(c > 10){c -= 7;}
      ram[RAMsize-3] = c;
    }
  }
}

function resetRam(){
  for(var i = 0;i < RAMsize;i++){
    //ram[i] = i;
    ram[i] = 0;
  }
}

function runA(data){
  compiler = new Assembler();
  cpu1.counter = 0;
  loadString(compiler.run(data),16);
  cpu1.run();
}

function runC(data){
  runA(compileC(data));
}

function sendRequest(fn,f,t,b){
  if(b === undefined){b = true;}
  if(t === undefined){t = "GET";}
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open(t,fn,b);
  xmlHttp.setRequestHeader('Expires',' Tue, 03 Jul 2001 06:00:00 GMT');
  xmlHttp.setRequestHeader('Last-Modified','{now} GMT');
  xmlHttp.setRequestHeader('Cache-Control','max-age=0, no-cache, must-revalidate, proxy-revalidate');
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState === 4) {
      f(xmlHttp.responseText);
    }
  }
  xmlHttp.send();
}

function search(b){
  sendRequest("search.php",displaySearchResults,"GET",b);
}

function runCFromFile(b){
  sendRequest(fileName,runC,"GET",b);
}

function displaySearchResults(data){
  var s = data.split("\n");
  s.pop();
  s.shift();
  s.shift();
  for(i = 0;i < s.length;i++){
    s[i] = s[i].slice(0,s[i].length-1);
    var link = createA("#",s[i]);
    var li = createElement('li','');
    li.child(link);
    pdiv.child(li);
    link.elt.setAttribute('onclick',"moveTo('"+s[i]+"');return false;");
  }
}

function moveTo(data){
  resetDiv(pdiv);
  fileName = "fakeCode/"+data;
  resetRam();
  runCFromFile();
}

function resetDiv(div){
  div.elt.innerHTML = '';
  var c = div.elt.children;
  while(0 < c.length){
    c[c.length-1].remove();
  }  
}

function compileNumber(s){
  if(s.startsWith('this')){
    var n = (compiler.r.split(" ").length-1);
    if(s.length > 4){n += eval(s.slice(4));}
    return n.toString(16);
  }
  else if(s.startsWith('-')){return s.slice(1,Number.MAX_VALUE);}
  else if(s.startsWith('0b')){return parseInt(s.slice(2),2).toString(16);}
  else if(s.startsWith('0x')){return s.slice(2,Number.MAX_VALUE);}
  else {return parseInt(s,10).toString(16);}
}

function loadString(s,base,pos){
  if(base == undefined){base = 2;}
  if(pos == undefined){pos = 0;}
  if(s[0] == " "){s = s.slice(1,Number.MAX_VALUE);}
  if(s[s.length-1] == " "){s = s.slice(0,-1);}
  var a = s.split(" ");
  if(a.length + pos > ram.length){print('to much data');}
  for(var i = 0;i < a.length;i++){
    ram[i+pos] = parseInt(a[i], base);
  }
}

function fixRam(){
  for(var i = 0;i < RAMsize;i++){
    //ram[i] = ram[i] % 256;
    if(ram[i] > RAMsize-1){cpu1.carry = true;}//fixme
    ram[i] = ram[i] & RAMsize-1;
  }
}

function ramString(){
  var s = "";
  for(var x = 0;x < sqrt(RAMsize);x++){
    for(var y = 0;y < sqrt(RAMsize);y++){
      s += hexString(ram[x*sqrt(RAMsize)+y].toString(16))+" ";
    }
    s += "\n"
  }
  return s;
}

function hexString(s){
  if(s.length == 1){s = "00" + s;}
  if(s.length == 2){s = "0" + s;}
  s = s.charAt(0).toUpperCase() + s.charAt(1).toUpperCase() + s.charAt(2).toUpperCase();
  return s;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

function compileA(data){
  compiler = new Assembler();
  return compiler.run(data);
}

function compileC(data){
  compiler = new Compiler();
  var r = compiler.run(data);
  print(compiler);
  return r;
}

function halt(){
  cpu1.isRunning = false;
  cpu1.counter = 0;
}

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}