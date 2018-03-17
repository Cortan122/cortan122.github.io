function Wplane(n) {
   
  this.tiles = [];
  this.max = 100;
  this.min = 0;
  this.allwalls = [];
  this.colors = [color(255),color(21,197,4,100),color('rgba(0,0,0,0.1)'),color('rgba(0,0,0,0.5)')]; //trueTile(bg),falseTile,trueWall,falseWall
  
  //this.scl = scl;
  //this.offset = offset;
  
  for(x = 0;x < n;x++){
    var line = [];
    for(y = 0;y < n;y++){
      line.push(new Tile());
      
      if(y < n-1){this.allwalls.push(new Wall(x,y+0.5,false,this));}
      if(x < n-1){this.allwalls.push(new Wall(x+0.5,y,true,this));}
    }
    this.tiles.push(line);
  }
  //for(i = 0;i < this.tiles.length;i++){
  //  //this.walls.push(new Wall(-0.5,i,true,this));
  //  //this.walls.push(new Wall(i,this.tiles[0].length-0.5,false,this));
  //}
  Array.prototype.push.apply(this.allwalls, this.walls);
  for(i = 0;i < this.allwalls.length;i++){
    this.allwalls[i].setup();
  }
  
  this.calc = function()
  {
    for(i = 0;i < this.allwalls.length;i++){
      this.allwalls[i].calc();
    }
    for(i = 0;i < this.allwalls.length;i++){
      this.allwalls[i].apply();
    }
    for(x = 0;x < this.tiles.length;x++){
      for(y = 0;y < this.tiles[x].length;y++){
        this.tiles[x][y].update();
      }
    }
  }
  
  this.count = function()
  {
    var r = 0;
    var max = 0;
    var min = Number.MAX_VALUE;
    for(x = 0;x < this.tiles.length;x++){
      for(y = 0;y < this.tiles[x].length;y++){
        var v = this.tiles[x][y].v;
        r += v;
        if(max < v){max = v;}
        if(min > v){min = v;}
      }
    }
    this.max = max;
    this.min = min;
    return (round10(r,-2)+' max:'+round10(max,-5)+'min:'+round10(min,-5));
  }
  
  this.draw = function()
  { 
    for(i = 0;i < this.allwalls.length;i++){
      this.allwalls[i].draw(this.colors);
    }
    for(x = 0;x < this.tiles.length;x++){
      for(y = 0;y < this.tiles[x].length;y++){
        //fill(color(modulo((this.tiles[x][y].v-this.min)*350/this.max,360), 255, 255));
        fill(color(modulo(this.tiles[x][y].v*10,360), 255, 255));
        ellipse(x*scl+offset.x,y*scl+offset.y,0.3*scl);
      }
    }
  }
  this.draw3D = function()
  { 
    renderer3D.background(255);
    renderer3D.push();
    renderer3D.translate(0, 250);
    renderer3D.rotateX(-PI/3);
    renderer3D.fill(0,0,0, 50);
    renderer3D.translate(-1700/2, -2000/2);
    for (var y = 0; y < this.tiles.length-1; y++) {
      renderer3D.beginShape(TRIANGLE_STRIP);
      for (var x = 0; x < this.tiles[y].length; x++) {
        renderer3D.vertex(x*scl, y*scl, this.tiles[x][y].v*vscl);
        renderer3D.vertex(x*scl, (y+1)*scl, this.tiles[x][y+1].v*vscl);
      }
      renderer3D.endShape();
    }
    renderer3D.pop();
  }
}

function Tile() {
  this.v = 0;
  this.vel = 0;
  this.acc = 0;
}

Tile.prototype.update = function() {
  //this.acc -= this.v/4;
  this.vel += this.acc;
  this.v += this.vel;
  this.acc = 0;
}

function Wall(x,y,d,p) {
  
  this.x = x;
  this.y = y;
  this.t1;
  this.t2;
  this.dir = !d;
  this.p = p;
  this.v = 0;
  
  this.setup = function()
  { 
    if(this.dir){
      this.t1 = p.tiles[this.x][this.y+0.5];
      this.t2 = p.tiles[this.x][this.y-0.5];
    }else{
      this.t1 = p.tiles[this.x+0.5][this.y];
      this.t2 = p.tiles[this.x-0.5][this.y];
    }
  }
  
  this.calc = function()
  { 
    this.v = (this.t1.v - this.t2.v)/4;
  }
  
  this.apply = function()
  { 
    if(this.v != 0){
      this.t1.acc -= this.v;
      this.t2.acc += this.v;
      //this.t1.v -= this.v;
      //this.t2.v += this.v;
    }
  }
  
  this.draw = function(colors)
  { 
    push();
    strokeWeight(0.2*scl);
    if(this.v != 0){stroke(colors[2]);}else{stroke(colors[3]);}
    var dy = 0.5 * sqrt(3) / 3;
    var dx = 0.5 / 2;

    translate((this.x*scl)+offset.x, (this.y*scl)+offset.y);
    rotate(PI);
    if(this.v > 0){rotate(PI);}
    if(!this.dir){rotate(-PI/2);}
    push();
    strokeWeight(0);
    fill(colors[2]);
    if(this.v != 0){triangle(dx*scl,dy*scl,-dx*scl,dy*scl,0*scl,-(dy)*scl);}
    pop();
    line(0,-0.5*scl,0,0.5*scl);
    fill(0);
    //ellipse(this.x*scl+offset.x,this.y*scl+offset.y,0.3*scl);
    pop();
  }
}

function modulo(a,b){
  return a - b * floor(a/b);
}