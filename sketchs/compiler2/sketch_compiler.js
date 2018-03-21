var ram = [];
var RAMsize = 0x100;
var RAMsize2 = Math.pow(RAMsize,2);
var cpu1;
var compiler;
var instructionDictionary = [];
var instructionDictionary1 = [];
var keywordDictionary = [];
var actionDictionary = [];
var adressingDictionary = [];
var clockDelay = -10;
var debugMode = true;
var drawMode = false;
var fileName = "../compiler/fakeCode/counter.js";
var pdiv;
var page = 0;
var displayString = '';
var historyLength = 100;
console.log('sketch_compiler');

function setup() {
  print('setup');
  pdiv = select('#pDiv');
  createCanvas(windowWidth,max(windowHeight,350/*550*/));
  cpu1 = new cpu();
  background(0);
  resetRam();
  fill(255);
  textFont('Courier New');
  textSize(20);
  initSubPixelText();
  drawingContext.imageSmoothingEnabled = false;
  //blendMode(MULTIPLY);
  compiler = new Assembler();
}

function draw() {
  if(debugMode){
    drawDebug();
  }else{
    background(0,0,0,1);
  }
}

function drawDebug(){
  background(0);
  noStroke();
  fill(255);
  text(ramString(), 50, 50);
  text(displayString,500,100)
  push();
  blendMode(MULTIPLY);
  //noFill();
  //stroke('green')
  fill('green');
  var w = drawingContext.measureText('ff ').width;//textSize()*1.75;
  var h = textSize()*1.25;
  var c = cpu1.counter&0xff;
  var o = (drawLabels)?1:0;
  var x = 50 + (c%sqrt(RAMsize)+o)*w;
  var y = 50 - textSize() + floor(c/sqrt(RAMsize)+o)*h;
  var w0 = w/3*2;
  rect(x,y,w0,h);
  if(cpu1.counter>>8 == page)
    rect(50 + (sqrt(RAMsize)-1+o)*w,50 - textSize() + (sqrt(RAMsize)+o)*h,w0,h);
  pop();
  if(drawLabelBox){
    push();
    strokeWeight(2);
    stroke(255);
    w1 = w/3*2.5;
    line(50+w1,50-textSize()*0.65,50+w1,50+h*sqrt(RAMsize));
    line(50,50+textSize()*0.3,50+w*sqrt(RAMsize)+w0,50+textSize()*0.3);
    pop();
  }
}

var scl = 30;

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
  if(!drawMode){
    var x = floor(i%16)*scl;var y = floor(i/16)*scl;
  }else{
    var x = i*scl;var y = ram[RAMsize-4]*scl;
  }

  rect(x+50,y+50,scl/2,scl/2);//point(x+50,y+50);
  pop();
}

