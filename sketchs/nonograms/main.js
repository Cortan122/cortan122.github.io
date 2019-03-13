const colors = {
  "-1":{bg:"#16c60c",fg:"white"},
  0:"white",
  1:"#383838",
  2:'#00ba9d',
  3:'#0078d7',
  text:'#f5f5dc',
  bg:'#666',
  stroke:'black'
};//["white","#383838",'#f5f5dc','#0f0','#88f','black','#666'];
var sizex = 5;
var sizey = 5;
var grid = [];
var lastMousePos;
var lastTouchTime;
var isDirty = true;
var dirtyCoords = [];
var isDone = true;
var offsetx,offsety,scl;
var isButtonSwitch = false;
var jsonCache = undefined;
var jsonCacheIndex = 0;

// id: 2188,7486,7692,13236,13452,15368
var tweakables = {
  sizex:5,
  sizey:5,
  borderWidth:.1,
  sideGap:10,
  resetIconSize:.8,
  seed:-1,
  id:14698,
  inputRepeatDelay:11,
  inputRepeatSpeed:-1,
  randomGrid:false,
  rainbowTiles:true,
  buttonBoard:false,
  cacheFrames:true,
  showFPS:true,
  metaStart:true
};

var inputRom = [
  {keys:['O','T'],action:'lib.tweaker.toggleTweakables()',description:'Toggle Tweakables'},
  {keys:['R'],action:'newGame()',description:'Restart'},
  {keys:['A'],action:'AI_all()',description:'AI'},
  {keys:[' '],action:'isDone?newGame():AI(1)',repeatable:true,description:'AI step'},
  {keys:[-1],action:'isButtonSwitch = !isButtonSwitch',description:'Switch mouse buttons'}
];

function fromJson(json){
  if(typeof json == 'string')json = JSON.parse(json);
  sizex = json.v.length;
  sizey = json.h.length;
  randomGrid();
  grid.lines.h.map((e,i)=>e.t=json.h[i]);
  grid.lines.v.map((e,i)=>e.t=json.v[i]);
  resetGrid();
}

function resetGrid(){
  fillGrid(0);
  grid.score = grid.lines.all.map(e=>{
    for(var k in e){
      if(k=='t'||k=='l')continue;
      delete e[k];
    }
    updateLine(e,true);
    return e.score;
  }).sum();
  isDirty = true;
  isDone = false;
}

function randomGrid(){
  if(grid==undefined)grid = [];
  randomSeed((new Date).getTime());
  grid.seed = floor(random(0,Number.MAX_SAFE_INTEGER));
  var gridSeed = tweakables.seed;
  if(gridSeed>=0)grid.seed = gridSeed;
  randomSeed(grid.seed);
  if(tweakables.randomGrid)$('#seed').html(`seed: ${grid.seed}`);
  for (var i = 0;i < sizex;i++){
    if(grid[i]==undefined)grid[i] = [];
    for (var j = 0;j < sizey;j++){
      if(grid[i][j]==undefined)grid[i][j] = {x:i,y:j};
      grid[i][j].v = round(random());
    }
  }
  if(grid.lines==undefined||grid.lines.h.length!=sizey||grid.lines.v.length!=sizex){
    var lines = {v:[],h:[]};
    for (var i = 0;i < sizex;i++){
      lines.v[i] = {/*tiles*/l:[],/*target*/t:[]};
      for (var j = 0;j < sizey;j++){
        lines.v[i].l[j] = grid[i][j];
      }
    }
    for (var i = 0;i < sizey;i++){
      lines.h[i] = {/*tiles*/l:[],/*target*/t:[]};
      for (var j = 0;j < sizex;j++){
        lines.h[i].l[j] = grid[j][i];
      }
    }
    lines.all = lines.v.concat(lines.h);
    grid.lines = lines;
  }
}

