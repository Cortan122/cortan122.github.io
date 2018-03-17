console.log('draw.js');
function draw() {
  if(tweakables.showFPS)frDiv.html('FPS: '+floor(frameRate()));
  if(paused == undefined){
    timer++;
    cd--;
    if(cd <= 0){
      drop(false);
      difficulty = max(1/(1/difficulty+tweakables.diffScaleTime),tweakables.maxDifficulty);
    }
  }
  updateKeyboard();
  if(dirty){dirty = false;truedraw();}
}

function drawGrid() {
  if(tweakables.gridThickness){
    push();
    translate(-0.5,-0.5);
    stroke(255,100);
    strokeWeight(tweakables.gridThickness);
    var h = grid[0].length;
    var w = grid.length;
    for (var i = 0; i < w+1; i++) {
      line(i,0,i,h);
    }
    for (var i = 0; i < h+1; i++) {
      line(0,i,w,i);
    }
    pop();
  }
}

function drawTile(x,y) {
  if(mode == 2){
    if(peek(x,y)){
      push();
      if(grid[x][y].c){fill(grid[x][y].c)};
      _drawTile(x,y);
      pop();
    }
    return;
  }
  if(mode == 1){
    if(peek(x,y)){
      push();
      if(grid[x][y].c){fill(grid[x][y].c)};
      image(img, x-0.5, y-0.5, 1, 1);
      blendMode(MULTIPLY);
      rect(x,y, 0.5, 0.5);
      pop();
    }
    return;
  }
  if(mode == 0){if(peek(x,y)){if(grid[x][y].c){fill(grid[x][y].c)};rect(x,y, 0.5, 0.5);};return;}
  var rom = [peek(x,y-1),peek(x+1,y),peek(x,y+1),peek(x-1,y)];
  var rom2 = [peek(x+1,y-1),peek(x+1,y+1),peek(x-1,y+1),peek(x-1,y-1)];
  if(peek(x,y) == 0){
    for (var i = 0; i < rom.length; i++) {
      if((rom[i] & rom[(i+1)%rom.length] /*& rom2[i]*/) == 1){
        push();
        fill('red');
        translate(x,y);
        rotate(i*PI/2);
        triangle(-divergence+0.5,-0.5,0.5,divergence-0.5,0.5,-0.5);
        pop();
      }
    }
  }else{
    fill(grid[x][y].c);
    rect(x, y, 0.5, 0.5);
    for (var i = 0; i < rom.length; i++) {
      if((rom[i] | rom[(i+1)%rom.length] | rom2[i]) == 0){
        push();
        fill(0);
        translate(x,y);
        rotate(i*PI/2);
        triangle(-divergence+0.5,-0.5,0.5,divergence-0.5,0.5,-0.5);
        pop();
      }
    }
  }
}

function _drawTile(x,y,goast){
  push();
  if(goast || mode == 2){
    push();
    noFill();
    stroke(255);
    strokeWeight(0.1);
    rect(x,y, 0.3, 0.3);
    pop();
    blendMode(MULTIPLY);
  }else if(mode == 1){
    image(img, x-0.5, y-0.5, 1, 1);
    blendMode(MULTIPLY);
  }else{blendMode(BLEND);}
  rect(x,y, 0.5, 0.5);
  pop();
}

function drawBox(){
  push();
  fill(0);
  rectMode(CORNER);
  rect(grid.length+1.5, 6/*grid[0].length*/-1, 5, 6);
  rectMode(CORNERS);
  rect(-50, -1.5, 50, -10);
  strokeWeight(1);
  if(tweakables.drawBox){stroke('white');}else{stroke(0);}
  rect(-1.5,-1.5, grid.length-0.5, grid[0].length-0.5);
  pop();
}

function drawQueue(){
  //if(!queue.dirty)return;
  queue.dirty = false;
  push();
  translate(grid.length+4,2);
  fill(0);
  strokeWeight(0.5);
  if(tweakables.showQueue){stroke('white');}else{stroke(0);}
  rectMode(CORNERS);
  rect(-2,-2,2,3);
  if(!tweakables.showQueue){pop();return;}
  fill(queue.color);
  var tiles = blockTypes[queue.type].slice();
  tiles.push({x:0,y:0});
  noStroke();
  rectMode(RADIUS);
  for (var i = 0; i < tiles.length; i++) {
    var x = tiles[i].x;var y = tiles[i].y;
    _drawTile(x,y);
  }
  drawCenter(0,0);
  pop();
}

