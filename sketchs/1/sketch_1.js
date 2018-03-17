var population;
var lifespan = 200;
var lifeP;
var count = 0;
var target;
var maxforce = 0.2;
var timewarp = lifespan+lifespan/100;
var mutability = 0.1;
var step = 1;

var rx = 100;
var ry = 150;
var rw = 200;
var rh = 10;

var drawMode = true;
var evoMode = true;
var d1 = 1;
var d2 = 350;
var slider1;
var slider2;
var frDiv;
var scoreDiv;

function setup() {
  createCanvas(400, 300);
  rocket = new Rocket();
  population = new Population();
  //lifeP = createP();
  target = createVector(width / 2, 50);
  background(0);
  //offset = createVector(0,0);
  offset = createVector(width/2,height/2);
  
  slider1 = createSlider(0,lifespan-1, 0, 1);
  slider2 = createSlider(0,lifespan-1, 0, 1);
  //var f = new Function('d1 = floor(slider1.value());d2 = floor(slider2.value());');
  //slider1.changed( f );
  //slider2.changed( f );
  frDiv = createDiv('');
  scoreDiv = createDiv('');
}

function keyPressed() {
  if (key == "1") {
   drawMode = !drawMode;
   background(0);
  }
}

function draw() {
  frDiv.html(floor(frameRate()));
  d1 = floor(slider1.value());d2 = floor(slider2.value());
  for (var i = 0; i < timewarp; i++) {
    population.run();
    count++;
    if (count >= lifespan) {
      population.evaluate();
      population.selection();
      //population = new Population();
      count = 0;
    }
  }
  if(drawMode){
    background(0);
    for (var i = 0; i < population.popsize; i++) {
      population.rockets[i].show();
    }
    fill(255);
    rect(rx, ry, rw, rh);
    ellipse(target.x, target.y, 16, 16);
  }
}

function trueDraw() {
  background(0,0,0,10);
  var s = min(width,height)*0.5/maxforce;
  push();
  translate(offset.x-width/2,offset.y);
  colorMode(HSB);
  strokeWeight(2);
  stroke(random(0,360),255,255);
  var list = population.rockets[0].dna.genes;
  for(var i=0;i < list.length;i++){
    //stroke(list[i].fitness*360,255,255);
    //stroke('red');
    var x = i*width/(list.length);//atan2(list[i].dna.genes[d1].y,list[i].dna.genes[d1].x)*width/(2*PI);
    var y = atan2(list[i].y,list[i].x)*height/(2*PI);//list[i].dna.genes[d1].y*s
    point(x, y);
  }
  pop();
}

function trueDraw1() {
  background(0,0,0,10);
  var s = min(width,height)*0.5/maxforce;
  push();
  translate(offset.x,offset.y);
  colorMode(HSB);
  strokeWeight(2);
  var list = population.rockets;
  for(var i=0;i < list.length;i++){
    stroke(list[i].fitness*360,255,255);
    var x = atan2(list[i].dna.genes[d1].y,list[i].dna.genes[d1].x)*width/(2*PI);//list[i].dna.genes[d1].x*s
    var y = atan2(list[i].dna.genes[d2].y,list[i].dna.genes[d2].x)*height/(2*PI);//list[i].dna.genes[d1].y*s
    point(x, y);
  }
  pop();
}

function mousePressed(){
  if(keyIsDown(SHIFT)){target = createVector(mouseX, mouseY);}
}

