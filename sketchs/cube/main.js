var faces = [];//f,u,l,b,d,r  //f,b,u,d,l,r
var slices = [];//m,e,s
var queue = [];
var animation = {type:1,progress:0,dir:1};
//var animationSpeed = 0.05;
var colors = ['green','white','orange','blue','yellow','red'];
var faceNames = ["F","U","L","B","D","R"];
var cubeSize = 3;//placeholder
var scl = 500/cubeSize/4;//placeholder
var depth = 0;
var isDirty = true;

var tweakables = {
  animationSpeed:0.05,
  cubeSize:3,
  showFPS:true,
  metaStart:true
};

var inputRom = [
  {keys:['O','T'],action:'lib.tweaker.toggleTweakables()'},
  {keys:['D','rightarrow'],action:'run1("y\'")'},
  {keys:['S','downarrow'],action:'run1("x\'")'},
  {keys:['A','leftarrow'],action:'run1("y")'},
  {keys:['W','uparrow'],action:'run1("x")'},
  {keys:['E','pgup'],action:'run1("z")'},
  {keys:['Q','home'],action:'run1("z\'")'},
  {keys:[' '],action:'run1("f")'},
  //{keys:[' '],action:'run("f\'",true);animation = {type:1,progress:1,dir:-1};'},
  {keys:['R'],action:'reset()'}
];

function setup() {
  createCanvas(500,500/4*3)
    .elt.addEventListener('contextmenu', function(ev) { ev.preventDefault();return false; }, false);
  cubeSize = tweakables.cubeSize;
  scl = 500/cubeSize/4;
  init();
  run1("fxf2xf'ulbdryzu'l'b'd'r'x'y'z'u2l2b2d2r2x2y2z2",1);
  reset();
}

