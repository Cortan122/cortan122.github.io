var scl = 30;
var offset = 100;
var Plane;
var turtles = [];
var id;
var frDiv;
var timeDiv;
var ttDiv;
var complitedLogs = [];
var cd = 0;
var Dcd = 10;
var Dtime = 0;
var sortByTime = true;
var timeOffset = 0;
var lastEvalTime = 0;
var queue = [];

var doSounds = true;
var hammerSound;
var tpSound;
var startSound;
var mapSound;

function preload(){
  startSound = loadSound('libraries/Windows XP Logon Sound.mp3');
}
function setup() {
  masterVolume().value = 0.1;//todo user prefs
  offset = createVector(20,20);
  var pdiv = select('#pDiv');
  timeDiv = select('#timeDiv');
  var idDiv = document.getElementById('idDiv');
  ttDiv = document.getElementById('ttDiv');//select('#ttDiv');
  var cnv = createCanvas(310,310);
  pdiv.position(80,20);
  
  button = createButton('up');
  button.position(30, 30);
  button.mousePressed(up);
  button = createButton('down');
  button.position(30, 70);
  button.mousePressed(down);
  button = createButton('left');
  button.position(30, 50);
  button.mousePressed(left);
  button = createButton('right');
  button.position(65, 50);
  button.mousePressed(right);
  
  frDiv = createDiv('');
  frDiv.position(0,0);
  idDiv = document.getElementById('idDiv');
  pdiv.child(idDiv);
  pdiv.child(cnv);
  pdiv.child(timeDiv);
  
  hammerSound = loadSound('libraries/hammer.mp3');
  tpSound = loadSound('libraries/Catbug_Teleport.mp3');
  tpSound.onended(new Function('doSounds = true'));
  mapSound = loadSound('libraries/page-flip.mp3');
  mapSound.onended(new Function('doSounds = true'));
  //startSound = loadSound('libraries/Windows XP Logon Sound.mp3');
  
  doSounds = false;
  startSound.play();
  Plane = new Wplane(100);
  getData();
  if (localStorage["id"] !== undefined && turtles.length > parseInt(localStorage["id"])){
    id = parseInt(localStorage["id"]);
  }else{
    localStorage["id"] = turtles.length;
    id = turtles.length;
    turtles.push(new Turtle(Plane,id));
    sendRequest('turtles.push(new Turtle(Plane,'+id+','+(new Date().getTime()/*-timeOffset*/)+'));turtles['+id+'].randomtp()');
  }
  doSounds = true;
  
  updateGraphics();
  
  idDiv.innerHTML = "id:"+id;
  idDiv.style.color = turtles[id].color.toString();
  timeDiv.style('color' , turtles[id].color.toString());
}

function draw() {
  frDiv.html(floor(frameRate())+" "+floor(millis()-Dtime));//print(floor(frameRate())+" "+floor(millis()-Dtime));//temp
  var timeStr = (new Date((new Date().getTime()-timeOffset))).toString().split(" ").slice(1,6).toString().split(",").join(" ");
  timeDiv.html(timeStr);
  //keyboardUpdate();
  
  if(cd > 10){
    keyboardUpdate();
    getData(true);
    cd = 0;
  }
  cd++;
  
  Dtime = millis();
}

function dir(dir){
  turtles[id].move(dir);
  var dataStr = "turtles["+id+"].move("+dir+");"
  sendRequest(dataStr);
}

function reset(){
  doSounds = false;
  Plane = new Wplane(100);
  turtles = [];
  complitedLogs = [];
  lastEvalTime = 0;
  tpSound.play(0,2,1,5.8,4);
  
  getData();
}

function displayMap(){
  doSounds = false;
  mapSound.play();
  scl = 10;
  resizeCanvas(100+Plane.tiles.length*scl,Plane.tiles.length*scl+100/2);
  Plane.colors[2] = color(0,50);
  Plane.draw();
  for(i = 0;i < turtles.length;i++){
    turtles[i].draw();
  }
  frameRate(0);
}
var ttSlider;
async function displayTTbox(){
  var ainc = 0;//margin-top:
  
  for(i = 0;0 < ttDiv.children.length;i++){
    ttDiv.children[i].remove();
  }
  ttSlider = createSlider(0,(new Date().getTime()-turtles[id].bDay),0);
  ttSlider.parent('#ttDiv');
  createP('').parent('#ttDiv');
  
  button = createButton('JUST DO IT');
  button.mousePressed(new Function('timeOffset = ttSlider.value();reset();ttDiv.style.top = -1000'));
  button.parent('#ttDiv');
  
  ttDiv.style.marginTop = -(ttDiv.clientHeight/2);
  while(ainc < 100){
    ainc++;
    print(ainc);
    ttDiv.style.top = lerp(-20,50,ainc/100).toString()+"%";
    await sleep(10);
  }
}

function sendRequest(data){
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("POST",'test.php',true);
  var dataString = (new Date().getTime()-timeOffset)+":"+data+" ";
  xmlHttp.send(dataString);
  complitedLogs.push(dataString);
  getData(true);
  updateGraphics();
}

