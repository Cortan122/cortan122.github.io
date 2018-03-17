function makeTransform(_this,_arguments){
  if(_this.constructor.prototype.x == undefined){
    if(!_this.constructor.prototype.pos)_this.constructor.prototype.pos = {};
    Object.defineProperty(_this.constructor.prototype, "x", {
      set: function(value) {
        this.pos.x = value;
      },
      get: function() {
        return this.pos.x;
      }, configurable: true, enumerable: false
    });
    Object.defineProperty(_this.constructor.prototype, "y", {
      set: function(value) {
        this.pos.y = value;
      },
      get: function() {
        return this.pos.y;
      }, configurable: true, enumerable: false
    });
  }
  var x = _arguments[0];var y = _arguments[1];
  if(x != undefined&&y == undefined){y = x.y;x = x.x;}
  if(x == undefined||y == undefined)throw 'trying to define a {0} with no position'.format(_this.constructor.name);
  _this.pos = createVector(x,y);
}

function Tile(x,y){
  makeTransform(this,arguments);

  this.health = 1;//floor(random(1,10));
  this.isTakingDamage = false;
}

Tile.prototype.init = function(value){
  if(value>0)this.health = value;
  else if(value == 0)return undefined;
  else if(value == -1){
    this.health = 1;
    //this._color = color(0);
    this.event = () => {balls.push(
      new Ball(createVector(this.x-grid.size/2+0.5,this.y-grid.size/2+0.5))
    );};
  }
  this.isTakingDamage = false;
  return this;
}

Tile.prototype.draw = function(can){
  if(can == undefined)can = window;
  can.push();
  can.rectMode(RADIUS);
  can.noStroke();
  can.fill(this.color);
  var gap = tweakables.gap;
  if(this.isTakingDamage){
    this.isTakingDamage = false;
    gap = -tweakables.gap;
    can.isDirty = true;
  }
  can.rect(this.x*scl,this.y*scl,(scl-gap)/2,(scl-gap)/2);
  can.fill(this.event?255:0);
  can.text(this.health,this.x*scl,this.y*scl);
  can.pop();
}

Tile.prototype.destroy = function(){
  grid.array[this.x][this.y] = undefined;
  grid.pushBoxes();
  if(this.event)this.event();
}

Tile.prototype.getBox = function(){
  var b = new Box(this.x-grid.size/2,this.y-grid.size/2,this.x+1-grid.size/2,this.y+1-grid.size/2);
  b.event = (()=>{this.health--;}).bind(this);
  return b;
}

Object.defineProperty(Tile.prototype, "color", {
  get: function() {
    if(!this._color){
      if(!this.event)
        return this._color = color('hsba({0},100%,100%,1)'.format(modulo(floor(
          -this.health*30+100
        ),360)));
      else
        return this._color = color(0);
    }
    return this._color;
  }
});
Object.defineProperty(Tile.prototype, "health", {
  set: function(value) {
    canvases.tiles.isDirty = true;
    if(value<=0){
      this.destroy();
      return;
    }
    this.isTakingDamage = true;
    this._color = undefined;
    this._health = value;
  },
  get: function() {
    return this._health;
  }
});

function Ball(pos,vel) {
  this.pos = (pos||createVector(0,0));
  this.vel = (vel||p5.Vector.random2D()).normalize();
  this.prevpos = this.pos;
  this.color = color('hsba({0},100%,100%,1)'.format( floor(degrees(this.vel.heading())+180) ));
  this.history = [this.pos];
  this.age = 0;
}

Ball.prototype.move = function(amount) {
  if(!this.isBounded){
    print("ball no.{0} went out of bounds".format(balls.indexOf(this)));
    balls.remove(this);
    return;
  }
  if(amount <= 0)return;
  var newpos = this.pos.copy().add(this.vel.copy().mult(amount));
  var line = [this.pos,newpos];
  var point = collider.check(line);
  if(point == undefined){this.pos = newpos;return;}
  var thickness = tweakables.thickness; 
  var amountRemaining = amount-this.pos.copy().dist(point.p)/this.vel.mag()-thickness;
  this.pos = point.p;
  if(point.event)point.event(this);
  if(point.t != undefined){
    var a = point.t;
    var b = this.vel.heading();
    var vel = p5.Vector.fromAngle(-b+2*a).setMag(this.vel.mag());
    this.vel = vel;
    this.history.push(this.pos);
  }
  this.pos = this.pos.copy().add(this.vel.copy().mult(thickness));

  if(this.age == 0)
    this.move(amountRemaining);
}