function analyseLine(line,cond=e=>e!=1){
  if(!(line instanceof Array))throw "analyseLine(Array)";
  var r = [];
  var acc = 0;
  for (var i = 0; i < line.length; i++) {
    var cell = line[i].v;
    if(cond(cell,i)){
      if(acc)r.push(acc);
      acc = 0;
      continue;
    }
    acc++;
  }
  if(acc)r.push(acc);
  return r;
}

function analyseGrid(){
  var lines = grid.lines;
  if(lines.all==undefined)lines.all = lines.v.concat(lines.h);
  var all = lines.all;
  for (var i = 0; i < all.length; i++) {
    all[i].t = analyseLine(all[i].l);
    /*for(var k in all[i]){
      if(k=='t'||k=='l')continue;
      delete all[i][k];
    }*/
  }
}

function fillGrid(n=0){
  for (var i = 0;i < sizex;i++){
    for (var j = 0;j < sizey;j++){
      grid[i][j].v = n;
    }
  }
}

function calcOffsets(){
  offsetx = grid.lines.h.map(e=>e.t.length).max();
  offsety = grid.lines.v.map(e=>e.t.length).max();
  if(offsetx==0)offsetx = 1;
  if(offsety==0)offsety = 1;
  var gap = tweakables.sideGap;
  translate(gap,gap);
  scl = (min(height,width)-2*gap) / max(sizex+offsetx,sizey+offsety);
  scale(scl);
  translate(0.5+offsetx,0.5+offsety);
  grid.coord = (x,y)=>{
    x -= gap;
    y -= gap;
    x /= scl;
    y /= scl;
    x -= 0.5+offsetx;
    y -= 0.5+offsety;
    x = round(x);
    y = round(y);
    if(x<0&&y<0)return -1;
    if(x<0||y<0||x>sizex-1||y>sizey-1)return undefined;
    return {x,y};
  };
  return {offsetx,offsety,scl};
}

function newGame(){
  if(!tweakables.randomGrid){
    if(!jsonCache){
      $.ajax("examples.json").done(e=>{jsonCache = e;newGame();});
      fromJson({v:[[1]],h:[[1]]});
      return;
    }
    var id = tweakables.id;
    if(id<0){
      var ks = Object.keys(jsonCache);
      id = ks[jsonCacheIndex%ks.length];
      jsonCacheIndex++;
    }
    $('#seed').html(`id: ${id}`);
    fromJson(jsonCache[id]);
    grid.id = id;
    return;
  }
  sizex = tweakables.sizex;
  sizey = tweakables.sizey;
  randomGrid();
  analyseGrid();
  resetGrid();
}

function updateLine(line,real=true){
  line.state = analyseLine(line.l);
  var score = compareArray(line.state,line.t)?1:0;
  if(line.score==undefined)line.score = 0;
  if(!real)return;
  var diff = score-line.score;
  line.score = score;
  grid.score += diff;
  isDone = (grid.score == sizex+sizey);
  if(diff)isDirty = true;
}

function updateTile(x,y){
  dirtyCoords.push({x,y});
  updateLine(grid.lines.h[y]);
  updateLine(grid.lines.v[x]);
}

function clickOnGrid(mb){
  if(isButtonSwitch)mb = mb==-1?1:-1;
  var c = grid.coord(mouseX,mouseY);
  if(!c)return;
  if(c==-1){
    if(isDone)newGame();
    return;
  }
  var {x,y} = c;
  var lmp = lastMousePos;
  if(lmp&&x == lmp.x&&y == lmp.y)return;
  lastMousePos = c;
  var v = grid[x][y].v;
  grid[x][y].v = v==mb?0:v==0?mb:v;
  updateTile(x,y);
}

function setup(){
  createCanvas(500, 500)
    .elt.addEventListener('contextmenu', function(ev){ ev.preventDefault();return false; }, false);
  rectMode(RADIUS);
  textSize(1);
  textAlign(CENTER,CENTER);
  lib.tweaker.events.push(()=>isDirty=true);
  lib.tweaker.events.push(onChangeSourceMode);
  onChangeSourceMode();
  var t = $('<div id="bg"></div>');
  $('body').append(t);
  t.height(height).width(width);
  $('body').append('<div id="seed"></div>');
  newGame();
}