function drawGoast(){
  if(!tweakables.showGoast)return;
  if(goast.tiles == undefined)return;
  push();
  fill(goast.color);
  var tiles = goast.tiles;
  noStroke();
  rectMode(RADIUS);
  for (var i = 0; i < tiles.length; i++) {
    var x = tiles[i].x+goast.x;var y = tiles[i].y+goast.y;
    _drawTile(x,y,tweakables.goastMode);
  }
  drawCenter(goast.x,goast.y);
  pop();
}

function drawHelp(){
  if(!helpRequired && paused != 'help'){return;}
  var helpString = `
  left,A       -    move left
  right,D      -   move right
  down,S       -   small drop
  up,W,E,{1}   - rotate right
  shift,Z,Q    -  rotate left
  space,{0}    -     big drop
  R            -      restart

  P,K,escape   -        pause
  T            - toggle theme
  H            -         help
  M            -         mute
  O            -  dev options
  any key      -     continue`.substr(1).format(
    tweakables.mouseControls?((!tweakables.flipMouseButtons)?'LMB':'RMB'):'   ',
    tweakables.mouseControls?((tweakables.flipMouseButtons)?'LMB':'RMB'):'   '
  );
  push();
  textAlign(CENTER);
  translate(3.3,0);
  rectMode(CORNERS);
  fill(0);
  noStroke();
  rect((((-width/2)-offset.x)/scl)-10,-1.5,50/*-1.5*/,50);
  if(!helpRequired){pop();paused = lastPaused;dirty = true;return;}
  textSize(1);
  fill('white');
  //text(helpString,((-width/2)-offset.x)/scl,0/*,-1.5,50*/)
  text(helpString,-(offset.x/scl)-4,0/*,-1.5,50*/);
  pop();
}

function drawHighlighter(){
  if(highlighter == undefined)return;
  push();
  fill('blue');
  //stroke(255);
  //strokeWeight(0.1); //noStroke();
  noStroke();
  rectMode(CORNER);
  blendMode(MULTIPLY);
  rect((((-width/2)-offset.x)/scl),(highlighter*1.25)+0.25, 6, -1);
  pop();
}

var _smallHelpString = 'H-help\nM-mute\nR-restart\nP-pause\nPresets\nSettings\nScoreboard';
var smallHelpString = _smallHelpString;

function drawExtraText(){
  noStroke();
  textSize(1);
  push();
  fill(0);
  rect((((-width/2)-offset.x)/scl),-1,6,10);
  pop();
  //textSize(smallHelpStringSize);
  if(smallHelpStringSize < 1){this._renderer.drawingContext.font = (smallHelpStringSize+'px '+tweakables.font);}
  if(!helpRequired && paused != 'help'&&tweakables.showSmallHelp){
    text(smallHelpString,((-width/2)-offset.x)/scl,0);
  }
  textSize(1);
  if(tweakables.showHighscore || tweakables.showDifficulty){
    textSize(0.85);
    this._renderer.drawingContext.font = '0.85px '+tweakables.font;
  }else if(tweakables.showPeriod){
    textSize(1);
    //this._renderer.drawingContext.font = '0.85px monospace';
  }
  var t = "lines:"+score;
  t += "\nscore:"+floor(fakeScore);
  if(tweakables.showDifficulty){
    t += "\nspeed:"+round10((tweakables.maxDifficulty*100)/difficulty,-1)+'%';
  }
  if(tweakables.showPeriod){t += "\nperiod:"+round(difficulty);}
  if(tweakables.showHighscore){t += '\nhighscore:'+localStorage["tetris_highscore"];}
  text(t, grid.length+1.5, (t.length>10?6:6.1)/*grid[0].length*/);
  push();
  fill('red');
  textSize(2.8);
  // textFont(tweakables.font);
  textFont('Courier New');
  if(paused != undefined&&paused != "animation"){text(paused, (grid.length/2)-(paused.length*0.9), -1.8);}
  pop();
}

function drawCenter(x,y){
  if(!tweakables.showCenter)return;
  push();
  fill(127);
  noStroke();
  blendMode(ADD);
  ellipse(x,y,0.5,0.5);
  pop();
}

function truedraw() {
  push();
  //background(0);
  translate(width/2,height/2);
  fill('white');
  //ellipse(0, 0, 100, 100);
  translate(offset.x,offset.y);
  scale(scl);
  drawBox();
  if(tweakables.drawGridFirst)drawGrid();
  drawExtraText();
  drawHighlighter();
  drawQueue();
  drawGoast();
  rectMode(RADIUS);
  for (var x = 0; x < grid.length; x++) {
    for (var y = 0; y < grid[0].length; y++) {
      drawTile(x,y);
    }
  }
  drawCenter(block.x,block.y);
  if(!tweakables.drawGridFirst)drawGrid();
  drawHelp();
  pop();
}