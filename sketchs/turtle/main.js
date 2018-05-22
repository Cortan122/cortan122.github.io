var bounds = [-.1,-.1,.1,.1];//[minx,miny,maxx,maxy]
var isDirty = true;
var examples = undefined;
const inlineTextarea = false;
var system = undefined;

var tweakables = {
  backgroundColor:"#666",
  fillColor:"none",
  strokeColor:"red",
  strokeWeight:1,
  spacing:10,
  templateName:"random",
  niceScaling:true,
  cacheFrames:true,
  showFPS:true,
  metaStart:true
};

var inputRom = [
  {keys:['O','T'],action:'lib.tweaker.toggleTweakables()'},
  {keys:['Enter'],action:'updateCode()'}
];

function setup(){
  createCanvas(500, 500);
  $.ajax("examples.json").done(e => {examples = e;updateCode()});
  updateCode();
  $('body').append("<textarea></textarea>");
  var b = $('<button value="undefined" id="runButton">run</button>');
  b.on('click',updateCode);
  $('body').append(b)
  $(window).on('resize',e => updateTextarea());
  $('#pDiv').on('resize',e => updateTextarea());
  var f1 = e => {if(e.keyCode==13&&e.shiftKey){updateCode();return false;}};
  $("textarea").keydown(f1);
  lib.tweaker.events.push(updateTextarea);
  lib.tweaker.events.push(e=>{
    if(e=="strokeWeight"||e=="strokeColor"||e=="fillColor"||e=="backgroundColor")isDirty=true;
    if(e=="spacing"||e=="niceScaling"){system.lines=undefined;isDirty=true;}
  });
  updateTextarea();
}

function updateTextarea(name){
  if(name!="inlineTextarea"&&name!="isTweakablesShown"&&name!=undefined)return;
  if(inlineTextarea){
    var t = width;
    if(lib.tweaker.isTweakablesShown){
      t += $('#pDiv').outerWidth()+17;
    }
    $('textarea').css({top: 0, left: t, position:'absolute'});
    $('textarea').outerHeight(windowHeight);
    $('textarea').outerWidth(windowWidth-t);
    $('#runButton').css({bottom: 0, right: 0, position:'absolute',"z-index":1});
  }else{
    $('textarea').css({position:'relative',top: 0, left: 0});
    $('textarea').outerHeight(windowHeight-height);
    $('textarea').outerWidth(width);
    $('#runButton').css({bottom: 0, right: windowWidth-width, position:'absolute',"z-index":1});
  }
}

function updateCode(){
  var str = $('textarea').val();
  if(str==undefined||str==''){
    if(examples == undefined)return;
    if(tweakables.templateName=="random"||tweakables.templateName==undefined){
      var keys = Object.keys(examples);
      var key = random(keys);
    }else{
      key = tweakables.templateName;
    }
    str = examples[key].code;
    $('textarea').val(str);
  }
  makeSystem(str);
  isDirty = true; 
}

function makeSystem(str){
  system = {rules:{},angle:90,draw:[],initIterations:0,iteration:0};
  str = str.replace(/(\/\/)([^\n])*/g,"");//remove comments
  str = str.replace(/\n/g,";");
  str = str.replace(/ /g,"");
  str = str.replace(/−/g,"-");
  str = str.replace(/\r/g,"");
  str = str.replace(/;+/g,";");
  var arr = str.split(';');
  for (var i = 0; i < arr.length; i++) {
    var line = arr[i];
    if(line.includes("=")){
      var a = line.split("=");
      if(a.length != 2||line.includes(":")){
        console.error("error on line "+i);
        continue;
      }
      if(a[0]=="angle"){
        system.angle = radians(parseInt(a[1]));
      }else if(a[0]=="start"){
        system.start = a[1];
      }else if(a[0]=="draw"){
        system.draw.push(a[1]);
      }else if(a[0]=="i"){
        system.initIterations = parseInt(a[1]);
      }else{
        console.error("error on line "+i);
        continue;
      }
    }else if(line.includes(":")){
      var a = line.split(":");
      if(a.length != 2||line.includes("=")||a.join('').match(/[\/:=]/g)){
        console.error("error on line "+i);
        continue;
      }
      system.rules[a[0]] = a[1];
    }
  }
  if(system.draw.length==0){
    system.draw = ['f'];
  }
  if(system.start==undefined){
    system.start = system.draw[0];
  }
  system.state = system.start;
  testTime(()=>iterate(system.initIterations),"iterate");
}

