console.log('block.js');
var blockTypes = [
  [{x:+0,y:-1},{x:+1,y:-1},{x:+1,y:+0}],//(O)
  [{x:+0,y:-1},{x:+0,y:+1},{x:+0,y:+2}],//(I)
  [{x:-1,y:-1},{x:-1,y:+0},{x:+1,y:+0}],//(J)
  [{x:+1,y:-1},{x:+1,y:+0},{x:-1,y:+0}],//(L)
  [{x:+0,y:-1},{x:+1,y:+0},{x:-1,y:+0}],//(T)
  [{x:+0,y:-1},{x:+1,y:-1},{x:-1,y:+0}],//(S)
  [{x:+0,y:-1},{x:-1,y:-1},{x:+1,y:+0}]//(Z)
];

var blockColors = [
  '#f00',//(O)
  '#ff7b00',//(I)
  '#a0f',//(J)
  '#00f',//(L)
  '#ff0',//(T)
  '#0ff',//(S)
  '#0f0'//(Z)
];

var queue = {};

var block = {
  x:0,
  y:0,
  tiles:[],
  color:'placeholder',
  type:0
};

queue.init = function(){
  this.type = getRandomInt(0,blockTypes.length);
  if(tweakables.randomColors){this.color = color(random(0,360),100,100);}else{this.color = color(blockColors[this.type]);}
}

block.init = function(){
  colorMode(HSB);
  if(queue.type == undefined){queue.init();}
  this.color = queue.color;
  this.type = queue.type;
  this.tiles = blockTypes[this.type].slice();
  this.tiles.push({x:0,y:0});
  this.x = floor(grid.length/2);
  this.y = 1;
  if(this.checkCollision()){paused = "game over";playSound(6);/*throw 'game over';*/}
  if(!tweakables.goastMode || mode == 2){goast.color = color(hue(this.color),50,100);}else{goast.color = this.color;}
  goast.calc();
  this.draw();
  queue.init();queue.dirty = true;
  colorMode(RGB);
}

block.checkCollision = function(){
  for (var i = 0; i < this.tiles.length; i++) {
    var x = this.tiles[i].x+this.x;var y = this.tiles[i].y+this.y;
    if(peek2(x,y).v == 1 || peek2(x,y).f == 1){return true;}
  }
  return false;
}

block.drop = function(){
  if(!isInputAllowed()){return false;}
  this.draw(0);
  this.y++;
  if(this.checkCollision()){
    this.y--;
    this.draw();
    checkWinCondition();
    playSound(5,0.5);
    this.init();
    return false;
  }
  this.draw();
  return true;
}

block.commit = function(){
  if(!isInputAllowed()){return;}
  playSound(4,1,0.8);
  while(this.drop()){fakeScore += 2*tweakables.maxDifficulty/difficulty;}
}

block.shove = function(d){
  if(!isInputAllowed()){return;}
  this.draw(0);
  this.x += d;
  var r;
  if(this.checkCollision()){
    this.x -= d;
    r = false;
  }else{goast.calc();r = true;}
  this.draw();
  return r;
}

block.rotate = function(d){
  if(!isInputAllowed()){return;}
  playSound(5);
  if(this.type == 0)return;
  this.draw(0);
  var backup = this.tiles;
  this.tiles = this._rotate(d);
  var r;
  if(this.checkCollision()){
    this.tiles = backup;
    if(tweakables.smartRotation &&(arguments.callee.caller != block.rotate)){
      if(this.shove(1)){
        r = this.rotate(d);
      }else if(this.shove(-1)){
        r = this.rotate(d);
      }else{r = false;}
    }else{r = false;}
  }else{goast.calc();r = true;}
  this.draw();
  return r;
}

block._rotate = function(d){
  var r = [];
  for (var i = 0; i < this.tiles.length; i++) {
    r.push(createVector(this.tiles[i].x,this.tiles[i].y).rotate(d*PI/2));
    r[i].x = round(r[i].x);r[i].y = round(r[i].y);
  }
  return r;
}

block.draw = function(b){
  if(b == undefined){b = 1;}
  for (var i = 0; i < this.tiles.length; i++) {
    var x = this.tiles[i].x+this.x;var y = this.tiles[i].y+this.y;
    grid[x][y].v = b;grid[x][y].c = this.color;
  }
}

var goast = {};

goast.calc = function(){
  if(!tweakables.showGoast)return;
  //colorMode(HSB);
  this.x = block.x;
  this.y = block.y;
  this.tiles = block.tiles;
  //this.color = color(hue(block.color),50,100);
  while(this.drop()){}
  //colorMode(RGB);
}

goast.checkCollision = block.checkCollision;

goast.drop = function(){
  this.y++;
  if(this.checkCollision()){
    this.y--;
    return false;
  }
  return true;
}