function draw() {
  if(!isDirty&&!animation.type)return;
  isDirty = false;
  var animationSpeed = tweakables.animationSpeed;
  push();
  rectMode(RADIUS);
  strokeWeight(.1);
  translate(width/2,height/2);
  scale(scl,scl);
  translate(.5,-(cubeSize-1)/2);
  background(200);
  if(animation.type == 10)animation.type = 1;
  if(animationSpeed > 1){animation.type = 0;advanceQueue();}
  if(animation.type == 11&&animation.img == undefined){
    if(animation.dir == 1){animation = {type:11,progress:1,dir:-1};}
    else{animation = {type:11,progress:0,dir:1};}
    var t = animation.img = createGraphics(scl*cubeSize*4,scl*(cubeSize*2-1));
    t.rectMode(RADIUS);
    t.strokeWeight(.1);
    t.translate(t.width/2,t.height/2);
    t.scale(scl,scl);
    t.translate(.5,-cubeSize*1);
    drawFaces(t);
  }
  if(animation.type == 14&&animation.img == undefined){
    var t = animation.img = createGraphics(scl*cubeSize*4,scl*(cubeSize*2-1));
    t.rectMode(RADIUS);
    t.strokeWeight(.1);
    t.translate(t.width/2,t.height/2);
    t.scale(scl,scl);
    t.translate(.5,1);
    drawFaces(t);
  }
  if(animation.type == 3 || ((animation.type == 11||animation.type == 14)/*&&animation.img*/) ){
    var fs = animation.faces = [{},{},{},{},{},{}];
    fs[4].rot = (animation.progress)*PI/2;
    fs[1].rot = -fs[4].rot;
    fs[4].rot1 = -PI/2*(animation.dir == 1?1:0);
    fs[1].rot1 = PI/2*(animation.dir == 1?1:0);
    fs[1].anchor = [0,cubeSize];
    fs[0].pos = fs[2].pos = fs[3].pos = fs[5].pos = [(animation.progress-1+((animation.dir == 1)?0:1) )*cubeSize,0];
    fs[4].pos = [(animation.progress)*cubeSize,0];
    fs[1].pos = [(animation.progress)*cubeSize,0];
    push();
    translate(cubeSize*((animation.dir == 1)?2:-3),0);
    drawFace(faces[(animation.dir == 1)?3:5]);
    pop();
  }
  if(animation.type == 2){
    var fs = animation.faces = [{},{},{},{},{},{}];
    var _f1 = (animation.dir == 1)?1:4;
    var _f4 = (animation.dir == 1)?4:1;
    fs[5].rot1 = -(animation.progress-1+((animation.dir == 1)?0:1))*PI/2;//PI/2;
    fs[2].rot1 = (animation.progress-1+((animation.dir == 1)?0:1))*PI/2;//-PI/2;
    fs[(animation.dir == 1)?1:3].anchor = fs[2].anchor = [cubeSize,0];
    fs[0].pos = fs[3].pos = fs[_f4].pos = [0,(animation.progress-1+((animation.dir == 1)?0:1))*cubeSize];
    var t1 = (animation.dir==1?1-.5*animation.progress:.5*animation.progress)*cubeSize*2;
    var t2 = cubeSize*(animation.dir != 1?0:1);
    fs[_f1].rot = (animation.progress)*PI;
    fs[_f1].pos = [-t1,t2];
    fs[_f1].rot1 = PI*(animation.dir == 1?1:0);
    fs[3].rot = (animation.progress)*PI;
    fs[3].pos = [t1,t2];
    fs[3].rot1 = PI*(animation.dir == 1?1:0);
  }
  if(animation.type == 13/*&&animation.img*/){
    var fs = animation.faces = [{},{},{},{},{},{}];
    //fs[3].rot1 = (animation.progress-1+((animation.dir == 1)?0:1))*PI/2;
    fs[3].rot = (animation.progress)*PI/2;
    fs[3].rot1 = -PI/2*(animation.dir == 1?1:0);
    fs[3].pos = [0,(animation.progress)*cubeSize];
    fs[3].anchor = [cubeSize,0];
  }
  drawFaces();
  var _1 = (cubeSize-1)/2;
  if(animation.type == 1&&animation.img == undefined){
    var t = animation.img = createGraphics(scl*(cubeSize+2),scl*(cubeSize+2));
    //animation.progress = 0;
    t.rectMode(RADIUS);
    t.strokeWeight(.1);
    t.translate(t.width/2,t.height/2);
    t.scale(scl,scl);
    t.translate(-_1,-_1);
    drawFaces(t);
  }
  if(animation.type == 1){
    push();
    //noStroke();
    rectMode(CORNER);
    fill(200);
    rect(-1.5,-1.5,cubeSize+2,cubeSize+2);
    translate(_1,_1);
    rotate((animation.progress-1+((animation.dir == 1)?0:1))*PI/2);
    translate(-_1,-_1);
    image(animation.img,-1.5,-1.5,cubeSize+2,cubeSize+2);
    pop();
  }
  if(animation.type == 11){
    push();
    rectMode(CORNER);
    fill(200);
    rect(-cubeSize*2-1,.5,cubeSize*4+1,cubeSize*2-1+1);
    image(animation.img,-cubeSize*2-.5,.5,cubeSize*4,cubeSize*2-1);
    pop();
  }
  if(animation.type == 13&&animation.img == undefined){
    var t = animation.img = createGraphics(scl*cubeSize*3,scl*cubeSize*3);
    t.rectMode(RADIUS);
    t.strokeWeight(.1);
    t.translate(t.width/2,t.height/2);
    t.scale(scl,scl);
    t.translate(-_1,-_1);
    drawFaces(t);
    t.drawingContext.clearRect(-cubeSize*2+.5,-cubeSize+.5,cubeSize*3-2,cubeSize*3-2);
  }
  if(animation.type == 13){
    push();
    rectMode(CORNER);
    fill(200);
    noStroke();
    rect(-cubeSize-.5,-cubeSize-.5,1,cubeSize*3);
    rect(-cubeSize-.5,-cubeSize-.5,cubeSize*3,1);
    rect(cubeSize*2-1.5,-cubeSize-.5,1,cubeSize*3);
    rect(-cubeSize-.5,cubeSize*2-1.5,cubeSize*3,1);
    noFill();
    strokeWeight(.1);
    stroke(0);
    rect(-cubeSize-.5,-cubeSize-.5,cubeSize*3,cubeSize*3);
    translate(_1,_1);
    rotate((animation.progress-1+((animation.dir == 1)?0:1))*-PI/2);
    translate(-_1,-_1);
    image(animation.img,-cubeSize-.5,-cubeSize-.5,cubeSize*3,cubeSize*3);
    pop();
  }
  if(animation.type == 14){
    push();
    rectMode(CORNER);
    fill(200);
    rect(-cubeSize*2-.5-1,-cubeSize-.5-1,cubeSize*4+2,cubeSize*2-1);
    image(animation.img,-cubeSize*2-.5,-cubeSize-.5,cubeSize*4,cubeSize*2-1);
    pop();
  }
  if(!animation.dir)animation.dir = 1;
  if((animation.progress >= 1 && animation.dir == 1) || (animation.progress <= 0 && animation.dir == -1)){
    animation = {type:0,progress:0,dir:1};
    advanceQueue();
    isDirty = true;
  }
  if(animation.type)animation.progress+=animationSpeed*animation.dir;
  if(animation.progress > 1 && animation.dir ==  1)animation.progress = 1;
  if(animation.progress < 0 && animation.dir == -1)animation.progress = 0;
  pop();
}

