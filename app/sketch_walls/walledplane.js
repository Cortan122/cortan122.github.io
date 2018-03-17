function Wplane(n) {
   
  this.tiles = [];
  this.walls = [];
  this.allwalls = [];
  this.colors = [color(255),color(21,197,4,100),color(0,100),color('red')]; //trueTile(bg),falseTile,trueWall,falseWall
  
  //this.scl = scl;
  //this.offset = offset;
  
  for(x = 0;x < n;x++){
    var line = [];
    for(y = 0;y < n;y++){
      line.push(new Tile(x,y,this));
    }
    this.tiles.push(line);
  }
  for(i = 0;i < this.tiles.length;i++){
    this.walls.push(new Wall(-0.5,i,true));
    this.tiles[0][i].walls[3] = this.walls[this.walls.length-1];
    
    this.walls.push(new Wall(i,this.tiles[0].length-0.5,false));
    this.tiles[i][this.tiles[0].length-1].walls[2] = this.walls[this.walls.length-1];
  }
  Array.prototype.push.apply(this.allwalls, this.walls);
  for(x = 0;x < this.tiles.length;x++){
    for(y = 0;y < this.tiles[x].length;y++){
      this.tiles[x][y].setup();
    }
  }
  
  this.click = function()
  {
    for(i = 0;i < this.walls.length;i++){
      this.walls[i].b = !this.walls[i].b;
    }
  }
  
  this.draw = function()
  { 
    for(x = 0;x < this.tiles.length;x++){
      for(y = 0;y < this.tiles[x].length;y++){
        this.tiles[x][y].draw(false,this.colors);
      }
    }
    for(i = 0;i < this.allwalls.length;i++){
      this.allwalls[i].draw(this.colors);
    }
    for(i = 0;i < this.walls.length;i++){
      this.walls[i].draw(this.colors);
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
          ntile[iy].draw(true,this.colors);
        }
    }
  }
}

function Tile(x,y,p) {
  
  this.x = x;
  this.y = y;
  this.parent = p;
  this.b = true;
  
  this.walls = []; // N(0,-1),E(1,0),S(0,1),W(-1,0)
  
  this.walls.push(new Wall(this.x,this.y-0.5,false));
  this.walls.push(new Wall(this.x+0.5,this.y,true));
  Array.prototype.push.apply(this.parent.allwalls, this.walls);
  this.setup = function()
  {
    var n = this.parent.tiles[x][y-1];
    if(n !== undefined){
      n.walls[2] = this.walls[0];
    }else{this.parent.walls.push(this.walls[0]);}
    n = this.parent.tiles[x+1];
    if(n !== undefined){
      n[y].walls[3] = this.walls[1];
    }else{this.parent.walls.push(this.walls[1]);}
  }
  this.click = function()
  {
    for(i = 0;i < this.walls.length;i++){
        this.walls[i].b = !this.walls[i].b;
    }
    this.b = ! this.b;
  }
  
  this.draw = function(b,colors)
  { 
    push();
    rectMode(RADIUS);
    stroke(0,100);
    //strokeWeight(0.4*scl);
    if(this.b){fill(colors[0]);}else{fill(colors[1]);}
    rect(this.x*scl+offset.x,this.y*scl+offset.y,0.4*scl,0.4*scl);
    pop();
    if(b){
      for(i = 0;i < this.walls.length;i++){
        this.walls[i].draw(colors);
      }
    }
  }
}

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

function modulo(a,b){
  return a - b * floor(a/b);
}