function keyPressed() {
  if(keyIsDown(SHIFT)){
    if (key == "1") {
     debugMode = !debugMode;
     background(0);
    }
    if (key == "C") {
      displayString = '';
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
    if (keyCode == 107) {//"+"
      page++;page &= RAMsize-1;
    }
    if (keyCode == 109) {//"-"
      page--;page &= RAMsize-1;
    }
  }else{
    //var c = key.charCodeAt(0)-0x2f;
    var c = keyCode-47;
    if(true/*c > 0*/){
      if(c > 48){c -= 48;}
      if(c > 10){c -= 7;}
      ram[RAMsize-3] = c & RAMsize-1;
    }
  }
}

function mouseWheel(event) {
  clockDelay += (event.delta>0)?1:-1;
}

function mouseMoved(){
  mouseX -= 50;
  mouseY -= 50-scl/2;
  var y = 0;
  if(drawMode){
    var x = round(map(mouseX,0,255*scl+0,0,256))&(RAMsize-1);
    y = round(map(mouseY,0,255*scl+0,0,256))&(RAMsize-1);
  }else{
    var x = (round(map(mouseX,0,16*scl,0,16))&15)
      +16*(round(map(mouseY,0,16*scl,0,16)&15))&255;
  }
  ram[RAMsize-5] = x;//map(mouseX,50,t*scl+50,0,t1)&(RAMsize-1);
  ram[RAMsize-6] = y;//map(mouseY,50,t*scl+50,0,t1)&(RAMsize-1);
}

function resetRam(){
  for(var i = 0;i < RAMsize2;i++){
    //ram[i] = i;
    ram[i] = 0;
  }
}

var _startPos = 0x1000;

function runRaw(data){
  cpu1.counter = startPos;
  loadString(data,16,startPos);
  halt();
  cpu1.counter = startPos;
  cpu1.run();
}

function runA(data){
  startPos = _startPos;
  runRaw(compileA(data));
}

function runC(data){
  startPos = _startPos;
  runA(compileC(data));
}

function runB(data){
  startPos = 0x8000;
  runA(compileB(data));
  startPos = _startPos;
}

function sendRequest(fn,f,t,b){
  if(b === undefined){b = true;}
  if(t === undefined){t = "GET";}
  var xmlHttp = new XMLHttpRequest();
  if(fn.endsWith('.php')&&window.location.href.includes("cortan122.github.io")){
    fn = fn.substring(0,fn.length-4)+'.txt';
  }
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
  sendRequest('../compiler/search.php',displaySearchResults,"GET",b);
}

function runCFromFile(b){
  sendRequest("../compiler/"+fileName,runC,"GET",b);
}

function displaySearchResults(data){
  var s = data.split("\n");
  s.pop();
  s.shift();
  s.shift();
  pdiv.style('display','grid');
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
  div.style('display','none');
  div.elt.innerHTML = '';
  var c = div.elt.children;
  while(0 < c.length){
    c[c.length-1].remove();
  }  
}

function compileNumber(s){
  if(s.startsWith('this')){
    var n = (compiler.r.split(" ").length-1)+startPos;
    if(s.length > 4){n += eval(s.slice(4));}
    return n.toString(16);
  }
  else if(s.startsWith('-')){return s.slice(1,Number.MAX_VALUE);}//fixme:old
  else if(s.startsWith('0b')){return parseInt(s.slice(2),2).toString(16);}
  else if(s.startsWith('0x')){return s.slice(2,Number.MAX_VALUE);}
  else if(s.match(/[0123456789]/) == undefined||s.match(/[0123456789]/).index != 0){return s;}
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
    ram[i+pos] = parseInt(a[i], base) & RAMsize-1;
  }
}

function fixRam(){
  for(var i = 0;i < RAMsize2;i++){
    //ram[i] = ram[i] % 256;
    if(ram[i] > RAMsize-1){cpu1.carry = true;}//fixme
    ram[i] = ram[i] & RAMsize-1;
  }
}

var drawLabels = true;
var drawLabelBox = true;

function ramString(){
  var s = "";
  if(drawLabels)s += "   00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f\n".toUpperCase();
  for(var x = 0;x < sqrt(RAMsize);x++){
    if(drawLabels)s += x.toString(16).toUpperCase()+"0 ";
    for(var y = 0;y < sqrt(RAMsize);y++){
      s += hexString(ram[(x*sqrt(RAMsize)+y)+(page<<8)].toString(16))+" ";
    }
    s += "\n";
  }
  if(drawLabels)s += "   ";
  return s+"                                        page:"+hexString(page.toString(16));
}

function hexString(s){
  if(s.length == 1){s = "0" + s;}
  //if(s.length == 2){s = "0" + s;}
  s = s.charAt(0).toUpperCase() + s.charAt(1).toUpperCase();// + s.charAt(2).toUpperCase();
  return s;
}

function compileA(data){
  compiler = new Assembler();
  var r = compiler.run(data);
  print(compiler);
  return r;
}

function compileC(data){
  compiler = new Compiler();
  var r = compiler.run(data);
  print(compiler);
  return r;
}

function compileB(data){
  return compilerB.run(data);
}

function halt(){
  cpu1.isRunning = false;
  cpu1.counter = 0;
  cpu1.age = 0;
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

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}