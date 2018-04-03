function Thing(x,y,dx,dy){
  this.pos = createVector(x,y);
  this.vel = createVector(dx,dy);
  this.s = speed;
  this.vector = createVector(x,y);
  this.colour = color(random(0,255), 255, 255, 100);
  this.age = 0;
  this.mass = 1; 
  
  this.dir = function(x,y){
    this.pos.add(createVector(x*10,y*10));
  }
  
  this.draw = function(){ 
    if(tweakables.colorMode == 1){
      stroke(this.colour);
    }else if(tweakables.colorMode == 2){
      stroke(color((this.mass * 10) % 255,255,255/*,100*/));
      if (this.age < 0 ){stroke(255);}
    }
    if (100 < dist(this.vector.x,this.vector.y,this.pos.x,this.pos.y)){
      this.vector = createVector(this.pos.x,this.pos.y);
    }
    line(this.vector.x,this.vector.y,this.pos.x,this.pos.y);
    this.vector = createVector(this.pos.x,this.pos.y);
  }

  this.force = function(x,y){
    x *= this.s/this.mass;y *= this.s/this.mass;
    var mag1 = /*sqrt*/(x*x+y*y);
    var mag2 = /*sqrt*/(this.vel.x*this.vel.x+this.vel.y*this.vel.y);
    var div = 1 + sqrt(mag1*mag2/(c*c*c*c));
    //var div = 1;
    this.vel.x = (this.vel.x + x)/div;
    this.vel.y = (this.vel.y + y)/div;
    //if(sqrt(this.vel.x*this.vel.x+this.vel.y*this.vel.y) >= c*c){/*print('hi');*/}
  }

  this.forceUpdate = function(){
    /*if(this.mass > fisionThreshold){
      var angle = atan2(this.vel.y,this.vel.x);
      var mag = sqrt(this.vel.x*this.vel.x+this.vel.y*this.vel.y);
      if(anglerandomization){
        var DAngle = random(1,0);
      }else{
        var DAngle = 1;
      }  
      
      this.vel = createVector(cos(angle+DAngle)*mag,sin(angle+DAngle)*mag);
      this.mass /= 2;
      //theThings[i] = new thing(theT.pos.x,theT.pos.y,cos(angle+DAngle),sin(angle+DAngle));
      theThings.push(new thing(this.pos.x + this.vel.x*this.s,this.pos.y + this.vel.y*this.s,cos(angle-DAngle)*mag,sin(angle-DAngle)*mag));
      theThings[theThings.length-1].mass = this.mass;
      //return;
    }*/
    var closeThings = theThings;
    for(var i = 0; i < closeThings.length; i++){
      var t = closeThings[i];
      if(t == this){continue;}
      var dist = trueDistance(t.pos,this.pos);
      var x = dist.x;var y = dist.y;var mag = dist.mag;
      /*if(mag < fusionThreshold){
        print('hi');
        this.mass += t.mass;
        var index = theThings.indexOf(t);
        if (index > -1) {
          theThings.splice(index, 1);
        }
      }*/
      var power = (mag*sqrt(mag))/(this.mass*t.mass);
      var dir = createVector((x)/power,(y)/power);
      this.force(dir.x,dir.y);
      var power = (mag*mag*sqrt(mag))/forceMultiplier;
      var dir = createVector((x)/power,(y)/power);
      this.force(-dir.x,-dir.y);
    }
  }

  this.update = function(){
    this.s = speed;

    this.age += this.s;
    
    this.pos.x = this.pos.x + this.vel.x*this.s;
    this.pos.y = this.pos.y + this.vel.y*this.s;
    
    this.pos.y = modulo(this.pos.y , (height));
    this.pos.x = modulo(this.pos.x , (width));
  }
}