//rocket
function Rocket(dna) {
  this.pos = createVector(width / 2, height-1);
  this.vel = createVector();
  this.acc = createVector();
  this.completed = false;
  this.crashed = false;
  this.age = -1;

  if (dna) {
    this.dna = dna;
  } else {
    this.dna = new DNA();
  }
  this.fitness = 0;

  this.applyForce = function(force) {
    this.acc.add(force);
  }

  this.calcFitness = function() {
    var d = dist(this.pos.x, this.pos.y, target.x, target.y);

    this.fitness = map(d, 0, width, width, 0);
    if (this.completed) {
      this.fitness *= 10*(lifespan/this.age);
      //if(this.age != 399){
      //  print('hi');
      //}
    }
    if (this.crashed) {
      this.fitness /= 10*(lifespan/this.age);
    }

  }

  this.update = function() {
    if(this.crashed || this.completed){return;}
    var d = dist(this.pos.x, this.pos.y, target.x, target.y);
    if (d < 10) {
      this.completed = true;
      this.pos = target.copy();
      this.age = count;
    }

    if (this.pos.x > rx && this.pos.x < rx + rw && this.pos.y > ry && this.pos.y < ry + rh) {
      this.crashed = true;
      this.age = count;
    }

    if (this.pos.x >= width || this.pos.x <= 0) {
      this.crashed = true;
      this.age = count;
    }
    if (this.pos.y >= height || this.pos.y <= 0) {
      this.crashed = true;
      this.age = count;
    }

    if (!this.completed && !this.crashed) {
      this.applyForce(this.dna.genes[count]);
      this.vel.add(this.acc);
      this.pos.add(this.vel);
      this.acc.mult(0);
      this.vel.limit(4);
    }
  }

  this.show = function() {
    push();
    noStroke();
    fill(255, 150);
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    rectMode(CENTER);
    rect(0, 0, 25, 5);
    pop();
  }
}

//pop
function Population() {
  this.rockets = [];
  this.popsize = 25;
  this.matingpool = [];

  for (var i = 0; i < this.popsize; i++) {
    this.rockets[i] = new Rocket();
  }

  this.evaluate = function() {

    var maxfit = 0;
    for (var i = 0; i < this.rockets.length; i++) {
      this.rockets[i].calcFitness();
      if (this.rockets[i].fitness > maxfit) {
        maxfit = this.rockets[i].fitness;
      }
    }
    scoreDiv.html(floor(maxfit));
    for (var i = 0; i < this.rockets.length; i++) {
      this.rockets[i].fitness /= maxfit;
    }
    //if(!drawMode){trueDraw();}
    
    this.matingpool = [];
    this.rockets.sort(new Function ('a','b',"return a.fitness - b.fitness;")).reverse();
    if(!drawMode){trueDraw();}
    if(this.rockets.length > this.popsize/2){this.rockets.splice(this.popsize/2, Number.MAX_VALUE);}
    for (var i = 0; i < this.rockets.length; i++) {
      var n = this.rockets[i].fitness * 100;
      for (var j = 0; j < n; j++) {
        this.matingpool.push(this.rockets[i]);
      }
    }
  }

  this.selection = function() {
    var newRockets = [];
    var n = this.rockets.length;
    for (var i = 0; i < n; i++) {
      if(this.rockets[i].pos.y == height-1){this.rockets[i] = new Rocket();continue;}
      this.rockets[i] = new Rocket(this.rockets[i].dna);
    }
    for (var i = 0; i < n*3; i++) {
      var parentA = random(this.matingpool).dna;
      var parentB = random(this.matingpool).dna;
      var child = parentA.crossover(parentB);
      child.mutation();
      this.rockets.push(new Rocket(child));
    }
    //this.rockets = newRockets;
  }

  this.run = function() {
    for (var i = 0; i < this.popsize; i++) {
      this.rockets[i].update();
      //this.rockets[i].show();
    }
  }
}

//dna
function DNA(genes) {
  if (genes) {
    this.genes = genes;
  } else {
    this.genes = [];
    for (var i = 0; i < lifespan; i++) {
      this.genes[i] = p5.Vector.random2D();
      this.genes[i].setMag(maxforce);
    }
  }

  this.crossover = function(partner) {
    var newgenes = [];
    var mid = floor(random(this.genes.length));
    for (var i = 0; i < this.genes.length; i++) {
      if (i > mid) {
        newgenes[i] = this.genes[i];
      } else {
        newgenes[i] = partner.genes[i];
      }
    }
    return new DNA(newgenes);
  }

  this.mutation = function() {
    for (var i = 0; i < this.genes.length; i++) {
      if (random(1) < mutability) {
        //this.genes[i].add(p5.Vector.random2D().setMag(maxforce));
        if(evoMode){
          var a = atan2(this.genes[i].y,this.genes[i].x) + step*(0.5-random());
          this.genes[i] = createVector(cos(a),sin(a));
        }else{
          this.genes[i] = p5.Vector.random2D();
        }
        this.genes[i].setMag(maxforce);
      }
    }
  }
}