function drawFaces(c) {
  if(c == undefined)c = this;
  push();
  drawFace(faces[0],c);
  c.translate(0,-cubeSize);
  drawFace(faces[1],c);
  c.translate(-cubeSize,cubeSize);
  drawFace(faces[2],c);
  c.translate(-cubeSize,0);
  drawFace(faces[3],c);
  c.translate(cubeSize*2,cubeSize);
  drawFace(faces[4],c);
  c.translate(cubeSize,-cubeSize);
  drawFace(faces[5],c);
  /*c.translate(9,3);
  drawFace(faces[5],c);
  c.translate(3,0);
  drawFace(faces[3],c);
  c.translate(3,0);
  drawFace(faces[2],c);*/
  pop();
}

function drawFace(f,c) {
  if(c == undefined)c = this;
  c.push();
  if(animation.faces){
    var t = animation.faces[f.index];
    if(t.pos)c.translate(t.pos[0],t.pos[1]);  
    if(t.rot){
      if(t.anchor)c.translate(t.anchor[0],t.anchor[1]);
      c.translate(-.5,-.5);
      c.rotate(t.rot);
      if(t.anchor)c.translate(-t.anchor[0],-t.anchor[1]);
      c.translate(.5,.5);
    }
    if(t.pos1)c.translate(t.pos1[0],t.pos1[1]);
    if(t.rot1){
      var _1 = (cubeSize-1)/2;
      c.translate(_1,_1);
      c.rotate(t.rot1);
      c.translate(-_1,-_1);
    }

  }
  for (var x = 0; x < f.length; x++) {
    var t = f[x];
    for (var y = 0; y < t.length; y++) {
      var s = t[y];
      if(typeof s.color == "number"){c.fill(colors[s.color]);}else{c.fill(s.color);}
      c.rect(x,y,.5,.5)
    }
  }
  c.pop();
}

