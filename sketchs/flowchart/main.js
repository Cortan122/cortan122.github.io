const colorRom = {
  jmp :'var(--color_0)',
  jmpt:'var(--color_1)',
  jmpf:'var(--color_2)',
  fall:'var(--color_3)',
};

var tweakables = {
  filename:'example.json',
  colors:'blue green red #f90',
  layoutType:'vertical',
  buttonBoard:true,
  oneAnchorStrip:true,
  randomScatter:false,
};

var inputRom = [
  {keys:['<','left'],action:'changeFunctionGroup(-1)',description:'<'},
  {keys:['R','up'],action:'changeFunctionGroup(0)',description:'All'},
  {keys:['>','right'],action:'changeFunctionGroup(1)',description:'>'},
  {keys:['O','T'],action:'lib.tweaker.toggleTweakables()',description:'Toggle Tweakables'},
  {keys:['f10'],action:'takeScreenshot()',description:'Screenshot'}
];

const preferVerticalOrientation = true;//is irrelevant because of lib mod at line 904
const randomScatterRange = [-5,5];

Object.defineProperty(this, "useSingularAnchorStrip", {
  get:()=>tweakables.oneAnchorStrip
});
Object.defineProperty(this, "useRandomScatter", {
  get:()=>tweakables.randomScatter
});
Object.defineProperty(this, "useSmartLayout", {
  get:()=>tweakables.layoutType!='dumb'
});

var sourceData;
var globalHtmlsCache;
var currentFunction = 0;
var showAllGroups = true; 
var isTouching = false;
var globalPositionOffset = {x:0,y:0};

function changeFunctionGroup(dir){
  if(dir==undefined){
    dir = 0;
  }else{
    showAllGroups = dir==0;
  }
  if(showAllGroups){
    if(tweakables.layoutType=='layered'){
      relayout();
    }else if(tweakables.layoutType=='horizontal'){
      layoutHorizontal();
    }else if(tweakables.layoutType=='vertical'){
      layoutVertical();
    }
    $('#statusDiv').html('Everything');
    return;
  }
  currentFunction = modulo(currentFunction+dir,sourceData.groups.length);
  relayout(currentFunction);
  $('#statusDiv').html(`func №${currentFunction}`);
}

function getTweakableColor(i){
  return tweakables.colors.split(' ')[i];
  //return `var(--color_${i})`;
}

function updateColors(){
  var rcss = $('#rootCSS');
  if(rcss.length==0)rcss = $('<style id="rootCSS"></style>').appendTo('head');
  var num = Object.keys(colorRom).length; 
  rcss.html(`:root {
    ${Array(num).fill(0).map((e,i)=>`--color_${i}:${getTweakableColor(i)};`).join('\n')} 
  }`);
}

function setup(){
  noCanvas();
  noLoop();
  $('#pDiv').detach().appendTo('#menu');
  $('#buttonBoard').find('button').slice(0,3)
    .detach().appendTo($('<div></div>').prependTo('#buttonBoard'))
    .css({display:'inline',width:'33.333%'});
  $('<div id="statusDiv"></div>').prependTo('#buttonBoard').html('Everything');
  lib.tweaker.makeEnum("layoutType",['dumb','layered','horizontal','vertical']);
  lib.tweaker.events.push(a=>{
    if(a!='colors')return;
    updateColors();
  });
  updateColors();
  lib.tweaker.events.push(a=>{
    if(a=='layoutType'||a=='randomScatter')changeFunctionGroup();
    else if(a=='oneAnchorStrip'||a=='filename')resetFilename(a=='filename');
  });
  resetFilename();
}

function syncajax(remote_url){
  return $.ajax({
    type: "GET",
    url: remote_url,
    async: false
  }).responseText;
}

function pushCSS(text){
  $('style').eq(0).append(text);
}

function makeConnectors(connections){
  var canvas = $('#mainCanvas');
  for (var i = 0; i < connections.length; i++) {
    var con = connections[i];
    var tstr = preferVerticalOrientation?'vertical_start vertical_end':'down_start down_end';
    var html = $(`
      <div class="connector ${con.s} ${con.d} ${tstr}">
        <img src="lib/arrow.gif" class="connector-end" style="background-color:${con.c};">
      </div>
    `);
    canvas.append(html);
    pushCSS(`.connector.${con.s}.${con.d}{background-color: ${con.c};}`);
  }
}

