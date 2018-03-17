var theThings = [];
var wrapper;
var colors = 0;
var backgroundtransperancy = true;
var showUI = true;
var speed = 14;
var colour;
var c = 0.5;
var forceMultiplier = 5000;

function setup() {  
  //createCanvas(windowWidth, windowHeight);
  createCanvas(windowHeight,windowHeight);
  colour = color(0,200,100);
  wrapper = new Wrapper();
  background(0);
  stroke(colour);
  fill(0);
  strokeWeight(20);
  colorMode(HSB,255,255,255,255);
  angleMode(DEGREES);
  /*
  for(var i = 0; i < 100; i++)
  {
    theThings[i] = new thing(floor( random(width)) , floor(random(height)));
  }
  */
  theThings[0] = new thing(width/2+100 , height/2,-0.1,0);
  theThings[1] = new thing(width/2 , height/2+100,0,-0.1);
  
  if (localStorage["true"]){
    colors = localStorage["colors"];
    //anglerandomization = (localStorage["anglerandomization"] === 'true');
    backgroundtransperancy = (localStorage["backgroundtransperancy"] === 'true');
    showUI = (localStorage["showUI"] === 'true');
  }else{
    localStorage["true"] = true;
    localStorage["colors"] = colors;
    //localStorage["anglerandomization"] = anglerandomization;
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
  for(var i = 0; i < theThings.length; i++)
  {
    theThings[i].draw();
    theThings[i].update();
    theThings[i].forceUpdate();
  }
  
  if(showUI){
  ShowUI();
  }
}

function mousePressed(){
  theThings.push(new thing(mouseX,mouseY));
  //theThings[theThings.length-1].mass = 0.01;
}

function ShowUI() {
  push();
  colorMode(RGB);
  textSize(32);
  stroke(0);
  strokeWeight(2);
  fill(255);
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
   //anglerandomization = !anglerandomization;
  } else if (key == "4") {
   showUI = !showUI;
  } else{return;}
  
  localStorage["colors"] = colors;
  //localStorage["anglerandomization"] = anglerandomization;
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