function init(){
  faces = [];
  var _2 = cubeSize-1;
  var rom = ['[x1,y,w]','[x,w,y1]','[w,y,x1]'];
  var rom1 = [];
  for (var i = _2; i >= 0; i--) {
    rom1.push(i);
  }
  for (var i = 0; i < 6; i++) {
    var f = faces[i] = [];
    f.index = i;
    for (var x = 0; x < cubeSize; x++) {
      var t = f[x] = [];
      for (var y = 0; y < cubeSize; y++) {
        var type = 'edge';
        if(x != 0 && y != 0 && x != _2 && y != _2)type = 'center';
        if(( x == _2||x == 0 )&&( y == 0||y == _2 ))type = 'corner';
        var w = floor(i/3)*_2;
        if((w != _2&&i != 0)||i == 3){var x1 = rom1[x];var y1 = rom1[y];}else{var x1 = x;var y1 = y;}
        var c = eval(rom[i%3]);
        t[y] = {color:i,type:type,face:f,faceCoords:[x,y],cubeCoords:c};
      }
    }
  }
  var flat = faces.flatten();
  for (var i = 0; i < faces.length; i++) {
    var f = faces[i];
    for (var x = 0; x < f.length; x++) {
      var t = f[x];
      for (var y = 0; y < t.length; y++) {
        var s = t[y];
        if(s.type == 'center'){s.ref = [];continue;}
        var filter = flat.filter(e => JSON.stringify(e.cubeCoords) == JSON.stringify(s.cubeCoords)&&e != s);
        s.ref = filter.map(e => ({face:e.face,coords:e.faceCoords,thing:e}));
        if(x == _2 && y ==  0 && i == 0)s.ref = s.ref.reverse();
        if(x == _2 && y == _2 && i == 1)s.ref = s.ref.reverse();
        if(x == _2 && y == _2 && i == 2)s.ref = s.ref.reverse();
        if(x ==  0 && y ==  0 && i == 3)s.ref = s.ref.reverse();
        if(x == _2 && y ==  0 && i == 4)s.ref = s.ref.reverse();
        if(x ==  0 && y == _2 && i == 5)s.ref = s.ref.reverse();
      }
    }
  }
  //if(cubeSize == 2)return;
  var rom2 = ['[j+1,x,y]','[x,j+1,y]','[x,y,j+1]'];
  for (var i = 0; i < 3; i++) {
    var sl = slices[i] = [];
    for (var j = 0; j < cubeSize-2; j++) {
      var f = sl[j] = [];
      for (var x = 0; x < cubeSize; x++) {
        var t = f[x] = [];
        for (var y = 0; y < cubeSize; y++) {
          var type = 'edge';
          if(x != 0 && y != 0 && x != _2 && y != _2)type = 'center';
          if(( x == _2||x == 0 )&&( y == 0||y == _2 ))type = 'corner';
          var c = eval(rom2[i]);
          var s = t[y] = {color:-1,cubeCoords:c,type:type};
          var filter = flat.filter(e => JSON.stringify(e.cubeCoords) == JSON.stringify(s.cubeCoords));
          s.ref = filter.map(e => ({face:e.face,coords:e.faceCoords,thing:e}));
          if(x == _2 && y == 0)s.ref = s.ref.reverse();
        }
      }
    }
  }
}

function highlight(x,y,z){
  var filter = faces.flatten().filter(e => e.cubeCoords[0]==x&&e.cubeCoords[1]==y&&e.cubeCoords[2]==z);
  filter.map(e => e.color = 'purple');
}

var faceSliceRom = [[2,1,1],[1,1,3],[0,1,1],[2,-1,3],[1,-1,1],[0,-1,3]];
function rotateFace(index,ignoreDepth){
  if(index < 6){
    rotateFace1(faces[index]);
    if(depth && !ignoreDepth){
      if(depth>cubeSize-2)throw 'too much depth';
      var rom = faceSliceRom;
      var t = rom[index];
      var i = 0;
      var i1 = t[1]>0?0:cubeSize-3;
      while(i < depth){
        i++;
        var t1 = slices[t[0]][i1];
        rotateFace1(t1);
        if(t[2]==3){rotateFace1(t1);rotateFace1(t1);}
        i1 += t[1];
      }
    }
  }else{
    var t = slices[index-6];
    t.map(rotateFace1);
  }
}

function rotateFace1(face){
  isDirty = true;
  var f = face;
  var flat = f.flatten();
  var rom = getRotationRom();
  for (var i = 0; i < flat.length; i++) {
    flat[i].color1 = flat[rom[i]].color;
    for (var j = 0; j < flat[i].ref.length; j++) {
      flat[i].ref[j].thing.color1 = flat[rom[i]].ref[j].thing.color;
    }
  }
  faces.flatten().map(e => (e.color1 != undefined)?e.color = e.color1:'');
}

function getRotationRom(){
  var r = [];
  for (var i = 0; i < cubeSize; i++) {
    var t = r[i] = [];
    for (var j = 0; j < cubeSize; j++) {
      t[j] = i+j*cubeSize;
    }
  }
  return r.reverse().flatten();
}