function makeAnchors(topAnchors,bottomAnchors,htmls){
  for (var i = 0; i < htmls.length; i++) {
    var html = htmls[i];
    var strip1 = $(`
      <div class="anchorStrip top">
        ${Array(topAnchors[i]).fill().map((e,ii)=>
          `<div id="block_${i}_top_anchor_${ii}" class="block anchor">1</div>`
          ).join('\n')}
      </div>
    `);
    var strip2 = $(`
      <div class="anchorStrip bottom">
        ${Array(bottomAnchors[i]).fill().map((e,ii)=>
          `<div id="block_${i}_bottom_anchor_${ii}" class="block anchor">1</div>`
          ).join('\n')}
      </div>
    `);
    if(useSingularAnchorStrip){
      strip1.append(strip2.children());
    }else
      html.append(strip2);
    html.append(strip1);
  }
}

function analyzeData(data=sourceData){
  var groups = Array(data.length).fill().map((e,i)=>i);
  var layers = Array(data.length).fill(Infinity);
  data.map(e=>e.in=[]);
  for (var i = 0; i < data.length; i++) {
    var o = data[i];
    o.out.map(e=>{
      data[e.v].in.push({v:i,t:e.t});
    });
    o.i = i;
  }
  var startpoints = data.filter(e=>e.in.length==0);
  var rfunc = (i,l,g)=>{
    var o = data[i];
    var oldg = groups[i];
    if(oldg!=g){
      groups = groups.map(e=>e==oldg?g:e);
    }
    if(layers[i]<=l)return;
    layers[i] = l;
    o.out.map(e=>rfunc(e.v,l+1,g));
  };
  startpoints.map(e=>rfunc(e.i,0,e.i));
  var unique = [...new Set(groups)];
  groups = groups.map(e=>unique.indexOf(e));
  var layerChildren = [];
  layers.map((e,i)=>{
    data[i].layer = e;
    var l = layerChildren[e];
    if(l==undefined)l = layerChildren[e] = [];
    l.push(i);
  });
  var groupChildren = [];
  groups.map((e,i)=>{
    data[i].group = e;
    var l = groupChildren[e];
    if(l==undefined)l = groupChildren[e] = [];
    l.push(i);
  });
  data.layers = layers = layerChildren.map(e=>e.sort((a,b)=>groups[a]-groups[b]));
  data.groups = groups = groupChildren;
  return {groups,layers};
}

function smartLayout(htmls,canvas=getCanvas()){
  var ldivs = [];
  var {layers,groups} = sourceData;
  var grom = htmls.map(e=>e.parent()[0]!=canvas[0]);
  layers.map((layer,i)=>{
    var ldiv = $(`<div id="layer_${i}" class="layoutlayer"></div>`);
    ldivs.push(ldiv);
    canvas.append(ldiv);
    layer.map(e=>{
      var html = htmls[e];
      if(grom[e])return;
      html.detach().appendTo(ldiv);
      layoutSingleElement(html);
    });
  });
  htmls.map((e,i)=>{
    if(grom[i])return;
    e.detach().appendTo(canvas);
  });
  ldivs.map(e=>e.remove());
}

function elementPositionHelper(html,margin=true,border=false,padding=false){
  var pos = html.position();
  if(margin)pos.top += parseInt(html.css('marginTop'));
  if(margin)pos.left += parseInt(html.css('marginLeft'));
  if(border)pos.top += parseInt(html.css('borderTop'));
  if(border)pos.left += parseInt(html.css('borderLeft'));
  if(padding)pos.top += parseInt(html.css('paddingTop'));
  if(padding)pos.left += parseInt(html.css('paddingLeft'));
  if(useRandomScatter){
    pos.top += floor(random(...randomScatterRange));
    //pos.left += floor(random(...randomScatterRange));
  }
  pos.top += globalPositionOffset.y;
  pos.left += globalPositionOffset.x;
  return pos;
}

function layoutSingleElement(html){
  html.addClass('layouttemp');
  html.css({top:'auto',left:'auto'});
  html.css(elementPositionHelper(html));
}

function layout(htmls,group=undefined){
  if(group!=undefined){
    var data = sourceData;
    htmls.map((e,i)=>{
      if(data[i].group!=group){
        e.detach();
      }
    });
  }
  if(useSmartLayout){
    smartLayout(htmls);
  }else{
    for (var i = 0; i < htmls.length; i++) {
      var html = htmls[i];
      if(!html.parent().length)continue;
      layoutSingleElement(html);
    }
  }
  htmls.map(e=>e.removeClass('layouttemp'));
}

function getHtmls(flat=false){
  var htmls = globalHtmlsCache;
  if(!htmls){
    htmls = $();
    var count = sourceData.length;
    for (var i = 0; i < count; i++) {
      htmls = $.merge(htmls,$(`#block_${i}`));
    }
    globalHtmlsCache = htmls;
  }
  if(flat)return htmls;
  return htmls.toArray().map(e=>$(e));
}

