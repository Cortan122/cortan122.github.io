var n;
var offset;
var population;
var img;
var img2;
var img0 = [];
var scl = 10;

var mutability = 0.01;
var timewarp = 10;
var d1 = 1;
var d2 = 350;

var slider1;
var slider2;
var frDiv;
var scoreDiv;

function preload() {
  img = loadImage("img.png");
  img2 = loadImage("img2.png");
  //img = imgConverter(loadImage("img.png").pixels);
  //img2 = imgConverter(loadImage("img2.png").pixels);
}

function setup() {
  createCanvas(400, 300);
  img.loadPixels();
  img2.loadPixels();
  img = imgConverter(img.pixels);
  img2 = imgConverter(img2.pixels);
  offset = createVector(width/2,height/2);
  
  slider1 = createSlider(0,18-1, 0, 1);
  slider2 = createSlider(0,18-1, 0, 1);
  frDiv = createDiv('');
  scoreDiv = createDiv('');
  
  //n = new Network();
  population = new Population();
  
  //for (var i = 0; i < 400; i++) {
  //  population.evaluate();
  //  population.selection();
  //}
  //n = population.rockets[0];
}

function draw() {
  frDiv.html(floor(frameRate()));
  //d1 = floor(slider1.value());d2 = floor(slider2.value());
  population.evaluate();
  population.selection();
  n = population.rockets[0];
  
  trueDraw2();
}

function trueDraw2() {
  push();
  background(100);
  translate(offset.x,offset.y);
  noStroke();
  var a = to2DArray(img0);
  if(a.length == 0){img0 = numtoArray(0b1010101010101010101010101010101010);}
  for(var x = 0;x < a.length;x++){
    for(var y = 0;y < a[x].length;y++){
      if(a[x][y] == 0){fill(255);}else if(a[x][y] == 1){fill(0);}else{a[x][y] = 0;}
      ellipse(x*scl, y*scl, scl, scl);
    }
  }
  pop();
}

function mousePressed(){
  var c = getMouseCords();
  var x = round(c.x);
  var y = round(c.y);
  var i = constrain(x*5+y, 0, 24);
  img0[i] ^= 1;
  
}

function getMouseCords(){
  var ux = (mouseX - offset.x)/scl;
  var uy = (mouseY - offset.y)/scl;
  return createVector(ux,uy);
}

function trueDraw() {
  background(0,0,0,10);
  var s = min(width,height)*0.5/1;
  push();
  translate(offset.x,offset.y);
  colorMode(HSB);
  strokeWeight(2);
  var list = population.rockets;
  for(var i=0;i < list.length;i++){
    stroke(list[i].fitness*360,255,255);
    var x = list[i].dna.genes[d1]*s;
    var y = list[i].dna.genes[d2]*s;
    point(x, y);
  }
  pop();
}

function Population() {
  this.rockets = [];
  this.popsize = 25;
  this.matingpool = [];

  for (var i = 0; i < this.popsize; i++) {
    this.rockets[i] = new Network();
  }

  this.evaluate = function() {

    var maxfit = 0;
    for (var i = 0; i < this.rockets.length; i++) {
      this.rockets[i].calcFitness();
      if (this.rockets[i].fitness > maxfit) {
        maxfit = this.rockets[i].fitness;
      }
    }
    scoreDiv.html(maxfit);
    for (var i = 0; i < this.rockets.length; i++) {
      this.rockets[i].fitness /= maxfit;
    }
    //if(!drawMode){trueDraw();}
    
    this.matingpool = [];
    this.rockets.sort(new Function ('a','b',"return a.fitness - b.fitness;")).reverse();
    if(this.rockets.length > this.popsize/2){this.rockets.splice(this.popsize/2, Number.MAX_VALUE);}
    //if(!drawMode){trueDraw();}
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
      //if(this.rockets[i].pos.y == height-1){this.rockets[i] = new Network();continue;}
      this.rockets[i] = new Network(this.rockets[i].dna);
    }
    for (var i = 0; i < n*3; i++) {
      var parentA = random(this.matingpool).dna;
      var parentB = random(this.matingpool).dna;
      var child = parentA.crossover(parentB);
      child.mutation();
      this.rockets.push(new Network(child));
    }
    //this.rockets = newRockets;
  }
}

function imgConverter(img){
  var r = [];
  for(var i = 0;i < img.length;i += 4){
    r.push(img[i]/255);
  }
  return r;
}

function numtoArray(a){
  var b = [];
  for (var i = 0; i < 25; i++){b[i] = (a >> i) & 1;}
  return b;
} 

function to2DArray(a){
  var l = sqrt(a.length);
  var r = [];
  for(var i = 0;i < l;i++){
    r.push(a.slice(i*l,(i+1)*l));
  }
  return r;
}

function Network(dna) {
  if (dna) {
    this.dna = dna;
  } else {
    this.dna = new DNA();
  }
  this.fitness = 0;
  
  this.calcFitness = function() {
    var r = this.run(img);
    r -= this.run(img2);
    this.fitness = r;
  }
  
  this.run = function(img) {
    var r = [];
    this.img = to2DArray(img);
    this.d = this.dna.genes.slice(0,9);//[1,-1,-1,1,-1,-1,1,-1,-1];
    for(var x=1;x < this.img.length-1;x++){
      for(var y=1;y < this.img[x].length-1;y++){
        r.push( this.segment(x,y) );
      }
    }
    this.img = to2DArray(r);
    this.d = this.dna.genes.slice(9,18);
    return this.segment(1,1);
  }
  
  this.segment = function(x,y) {
    var r = 0;
    var i = 0;
    for(var ox=-1;ox < 1;ox++){
      for(var oy=-1;oy < 1;oy++){
        var rx = ox+x;var ry = oy+y;
        r += this.img[rx][ry] * this.d[i];
        i++;
      }
    }
    return r;
  }
}

function DNA(genes) {
  if (genes) {
    this.genes = genes;
  } else {
    this.genes = [];
    for (var i = 0; i < 18; i++) {
      this.genes[i] = random(-1,1);
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
        this.genes[i] = random(-1,1);
      }
    }
  }

}