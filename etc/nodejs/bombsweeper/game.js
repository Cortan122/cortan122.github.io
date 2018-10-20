const {floor} = Math;

const charRom = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ~!@#$%^&*()_+-=`\\;',./{}|[]<>?\"";

var updateMask = 2**9-1;//0b010101010
var grid;
var size = {x:0,y:0};
var flagCount;
var hiddenCount;

Array.prototype.remove_fast || (Array.prototype.remove_fast = function(e) {
  var index = this.indexOf(e);
  if(index == this.length-1){
    this.pop();
  }else if(index > -1){
    this[index] = this.pop();
  }
  return this;
});
Object.defineProperty(Array.prototype,"remove_fast",{enumerable: false});

function randomChoice(arr){
  return arr[Math.floor(Math.random() * arr.length)];
}

function gridGet(x,y){
  var argc = arguments.length;
  if(argc==1){
    var {x,y} = x;
  }
  if(x>=size.x||y>=size.y||y<0||x<0)return undefined;
  return grid[x][y];
}

function getLinearIndex(x,y){
  var argc = arguments.length;
  if(argc==1){
    var {x,y} = x;
  }
  return x+y*size.x;
}

function get2dIndex(i){
  return {x:i%size.x,y:floor(i/size.x)};
}

function linearGet(i){
  return gridGet(get2dIndex(i));
}

function init(x,y){
  var argc = arguments.length;
  if(argc==1){
    var {x,y} = x;
  }
  flagCount = 0;
  hiddenCount = x*y;
  size = {x,y};
  grid = new Array(x).fill().map(e=>new Array(y).fill().map(e=>{
    return {bomb:false,visible:false,flagged:false,value:0};
  }));
}

function addBomb(x,y,num){
  var m = 1;
  for(var xi = -1;xi <= 1;xi++){
    for(var yi = -1;yi <= 1;yi++){
      if(updateMask&m){
        var t = gridGet(x+xi,y+yi);
        if(t)t.value += num;
      }
      m <<= 1;
    }
  }
}

function spreadBombs(num){
  var avalibleSpots = [];
  for(var i = 0;i < size.x*size.y;i++){
    var t = linearGet(i);
    if(!t.bomb&&!t.visible)avalibleSpots.push(i);
  }
  for(var i = 0;i < num;i++){
    var ii = randomChoice(avalibleSpots);
    if(ii==undefined)return/* console.log(avalibleSpots,i,ii)*/;//we are full
    avalibleSpots.remove_fast(ii);
    var {x,y} = get2dIndex(ii);
    gridGet(x,y).bomb = true;
    addBomb(x,y,1);
  }
}

function clearArea(x,y){
  var t = gridGet(x,y);
  if(t==undefined||t.visible)return [];
  var r = [{x,y}];
  hiddenCount -= t.visible?0:1;
  t.visible = true;
  flagCount -= t.flagged?1:0;
  t.flagged = false;
  if(t.value!=0)return r;
  var m = 1;
  for(var xi = -1;xi <= 1;xi++){
    for(var yi = -1;yi <= 1;yi++){
      if(updateMask&m){
        r = r.concat(clearArea(x+xi,y+yi));
      }
      m <<= 1;
    }
  }
  return r;
}

function leftClick(x,y,safe=false){
  if(x&&x.x&&x.y&&arguments.length<3){
    safe = y;
    var {x,y} = x;
  }
  if(safe==undefined)safe = false;
  var t = gridGet(x,y);
  if(t==undefined){
    return 'out of bounds';
  }else if(t.flagged){
    return 'flagged';
  }else if(t.visible){
    return 'visible';
  }else if(t.bomb&&safe){
    t.bomb = false;
    addBomb(x,y,-1);
    t.visible = true;
    spreadBombs(1);
    t.visible = false;
    return clearArea(x,y);
  }else if(t.bomb){
    return 'bomb';
  }else{
    return clearArea(x,y);
  }
}

function rightClick(x,y){
  var argc = arguments.length;
  if(argc==1){
    var {x,y} = x;
  }
  var t = gridGet(x,y);
  if(t==undefined){
    return 'out of bounds';
  }else if(t.visible){
    return 'visible';
  }else{
    flagCount -= t.flagged?1:-1;
    t.flagged = !t.flagged;
    return [{x,y}];
  }
}

function getFlagCount(){
  return flagCount;
}

function getHiddenCount(){
  return hiddenCount;
}

function setString(str){
  var [x,y,str] = str.split(' ');
  init(parseInt(x),parseInt(y));
  for (var i = 0; i < size.x*size.y; i++) {
    var t = linearGet(i);
    var b = charRom.indexOf(str[i]);
    t.value = (b>>3)&0b1111;
    t.flagged = (b>>2)&0b1==1;
    t.visible = (b>>1)&0b1==1;
    t.bomb = (b)&0b1==1;
    if(t.flagged)flagCount++;
    if(t.visible)hiddenCount--;
  }
}

function getString(){
  var r = "";
  for (var i = 0; i < size.x*size.y; i++) {
    var t = linearGet(i);
    var b = t.bomb|t.visible<<1|t.flagged<<2|t.value<<3;
    r += charRom[b];
  }
  r = `${size.x} ${size.y} `+r;
  return r;
}

module.exports = {
  getTile:gridGet,
  init,
  leftClick,
  rightClick,
  spreadBombs,
  getFlagCount,
  getHiddenCount,
  getString,
  setString,
};