function getCanvas(){
  var v1 = $("#mainCanvas_innerDiv");
  if(v1.length)return v1;
  return $("#mainCanvas");
}

function relayout(group,htmls){
  if(htmls==undefined)htmls = getHtmls();
  htmls.map(e=>{
    if(!e.parent().length)e.appendTo(getCanvas());
  });
  layout(htmls,group);
  resizeInnerDiv();
  nudgeBlocks();
}

function layoutHorizontal(x='x',width='width'){
  var htmls = getHtmls();
  var canvas = getCanvas();
  var data = sourceData;
  globalPositionOffset = {x:0,y:0};
  htmls.map(e=>{
    if(!e.parent().length)e.appendTo(getCanvas());
  });
  data.groups.map((e,i)=>{
    layout(htmls,i);
    globalPositionOffset[x] = getSizeOfInnerDiv(false)[width];
    htmls.map(e=>{
      if(!e.parent().length)e.appendTo(getCanvas());
    });
  });
  globalPositionOffset = {x:0,y:0};
  resizeInnerDiv();
  nudgeBlocks();
}

function layoutVertical(){
  layoutHorizontal('y','height');
}

function resetFilename(bool=true){
  canvases = new Array();
  if(bool){
    $.ajax(tweakables.filename).done(e=>{
      if(typeof e == 'string')e = JSON.parse(e);
      init(e);
    });
  }else{
    init(sourceData);
  }
}

function init(json){
  globalHtmlsCache = undefined;
  sourceData = json;
  analyzeData();
  var canvas = $('#mainCanvas');
  canvas.children().remove();
  var connections = [];
  var topAnchors = Array(json.length).fill(0);
  var bottomAnchors = Array(json.length).fill(0);
  var htmls = [];
  for (var i = 0; i < json.length; i++) {
    var o = json[i];
    var html = $(o.html);
    htmls.push(html);
    html.addClass('block draggable asmcode');
    html.attr('id',`block_${i}`);
    canvas.append(html);
    var out = o.out;
    for (var j = 0; j < out.length; j++) {
      var {v,t} = out[j];
      if(v==i){
        var sa = topAnchors[i]++;
        var da = topAnchors[v]++;
        connections.push({c:colorRom[t],s:`block_${i}_top_anchor_${sa}`,d:`block_${v}_top_anchor_${da}`});
        continue;
      }
      var sa = bottomAnchors[i]++;
      var da = topAnchors[v]++;
      connections.push({c:colorRom[t],s:`block_${i}_bottom_anchor_${sa}`,d:`block_${v}_top_anchor_${da}`});
    }
  }
  makeAnchors(topAnchors,bottomAnchors,htmls);
  makeConnectors(connections);
  layout(htmls);
  resizeInnerDiv();
  initPageObjects();
  nudgeBlocks();
  if(tweakables.layoutType=='vertical')layoutVertical();
  else if(tweakables.layoutType=='horizontal')layoutHorizontal();
}

function getSizeOfInnerDiv(useWindow=true,[padx,pady]=[0,0]){
  htmls = getHtmls();
  var height = htmls.map(e=>e.outerHeight(true)+e.position().top).max();
  var width = htmls.map(e=>e.outerWidth(true)+e.position().left).max();
  if(useWindow){
    height = max(height,window.innerHeight-17);
    width = max(width,window.innerWidth-17);
  }
  return {height:height+pady,width:width+padx};
}

function resizeInnerDiv(){
  $("#mainCanvas_innerDiv").css(getSizeOfInnerDiv());
}

function nudgeBlocks(count=sourceData.length){
  for (var i = 0; i < count; i++) {
    findBlock(`block_${i}`).onMove();
  }
}

function takeScreenshot(){
  var size = getSizeOfInnerDiv(false,[5,10]);
  var can = $('#mainCanvas');
  can.css(size);
  html2canvas(can[0]).then(canvas=>{
    can.attr('style','');
    saveCanvas(canvas);
  });
}

function mouseDragged(e){
  if(!isTouching)return;
  if(touches.length>1)return;
  e.clientX = mouseX;
  e.clientY = mouseY;
  movemouse(e);
}

function mousePressed(){}
function mouseReleased(){}

function touchEnded(e){
  stopDrag(e);
  isTouching = false;
}

function touchStarted(e){
  e.clientX = mouseX;
  e.clientY = mouseY;
  startDrag(e);
  if(isdrag)isTouching = true;
}

window.onresize = resizeInnerDiv;
