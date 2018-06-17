//Cornu spiral?

var theThings = [];
var colors = 0;
var anglerandomization = false;
var backgroundtransperancy = true;
var showUI = true;
var speed = 193/360;//14;
var colour;
var a = 0;
var timewarp = 1000;//1;
var timewarpD = true;

function setup() {  
  createCanvas(windowWidth, windowHeight);
  colour = color(0,200,100);
  background(0);
  stroke(colour);
  fill(0);
  strokeWeight(5);
  colorMode(HSB,255,255,255,255);
  angleMode(DEGREES);
  /*
  for(var i = 0; i < 10; i++)
  {
    theThings[i] = new thing(floor( random(windowWidth)) , floor(random(windowHeight)));
  }
  */
  theThings[0] = new thing(windowWidth/2 , windowHeight/2,0,-1);
  
  if (localStorage["true"]){
    colors = localStorage["colors"];
    anglerandomization = (localStorage["anglerandomization"] === 'true');
    backgroundtransperancy = (localStorage["backgroundtransperancy"] === 'true');
    showUI = (localStorage["showUI"] === 'true');
  }else{
    localStorage["true"] = true;
    localStorage["colors"] = colors;
    localStorage["anglerandomization"] = anglerandomization;
    localStorage["backgroundtransperancy"] = backgroundtransperancy;
    localStorage["showUI"] = showUI;
  }
} 

function draw() {
  if(backgroundtransperancy){
    background(0,0,0,10);
  }else{
    //background(0,0,0);
  }
  //line(vector.x,vector.y,mouseX,mouseY);
  //vector = createVector(mouseX,mouseY);
  for (var j = 0; j < timewarp; j++) {
    for(var i = 0; i < theThings.length; i++)
    {
      if(j == 0 ||timewarpD){theThings[i].draw();}
      theThings[i].update();
      theStuff(i);
    }
  }
  if(showUI){
  ShowUI();
  }
  
  //print(theThings);
}

function theStuff(i){
  var theT = theThings[i];
  var angle = atan2(theT.vel.y,theT.vel.x);
  if(anglerandomization){
    var DAngle = random(1,0);
  }else{
    var DAngle = a + theT.age*0.5;
  }  
  
  theThings[i].pos = theT.pos;//new thing(theT.pos.x,theT.pos.y,cos(angle+DAngle),sin(angle+DAngle));
  theThings[i].vector = theT.vector;
  theThings[i].vel = createVector(cos(angle+DAngle),sin(angle+DAngle));
  theThings[i].age = theT.age; //+ i*10;
  //theThings[theThings.length] = new thing(theT.pos.x,theT.pos.y,cos(angle-DAngle),sin(angle-DAngle));
}

function mousePressed(){
  var num = theThings.length;
    for(var i = 0; i < num; i++)
    {
      //theStuff(i);
    }
}

function ShowUI() {
  
  push();
  colorMode(RGB);
  textSize(32);
  stroke(0);
  strokeWeight(2);
  //rect(0, 0, 400, 400);
  fill(255);
  
  //text(theThings[0].age, 500, 500);
  
  var colormode = "monotone";
  if(colors == 1){
    colormode = "rainbow";
  }else if(colors == 2){
    colormode = "gradiant";
  }
  
  var string = "Num particles: " + nfc(theThings.length) + "\nContorls:\nColor Mode - 1 : " + colormode + "\nMotion Blur - 2 : " + nfc(backgroundtransperancy) + "\nShowUI - 4 : " + nfc(showUI);
  text(string, 0, 0, 400, 400);
  pop();

}

function keyPressed() {
  if (keyCode === UP_ARROW) {
   dir(0, -1);
  } else if (keyCode === DOWN_ARROW) {
   dir(0, 1);
  } else if (keyCode === RIGHT_ARROW) {
   dir(1, 0);
  } else if (keyCode === LEFT_ARROW) {
   dir(-1, 0);
  }
  if (key == "1") {
    colors++;
    colors = colors % 3
   //colors = !colors;
   background(colour);
   stroke(colour);
  } else if (key == "2") {
   backgroundtransperancy = !backgroundtransperancy;
   background(0,0,0);
   //background(colour);
   stroke(colour);
  } else if (key == "3") {
   anglerandomization = !anglerandomization;
  } else if (key == "4") {
   showUI = !showUI;
  } else if (key == "R") {
   theThings[0] = new thing(windowWidth/2 , windowHeight/2,0,-1);
  }else{return;}
  
  localStorage["colors"] = colors;
  localStorage["anglerandomization"] = anglerandomization;
  localStorage["backgroundtransperancy"] = backgroundtransperancy;
  localStorage["showUI"] = showUI;
}

function mouseWheel(event) {
  speed -= event.delta/100;
}

function dir(x,y){
  for(var i = 0; i < theThings.length; i++)
  {
    theThings[i].dir(x,y);
  }
}

function modulo(a,b){
  return a - b * floor(a/b);
}

function thing(x,y,dx,dy){
  
  this.pos = createVector(x,y);
  this.vel = createVector(dx,dy);
  this.s = speed;
  this.vector = createVector(x,y);
  this.colour = color(random(0,255), 255, 255, 255);
  this.age = 0;
  
  this.dir = function(x,y)
  {
    this.vel = createVector(x,y);
  }
  
  this.draw = function()
  { 
    if(colors == 1){
      stroke(this.colour);
    }else if(colors == 2){
      stroke(color((this.age / 10) % 255,255,255,255));
      if (this.age < 0 ){stroke(255);}
    }
    if (100 < dist(this.vector.x,this.vector.y,this.pos.x,this.pos.y)){
      this.vector = createVector(this.pos.x,this.pos.y);
    }
    line(this.vector.x,this.vector.y,this.pos.x,this.pos.y);
    this.vector = createVector(this.pos.x,this.pos.y);
    //stroke(0,0,0);
    //rect(this.pos.x,this.pos.y,1,1);
    //stroke(0,200,100);
  }
  this.update = function()
  {
    this.s = speed;
    
    this.age += this.s;
    
    this.pos.x = this.pos.x + this.vel.x*this.s;
    this.pos.y = this.pos.y + this.vel.y*this.s;
    
    this.pos.y = modulo(this.pos.y , (windowHeight-10));
    this.pos.x = modulo(this.pos.x , (windowWidth-10));
  }
}