function serialize(){
  var r = [];
  for (var i = 0; i < 6; i++) {
    var f = r[i] = [];
    for (var x = 0; x < cubeSize; x++) {
      var t = f[x] = [];
      for (var y = 0; y < cubeSize; y++) {
        t[y] = faces[i][x][y].color;
      }
    }
  }
  return JSON.stringify(r);
}

var dictionary = {
  '_1':e => {rotateFace(0);animation.type = 1;},  
  '_2':e => {rotateFace(6,true);rotateFace(2,true);rotateFace(5,true);rotateFace(5,true);rotateFace(5,true);animation.type = 2;},
  '_3':e => {rotateFace(7,true);rotateFace(4,true);rotateFace(1,true);rotateFace(1,true);rotateFace(1,true);animation.type = 3;},
  'F':"_1",
  "'F":'FFF',
  "2F":"FF",
  "'X":"_2",
  "X":"X'X'X'",
  "2X":"X'X'",
  "'Y":"_3",
  "Y":"Y'Y'Y'",
  "2Y":"Y'Y'",
  "'Z":"Y'X'Y",
  "Z":"X'Y'X",
  "2Z":"X2Y2",
  "U":"X'FX",
  "'U":"UUU",
  "2U":"UU",
  "D":"XFX'",
  "'D":"DDD",
  "2D":"DD",
  "L":"Y'FY",
  "'L":"LLL",
  "2L":"LL",
  "R":"YFY'",
  "'R":"RRR",
  "2R":"RR",
  "B":"X2FX2",
  "'B":"BBB",
  "2B":"BB",
  "M":"L'RX'",
  "'M":"LR'X",
  "2M":"MM",
  "E":"D'UY'",
  "'E":"DU'Y",
  "2E":"EE",
  "S":"F'BZ",
  "'S":"FB'Z'",
  "2S":"SS"
};

var dictionary2 = {
  "F2":e => {rotateFace(0);rotateFace(0);animation = {type:10,progress:-1,dir:1};},
  "X'":e => parse("x\'").map(a => a()),
  "X":e => {parse("x").map(a => a());animation = {type:2,progress:1,dir:-1};},
  "X2":e => {parse("x").map(a => a());animation = {type:2,progress:1,dir:-1};queue.unshift(dictionary2.X)},
  "Y'":e => parse("y\'").map(a => a()),
  "Y":e => {parse("y").map(a => a());animation = {type:3,progress:1,dir:-1};},
  "Y2":e => {parse("y").map(a => a());animation = {type:3,progress:1,dir:-1};queue.unshift(dictionary2.Y)},
  "Z":e => {parse("z").map(a => a());animation = {type:4,progress:0,dir:1};},
  "Z'":e => {parse("z\'").map(a => a());animation = {type:4,progress:1,dir:-1};},
  "Z2":e => {parse("z").map(a => a());animation = {type:4,progress:0,dir:1};queue.unshift(dictionary2.Z)}/*,
  "R":e => {dictionary2.Y();queue.unshift(e => {dictionary2.F();queue.unshift(dictionary2["Y'"])})},
  "R2":e => {dictionary2.Y();queue.unshift(e => {dictionary2["F2"]();queue.unshift(dictionary2["Y'"])})},
  "R'":e => {dictionary2.Y();queue.unshift(e => {dictionary2["F'"]();queue.unshift(dictionary2["Y'"])})},
  "L":e => {dictionary2["Y'"]();queue.unshift(e => {dictionary2.F();queue.unshift(dictionary2["Y"])})},
  "L2":e => {dictionary2["Y'"]();queue.unshift(e => {dictionary2["F2"]();queue.unshift(dictionary2["Y"])})},
  "L'":e => {dictionary2["Y'"]();queue.unshift(e => {dictionary2["F'"]();queue.unshift(dictionary2["Y"])})}*/
};

var moveList = ["F","F2","F'","U","U2","U'","D","D2","D'","L","L2","L'","R","R2","R'","B","B2","B'","M","M2","M'","S","S2","S'","E","E2","E'","X","X2","X'","Y","Y2","Y'","Z","Z2","Z'"];

