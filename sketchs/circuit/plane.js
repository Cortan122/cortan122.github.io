function Wplane(n) {
   
  this.tiles = [];
  
  this.colors = [color(255,255,255,10),color(200,250,0,200),color(0,100),color('red')]; //trueTile(bg),falseTile,trueWall,falseWall
  
  for(x = 0;x < n;x++){
    var line = [];
    for(y = 0;y < n;y++){
      line.push(new Tile(x,y,this));
    }
    this.tiles.push(line);
  }
  
  this.click = function(){}
  
  this.draw = function()
  { 
    for(x = 0;x < this.tiles.length;x++){
      for(y = 0;y < this.tiles[x].length;y++){
        this.tiles[x][y].draw(this.colors);
      }
    }
  }
  
  this.smartDraw = function(x,y,dist)
  { 
    translate(width/2,height/2);
    translate(-offset.x,-offset.y);
    translate(-x*scl,-y*scl);
    var ntiles = this.tiles.slice(constrain(x-dist,0,this.tiles.length),constrain(x+dist+1,0,this.tiles.length));
    for(ix = 0;ix < ntiles.length;ix++){
      var ntile = ntiles[ix].slice(constrain(y-dist,0,this.tiles.length),constrain(y+dist+1,0,this.tiles.length));
        for(iy = 0;iy < ntile.length;iy++){
          ntile[iy].draw(this.colors);
        }
    }
  }
  
  this.highlight = function(x1,y1,x2,y2)
  { 
    var w = abs(x2-x1)+1;
    var h = abs(y2-y1)+1;
    var mx = min(x1,x2);
    var my = min(y1,y2);
    for(x = 0;x < this.tiles.length;x++){
      for(y = 0;y < this.tiles[x].length;y++){
        this.tiles[x][y].c = true;
      }
    }
    for(x = 0;x < w;x++){
      for(y = 0;y < h;y++){
        this.tiles[x+mx][y+my].c = false;
      }
    }
  }
  
  this.resetArea = function(x1,y1,x2,y2)
  { 
    var w = abs(x2-x1)+1;
    var h = abs(y2-y1)+1;
    var mx = min(x1,x2);
    var my = min(y1,y2);
    for(x = 0;x < w;x++){
      for(y = 0;y < h;y++){
        this.tiles[x+mx][y+my].removeBlock();
      }
    }
  }
  
  this.encode = function(x1,y1,x2,y2)
  {
    var w = abs(x2-x1)+1;
    var h = abs(y2-y1)+1;
    var s = w+","+h+">";
    var mx = min(x1,x2);
    var my = min(y1,y2);
    for(x = 0;x < w;x++){
      for(y = 0;y < h;y++){
        var b = this.tiles[x+mx][y+my].block;
        if(b !== undefined){
          s += tools.indexOf(b.__proto__.constructor)+","+b.b;
          if(b.encode !== undefined){
            s += b.encode();
          }
        }
        s += "|";
      }
    }
    return s;
  }
  
  this.decode = function(mx,my,data)
  {
    var a = data.split(">");
    var b = a[0].split(",");
    var w = parseInt(b[0]);
    var h = parseInt(b[1]);
    var s = a[1].split("|");
    var i = 0;
    for(x = 0;x < w;x++){
      for(y = 0;y < h;y++){
        var c = s[i].split(",");
        if(c[0] !== ""){
          var b = new tools[parseInt(c[0])];
          this.tiles[x+mx][y+my].click(b)
          b.b = (c[1] != "false");
          if(b.decode !== undefined && c[2] !== undefined){b.decode(c[2]);}
        }else{this.tiles[x+mx][y+my].removeBlock();}
        i++;
      }
    }
  }
}

function Tile(x,y,p) {
  this.x = x;
  this.y = y;
  this.parent = p;
  this.block;
  this.b = true;
  this.c = true;//visuals
}

Tile.prototype.removeBlock = function()
{
  this.block = undefined;
  this.update(null,true);
}

Tile.prototype.click = function(b)
{
  if(b === undefined && this.block !== undefined){
    if(this.block.click !== undefined){
      this.block.click();
    }
    return;
  }
  if(b !== undefined){
    this.block = b;
    this.block.parent = this;
    this.update(null,true);
  }else{this.b = !this.b;}
}

async function Tupdate(a,x,y,b,p,isBlock){
  if(a[x] !== undefined){
    if(a[x][y] !== undefined){
      var n = a[x][y].block;
      if(n !== undefined){
        if(isBlock){
          if(n.blockUpdate !== undefined){
            n.blockUpdate();
          }
        }else if(n.update !== undefined){
          n.update(b,p);
        }
      }
    }
  }
}

