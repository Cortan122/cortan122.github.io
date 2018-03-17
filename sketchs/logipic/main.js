var grid  = [];
var lines = {v:[],h:[]};
var _size = 5;
var scl = 12;
var offset = {x:50,y:50};
var seed;
var _seed = undefined;
//_seed = 10410;
//_seed = ;

var framebuffer = {
  offset:{x:Math.ceil(_size/2),y:Math.ceil(_size/2)},
  init:function(_size,char){
    //if (char == undefined ){char = " ";}
    this.pixels = [];
    this._size = (_size += max(this.offset.x,this.offset.y));
    for (var i = 0;i < _size;i++){
      this.pixels[i] = [];
      for (var j = 0;j < _size;j++){
        this.pixels[i][j] = [char];
      }
    }
  },
  reset:function(){
    background(255);
    var _size = this._size;
    for (var i = 0;i < _size;i++){
      for (var j = 0;j < _size;j++){
        this.pixels[i][j] = [undefined];
      }
    }
  },
  run:function(){
    var _size = this._size;
    var r = "";
    for (var i = 0;i < _size;i++){
      for (var j = 0;j < _size;j++){
        var p = (this.pixels[i][j][0]);
        if (p== undefined ){
          p = "□"
        }
        r += p;
      }
      r+=("\n");
    }
    return r;//console.log  (r)
  },
  draw:function(){
    var _size = this._size;
    for (var i = 0;i < _size;i++){
      for (var j = 0;j < _size;j++){
        var p = (this.pixels[j][i][0]);
        if (p != undefined ){
          push();
          var _scl = scl;
          if(p.length == 2){
            p = p[1];
            scale(1.35);
            //translate(0,1.5);
            _scl /= 1.35;
          }
          text(p,j*_scl,i*_scl);
          pop();
        }else{
          push();
          fill(255);
          noStroke();
          rectMode(RADIUS);
          var s = scl/2;
          rect(j*scl,i*scl,s,s);
          pop();
        }
      }
    }
  },
  add:function (x,y,char){
    try{this.pixels  [x+this.offset.x][y+this.offset.y].unshift(char);}catch(e){return false;}
    return true;
  },
  remove:function  (x,y){
    try{this.pixels  [x+this.offset.x][y+this.offset.y].shift();}catch(e){return false;}
    return true;
  },
  set:function (x,y,char){
    this.remove(x,y);
    return this.add(x,y,char);
  },
}

function randomGrid(){
  for (var i = 0;i < _size;i++){
    for (var j = 0;j < _size;j++){
      grid[i][j].v = Math.round (/*Math.*/random());
    }
  }
}

function initGrid(){
  for (var i = 0;i < _size;i++){
    grid[i] = [];
    lines.v [i] = {l:[],d:[],e:{}};
    lines.h [i] = {l:[],d:[],e:{}};
    for (var j = 0;j < _size;j++){
      grid[i][j]={v:Math.round (/*Math.*/random())};
      lines.h[i].l[j]=grid[i][j];
    }
  }
  for (var i = 0;i < _size;i++){
    for (var j = 0;j < _size;j++){
      lines.v[i].l[j]=grid[j][i];
    }
  }
}

function transferGrid (){
  var _size  = grid.length;
  for (var i = 0;i < _size;i++){
    for (var j = 0;j < _size;j++){
      var r = '';
      if (grid[i][j].v == -1){r = '❎'}
      if (grid[i][j].v ==  1){r = '\u2005\u2b1b'/*'⬛'*//*'🔲'*/}
      if (grid[i][j].v ==  0){r = '\u2005\u2b1c'/*'⬜'*//*'🔳'*/}
      framebuffer.set (i,j,r)
    }
  }
}

function scanLine (l){
  var _size = l.l.length;
  var ret = [];
  for (var i = 0;i < _size;i++){
    var r = 0;
    //console.log  (l.l [i].v)
    while (l.l[i].v==1){
      r++;
      i++;
      if (l.l[i]==undefined )break;
    }
    if (r){
      ret.push(r); //l.d.push (r);
    }
  }
  return ret;
}

function scan (){
  var _size = lines.h.length;
  for (var i = 0;i < _size;i++){
    lines.h[i].d = scanLine(lines.h[i]);
    lines.v[i].d = scanLine(lines.v[i]);
  }
}

function _transferLines(arr,b){
  var rom = [0,1,2,3,4,5,6,7,8,9];
  //var rom = ['\uFE0F','\uFE0F',2,3,4,5,6,7,8,9];
  for (var i = 0; i < arr.length; i++) {
    t = arr[i].d.reverse();
    for (var j = 0; j < t.length; j++) {
      var x = i;var y = i;
      if(b){x = -j-1;}else{y = -j-1;}
      framebuffer.set(x,y,rom[t[j]]+'\uFE0F\u20E3');
    }
    arr[i].d.reverse();
  }
}