Ball.prototype.update = function(){
  if(this.age == 0)
    this.move(tweakables.timeStep);
  else
    this.age += tweakables.timeStep;

  if(this.age<tweakables.laserLength)
    canvases.main.isDirty = true;
}

Ball.prototype.drawBall = function() {
  //if(tweakables.simpleDraw){
    fill(tweakables.ballColor);
    noStroke();
    ellipse(this.pos.x*scl,this.pos.y*scl,tweakables.ballSize,tweakables.ballSize);
    return;
  //}
  strokeWeight(tweakables.ballSize);
  stroke(this.color.red,this.color.green,this.color.blue,100);
  line(this.prevpos.x,this.prevpos.y,this.pos.x,this.pos.y);
  fill(this.color);
  noStroke();
  ellipse(this.pos.x,this.pos.y,tweakables.ballSize,tweakables.ballSize);
  this.prevpos = this.pos.copy();
}

Ball.prototype.drawLaser = function() {
  push();
  var context = drawingContext;
  context.strokeStyle   = "#fff";
  context.lineWidth     = tweakables.ballSize-tweakables.shadowBlur*1.5;
  context.shadowBlur    = tweakables.shadowBlur;
  context.shadowColor   = tweakables.ballColor;
  context.lineJoin      = "bevel";
  var line = this.getLaserPath(tweakables.laserLength);
  //var line = makeBouncyLine(this.pos.copy(),this.vel.copy().mult(-1),1);
  for (var i = 0; i < tweakables.shadowIntensity; i++) {
    drawBouncyLine(line);
  }
  pop();
}

Ball.prototype.getLaserPath = function(amount) {
  var arr = this.history.copy().reverse();
  arr.unshift(this.pos);
  if(this.age != 0)amount -= this.age;
  amount = max(0,amount);
  var r = [arr[0]];
  for (var i = 0; i < arr.length-1; i++) {
    var d = dist(arr[i].x,arr[i].y,arr[i+1].x,arr[i+1].y);
    if(d<amount){
      amount -= d;
      r.push(arr[i+1]);
    }else{
      var p = p5.Vector.lerp(arr[i],arr[i+1],amount/d);
      r.push(p);
      break;
    }
  }
  return r;
} 

Ball.prototype.draw = function() {
  if(tweakables.ballDrawMode == "ball")
    this.drawBall();
  else if(tweakables.ballDrawMode == "laser")
    this.drawLaser();
}

Object.defineProperty(Ball.prototype, "isBounded", {
  get: function() {
    return collider.bounds.includes(this.pos);
  }
});
Object.defineProperty(Ball.prototype, "x", {
  set: function(value) {
    canvases.main.isDirty = true;
    this.pos.x = value;
  },
  get: function() {
    return this.pos.x;
  }, configurable: true, enumerable: false
});
Object.defineProperty(Ball.prototype, "y", {
  set: function(value) {
    canvases.main.isDirty = true;
    this.pos.y = value;
  },
  get: function() {
    return this.pos.y;
  }, configurable: true, enumerable: false
});
Object.defineProperty(Ball.prototype, "pos", {
  set: function(value) {
    canvases.main.isDirty = true;
    this._pos = value;
  },
  get: function() {
    return this._pos;
  }, configurable: true, enumerable: false
});

function Box(x,y,x1,y1,mode = 'corners') {
  if(arguments.length == 3||arguments.length == 2){
    if(x1)mode = x1;
    x1 = y.x;y1 = y.y;
    y = x.y;x = x.x;
  }
  if(mode == 'corner'){
    this.x = x;this.y = y;
    this.x1 = x+x1;this.y1 = y+y1;
  }else if(mode == 'corners'){
    this.x = min(x,x1);this.y = min(y,y1);
    this.x1 = max(x,x1);this.y1 = max(y,y1);
  }
  this.isSolid = true;
}

Box.prototype.includes = function(x,y){
  if(x != undefined&&y == undefined){y = x.y;x = x.x;}
  return x>this.x&&x<this.x1&&y>this.y&&y<this.y1;
}

Box.prototype.getBorders = function(){
  var v0 = createVector(this.x,this.y);
  var v1 = createVector(this.x1,this.y);
  var v2 = createVector(this.x1,this.y1);
  var v3 = createVector(this.x,this.y1);
  var r = [[v0,v1],[v0,v3],[v1,v2],[v2,v3]];
  r.map(e => {e.isSolid = this.isSolid;e.event = this.event});
  return r;
}