Tile.prototype.update = function(b,isBlock)
{
  this.b = b;
  var a = this.parent.tiles;
  var x = this.x;var y = this.y;
  if(isBlock){Tupdate(a,x,y,this.b,this,isBlock);}
  Tupdate(a,x+1,y,this.b,this,isBlock);
  Tupdate(a,x-1,y,this.b,this,isBlock);
  Tupdate(a,x,y+1,this.b,this,isBlock);
  Tupdate(a,x,y-1,this.b,this,isBlock);
}

Tile.prototype.draw = function(colors)
{ 
  push();
  rectMode(RADIUS);
  stroke(0,100);
  if(this.block !== undefined){strokeWeight(0);}
  if(this.c){fill(colors[0]);}else{fill(colors[1]);}
  rect(this.x*scl+offset.x,this.y*scl+offset.y,0.5*scl,0.5*scl);
  pop();
  if(this.block !== undefined){this.block.draw(colors);}
}

function Block1() {
  this.parent;
  this.b = true;
}

Block1.prototype.click = function(b){this.b = !this.b;this.parent.update(this.b);}

Block1.prototype.draw = function(colors)
{ 
  var x = this.parent.x;
  var y = this.parent.y;
  push();
  noStroke();
  if(this.b){fill(colors[2]);}else{fill(colors[3]);}
  ellipse(x*scl+offset.x,y*scl+offset.y,0.5*scl);
  pop();
}

Block1.prototype.update = async function(b)
{ 
  if(!this.b && b){
    //this.b = b;
    this.parent.update(this.b);
  }
}

function Block2() {
  this.parent;
  this.b = true;
  this.da = false;this.db = false;this.dc = false;this.dd = false;
}

Block2.prototype.blockUpdate = function()
{ 
  var x = this.parent.x;
  var y = this.parent.y;
  var a = true;var b = true;var c = true;var d = true;
  try{
    if(this.parent.parent.tiles[x][y+1].block.update === undefined){ a = false;}
  }catch(e){ a = false;}
  try{
    if(this.parent.parent.tiles[x][y-1].block.update === undefined){ c = false;}
  }catch(e){ c = false;}
  try{
    if(this.parent.parent.tiles[x+1][y].block.update === undefined){ b = false;}
  }catch(e){ b = false;}
  try{
    if(this.parent.parent.tiles[x-1][y].block.update === undefined){ d = false;}
  }catch(e){ d = false;}
  this.da = a;this.db = b;this.dc = c;this.dd = d;
}

Block2.prototype.draw = function(colors)
{ 
  var x = this.parent.x;
  var y = this.parent.y;
  var a = this.da;var b = this.db;var c = this.dc;var d = this.dd;
  push();
  strokeWeight(0.2*scl);
  if(this.b){stroke(colors[2]);}else{stroke(colors[3]);}
  if(!(a||b||c||d)){ellipse(x*scl+offset.x,y*scl+offset.y,0.05*scl);}
  if(c){line(x*scl+offset.x,(y-0.5)*scl+offset.y,x*scl+offset.x,(y+0)*scl+offset.y);}
  if(a){line(x*scl+offset.x,(y-0)*scl+offset.y,x*scl+offset.x,(y+0.5)*scl+offset.y);}
  if(b){line((x-0)*scl+offset.x,y*scl+offset.y,(x+0.5)*scl+offset.x,y*scl+offset.y);}
  if(d){line((x-0.5)*scl+offset.x,y*scl+offset.y,(x+0)*scl+offset.x,y*scl+offset.y);}
  pop();
}

Block2.prototype.update = async function(b)
{ 
  if(this.b != b){
    this.b = b;
    this.parent.update(b);
  }
}

function Block3() {
  this.parent;
  this.b = true;
  this.dir = 0;
  this.output;
  this.input;
}

Block3.prototype.click = function(b){
  if(b === undefined){
  this.dir++;
  this.dir = this.dir % 4;
  }
  try{this.output = this.parent.parent.tiles[this.parent.x + round(cos(PI*0.5*this.dir))][this.parent.y + round(sin(PI*0.5*this.dir))].block;}catch(e){this.output = undefined;}
  try{this.input  = this.parent.parent.tiles[this.parent.x - round(cos(PI*0.5*this.dir))][this.parent.y - round(sin(PI*0.5*this.dir))].block;}catch(e){this.input  = undefined;}
  //this.update();
}

Block3.prototype.draw = function(colors)
{ 
  var x = this.parent.x;
  var y = this.parent.y;
  push();
  noStroke();
  if(this.b){fill(colors[2]);}else{fill(colors[3]);}
  var dy = 0.5 * sqrt(3) / 3;
  var dx = 0.5 / 2;
  translate((x*scl)+offset.x, (y*scl)+offset.y);
  rotate(PI*0.5*(this.dir+1));
  triangle(dx*scl,dy*scl,-dx*scl,dy*scl,0*scl,-(dy)*scl);
  pop();
}

