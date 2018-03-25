var gx,gy,scl,isDirty = true;

var tweakables = {
  scale:120,
  width:4,
  height:4,
  lineWidth:15,
  lineColor:'#bbada0',
  textColor:'#776e65',
  textSize:55,
  randomString:'12',
  dragThreshold:100,
  animationDuration:.05,
  spawnRandomTiles:true,//debug
  purpleDots:false,//debug
  useCSS:true,
  extraSpace:true,
  logScale:false,
  printZeros:false,
  showFPS:true,
  metaStart:true
};

var inputRom = [
  {keys:['O','T'],action:'lib.tweaker.toggleTweakables()'},
  {keys:['D','rightarrow'],action:'move(1)'},
  {keys:['S','downarrow'],action:'move(2)'},
  {keys:['A','leftarrow'],action:'move(3)'},
  {keys:['W','uparrow'],action:'move(0)'},
  {keys:['R'],action:'reset();rand()'}
];

function setup() {
  scl = tweakables.scale;
  gx  = tweakables.width;
  gy  = tweakables.height;

  var twlw = tweakables.extraSpace?tweakables.lineWidth:0;
  createCanvas(scl*gx+twlw,scl*gy+twlw);
  textAlign(CENTER,CENTER);
  textSize(tweakables.textSize);
  background(tweakables.lineColor);
  $(canvas).addClass('on');
  $('body').append('<div id="container" class="on"></div>');

  lib.tweaker.events.push(()=>isDirty = true);
  lib.tweaker.events.push(onChangeDrawMode);
  lib.tweaker.events.push(updateCSS);

  updateCSS();
  onChangeDrawMode('useCSS');

  reset();
  rand();
}

function draw(){
  if(isDirty){
    if(tweakables.useCSS){
      rdrawcss();
    }else{
      rdraw();
    }
    isDirty = false;
  }
}

var crom = ['#cdc1b4','#eee4da','#ede0c8','#f2b179','#f59563','#f65e3b','#edcf72','#edcc61','#edc850','Gold','#48D1CC','black','#ADFF2F','#00FF7F','#DA70D6','#DB7093','white'];
function rdraw(){
  push();
  var twlw = tweakables.extraSpace?tweakables.lineWidth:0;
  translate(twlw/2,twlw/2);
  strokeWeight(tweakables.lineWidth);
  for(var i = 0;i <larr.length;i++){
    stroke(tweakables.lineColor);
    fill(crom[larr[i]%crom.length]);
    rect((i%gx)*scl,floor(i/gy)*scl,scl,scl);
    fill(tweakables.textColor);
    noStroke();
    if(tweakables.printZeros||larr[i]!=0){
      var t = larr[i];
      if(!tweakables.logScale&&t!=0){
        t = 1<<t;
      }
      text(t,((i%gx)+.5)*scl,(floor(i/gy)+.5)*scl);
    }

    if(tmparr[i]&&tweakables.purpleDots){
      fill('purple');
      ellipse(((i%gx)+.5)*scl,(floor(i/gy)+.5)*scl,10,10);
    }
  }
  pop();
}

function rdrawcss(){
  var con = $('div#container');
  con.html('');
  var offset = tweakables.extraSpace?tweakables.lineWidth:tweakables.lineWidth/2;
  for(var i = 0;i <larr.length;i++){
    var cell = $('<span class="cell"></span>');
    con.append(cell);
    cell.css({top:floor(i/gy)*scl+offset,left:(i%gx)*scl+offset});

    cell.addClass('n'+larr[i]);
    if(aniray[i]){
      cell.addClass('m'+aniray[i]);
      if(prevDir!=undefined)cell.addClass('dir'+prevDir);
    }
    if(tmparr[i])cell.addClass('merged');
    if(randIndex===i)cell.addClass('random');

    if(tweakables.printZeros||larr[i]!=0){
      var t = larr[i];
      if(!tweakables.logScale&&t!=0){
        t = 1<<t;
      }
      t = t.toString();
      if(t.length>2){
        var f = tweakables.textSize-10;
        if(t.length>3)f -= 10;
        cell.css('font-size',f);
      }
      cell.html(t);
    }
  }
}

function onChangeDrawMode(name){
  if(name!='useCSS')return;
  if(!tweakables.useCSS){
    $('canvas.off').attr('class','on');
    $('div#container.on').attr('class','off');
    $('canvas').focus();
  }else{
    $('canvas.on').attr('class','off');
    $('div#container.off').attr('class','on');
    $('div#container').focus();
    var can = $(canvas);
    $('div#container').width(can.width()).height(can.height());
  }
}

function updateCSS(){
  var tw = tweakables;
  if(!tw.useCSS)return;

  var s = `
    .cell {width:{0}px;height:{0}px;line-height:{0}px;font-size:{2}px;color:{3};animation-duration:{4}s;}
    #container {background:{1};}
  `.format(scl-tw.lineWidth,tw.lineColor,tw.textSize,tw.textColor,tw.animationDuration);
  for (var i = 0; i < crom.length; i++) {
    s += '.n{1} {background:{0};}\n'.format(crom[i],i);
  }
  for (var i = 0; i < 4; i++) {
    var dirv = dirrom[i];
    for (var j = 1; j < 4; j++) {
      s += '@keyframes dir{0}m{1}{from{transform:translate({2}%,{3}%);}to{transform:translate(0,0);}}'
        .format(i,j,dirv[0]*j*-100,dirv[1]*j*-100);
      s += '.dir{0}.m{1}:not(.n0):not(.random) {animation-name: dir{0}m{1};}'.format(i,j);
    }
  }

  var css = $('.pushedCSS');
  if(css.length){
    css.html(s);
  }else{
    pushCSS(s);
  }
}

var mx,my;
function mousePressed(){
  mx = mouseX;
  my = mouseY;
}

function mouseReleased(){
  var dx,dy;
  dx = mouseX-mx;
  dy = mouseY-my;
  if(dx**2+dy**2<tweakables.dragThreshold)return;
  var dir = vectorToDir(createVector(-dx,-dy));
  move(dir);
}

function vectorToDir(v){
  var angle = -(atan2(v.y,v.x)-PI);
  var dir;
  if(angle >= PI*1.75||angle < PI*0.25)dir = 1;
  if(angle >= PI*0.25&&angle < PI*0.75)dir = 0;
  if(angle <= PI*1.25&&angle >= PI*0.75)dir = 3;
  if(angle > PI*1.25&&angle < PI*1.75)dir = 2;
  return dir;
}

function pushCSS(css) {
  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  $(style).addClass('pushedCSS');
  style.type = 'text/css';
  if (style.styleSheet){
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
  head.appendChild(style);
}