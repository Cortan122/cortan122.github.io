var theThings = [];
var colors = 0;
var anglerandomization = false;
var backgroundtransperancy = true;
var showUI = true;
var speed = 14;
var colour;
var a = 0;
var c = 1;
var forceMultiplier = 5000;
var fusionThreshold = 1;
var fisionThreshold = 99;

//var test = 1;

function setup() {  
  createCanvas(windowWidth, windowHeight);
  colour = color(0,200,100);
  background(0);
  stroke(colour);
  fill(0);
  strokeWeight(20);
  colorMode(HSB,255,255,255,255);
  angleMode(DEGREES);
  ///*
  for(var i = 0; i < 100; i++)
  {
    theThings[i] = new thing(floor( random(width)) , floor(random(height)));
  }
  //*/
  //theThings[0] = new thing(windowWidth/2 , windowHeight/2,0,-1);
  
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
  
  for(var i = 0; i < theThings.length; i++)
  {
    theThings[i].draw();
    theThings[i].update();
    theThings[i].forceUpdate();
    //theStuff(i);
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
  
  theThings[i] = new thing(theT.pos.x,theT.pos.y,cos(angle+DAngle),sin(angle+DAngle));
  theThings[i].age = theT.age; //+ i*10;
  //theThings[theThings.length] = new thing(theT.pos.x,theT.pos.y,cos(angle-DAngle),sin(angle-DAngle));
}

function mousePressed(){
  theThings.push(new thing(mouseX,mouseY));
  theThings[theThings.length-1].mass = 0.01;
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
  } else{return;}
  
  localStorage["colors"] = colors;
  localStorage["anglerandomization"] = anglerandomization;
  localStorage["backgroundtransperancy"] = backgroundtransperancy;
  localStorage["showUI"] = showUI;
}

function mouseWheel(event) {
  speed -= event.delta/100;
}

function dir(x,y)
{
  for(var i = 0; i < theThings.length; i++)
  {
    theThings[i].dir(x,y);
  }
}

function modulo(a,b){
  return a - b * floor(a/b);
}

function thing(x,y,dx,dy)
{
  
  this.pos = createVector(x,y);
  this.vel = createVector(dx,dy);
  this.s = speed;
  this.vector = createVector(x,y);
  this.colour = color(random(0,255), 255, 255, 100);
  this.age = 0;
  this.mass = 1; 
  
  this.dir = function(x,y)
  {
    this.pos.add(createVector(x*10,y*10));
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
    //stroke(0,0,0);
    //rect(this.pos.x,this.pos.y,1,1);
    //stroke(0,200,100);
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
    if(this.mass > fisionThreshold)
    {
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
    }
    for(var i = 0; i < theThings.length; i++)
    {
      var t = theThings[i];
      if(t == this){continue;}
      /*var x = (t.pos.x-this.pos.x);
      var y = (t.pos.y-this.pos.y);
      var mag = (x*x+y*y);*/
      var dist = trueDistance(t.pos,this.pos);
      var x = dist.x;var y = dist.y;var mag = dist.mag;
      if(mag < fusionThreshold)
      {
        print('hi');
        this.mass += t.mass;
        var index = theThings.indexOf(t);
        if (index > -1) {
          theThings.splice(index, 1);
        }
      }
      var power = (mag*sqrt(mag))/(this.mass*t.mass);
      var dir = createVector((x)/power,(y)/power);
      this.force(dir.x,dir.y);
      var power = (mag*mag*sqrt(mag))/forceMultiplier;
      var dir = createVector((x)/power,(y)/power);
      this.force(-dir.x,-dir.y);
    }
  }
  this.update = function()
  {
    //this.s = speed;
    this.s = speed;//+ ((this.pos.y > 250)?test:-test);
    //if(this.pos.y > 250){this.colour = color('wihte');}else{this.colour = color('red');}

    this.age += this.s;
    
    this.pos.x = this.pos.x + this.vel.x*this.s;
    this.pos.y = this.pos.y + this.vel.y*this.s;
    
    this.pos.y = modulo(this.pos.y , (height-10));
    this.pos.x = modulo(this.pos.x , (width-10));
  }
}

function trueDistance(a,b){
  var dx = (a.x-b.x);
  var t = (width-10);
  if(abs(dx) > t/2){dx = dx-t;}
  var dy = (a.y-b.y);
  t = (height-10);
  if(abs(dy) > t/2){dy = dy-t;}
  //var mag = (x*x+y*y);
  return {mag:(dx*dx+dy*dy),x:dx,y:dy};
}
