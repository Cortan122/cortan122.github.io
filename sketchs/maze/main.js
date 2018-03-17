var canvas;
var mazeImage;
var offset = 10;

var grid = [];
var categories = [];

var verticalityBias = false;

function setup() {
  canvas = createCanvas(500,500);
  canvas.drawingContext.imageSmoothingEnabled = false;
  // body...
  makeMaze(10,10);
}

function makeMaze(xsize,ysize) {
  //init image
  mazeImage = createGraphics(xsize*2+1,ysize*2+1);
  mazeImage.pixelDensity(1);
  mazeImage.background(0);
  mazeImage.loadPixels();
  //init grid
  grid = [];
  categories = [];
  for (var x = 0; x < xsize; x++) {
    grid[x] = [];
    for (var y = 0; y < ysize; y++) {
      grid[x][y] = {cat:x*xsize+y,x:x,y:y};
      categories[x*xsize+y] = [grid[x][y]];
      setPixel(255,gridPosToPixelPos(x,y));
    }
  }
  //init tiles
  var todoTiles = [];
  for (var x = 0; x < xsize; x++) {
    for (var y = 0; y < ysize; y++) {
      todoTiles.push(grid[x][y]);
    }
  }
  //find a tile
  while(todoTiles.length > 0){
    var tile = random(todoTiles);
    var t = pokeHoleAt(tile);
    if(t == false)todoTiles.remove(tile);
  }
  //display
  mazeImage.updatePixels();
  image(mazeImage,offset,offset,width-2*offset,height-2*offset);
}

function pokeHoleAt(x,y){
  if(x != undefined&&y == undefined){y = x.y;x = x.x;}
  var rom = [0,1,2,3];
  if(!verticalityBias)rom.shuffle();
  for (var i = 0; i < 4; i++) {
    var t = pokeHole(x,y,rom[i]);
    if(t == 2)return true;
    //if(t == 1)return false;
  }
  return false;
}

function pokeHole(x,y,dir){
  var catIndex = grid[x][y].cat;
  if(typeof dir == 'number'){var vector = dirToVector(dir);}else{var vector = dir;}
  try{
    if(catIndex == grid[x+vector.x][y+vector.y].cat)return 0;
  }catch(e){return 1;}
  var pos = gridPosToPixelPos(x,y);
  setPixel(255,pos.x+vector.x,pos.y+vector.y);
  var catIndex2 = grid[x+vector.x][y+vector.y].cat;
  var cat2 = categories[catIndex2];
  var cat = categories[catIndex];
  categories[catIndex2] = undefined;
  for (var i = 0; i < cat2.length; i++) {
    var t = cat2[i];
    cat.push(t);
    t.cat = catIndex;
  }
  return 2;
}

function gridPosToPixelPos(x,y){
  if(x != undefined&&y == undefined){y = x.y;x = x.x;}
  return {x:x*2+1,y:y*2+1};
}

function setPixel(p,x,y){
  if(x != undefined&&y == undefined){y = x.y;x = x.x;}
  for (var i = 0; i < 3; i++) {
    mazeImage.pixels[(x+y*mazeImage.width)*4+i] = p;
  }
  return p;
}

function getPixel(x,y){
  if(x != undefined&&y == undefined){y = x.y;x = x.x;}
  return mazeImage.pixels[(x+y*mazeImage.width)*4];
}

var dirToVectorRom = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
function dirToVector(dir){
  return dirToVectorRom[dir];
}

Array.prototype.remove || (Array.prototype.remove = function(e) {
  var index = this.indexOf(e);
  if (index > -1) {
    this.splice(index, 1);
  }
});

Array.prototype.shuffle || (Array.prototype.shuffle = function() {
  var j, x, i;
  for (i = this.length; i; i--) {
    j = Math.floor(/*Math.*/random() * i);
    x = this[i - 1];
    this[i - 1] = this[j];
    this[j] = x;
  }
});