function darwTile(i,j){
  var v = grid[i][j].v;
  if(isDone&&v==-1)v = 0;
  if(v==-1){
    fill(colors[v].bg);
    rect(i,j,0.5,0.5);
    push();
    translate(i,j);
    stroke(colors[v].fg);
    line(-.25,-.25,.25,.25);
    line(.25,-.25,-.25,.25);
    pop();
    return;
  }
  fill(colors[v]);
  if(isDone&&v==0&&tweakables.rainbowTiles){
    noFill();
    drawingContext.clearRect(i-.5,j-.5,1,1);
  }
  rect(i,j,0.5,0.5);
}

function darwTiles(){
  stroke(colors.stroke);
  strokeWeight(tweakables.borderWidth);
  for(var i = 0;i < sizex;i++){
    for(var j = 0;j < sizey;j++){
      darwTile(i,j);
    }
  }
}

function drawGoals(){
  for(var i = 0; i < grid.lines.h.length; i++){
    let line = grid.lines.h[i].t.copy().reverse();
    let score = grid.lines.h[i].score;
    for(var j = 0; j < line.length; j++){
      fill(colors[score?2:3]);
      rect(-j-1,i,0.5,0.5);
      fill(colors.text);
      text(line[j],-j-1,i);
    }
  }
  for(var i = 0; i < grid.lines.v.length; i++){
    let line = grid.lines.v[i].t.copy().reverse();
    let score = grid.lines.v[i].score;
    for(var j = 0; j < line.length; j++){
      fill(colors[score?2:3]);
      rect(i,-j-1,0.5,0.5);
      fill(colors.text);
      text(line[j],i,-j-1);
    }
  }
}

function drawHole(){
  var x = offsetx,y = offsety;
  x = y = min(x,y);
  drawingContext.clearRect(-x-.5,-y-.5,x,y);
  noFill();
  stroke(colors.stroke);
  strokeWeight(tweakables.borderWidth);
  rectMode(CORNER);
  rect(-x-.5,-y-.5,x,y);
  rectMode(RADIUS);
  var tscl = tweakables.resetIconSize;
  $('#svg').css({
    top:tweakables.sideGap+(offsety-y+(1-tscl)/2*x)*scl,
    left:tweakables.sideGap+(offsetx-x+(1-tscl)/2*y)*scl,
    height:y*tscl*scl,
    width:x*tscl*scl
  });
}

function draw(){
  if(!isDirty&&tweakables.cacheFrames){
    if(dirtyCoords.length){
      calcOffsets();
      stroke(colors.stroke);
      strokeWeight(tweakables.borderWidth);
      for (var i = 0; i < dirtyCoords.length; i++) {
        let {x,y} = dirtyCoords[i];
        darwTile(x,y);
      }
      dirtyCoords = [];
    }
    if(isDone)drawHole();
    return;
  }
  isDirty = false;
  background(colors.bg);
  calcOffsets();
  darwTiles();
  drawGoals();
  if(isDone)drawHole();
}

function mouseDragged(){
  clickOnGrid((mouseButton != LEFT)?-1:1);
}

function mousePressed(){
  if(lastTouchTime==frameCount)return;
  lastMousePos = undefined;
  clickOnGrid((mouseButton != LEFT)?-1:1);
}

function touchEnded(){
  lastTouchTime = frameCount;
}

function mouseReleased(){}

function onChangeSourceMode(name){
  var tw = tweakables;
  if(name==undefined||name=="randomGrid"){
    //i do not know
    var a = $('#tw_sizex,#tw_sizey,#tw_seed');
    var b = $('#tw_id');
    if(tw.randomGrid){
      a.removeClass('deprecated');
      b.addClass('deprecated');
    }else{
      a.addClass('deprecated');
      b.removeClass('deprecated');
    }
  }
}

function compareArray(a1,a2){
  if(!a1.equals)return false;
  return a1.equals(a2);
}