Block3.prototype.blockUpdate = function(){this.click(true);}

Block3.prototype.update = async function()
{ 
  //if(bla === this.b){return;}
  //try{
    if(this.input === undefined || this.output === undefined){this.click(true);}
    if(this.input.b1 !== undefined){
      if(this.dir % 2 == 0){this.input.b = this.input.b1;}else{this.input.b = this.input.b2;}
    }
    if(this.b == this.input.b/*||(!this.b && this.output.b)*/){
      this.b = !this.input.b;
      await sleep(delay);
      this.output.update(this.b,this.parent);
    }else if(!this.b && this.output.b){
      this.output.update(this.b,this.parent);
    }
  //}catch(e){print(e.toString());}
}

Block3.prototype.encode = function()
{
  return "," + this.dir;
}

Block3.prototype.decode = function(data)
{
  this.dir = parseInt(data);
}

function Block4() {
  this.parent;
  this.b = null;//never used
  this.b1 = true;
  this.b2 = true;
}

Block4.prototype.draw = function(colors)
{ 
  var x = this.parent.x;
  var y = this.parent.y;
  push();
  if(false){
    rectMode(RADIUS);
    noStroke();
    if(this.b2){fill(colors[2]);}else{fill(colors[3]);}
    rect(x*scl+offset.x,y*scl+offset.y,0.05*scl,0.5*scl);
    if(this.b1){fill(colors[2]);}else{fill(colors[3]);}
    rect(x*scl+offset.x,y*scl+offset.y,0.5*scl,0.05*scl);
    stroke('black');fill('black');
    rect(x*scl+offset.x,y*scl+offset.y,0.1*scl,0.1*scl);
  }else{
    strokeWeight(0.2*scl);
    if(this.b2){stroke(colors[2]);}else{stroke(colors[3]);}
    line(x*scl+offset.x,(y-0.5)*scl+offset.y,x*scl+offset.x,(y+0.5)*scl+offset.y);
    if(this.b1){stroke(colors[2]);}else{stroke(colors[3]);}
    line((x-0.5)*scl+offset.x,y*scl+offset.y,(x+0.5)*scl+offset.x,y*scl+offset.y);
    stroke('black');fill('black');
    ellipse(x*scl+offset.x,y*scl+offset.y,0.2*scl);
  }
  pop();
}

Block4.prototype.update = async function(b,p)
{ 
  try{
    var a = round(atan2(this.parent.y - p.y,this.parent.x - p.x)/(PI*0.5));//fixme
    if(a % 2 == 0){
      if(this.b1 != b){
        this.b1 = b;
        this.parent.parent.tiles[this.parent.x + 1][this.parent.y].block.update(b,this.parent);
        this.parent.parent.tiles[this.parent.x - 1][this.parent.y].block.update(b,this.parent);
        //this.parent.update(b);
      }
    }else{
      if(this.b2 != b){
        this.b2 = b;
        this.parent.parent.tiles[this.parent.x][this.parent.y + 1].block.update(b,this.parent);
        this.parent.parent.tiles[this.parent.x][this.parent.y - 1].block.update(b,this.parent);
        //this.parent.update(b);
      }
    }
  }catch(e){print(e.toString());}
}

Block4.prototype.encode = function()
{
  return "," + this.b1 +"."+ this.b2;
}

Block4.prototype.decode = function(data)
{
  var s = data.split(".");
  this.b1 = s[0]!= "false";
  this.b2 = s[1]!= "false";
}

function Block5() {
  this.parent;
  this.b = true;
  this.dir = 0;
  this.output;
  this.input;
  
  this.oldtime;
  this.queue = [];  
}

Block5.prototype.click = function(b){
  if(b === undefined){
  this.dir++;
  this.dir = this.dir % 4;
  }
  try{this.output = this.parent.parent.tiles[this.parent.x + round(cos(PI*0.5*this.dir))][this.parent.y + round(sin(PI*0.5*this.dir))].block;}catch(e){this.output = undefined;}
  try{this.input  = this.parent.parent.tiles[this.parent.x - round(cos(PI*0.5*this.dir))][this.parent.y - round(sin(PI*0.5*this.dir))].block;}catch(e){this.input  = undefined;}
  //this.update();
}

Block5.prototype.draw = function(colors)
{ 
  var x = this.parent.x;
  var y = this.parent.y;
  push();
  rectMode(RADIUS);
  noStroke();
  if(this.b){fill(colors[2]);}else{fill(colors[3]);}
  var dy = 0.5 * sqrt(3) / 3;
  var dx = 0.5 / 2;
  translate((x*scl)+offset.x, (y*scl)+offset.y);
  rotate(PI*0.5*(this.dir+1));
  triangle(dx*scl,dy*scl,-dx*scl,dy*scl,0*scl,-(dy)*scl);
  rect(0*scl,-(dy)*scl,0.25*scl,0.05*scl);
  pop();
}