Object.defineProperty(Box.prototype, "v", {
  set: function(value) {
    this.x = value.x;
    this.y = value.y;
  },
  get: function() {
    return createVecto(this.x,this.y);
  }, configurable: true, enumerable: false
});
Object.defineProperty(Box.prototype, "v1", {
  set: function(value) {
    this.x1 = value.x;
    this.y1 = value.y;
  },
  get: function() {
    return createVecto(this.x1,this.y1);
  }, configurable: true, enumerable: false
});

var collider = {
  lines:[],//a line is an array of 2 p5.Vectors
  bounds:{},
  init:function(bounds){
    if(bounds)this.bounds = bounds;
    if(!(this.bounds instanceof Box) )this.bounds = new Box(0,0,width,height);
    this.lines = /*this.lines.concat(*/this.bounds.getBorders()/*)*/;
  },
  check:function(line){
    var points = this.lines
      .map(e => {return {p:intersectionChecker.point(e,line),l:e};})
      .filter(e => e.p != undefined);
    if(points.length == 0)return undefined;
    points.sort((a,b) => a.p.dist(line[0])-b.p.dist(line[0]));

    if(points[0].l.isSolid)
      points[0].t = points[0].l[1].copy().sub( points[0].l[0]).heading();
    points[0].event = points[0].l.event;
    return points[0];
  },
  draw:function(){
    strokeWeight(tweakables.colliderLineWidth);
    stroke(0);
    for (var i = 0; i < this.lines.length; i++) {
      line(this.lines[i][0].x*scl,this.lines[i][0].y*scl,this.lines[i][1].x*scl,this.lines[i][1].y*scl);
    }
  },
  drawBounds:function(can){
    if(can == undefined)can = window;
    can.push();
    //can.fill(255,1);
    //can.strokeWeight(tweakables.colliderLineWidth);
    //can.stroke(0);
    //can.noStroke();
    can.rectMode(CORNERS);
    //can.blendMode(REPLACE);
    //can.rect(this.bounds.x*scl,this.bounds.y*scl,this.bounds.x1*scl,this.bounds.y1*scl);
    can.drawingContext.clearRect(
      this.bounds.x*scl,
      this.bounds.y*scl,
      this.bounds.x1*scl*2,
      this.bounds.y1*scl*2
    );
    can.pop();
  },
  pushBox:function(b){
    this.lines = this.lines.concat(b.getBorders());
  }
}

var intersectionChecker = {
  onSegment:function(p,q,r){
    return (q.x <= max(p.x, r.x) && q.x >= min(p.x, r.x) &&
      q.y <= max(p.y, r.y) && q.y >= min(p.y, r.y));
  },
  orientation:function(p,q,r){
    // See http://www.geeksforgeeks.org/orientation-3-ordered-points/
    // for details of below formula.
    var val = (q.y - p.y) * (r.x - q.x) -
              (q.x - p.x) * (r.y - q.y);
    if (val == 0) return 0;  // colinear
    return (val > 0)? 1: 2; // clock or counterclock wise
  },
  doIntersect:function(p1, q1, p2, q2){
    // Find the four orientations needed for general and
    // special cases
    var o1 = intersectionChecker.orientation(p1, q1, p2);
    var o2 = intersectionChecker.orientation(p1, q1, q2);
    var o3 = intersectionChecker.orientation(p2, q2, p1);
    var o4 = intersectionChecker.orientation(p2, q2, q1);
    // General case
    if (o1 != o2 && o3 != o4)
      return true;
    // Special Cases
    // p1, q1 and p2 are colinear and p2 lies on segment p1q1
    if (o1 == 0 && intersectionChecker.onSegment(p1, p2, q1)) return true;
    // p1, q1 and p2 are colinear and q2 lies on segment p1q1
    if (o2 == 0 && intersectionChecker.onSegment(p1, q2, q1)) return true;
    // p2, q2 and p1 are colinear and p1 lies on segment p2q2
    if (o3 == 0 && intersectionChecker.onSegment(p2, p1, q2)) return true;
    // p2, q2 and q1 are colinear and q1 lies on segment p2q2
    if (o4 == 0 && intersectionChecker.onSegment(p2, q1, q2)) return true;
    return false; // Doesn't fall in any of the above cases
  },
  doIntersectE:function(e1,e2){
    return intersectionChecker.doIntersect(e1[0],e1[1],e2[0],e2[1]);
  },
  point:function(/*line*/ e1,/*line*/ e2){
    if(!intersectionChecker.doIntersectE(e1,e2))return undefined;
    var p1 = e1[0],p2 = e1[1],p3 = e2[0],p4 = e2[1];
    return createVector(((p1.x*p2.y-p1.y*p2.x)*(p3.x-p4.x)-(p1.x-p2.x)*(p3.x*p4.y-p3.y*p4.x))/((p1.x-p2.x)*(p3.y-p4.y)-(p1.y-p2.y)*(p3.x-p4.x)),((p1.x*p2.y-p1.y*p2.x)*(p3.y-p4.y)-(p1.y-p2.y)*(p3.x*p4.y-p3.y*p4.x))/((p1.x-p2.x)*(p3.y-p4.y)-(p1.y-p2.y)*(p3.x-p4.x)));
  }
}

