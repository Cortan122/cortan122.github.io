var balls = [];
var animations = [];
var canvases = [];
var canvasNames = ["main","frame","tiles","ui"];

var scl = 50;

var timeDilation = 1;

var tweakables = {
  timeStep:.5,
  thickness:0.000001,
  ballCount:10,
  colliderLineWidth:1,
  ballSize:15,
  gap:10,
  ballDispenserDelay:2,
  previewLength:1000,
  previewJoints:3,
  ballDrawMode:"laser",
  ballColor:"red",
  shadowBlur:7,
  shadowIntensity:10,
  laserLength:1,
  animationSpeed:.1,
  motionBlur:50,
  imageSmoothing:true,
  presistPreview:false,
  simpleDraw:true,
  showFPS:true,
  metaStart:true
};

function setup() {
  initCanvases(500,500,4,0);
  /*rectMode(CORNERS);*/
  canvases.map(e => e.textAlign(CENTER,CENTER));
  //canvases[0].background(100);
  for (var i = 0; i < tweakables.ballCount; i++)
    balls.push(new Ball(0,p5.Vector.fromAngle(i/tweakables.ballCount*PI*2+1)));

  grid.init();
  var gap = tweakables.gap/scl/2;
  collider.init(new Box(-grid.size/2-gap,-(grid.size+2)/2,grid.size/2+gap,(grid.size+2)/2));
  grid.pushBoxes();
  ballManager.endTurn();
}

function initCanvases(width = 500,height = 500,numCanvases = 1,mainCanvasIndex = 0){
  //var width = 500;var height = 500;var numCanvases = 2;var mainCanvasIndex = 0;

  var container = document.getElementById('canvasContainer');
  container.style.width = width;
  container.style.height = height;
  for (var i = 0; i < numCanvases; i++) {
    if(i == mainCanvasIndex){
      canvases[i] = createCanvas(width,height);
    }else{
      canvases[i] = createGraphics(width,height);
    }

    container.appendChild(canvases[i].elt);
    canvases[i].elt.style['z-index'] = i;
    canvases[i].elt.style.display = '';
    canvases[i].drawingContext.imageSmoothingEnabled = tweakables.imageSmoothing;
    canvases[i].isDirty = true;

    canvases[canvasNames[i]] = canvases[i];
  }

  if(window.tweakables && window.tweakables.showFPS !== undefined && window.$){
    $("body").append(
      "<div id='frDiv' style='position: absolute;top:{0}px'></div>".format(height)
    );
  }
}

function draw() {
  for (var i = 0; i < timeDilation; i++) {
    ballManager.update();
    balls.map(e => e.update() );
  }

  animations = drawAnimations(animations);//animation = drawAnimation(animation);

  trueDraw();
}

function trueDraw(){
  if(canvases.tiles.isDirty){
    var a = canvases.tiles;
    a.isDirty = false;
    a.push();
    clearCanvas(a);
    a.translate(width/2,height/2);
    //a.background(100);
    //collider.drawBounds(a);
    grid.draw(a);
    a.pop();
  }
  if(canvases.frame.isDirty){
    var a = canvases.frame;
    a.isDirty = false;
    a.push();
    a.translate(width/2,height/2);
    a.background(100);
    collider.drawBounds(a);
    a.pop();
  }
  if(canvases.main.isDirty){
    if(tweakables.motionBlur==255)canvases[1].isDirty = false;
    push();
    //clearCanvas();
    background(255,tweakables.motionBlur);
    translate(width/2,height/2);
    balls.map(e => e.draw() );
    pop();
  }
  if(canvases.ui.isDirty){
    var a = canvases.ui;
    a.isDirty = false;
    a.push();
    clearCanvas(a);
    a.translate(width/2,height/2);
    if(tweakables.presistPreview||ballManager.isWaitingForInput)drawPreview(a);
    if(timeDilation>1){
      a.push();
      a.textSize(scl/2);
      a.fill(0);
      a.text(
        'x{0}\u23E9'.format(timeDilation)
        ,collider.bounds.x1*scl-scl/2
        ,collider.bounds.y1*scl-scl/2);
      a.pop();
    }
    a.pop();
  }
}

function clearCanvas(can){
  if(can == undefined)can = window;
  if(can.drawingContext.globalAlpha != 1.0)can.drawingContext.globalAlpha = 1.0;
  can.drawingContext.clearRect(0,0,can.width,can.height);
  //can.drawingContext.clearRect(-offset.x/1,-offset.y/1, (can.width+offset.x), (can.height+offset.y));
}

