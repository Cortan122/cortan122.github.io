function Particle(x,y) {
  if(x == undefined&&y == undefined){
    do{
      x = floor(random(0,grid.length));
      y = floor(random(0,grid[0].length));
    }while(!grid[floor(x)][floor(y)].b)
  }
  this.pos = createVector(x,y);
  this.speed = random(minSpeed,maxSpeed);
  this.color = color(map(this.speed,minSpeed,maxSpeed,0,255), 255, 255, 100);
  //this.vel = createVector(0,0);
}

Particle.prototype.update = function() {
  this.vel = convertVectorToP5(grid[floor(this.pos.x)][floor(this.pos.y)].v);
  if(this.vel.x == 0){this.vel.x = -(this.pos.x-floor(this.pos.x));}
  if(this.vel.y == 0){this.vel.y = -(this.pos.y-floor(this.pos.y));}
  this.pos.add(this.vel.mult(this.speed));
}

Particle.prototype.draw = function() {
  push();
  noStroke();
  fill(this.color);
  ellipse((this.pos.x),(this.pos.y),1,1);
  pop();
}