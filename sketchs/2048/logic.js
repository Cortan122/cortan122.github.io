var larr,tmparr = [],aniray = [];
function reset(){
  larr = Array(gx*gy).fill().map(e=>0);
  //[1,2,3,4,8,7,6,5,9,10,11,12,16,15,14,13].map((e,i) => larr[i] = e);//debug
}

function larrxy(x,y){
  if(x<0||x>=gx||y<0||y>=gy)
    return -1;
  return (x+y*gx)%(gx*gy);
}

var randIndex;
function rand(){
  isDirty = true;
  randIndex = undefined;
  if(!tweakables.spawnRandomTiles)return true;
  var t = larr.map((e,i)=>[e,i]).filter(e => e[0]==0);
  if(t.length == 0)return false;
  randIndex = random(t)[1];
  larr[randIndex] = parseInt(random(tweakables.randomString.split('')),16);
  return true;
}

var dirrom=[
  [0,-1],
  [1,0],
  [0,1],
  [-1,0]
];

var prevDir;
function move(dir){
  tmparr = Array(gx*gy).fill().map(e=>false);
  aniray = Array(gx*gy).fill().map(e=>0);
  dir = dir%4;
  prevDir = dir;
  var r = false;
  var dirv = dirrom[dir];
  var dx = dirv[0]==1?-1:1;
  var dy = dirv[1]==1?-1:1;
  var ix = dx==-1?gx-1:0;
  var iy = dy==-1?gy-1:0;
  var bx = dx==-1?-1:gx;
  var by = dy==-1?-1:gy;
  for(var x = ix;x!=bx;x+=dx){
    for(var y = iy;y!=by;y+=dy){
      var t = movexy(dir,x,y);
      if(t === true)r = true; 
    }
  }
  if(!r){
    //throw 'you lose';
  }else{
    rand();
  } 
}

function movexy(dir,x,y,b=false){
  if(x<0||x>=gx||y<0||y>=gy)
    return false;
  var i = larrxy(x,y);
  var t = larr[i];
  if(t == 0)return 1;
  var dirv = dirrom[dir];
  var nx = x+dirv[0];
  var ny = y+dirv[1];
  var ni = larrxy(nx,ny);
  if(ni==-1){
    tmparr[i] = b||tmparr[i];
    return false;
  }
  var nt = larr[ni];
  if(nt==t&&!b&&!tmparr[i]&&!tmparr[ni]){
    larr[ni]++;
    larr[i]=0;
    aniray[ni] = aniray[i]+1;
    aniray[i] = 0;
    movexy(dir,nx,ny,true);
    return true;
  }
  var res = movexy(dir,nx,ny);
  if(!res){
    tmparr[i] = b||tmparr[i];
    return false;
  }
  larr[ni]=t;
  larr[i]=0;
  aniray[ni] = aniray[i]+1;
  aniray[i] = 0;
  movexy(dir,nx,ny,b);
  return true;
}