var grid = {
  array:[],
  size:7,
  offset:{x:0,y:0},
  init:function(){
    for (var i = 0; i < this.size; i++) {
      var t = this.array[i] = [];
      for (var j = 0; j < this.size; j++) {
        t[j] = new Tile(i,j);
      }
    }
  },
  draw:function(can){
    if(can == undefined)can = window;
    can.push();
    can.translate(this.offset.x,this.offset.y);
    can.translate((.5-this.size/2)*scl,(.5-this.size/2)*scl);
    this.array.flatten().filter(e => e).map(e => e.draw(can));
    can.pop();
  },
  bottomLineEvent:e=>ballManager.onBallDeath(e),
  pushBoxes:function(){
    collider.init();
    collider.lines[3].event = this.bottomLineEvent;
    var bs = this.array.flatten().filter(e => e).map(e => e.getBox());
    bs.map(e => collider.pushBox(e));
  },
  nextTurn:function(){
    canvases.tiles.isDirty = true;
    if(this.checkLine(this.size-1))return;//game over
    var r = this.random();
    for (var i = 0; i < this.size; i++) {
      var t = this.array[i];
      t.pop();
      t.filter(e => e).map(e => e.y++);
      t.unshift((new Tile(i,0)).init(r[i]));
    }
    this.pushBoxes();

    var temp = this;
    animations.push( {progress:0,func:i => {
        temp.offset.y = (i-1)*scl;
        canvases.tiles.isDirty = true;
      },
      endfunc:() => {
        temp.offset.y = 0;
      }
    });

  },
  checkLine:function(n){
    var t = this.array.map(e => e[n/*this.size-1*/]).filter(e => e);
    return t.length!=0;
  },
  random:function(){
    var r = [];
    for (var i = 0; i < this.size; i++) {
      r[i] = floor(random(-1,10));
    }
    return r;
  }
}

var ballManager = {
  //numBalls:10,
  numBallsAlive:10,
  startPos:10,
  isWaitingForInput:true,
  ballsToDispense:[],
  cd:0,
  dir:{},
  onBallDeath:function(ball){
    ball.age = tweakables.timeStep;
    this.numBallsAlive--;
    if(this.numBallsAlive<=0){
      this.endTurn();
    }
  },
  endTurn:function(){
    var p = 0;
    balls.map(e => {
      p += e.x;
      e.age = tweakables.timeStep;
      e.y = collider.lines[3][0].y-tweakables.thickness;
      e.history = [e.pos];
    });
    p /= balls.length;
    this.startPos = p;

    animations.push( {progress:0,func:i => {
        balls.map(e => {e.pos.x = lerp(lerp(e.pos.x,p,-i/(1-i) ),p,i+tweakables.animationSpeed );});
        canvases.main.isDirty = true;
      },
      endfunc:() => {
        balls.map(e => e.x = p);
        this.ballsToDispense = balls.slice();
        this.isWaitingForInput = true;
        this.calcDir();
        canvases.main.isDirty = true;
        canvases.ui.isDirty = true;
      }
    } );

    //this.ballsToDispense = balls.slice();
    //this.isWaitingForInput = true;
    timeDilation = 1;
    grid.nextTurn(); 
  },
  nextTurn:function(){
    this.isWaitingForInput = false; 
    this.numBallsAlive /*= this.numBalls*/ = balls.length;
    balls.map(e => e.vel = this.dir.add(0,0.0000001).normalize() );
    this.cd = Number.MAX_VALUE;
  },
  update:function(){
    if(this.isWaitingForInput){
      this.calcDir();
      return;
    }
    this.cd += tweakables.timeStep;
    if(this.cd<tweakables.ballDispenserDelay)return;
    if(this.ballsToDispense.length==0)return;
    var ball = this.ballsToDispense.pop();
    ball.age = 0;
    this.cd = 0;
  },
  calcDir:function(){
    this.dir = 
      createVector(mouseX,mouseY)
      .sub(width/2,height/2)
      .mult(1/scl)
      .sub(balls[0].pos)
      .normalize();
  }
}