function drawAnimations(anis){
  if(anis.length == 0)return [];
  var r = [];
  for (var i = 0; i < anis.length; i++) {
    anis[i] = drawAnimation(anis[i]);
    if(anis[i] != undefined)r.push(anis[i]);
  }
  return r;
}

function drawAnimation(ani){
  if(ani == undefined)return undefined;
  if(ani.progress>=1){
    if(ani.endfunc)ani.endfunc();
    return undefined;
  }
  if(ani.progress==0){
    if(ani.startfunc)ani.startfunc();
  }
  ani.func(ani.progress);
  ani.progress += tweakables.animationSpeed;
  return ani;
}

function drawPreview(can){
  if(can == undefined)can = window;
  can.push();
  can.stroke(0);
  can.strokeWeight(tweakables.colliderLineWidth);
  drawArrow.call(
    can,
    balls[0].pos.copy().mult(scl),
    balls[0].pos.copy().add(ballManager.dir).mult(scl)
  );
  var line = makeBouncyLine(balls[0].pos.copy(),ballManager.dir,tweakables.previewLength);
  line.length = 
    isNaN(tweakables.previewJoints)?line.length:min(tweakables.previewJoints,line.length);
  can.drawingContext.setLineDash([5,5]);
  drawBouncyLine.call(can,line);
  can.pop();
}

function drawArrow(x, y, x1, y1){
  if(arguments.length == 2){
    x1 = y.x;y1 = y.y;
    y = x.y;x = x.x;
  }
  var headlen = 10;   // length of head in pixels
  var angle = Math.atan2(y1-y,x1-x);
  var context = this.drawingContext;
  this.push();
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x1, y1);
  context.lineTo(x1-headlen*Math.cos(angle-Math.PI/6),y1-headlen*Math.sin(angle-Math.PI/6));
  context.moveTo(x1, y1);
  context.lineTo(x1-headlen*Math.cos(angle+Math.PI/6),y1-headlen*Math.sin(angle+Math.PI/6));
  context.stroke();
  this.pop();
}

function mousePressed(){
  if(!isMouseOverCanvas())return;
  canvases.ui.isDirty = true;
  if(ballManager.isWaitingForInput){
    ballManager.nextTurn();
  }else{
    timeDilation++;
  }
}

function mouseMoved(){
  canvases.ui.isDirty = true;
}

function makeBouncyLine(pos,vel,amount){
  if(amount <= 0)return [pos];
  var newpos = pos.copy().add(vel.copy().mult(amount));
  var line = [pos,newpos];
  var point = collider.check(line);
  if(point == undefined){/*pos = newpos;*/return [pos,newpos];}
  if(point.event == grid.bottomLineEvent)return [pos,point.p];
  var thickness = tweakables.thickness; 
  var amountRemaining = amount-pos.copy().dist(point.p)/vel.mag()-thickness;
  var oldpos = pos.copy();
  pos = point.p;
  if(point.t != undefined){
    var a = point.t;
    var b = vel.heading();
    vel = p5.Vector.fromAngle(-b+2*a).setMag(vel.mag());
  }
  pos = pos.copy().add(vel.copy().mult(thickness));  

  var r = makeBouncyLine(pos,vel,amountRemaining);
  return [oldpos].concat(r);
}

function drawBouncyLine(line){
  if(arguments.length>1)line = makeBouncyLine.apply(this,arguments);
  var context = this.drawingContext;
  context.beginPath();
  context.moveTo(line[0].x*scl,line[0].y*scl);
  for (var i = 1; i < line.length; i++) {
    context.lineTo(line[i].x*scl,line[i].y*scl);
  }
  context.stroke();
}

/*function parseAnimation(data){
  for (var i = 0; i < data.length; i++) {
    var d = data[i];
    if(typeof d == "function")continue;
    if(typeof d == "string")data[i] = eval('() => {'+d+'}');
    if(typeof d == "number"){
      if(t < 1)throw 'parseAnimation error';
      var t = [() => {}];
      for (var i = 1; i < d; i++) {
        t[i] = t[0];
      }
      data = data.splice.apply(this,[i,0].concat(t));
    }
  }
  return data;
}

function playAnimation(data){
  data = parseAnimation(data);
  if(animation.length > 0)throw 'playAnimation: animation already playing';
  animation = data;
} */