function transferLines(){
  _transferLines(lines.h,false);
  _transferLines(lines.v,true);
}

function fillGrid(n){
  if(n == undefined){n = 0;}
  var _size  = grid.length;
  for (var i = 0;i < _size;i++){
    for (var j = 0;j < _size;j++){
      grid[i][j].v = n;
    }
  }
}

function checkWinLine(l){
  if(l.e == undefined){l.e = {};}
  //if(l.e.done){return true;}
  return l.e.done = compareArray(l.d,scanLine(l));//JSON.stringify(l.d)==JSON.stringify(scanLine(l));
}

function checkAllLines(){
  for(var n in lines){
    for (var i = 0; i < lines[n].length; i++) {
      checkWinLine(lines[n][i]);
    }
  }
  checkWinCondition()
}

function checkWinCondition(){
  for(var n in lines){
    for (var i = 0; i < lines[n].length; i++) {
      if(lines[n][i].e.done == false)return false;
    }
  }
  print('you win');
  newGame();//throw 'you win';
  return true;
}

function onChangeTile(x,y){
  if(y == undefined){y = x.y;x = x.x;}
  var r = true;
  r = r && checkWinLine(lines.v[x]);
  r = r && checkWinLine(lines.h[y]);
  //wtf
  r = r && checkWinLine(lines.h[x]);
  r = r && checkWinLine(lines.v[y]);

  if(r)checkWinCondition();
}

function setup(){
  var can = createCanvas(500, 500);
  can.elt.addEventListener('contextmenu', function(ev) { ev.preventDefault();return false; }, false);
  textAlign(CENTER,CENTER)
  initGrid();
  framebuffer.init (_size/*,"😁"*/);
  newGame();
}

function newGame(){
  if(_seed == undefined){
    randomSeed(seed = floor(Math.random()*100000));
  }else{
    randomSeed(seed = _seed);
  }
  for(var n in lines){
    for (var i = 0; i < lines[n].length; i++) {
      lines[n][i].e = {};
    }
  }
  framebuffer.reset();
  randomGrid();
  scan ();
  transferLines();
  fillGrid(0);
  transferGrid ();
}

function draw(){
  //background(255);
  translate(offset.x,offset.y);
  framebuffer.draw();
}

function mouseDragged(){
  clickOnGrid((mouseButton != LEFT)?-1:1);
}

function keyPressed() {
  if (key == 'R') {
    newGame();
    recursiveAI();
  }
  if (key == 'A') {
    //newGame();
    recursiveAI();
  }
  if (key == 'D') {
    for(var n in lines){
      for (var i = 0; i < lines[n].length; i++) {
        lines[n][i].e = {/*done:lines[n][i].e.done*/};
      }
    }
    recursiveAI();
  }
  if (keyCode == 32) {
    AI();
    transferGrid ();
  }
}

var lastMousePos;

function clickOnGrid(mb){
  var pos = pixelToGridPos(mouseX,mouseY);
  if(lastMousePos == undefined){lastMousePos = clone(pos);lastMousePos.x++;}
  if(pos.x == lastMousePos.x && pos.y == lastMousePos.y){return;}
  lastMousePos = clone(pos);
  try{
    //var mb = (mouseButton != LEFT)?-1:1;
    if(grid[pos.x][pos.y].v == mb){
      grid[pos.x][pos.y].v = 0; 
    }else if(grid[pos.x][pos.y].v == 0){
      grid[pos.x][pos.y].v = mb; 
    }
  }catch(e){return;}
  onChangeTile(pos);
  transferGrid ();
}

function mousePressed(){
  lastMousePos = undefined;
  clickOnGrid((mouseButton != LEFT)?-1:1);
  /*if(lastMousePos == undefined){lastMousePos = pos;framebuffer.add(pos.x,pos.y,'@');}
  framebuffer.remove(lastMousePos.x,lastMousePos.y);
  framebuffer.add(pos.x,pos.y,'@');
  lastMousePos = pos;*/
}

function pixelToGridPos(x,y){
  if(y == undefined){y = x.y;x = x.x;}
  return {x:round((x-offset.x)/scl-framebuffer.offset.x),y:round((y-offset.y)/scl-framebuffer.offset.y)};
}

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function compareArray(a1,a2){
  return JSON.stringify(a1)==JSON.stringify(a2);//fixme
}

function getMaxOfArray(numArray) {
  return Math.max.apply(null, numArray);
}

function getMinOfArray(numArray) {
  return Math.min.apply(null, numArray);
}