function parse(string){
  string = string.toUpperCase();
  string = string.replace(/\`/g,"'");
  string = string.replace(/([^'0-9\_])(['0-9])/g,function(){return arguments[2]+arguments[1];});
  string = string.replace(/ /g,"");
  var r = [];
  var buffer = '';
  for (var i = 0; i < string.length; i++) {
    buffer += string[i];
    var t = dictionary[buffer];
    if(!t)continue;
    buffer = '';
    if(typeof t == "function"){r.push(t);}else{r = r.concat(parse(t));}
  }
  return simplify(r);
}

function run(string,instant){
  if(typeof string == "string"){queue = parse(string);}else{queue = string;}
  advanceQueue(instant);
  //arr.map(e => e());
}

function parse1(string){
  string = string.toUpperCase();
  string = string.replace(/\`/g,"'");
  var arr = string.match(/[FUDLRBMSEXYZ]W?[2\']?/g);
  return simplify1(arr);
}

function simplify1(arr){
  if(typeof arr == "string")arr = parse1(arr);
  var rom = moveList;
  var str = arr.map(e => rom.indexOf(e).toString(36)).join("");
  if(str.length != arr.length)throw '122';
  var str1 = str;
  str1 = str1.replace(/([2582ehknqtwz])/g,function(){
    return (parseInt(arguments[1],36)-2).toString(36).repeat(3);
  });
  str1 = str1.replace(/([1471dgjmpsvy])/g,function(){
    return (parseInt(arguments[1],36)-1).toString(36).repeat(2);
  });
  str1 = str1.replace(/(.)\1\1\1/g,"");//[0360cfilorux]
  str1 = str1.replace(/(0+)(f+)(0+)/g,function(a,b,c,d){return b+d+c;});
  str1 = str1.replace(/(f+)(0+)(f+)/g,function(a,b,c,d){return b+d+c;});
  str1 = str1.replace(/(3+)(6+)(3+)/g,function(a,b,c,d){return b+d+c;});
  str1 = str1.replace(/(6+)(3+)(6+)/g,function(a,b,c,d){return b+d+c;});
  str1 = str1.replace(/(9+)(c+)(9+)/g,function(a,b,c,d){return b+d+c;});
  str1 = str1.replace(/(c+)(9+)(c+)/g,function(a,b,c,d){return b+d+c;});

  if(str1 != str)return simplify1(str1.split("").map(e => rom[parseInt(e,36)]));
  str1 = str1.replace(/([0360cfilorux])\1\1/g,function(){
    return (parseInt(arguments[1],36)+2).toString(36);
  });
  str1 = str1.replace(/([^1471dgjmpsvy])\1/g,function(){
    var i = parseInt(arguments[1],36);
    if(i%3 == 0)return (i+1).toString(36);
    if(i%3 == 2)return (i-1).toString(36);
    if(i%3 == 1)throw '1224';
  });
  str1 = str1.replace(/(.)\1\1\1/g,"");
  str1 = str1.replace(/([1471dgjmpsvy])\1/g,"");

  return str1.split("").map(e => rom[parseInt(e,36)]);
} 

function run1(string,instant){
  advanceQueue(1);
  animation.type = 0;
  if(typeof string == "string"){queue = parse1(string);}else{queue = string;}
  queue = queue.map(map1);
  advanceQueue(instant);
  //arr.map(e => e());
}

function map1(str){
  if(dictionary2[str])return dictionary2[str];
  var i = faceNames.indexOf(str[0]);
  var s;
  if(str[1] == undefined)
    s = "rotateFace({0});animation = {type:{0}+10,progress:0,dir:1};".format(i);
  if(str[1] == '2')
    //s = "rotateFace({0});rotateFace({0});animation = {type:{0}+10,progress:-1,dir:1};".format(i);
    s = "rotateFace({0});animation = {type:{0}+10,progress:0,dir:1};queue.unshift(e => {rotateFace({0});animation = {type:{0}+10,progress:0,dir:1};})".format(i);
  if(str[1] == "'")
    s = "rotateFace({0});rotateFace({0});rotateFace({0});animation = {type:{0}+10,progress:1,dir:-1};".format(i);
  return dictionary2[str] = new Function(s);
}

function advanceQueue(all){
  //if(all){queue.map(e => e());queue = [];return;}
  if(queue.length == 0)return;
  queue.shift()(all);
  if(tweakables.animationSpeed>1||all)advanceQueue(all);
}

function reset(str){
  isDirty = true;
  for (var i = 0; i < faces.length; i++) {
    var f = faces[i];
    for (var x = 0; x < f.length; x++) {
      var t = f[x];
      for (var y = 0; y < t.length; y++) {
        var s = t[y];
        s.color1 = s.color = f.index;
      }
    }
  }
  if(str)run(str);
}

function randomQueue(length){
  var r = [];
  var rom = ["_1","_2","_3"].map(e => dictionary[e]);
  var rom1 = [];
  for (var i = 0; i <= cubeSize/2-1; i++) {
    rom1.push(i);
  }
  var f = (all) => {depth = random(rom1);advanceQueue(all);}; 
  for (var i = 0; i < length; i++) {
    r.push(random(rom));
    if(cubeSize > 3)r.push(f);
  }
  return /*simplify*/(r);
}

function shuffleCube(n){
  run(randomQueue(n));
}

function simplify(arr){
  var array = $.map(dictionary, function(value, index) {
    return [value];
  });
  var str1 = arr.map(e => array.indexOf(e)).join("");
  var str = str1.replace(/0000/g,"");
  str = str.replace(/1111/g,"");
  str = str.replace(/2222/g,"");
  if(str1 == str)return str.split("").map(e => array[parseInt(e)]);
  return simplify(str.split("").map(e => array[parseInt(e)]));
}

function reverseCube(arr){
  if(typeof arr == "string")arr = parse(arr);
  return simplify(arr.reverse().map(e => [e,e,e]).flatten());
}

function reverse1(arr){
  if(typeof arr == "string")arr = parse1(arr);
  return simplify1(arr.reverse().map(e => [e,e,e]).flatten());
}

function getMousePos(){
  var v = createVector(mouseX,mouseY);
  v.sub(width/2,height/2);
  v.div(scl,scl);
  v.sub(.5,-(cubeSize-1)/2);
  return v;
}

function getHighlightedFace(){
  var rom = {
    "0,0":0,
    "0,-1":1,
    "-1,0":2,
    "-2,0":3,
    "0,1":4,
    "1,0":5
  };
  var pos = getMousePos();
  pos.add(.5,.5);
  pos.div(cubeSize);
  pos.floor();
  var str = pos.x+","+pos.y;
  return faces[rom[str]];
}

function getHighlightedSticker(){
  var face = getHighlightedFace();
  if(face == undefined)return face;
  var pos = getMousePos();
  pos.add(.5,.5);
  pos = pos.map(e => modulo(e,cubeSize) );
  pos.floor();
  return face[pos.x][pos.y];
} 

var mousePressedPos = {};

function mousePressed(){
  mousePressedPos = createVector(mouseX,mouseY);
}

function mouseReleased(){
  isDirty = true;
  if(mousePressedPos.x != mouseX||mousePressedPos.y != mouseY){
    drag();
  }else{
    click();
  }
}

function click(){
  var s = getHighlightedSticker();
  if(s == undefined)return;
  if(s.type != 'center')return;
  fancyRotate(s.face,mouseButton == RIGHT);
}

function fancyRotate(face,ccw){
  if(typeof face == "number")face = faces[face];
  var t = faceNames[face.index]
  if(ccw)t += "'";
  run1(t);
}

function drag(){
  var delta = mousePressedPos.copy().sub(mouseX,mouseY);
  var dir = vectorToDir(delta);
  mouseX = mousePressedPos.x;
  mouseY = mousePressedPos.y;
  var s = getHighlightedSticker();
  if(s == undefined)return;
  if(s.type == 'edge'){
    var d = edgeRotation(s,dir);
    if(!d.d){
      edgeRotationS(s,dir);
    }
  }else if(s.type == 'corner'){
    var v = dirToVector(dir);
    var p = createVector.apply(0,s.faceCoords).add(v).map(e => modulo(e,cubeSize));
    var s1 = s.face[p.x][p.y];
    if(cubeSize == 2){
      var f = a => a.ref.map(e => e.face.index).sort();
      var t = intersect(f(s),f(s1));
      if(t.length != 1)throw 'hihu';
      var face = faces[t[0]];
      var b = 
          (t[0]==0&&(s.face.index==4||s.face.index==5))
        ||(t[0]==3&&(s.face.index==1||s.face.index==2))
        ||(t[0]==2&&(s.face.index==0||s.face.index==4));
      edgeRotation(s1,dir,face,b);
    }else if(s1.type == 'edge'){
      edgeRotation(s1,dir);
    }else if(s1.type == 'corner'){
      p = createVector.apply(0,s1.faceCoords).add(v).map(e => modulo(e,cubeSize));
      s1 = s.face[p.x][p.y];
      if(s1.type == 'edge'){
        edgeRotation(s1,dir);
      }else{throw 'haha';}
    }else{throw 'haha';}
  }else if(s.type == 'center'){
    var v = dirToVector(dir);var p;var s1 = s;
    do{
      p = createVector.apply(0,s1.faceCoords).add(v).map(e => modulo(e,cubeSize));
      s1 = s.face[p.x][p.y];
    }while(s1.type != 'edge')
    edgeRotationS(s1,dir);
  }
}

function edgeRotationS(s,dir){
  var dt;
  var _2 = cubeSize-1;
  if(s.faceCoords.includes(0))dt = s.faceCoords.indexOf(0);
  if(s.faceCoords.includes(_2))dt = s.faceCoords.indexOf(_2);
  var rom = faceSliceRom;
  var sl1 = rom[s.face.index][0];
  var sl2 = rom[s.ref[0].face.index][0];
  if(sl1 == sl2)throw 'thing';
  var t = [0,1,2];
  t.remove(sl1);
  t.remove(sl2);
  var c = s.faceCoords[dt^1]-1;
  if(s.face.index == 1||s.face.index == 2||s.face.index == 3)
    c = cubeSize-3-c;
  var sl = slices[t[0]][c];
  if(sl == undefined)throw 'ball';
  rotateFace1(sl);
  if(floor(dir/2)^(t[0]==0&&s.face.index!=3)^(t[0]==2&&(s.face.index==4||s.face.index==5))){
    rotateFace1(sl);
    rotateFace1(sl);
  }
}

function edgeRotation(s,dir,face,bool){
  if(s == undefined)throw "hihi";
  if(s.type != 'edge'&&face == undefined)throw "hihi";
  var _1 = (cubeSize-1)/2;
  var d = vectorToDir(createVector.apply(0,s.faceCoords).add(-_1,-_1));
  var t;
  var _2 = cubeSize-1;
  if(s.faceCoords.includes(0))t = s.faceCoords.indexOf(0);
  if(s.faceCoords.includes(_2))t = s.faceCoords.indexOf(_2);
  if(d%2 != dir%2||face){
    var t1 = (bool)?0:1;
    if(face&&face.index != 1)t1 ^= 1; 
    fancyRotate(face||s.ref[0].face,floor(dir/2)^floor(s.faceCoords[t]/_2)^t1);
  }
  return {d:d%2 != dir%2,t:t};    
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

var dirToVectorRom = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
function dirToVector(dir){
  var t = dirToVectorRom[dir];
  return createVector(t.x,t.y);
}

function intersect(a, b){
  var ai=0, bi=0;
  var result = [];
  while( ai < a.length && bi < b.length ){
     if      (a[ai] < b[bi] ){ ai++; }
     else if (a[ai] > b[bi] ){ bi++; }
     else /* they're equal */{
       result.push(a[ai]);
       ai++;
       bi++;
     }
  }
  return result;
}

/*Algorithms
  torus:m s' m' s
  edge cycle:R U' R U R U R U' R' U' R2
  corner swap:R F U' R2 U F' R U F2 R2
*/
