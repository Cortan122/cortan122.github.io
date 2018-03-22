var larr;
function reset(){
  larr = [
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0
  ];
}

function larrxy(x,y){
  if(x<0||x>=gx||y<0||y>=gy)
    return -1;
  return (x+y*gx)%(gx*gy);
}

function rand(){
  var r = Math.floor(Math.random()*gx*gy);
  var t;
  for(var i = 0;i <gx*gy;i++){
    t = larr[r];
    if(t==0){
      larr[r] = parseInt(random(tweakables.randomString.split('')),16);
      return true;
    }
    r++;
    r = r%(gx*gy);
  }
  return false;
}

var dirrom=[
  [0,-1],
  [1,0],
  [0,1],
  [-1,0]
];

function move(dir){
  dir = dir%4;
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
  if(ni==-1)return false;
  var nt = larr[ni];
  if(nt==t&&!b){
    larr[ni]++;
    larr[i]=0;
    movexy(dir,nx,ny,true);
    return true;
  }
  var res = movexy(dir,nx,ny,b);
  if(!res)return false;
  larr[ni]=t;
  larr[i]=0;
  movexy(dir,nx,ny,b);
  return true;
}