function updateGraphics(){
  background(255);
  if(width > 500||height > 500){
    doSounds = false;
    mapSound.play();
    Plane.colors[2] = color(0,100);
    resizeCanvas(310,310);
    scl = 30;
    delayEval(50,'updateGraphics()');
  }
  
  try{Plane.smartDraw(turtles[id].x,turtles[id].y,4); } catch(e){Plane.draw();}
  //turtle.draw();
  for(i = 0;i < turtles.length;i++){
    turtles[i].draw();
  }
}

function getData(b){
  if(b === undefined){b = false;}
  
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET",'data.txt',b);
  xmlHttp.setRequestHeader('Expires',' Tue, 03 Jul 2001 06:00:00 GMT');
  xmlHttp.setRequestHeader('Last-Modified','{now} GMT');
  xmlHttp.setRequestHeader('Cache-Control','max-age=0, no-cache, must-revalidate, proxy-revalidate');
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState === 4) {
      evalData(xmlHttp.responseText);
    }
  }
  xmlHttp.send();
  //evalData(xmlHttp.responseText);
  //httpGet('data.txt',undefined,undefined,evalData);
}

function evalData(data){
  var s = data.split("\\n");
  var time = new Date().getTime()-timeOffset;
  if((s.length != complitedLogs.length)){
    if(sortByTime){
      s.sort();
    }
    var inc = 0;
    
  //if((s.length != complitedLogs.length)||(s[s.length] != complitedLogs[complitedLogs.length])){
    var diff = arr_diff(s,complitedLogs);//todo loop backwards?
    for(i = 0;i < diff.length;i++){
      if(diff.length < 5 ){ if(!s.includes(diff[i])){return;}}
        var c = diff[i].split(":");
        if(c[0] <= time){
          if(lastEvalTime > (parseInt(c[0])+5000)){print('time thing detected!!!'); reset(); return;}//todo ask the player?
          eval(c[c.length-1]);
          complitedLogs.push(diff[i]);
          inc++;
        }
      //}
    }
    if(inc > 0){
      updateGraphics();
    }
    print(inc + ' logs evaluated');
    Dcd -= 2;
  }else{print('no logs evaluated');Dcd += 2;}//todo user frefs?
  Dcd = constrain(Dcd,5,15)
  lastEvalTime = time;
}

function keyboardUpdate(){
  if(queue.length > 10){
    queue = [];
  }
  
  if (keyIsDown(UP_ARROW) || queue[0] === 0) {
    dir(0);
    queue.shift();
  } else if (keyIsDown(DOWN_ARROW) || queue[0] === 2) {
    dir(2);
    queue.shift();
  } else if (keyIsDown(RIGHT_ARROW) || queue[0] === 1) {
    dir(1);
    queue.shift();
  } else if (keyIsDown(LEFT_ARROW) || queue[0] === 3) {
    dir(3);
    queue.shift();
  }  
}

function keyPressed() {
  if (keyCode === UP_ARROW) {
    queue.push(0);
  } else if (keyCode === DOWN_ARROW) {
    queue.push(2);
  } else if (keyCode === RIGHT_ARROW) {
    queue.push(1);
  } else if (keyCode === LEFT_ARROW) {
    queue.push(3);
  }
  if (key === " ") {
    turtles[id].buildWall();
    var dataStr = "turtles["+id+"].buildWall();";
    sendRequest(dataStr);
  } else if (key === "R" && keyIsDown(SHIFT)) {
    print('Reset');
    reset();
  } else if (key === "M" && keyIsDown(SHIFT)) {
    print('Map');
    displayMap();
  } else if (key === "T" && keyIsDown(SHIFT)) {
    print('time travel!?');
    displayTTbox();
  }
}

function mousePressed(){
  /*
  var ux = (mouseX - offset)/scl;
  var uy = (mouseY - offset)/scl;
  var x = round(ux);
  var y = round(uy);
  var nux = ux - x;
  var nuy = uy - y;
  if(Plane.tiles[x] !== undefined){
  if(Plane.tiles[x][y] !== undefined){
    if(max(abs(nux),abs(nuy)) < 0.3){
      Plane.tiles[x][y].click();
    }else if(nux-nuy > 0 && nux+nuy < 0){
      Plane.tiles[x][y].walls[0].b = !Plane.tiles[x][y].walls[0].b;
    }else if(nux-nuy > 0 && nux+nuy > 0){
      Plane.tiles[x][y].walls[1].b = !Plane.tiles[x][y].walls[1].b;
    }else if(nux-nuy < 0 && nux+nuy > 0){
      Plane.tiles[x][y].walls[2].b = !Plane.tiles[x][y].walls[2].b;
    }else if(nux-nuy < 0 && nux+nuy < 0){
      Plane.tiles[x][y].walls[3].b = !Plane.tiles[x][y].walls[3].b;
    }
  }else{Plane.click();}
  }else{Plane.click();}
  */
}

function up(){dir(0);}
function down(){dir(2);}
function left(){dir(3);}
function right(){dir(1);}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function delayEval(ms,str) {
  await sleep(ms);
  eval(str);
}

function arr_diff (a1, a2) {
  var a = [], diff = [];
  for (var i = 0; i < a1.length; i++) {
    a[a1[i]] = true;
  }
  for (var i = 0; i < a2.length; i++) {
    if (a[a2[i]]) {
      delete a[a2[i]];
    } else {
      a[a2[i]] = true;
    }
  }
  for (var k in a) {
    diff.push(k);
  }
  return diff;
};