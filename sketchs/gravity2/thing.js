function thing(x,y,dx,dy)
{
  this.pos = createVector(x,y);
  this.gridPos = createVector(round(x/100),round(y/100));
  this.lastGridPos = this.gridPos.copy();
  this.vel = createVector(dx,dy);
  this.s = speed;
  this.vector = createVector(x,y);
  this.colour = color(random(0,255), 255, 255, 100);
  this.age = 0;
  this.mass = 1;
  
  wrapper.set(this.gridPos.x,this.gridPos.y,this);  
  
  this.dir = function(x,y)
  {
    this.vel = createVector(x,y);
  }
  
  this.draw = function()
  { 
    if(colors == 1){
      stroke(this.colour);
    }else if(colors == 2){
      stroke(color((this.mass * 10) % 255,255,255,100));
      if (this.age < 0 ){stroke(255);}
    }
    if (100 < dist(this.vector.x,this.vector.y,this.pos.x,this.pos.y)){
      this.vector = createVector(this.pos.x,this.pos.y);
    }
    line(this.vector.x,this.vector.y,this.pos.x,this.pos.y);
    this.vector = createVector(this.pos.x,this.pos.y);
  }
  this.force = function(x,y)
  {
    x *= this.s/this.mass;y *= this.s/this.mass;
    var mag1 = sqrt(x*x+y*y);
    var mag2 = sqrt(this.vel.x*this.vel.x+this.vel.y*this.vel.y);
    var div = 1 + (mag1*mag2/(c*c))
    this.vel.x = (this.vel.x + x)/div;
    this.vel.y = (this.vel.y + y)/div;
    if(sqrt(this.vel.x*this.vel.x+this.vel.y*this.vel.y) >= c*c){/*print('hi');*/}
  }
  this.forceUpdate = function()
  {
    for(var i = 0; i < theThings.length; i++)
    {
      var t = theThings[i];
      if(t == this){continue;}
      var x = (t.pos.x-this.pos.x);
      var y = (t.pos.y-this.pos.y);
      var mag = (x*x+y*y);

      var power = (mag*sqrt(mag))/(this.mass*t.mass);
      var dir = createVector((x)/power,(y)/power);
      this.force(dir.x,dir.y);
      //var power = (mag*mag*sqrt(mag))/forceMultiplier;
      //var dir = createVector((x)/power,(y)/power);
      //this.force(-dir.x,-dir.y);
    }
  }
  this.update = function()
  {
    this.s = speed;
    this.age += this.s;
    
    x = this.pos.x;y = this.pos.y;
    
    x = x + this.vel.x*this.s;
    y = y + this.vel.y*this.s;
    
    y = modulo(y , (height-10));
    x = modulo(x , (width-10));
    
    this.gridPos = createVector(round(x/100),round(y/100));
    if(!this.gridPos.equals( this.lastGridPos )){
      var g = wrapper.get(this.gridPos.x,this.gridPos.y);
      if(g != undefined){
        var v1 = createVector(-(this.vel.x*this.mass-(this.vel.x + 2*g.vel.x)*g.mass)/(g.mass+this.mass),-(this.vel.y*this.mass-(this.vel.y + 2*g.vel.y)*g.mass)/(g.mass+this.mass));
        var v2 = createVector(-(g.vel.x*g.mass-(g.vel.x + 2*this.vel.x)*this.mass)/(g.mass+this.mass),-(g.vel.y*g.mass-(g.vel.y + 2*this.vel.y)*this.mass)/(g.mass+this.mass));
        
        this.vel = v1;
        g.vel = v2;
        this.gridPos = this.lastGridPos.copy();//fixme
      }
      wrapper.set(this.lastGridPos.x,this.lastGridPos.y);
      wrapper.set(this.gridPos.x,this.gridPos.y,this);
      this.lastGridPos = this.gridPos.copy();
    }
    
    this.pos.x = x;this.pos.y = y;
  }
}