function iterate(n){
  if(n!==undefined){
    for (var i = 0; i < n; i++) {
      iterate();
    }
    return;
  }
  var r = "";
  var s = system.state/*.split('')*/;
  var dic = system.rules;
  for (var i = 0; i < s.length; i++) {
    var c = s[i];
    var t = dic[c];
    if(t==undefined){
      r += c;
    }else{
      r += t;
    }
  }
  system.iteration++;
  system.state = r;
  system.lines = undefined;
}

function makeLines(){
  var a = system;
  bounds = [-0,-0,0,0];
  a.lines = [];
  var pos = createVector(0,0);
  var angle = 0;
  var vel = p5.Vector.fromAngle(angle);
  var str = a.state;
  var draw = a.draw;
  var temp = [];
  var stack = [];
  for (var i = 0; i < str.length; i++) {
    var c = str[i];
    if(draw.includes(c)){
      temp.push(pos.copy());
      pos.add(vel);
      bounds[0] = min(pos.x,bounds[0]);
      bounds[1] = min(pos.y,bounds[1]);
      bounds[2] = max(pos.x,bounds[2]);
      bounds[3] = max(pos.y,bounds[3]);
    }else if(c == "+"){
      angle = modulo(angle+a.angle,PI*2);
      vel = p5.Vector.fromAngle(angle);
    }else if(c == "-"){
      angle = modulo(angle-a.angle,PI*2);
      vel = p5.Vector.fromAngle(angle);
    }else if(c == "["){
      stack.push([pos.copy(),angle]);
    }else if(c == "]"){
      var t = stack.pop();
      temp.push(pos);
      a.lines.push(temp);
      temp = [];
      pos = t[0];
      angle = t[1];
      vel = p5.Vector.fromAngle(angle);
    }
  }
  if(tweakables.niceScaling){
    var dx = bounds[2]-bounds[0];
    var dy = bounds[3]-bounds[1];
    var d = abs(dx-dy);
    if(dx>dy){
      bounds[3] += d;
      bounds[1] -= d;
    }else if(dx<dy){
      bounds[2] += d;
      bounds[0] -= d;
    }
  }

  if(temp.length){
    temp.push(pos);
    a.lines.push(temp);
  }
  var sp = tweakables.spacing;
  a.lines.forEach(e => e.forEach(a => {
    a.x = map(a.x,bounds[0],bounds[2],sp,width-sp);
    a.y = map(a.y,bounds[1],bounds[3],sp,height-sp);
  }));
}

function draw(){
  if(!isDirty&&tweakables.cacheFrames)return;
  isDirty = false;
  if(system == undefined)return;
  background(tweakables.backgroundColor);
  if(system.lines==undefined){
    testTime(()=>makeLines(),"makeLines");
    isDirty = true;
    return;
  }
  push();
  var fc = tweakables.fillColor;
  var doFill = !(fc == "none" || fc == "transparent" || fc == "");
  if(doFill){
    fill(fc);
  }else{
    noFill();
  }
  strokeWeight(tweakables.strokeWeight);
  stroke(tweakables.strokeColor);
  strokeJoin(MITER);

  testTime(()=>drawLines(system.lines,doFill),"drawLines");

  pop();
}

function drawLines(arr,doFill){
  var ctx = drawingContext;
  ctx.beginPath();
  for (var j = 0; j < arr.length; j++) {
    var line = arr[j];
    ctx.moveTo(line[0].x,line[0].y)
    for (var i = 1; i < line.length; i++) {
      ctx.lineTo(line[i].x,line[i].y);
    }
  }
  ctx.stroke();
  if(doFill)ctx.fill();
  ctx.closePath();
}

function testTime(func,str){
  var time = (new Date).getTime();
  func();
  var time1 = (new Date).getTime();

  print('{1} took {0} ms'.format(time1-time,str));
}
