const Color = require("./color.js");

const boxChars = [
  ' ',//0
  '╵',//1
  '╶',//2
  '└',//3
  '╷',//4
  '│',//5
  '┌',//6
  '├',//7
  '╴',//8
  '┘',//9
  '─',//10
  '┴',//11
  '┐',//12
  '┤',//13
  '┬',//14
  '┼' //15
];

var api;

function init(_api){
  api = _api;
}

function addBoxChars(a,b){
  var ia = boxChars.indexOf(a);
  var ib = boxChars.indexOf(b);
  if(ia==-1)ia = 0;
  if(ib==-1)ib = 0;
  var ir = ia|ib;
  return boxChars[ir];
}

function getCursorString(x,y){
  return `\x1b[${y};${x}H`;
}

class Box{
  constructor(minx,miny,maxx,maxy){
    var argc = arguments.length;
    if(argc==2){
      var {x:maxx,y:maxy} = miny;
      var {x:minx,y:miny} = minx;
    }
    if(maxx<minx)[maxx,minx] = [minx,maxx];
    if(maxy<miny)[maxy,miny] = [miny,maxy];
    this.minx = minx;
    this.miny = miny;
    this.maxx = maxx;
    this.maxy = maxy;
  }
  draw(color=api.getColor(),background=null){
    var lines = [];
    var {minx,miny,maxx,maxy} = this;
    var gx = maxx-minx;
    var gy = maxy-miny;
    for(var i = 0; i < gy+1; i++){
      var t = "";
      for(var j = 0; j < gx+1; j++){
        var c = api.read(minx+j,miny+i);
        if(i==0&&j==0)c = addBoxChars(c,boxChars[6]);
        else if(i==0&&j==gx)c = addBoxChars(c,boxChars[12]);
        else if(i==gy&&j==0)c = addBoxChars(c,boxChars[3]);
        else if(i==gy&&j==gx)c = addBoxChars(c,boxChars[9]);
        else if(i==0||i==gy)c = addBoxChars(c,boxChars[10]);
        else if(j==0||j==gx)c = addBoxChars(c,boxChars[5]);
        else if(background)c = background;
        t += c;
      }
      lines.push(t);
    }
    for(var i = 0; i < lines.length; i++){
      api.write(lines[i],minx,miny+i,color);
    }
  }
  toAnsiCode(){
    var {minx,miny,maxx,maxy} = this;
    var r = "";
    var gx = maxx-minx-1;
    var gy = maxy-miny;
    r += getCursorString(minx,miny)+boxChars[6];
    r += boxChars[10].repeat(gx);
    r += boxChars[12];
    for(var i = 1; i < gy; i++){
      r += getCursorString(minx,miny+i)+boxChars[5];
      if(gx)r += `\x1b[${gx}C`;
      r += boxChars[5];
    }
    r += getCursorString(minx,maxy)+boxChars[3];
    r += boxChars[10].repeat(gx);
    r += boxChars[9];
    return r;
  }
}

const Box_public = new Proxy(Box, {
  // target = Box
  apply (target, thisArg, argumentsList) {
    return new target(...argumentsList);
  },
  construct (target, argumentsList) {
    return new target(...argumentsList);
  }
});

module.exports = {init,Box:Box_public};
