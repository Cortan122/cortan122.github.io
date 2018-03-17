var balls = [];

var tweakables = {
  timeStep:10,
  thickness:0.000001,
  ballCount:10,
  colliderLineWidth:10,
  angleOffset:0.00001,
  simpleDraw:true,
  showFPS:true,
  metaStart:true
};

function setup() {
  createCanvas(500,500);
  background(100);
  for (var i = 0; i < tweakables.ballCount; i++)
    balls.push(new Ball(0,p5.Vector.fromAngle(i/tweakables.ballCount*PI*2+tweakables.angleOffset)));

  collider.init();
}

function draw() {
  background(100);
  collider.draw();
  balls.map(e => e.move(tweakables.timeStep) );
  balls.map(e => e.draw() );
}

function Ball(pos,vel) {
  this.pos = (pos||createVector(width/2,height/2));
  this.vel = (vel||p5.Vector.random2D()).normalize();
  this.prevpos = this.pos;
  this.color = color('hsba({0},100%,100%,1)'.format( floor(degrees(this.vel.heading())+180) ));
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
  }
  this.pos = this.pos.copy().add(this.vel.copy().mult(thickness));  

  this.move(amountRemaining);
}

Ball.prototype.draw = function() {
  if(tweakables.simpleDraw){
    fill(0);
    noStroke();
    ellipse(this.pos.x,this.pos.y,10,10);
    return;
  }
  strokeWeight(10);
  stroke(this.color.red,this.color.green,this.color.blue,100);
  line(this.prevpos.x,this.prevpos.y,this.pos.x,this.pos.y);
  fill(this.color);
  noStroke();
  ellipse(this.pos.x,this.pos.y,10,10);
  this.prevpos = this.pos.copy();
}

Object.defineProperty(Ball.prototype, "isBounded", {
  get: function() {
    return collider.bounds.includes(this.pos);
  }
});
Object.defineProperty(Ball.prototype, "x", {
  set: function(value) {
    this.pos.x = value;
  },
  get: function() {
    return this.pos.x;
  }, configurable: true, enumerable: false
});
Object.defineProperty(Ball.prototype, "y", {
  set: function(value) {
    this.pos.y = value;
  },
  get: function() {
    return this.pos.y;
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
  r.map(e => e.isSolid = this.isSolid);
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
  init:function(){
    if(!(this.bounds instanceof Box) )this.bounds = new Box(0,0,width,height);
    this.lines = this.lines.concat(this.bounds.getBorders());
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
      line(this.lines[i][0].x,this.lines[i][0].y,this.lines[i][1].x,this.lines[i][1].y);
    }
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