Block5.prototype.blockUpdate = function(){this.click(true);}

Block5.prototype.clockUpdate = async function()
{
  if(millis() - this.oldtime > 100){
    var index = clockEvents.indexOf(this);
    if (index > -1) {
      clockEvents.splice(index, 1);
    }else{throw 'wat';}
    
    var sum = 0;
    for(var i = 0;i < this.queue.length;i++){
      sum += this.queue[i];
    }
    
    this.b = round(sum/this.queue.length) > 0.8;
    this.queue = [];
    this.output.update(this.b,this.parent);
  }
}

Block5.prototype.update = async function(b,p)
{ 
  if(this.input === undefined || this.output === undefined){this.click(true);}
  
  if(p.block == this.input){
    if(this.input.b1 !== undefined){
      if(this.dir % 2 == 0){this.input.b = this.input.b1;}else{this.input.b = this.input.b2;}
    }
    if(b !== this.input.b){throw 'wat';}
    if(this.queue.length == 0){this.oldtime = millis();clockEvents.push(this);}
    this.queue.push(b?1:0);
  }
  if(p.block == this.output){
    if(!this.b && this.output.b){
      this.output.update(this.b,this.parent);
    }
  }
}

Block5.prototype.encode = function()
{
  return "," + this.dir;
}

Block5.prototype.decode = function(data)
{
  this.dir = parseInt(data);
}


/*
function Wall(x,y,d) {
  
  this.x = x;
  this.y = y;
  this.dir = d;
  
  this.b = true;
  
  this.draw = function(colors)
  { 
    push();
    strokeWeight(0.2*scl);
    if(this.b){stroke(colors[2]);}else{stroke(colors[3]);}
    if(this.dir){
      line(this.x*scl+offset.x,(this.y-0.5)*scl+offset.y,this.x*scl+offset.x,(this.y+0.5)*scl+offset.y);
    }else{
      line((this.x-0.5)*scl+offset.x,this.y*scl+offset.y,(this.x+0.5)*scl+offset.x,this.y*scl+offset.y);
    }
    pop();
  }
}
*//*
function Turtle(p,ID,bDay) {
  
  if(ID === undefined){ID = 0;}
  if(bDay === undefined){bDay = new Date().getTime();}
  
  this.x = 0;
  this.y = 0;
  this.dir = 0;
  this.bDay = bDay;
  this.plane = p;
  this.color = color('hsb('+ID*53+', 100%, 50%)');
  
  this.draw = function()
  {
    push();
    fill(this.color);
    noStroke();
    
    var dy = 0.5 * sqrt(3) / 3;
    var dx = 0.5 / 2;

    translate((this.x*scl)+offset.x, (this.y*scl)+offset.y);
    rotate(this.dir*(2*PI/4));
    //ellipse(this.x*scl+offset.x,this.y*scl+offset.y,0.3*scl);
    triangle(dx*scl,dy*scl,-dx*scl,dy*scl,0*scl,-(dy)*scl);
    pop();
  }
  
  this.randomtp = function()
  {
    randomSeed(hue(this.color));
    this.x = floor(random(0,this.plane.tiles.length));
    this.y = floor(random(0,this.plane.tiles.length));
  }
  this.tp = function(x,y)
  {
    if(this.plane.tiles[x] !== undefined){
    if(this.plane.tiles[x][y] !== undefined){
      this.x = x;
      this.y = y;
    }}
  }
  
  this.buildWall = function()
  {
    this.plane.tiles[this.x][this.y].walls[this.dir].b = !this.plane.tiles[this.x][this.y].walls[this.dir].b;
    try{ 
    if(!hammerSound.isPlaying()&&doSounds)
      {hammerSound.stopAll();
      hammerSound.play(0,2,1/(dist(this.x,this.y,turtles[id].x,turtles[id].y)+1),2,2);}
    } catch(e){print('cant play sounds');}
  }
  
  this.move = function(dir)
  {
    this.dir = dir;
    if(this.plane.tiles[this.x][this.y].walls[modulo(dir,4)].b === true){
      switch (dir) {
        case 0:
          var ny = this.y - 1;
          var nx = this.x;
          break;
        case 1:
          var ny = this.y;
          var nx = this.x + 1;
          break;
        case 2:
          var ny = this.y + 1;
          var nx = this.x;
          break;
        case 3:
          var ny = this.y;
          var nx = this.x - 1;
          break;
      }
      //var ny = this.y + 
      //var nx = this.x + 
      if(this.plane.tiles[nx] !== undefined){
      if(this.plane.tiles[nx][ny] !== undefined){
        this.x = nx;
        this.y = ny;
      }}
    }
  }
}
*/
function modulo(a,b){
  return a - b * floor(a/b);
}