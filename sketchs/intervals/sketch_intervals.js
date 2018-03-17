var inputString;
var listL = [];
var listM = [];
var scl;
var offset;
var max;

function setup() {
  createCanvas(windowWidth, windowHeight); 
  background(100);  
  inputString = "< 10";
  scl = 10;
  offset = createVector(200,10);
  max = 1000;
  stroke(255);
  strokeWeight(5);
} 

function draw() {
  
  
  background(100,100,100,10);
  rect(20,10,120,20);
  push();
  strokeWeight(0);
  text(frameRate(), 20, 20);
  pop();
  
  
  for(i = 0;i < listL.length;i++){
    line(offset.x,offset.y*(i+1),constrain((listL[i]*scl)+offset.x,0,max),offset.y*(i+1));
  }
  for(i = 0;i < listM.length;i++){
    line(max,offset.y*(i+1+listL.length),constrain((listM[i]*scl)+offset.x,0,max),offset.y*(i+1+listL.length));
  }
  
  
  if(inputString != undefined){
    var temp = split(inputString, " ");
    if(inputString[0] == "<"){
      listL.push(parseFloat(temp[1]));
    }else if(inputString[0] == ">"){
      listM.push(parseFloat(temp[1]));
    }else{}
    inputString = undefined;
  }
  
  
  var m = 0;
  var l = max;
  for(i = 0;i < listL.length;i++){
    if (listL[i] < l){
     l = listL[i];
    }
  }
  for(i = 0;i < listM.length;i++){
    if (listM[i] > m){
     m = listM[i];
    }
  }
  if(m <= l){stroke(0,255,0);}else{stroke(255,0,0);}
  line(constrain(offset.x + (l*scl),0,max),offset.y*(i+1+listL.length+listM.length),constrain(offset.x + (m*scl),0,max),offset.y*(i+1+listL.length+listM.length));
  stroke(255);
}