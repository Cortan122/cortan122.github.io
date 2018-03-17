var scl = 30;
var vscl = 1;
var offset = 100;
var Plane;
var scDiv;
var doloop = false;
var draw3D = true;

var renderer3D;

function setup() {
  colorMode(HSB);
  createCanvas(windowWidth-100,windowHeight-100);
  renderer3D = createGraphics(windowWidth-100,windowHeight-100, WEBGL);
  offset = createVector(20,20);
  Plane = new Wplane(11);
  Plane.tiles[5][5].v = 100;
  Plane.draw();
  scDiv = createDiv('');
  scDiv.html(Plane.count());
}

function draw() {
  background(255);
  //rect(mouseX,mouseY,10,10);
  if(draw3D){
  	Plane.draw3D();
  	image(renderer3D,0,0,width,height);
  }else{Plane.draw();}
  //Plane.calc();
  //scDiv.html(Plane.count());
  if(doloop == true){
    tick();
  }
}

function tick(){
  //if(Plane.tiles[0][0].v < 100|| true){Plane.tiles[0][0].v += 1;}
  //if(Plane.tiles[Plane.tiles.length-1][Plane.tiles.length-1].v > 0){Plane.tiles[Plane.tiles.length-1][Plane.tiles.length-1].v -= 1;}
  //if(Plane.tiles[9][9].v > 0|| true){Plane.tiles[10][10].v -= 1;}
  Plane.calc();
  scDiv.html(Plane.count());
  
}

function keyPressed() {
  if (key == "3") {
    draw3D = !draw3D;
    //this._renderer.isP3D = draw3D;
    //if(draw3D){createCanvas(windowWidth-100,windowHeight-100, WEBGL);}else{createCanvas(windowWidth-100,windowHeight-100);}
  } else if (key == "L") {
    doloop = !doloop;
  } else if (key == " ") {
    tick();
  }else if (key == "R") {
    for(x = 0;x < Plane.tiles.length;x++){
      for(y = 0;y < Plane.tiles[x].length;y++){
        Plane.tiles[x][y].v = 0;
        Plane.tiles[x][y].vel = 0;
      }
    }
    scDiv.html(Plane.count());
  }else{return;}

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
      if(max(abs(nux),abs(nuy))  /*dist(ux,uy,x,y)*/ < 0.5){
        //Plane.tiles[x][y].click();
        Plane.tiles[x][y].v += 1;
        scDiv.html(Plane.count());
      }
    }
  }
}

function round10(value,exp){
  value = +value;
  exp = +exp;
  value = value.toString().split('e');
  value = round(+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
  value = value.toString().split('e');
  return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
}