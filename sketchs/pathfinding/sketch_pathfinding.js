var scl = 30;
var offset;
var Plane;
var pathfinder;
var turtles = [];

function setup() {
  offset = createVector(100,100);
  createCanvas(500,500);
  Plane = new Wplane(10);
  pathfinder = Plane.pathfinder;//new Pathfinder(Plane);
  
  for(i=0;i<10;i++){
    turtles[i] = new Turtle(Plane,i);
  }
  
  //frameRate(10);
}

function draw() {
  background(255);
  Plane.draw();
  for(i = 0;i < turtles.length;i++){
    turtles[i].advance();
    turtles[i].draw();
  }
}

function pathfinderTest(){
  var p = pathfinder.findCords(0,0,9,9);
  for(x = 0;x < Plane.tiles.length;x++){
    for(y = 0;y < Plane.tiles[x].length;y++){
       Plane.tiles[x][y].b = true;
    }
  }
  for(i in p){
    p[i].b = false;
  }
}

function mousePressed(){
  var ux = (mouseX - offset.x)/scl;
  var uy = (mouseY - offset.y)/scl;
  var x = round(ux);
  var y = round(uy);
  var nux = ux - x;
  var nuy = uy - y;
  if(Plane.tiles[x] !== undefined){
    if(Plane.tiles[x][y] !== undefined){
      if(max(abs(nux),abs(nuy))  /*dist(ux,uy,x,y)*/ < 0.3){
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
  pathfinder.isValid = false;//pathfinder.update();
}