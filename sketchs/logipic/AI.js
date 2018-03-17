var delay = 10;
var doAnimations = false;

function getLineLength(l){
  var r = -1;
  for (var i = 0; i < l.d.length; i++) {
    r += l.d[i]+1;
  }
  return r;
}

function getLineALength(l){
  var _size = l.l.length;
  var ret = [];
  l.e.start = [];
  for (var i = 0;i < _size;i++){
    var r = 0;
    var start = undefined;
    while (l.l[i].v==1||l.l[i].v==0){
      //if(l.e.start == undefined)l.e.start = i;
      if(start == undefined)start = i;
      r++;
      i++;
      if (l.l[i]==undefined)break;
    }
    if (r){
      ret.push(r);
      l.e.start.push(start);
    }
  }
  return ret;
}

function fillLine(l,n,start,end){
  if(start == undefined)start = 0;
  if(end == undefined)end = l.l.length;
  for (var i = start; i < end; i++) {
    l.l[i].v = n;
  }
}

function fillLineS(l,n,start){
  if(start == undefined)start = 0;
  for (var i = start; i < l.l.length; i++) {
    if(l.l[i].v == 0)l.l[i].v = n;
  }
}

async function recursiveAI(){
  AI.i = 0;
  AI.ni = 0;
  var r = 0;
  var t = AI();
  var t1 = 0;
  while(t||t1){
    transferGrid ();
    await sleep(delay);
    r += t;
    t1 = t;
    t = AI();
  }
  checkAllLines();
  print(r);//return r;
}

function projectLine(l,start){
  var r = [];
  for (var i = 0; i < l.d.length; i++) {
    var n = l.d[i];
    for (var j = 0; j < n; j++) {
      r.push(1);
    }
    r.push(-1);
  }
  r.pop();
  if(start == undefined)start = 0;
  for (var i = 0; i < r.length; i++) {
    l.l[i+start].v = r[i];
  }
}

function fillCenter(l,d){
  if(d == true){
    for (var i = l.e.start[0]+l.e.ALength[0]-l.e.length; i < l.e.length+l.e.start[0]; i++) {
      l.l[i].v = 1;
    }
    return;
  }
  for (var i = _size-l.e.length; i < l.e.length; i++) {
    l.l[i].v = 1;
  }
}

function fillHoles(l){
  var goal = getMinOfArray(l.d);
  for (var i = 0; i < l.e.ALength.length; i++) {
    if(l.e.ALength[i]<goal){
      l.l[l.e.start[i]].v = -1;
      if(l.e.ALength[i]>1)l.e._doneHoles = false;
    }
  }
}

function isUniform(l){
  //
  return getMinOfArray(l.d) == getMaxOfArray(l.d); 
}

AI.i = 0;
AI.ni = 0;

function AI(){
  var r = 0;
  if(AI.ni >= Object.keys(lines).length)AI.ni = 0;
  while (AI.ni < Object.keys(lines).length) {
    if(r > 0&&doAnimations)break;
    AI.n = Object.keys(lines)[AI.ni];
    AI.ni++;
    if(AI.i >= lines[AI.n].length)AI.i = 0;
    while (AI.i < lines[AI.n].length) {
      if(r > 0&&doAnimations)break;
      var l = lines[AI.n][AI.i];
      AI.i++;
      if(l.e.done && l.e._done)continue;
      if(l.e.done){l.e._done = true;fillLineS(l,-1);r++;continue;}
      if(l.d.length == 0){fillLine(l,-1);l.e._done = true;r++;}else
      if(l.e.length == undefined){l.e.length = getLineLength(l);}
      if(l.e.length == _size){
        if(l.d.length == 1){
          fillLine(l,1);r++;
        }else{
          projectLine(l);r++;
        }
      }
      if(l.e.length > _size/2 && l.d.length == 1 && !l.e._doneCenter){
        fillCenter(l);l.e._doneCenter = true;r++;
      }
      if(l.l[0].v == 1 && !l.e._doneEdge0 && l.e.length != _size){
        fillLine(l,1,0,l.d[0]);
        l.l[l.d[0]].v = -1;l.e._doneEdge0 = true;r++;
      }
      if(l.l[_size-1].v == 1 && !l.e._doneEdge1 && l.e.length != _size){
        fillLine(l,1,_size-l.d[l.d.length-1],_size);
        l.l[_size-l.d[l.d.length-1]-1].v = -1;l.e._doneEdge1 = true;r++;
      }
      l.e.ALength = getLineALength(l);
      if(l.e.ALength.length == 1){
        if(l.e.length == l.e.ALength[0] && _size != l.e.ALength[0]&& !l.e._doneA){
          l.e._doneA = true;
          if(l.d.length == 1){
            fillLineS(l,1,l.e.start[0]);r++;
          }else{
            projectLine(l,l.e.start[0]);r++;
          }
        }
        if(l.e.length > l.e.ALength[0]/2 && l.d.length == 1 && !l.e._doneCenter1 && !l.e._doneCenter){
          fillCenter(l,true);l.e._doneCenter1 = true;r++;
        }
      }
      if(compareArray(l.e.ALength,l.d)&& !l.e._doneA1){l.e._doneA1 = true;fillLineS(l,1);r++;}
      if(l.e.ALength.length > 1 && !l.e._doneHoles){
        l.e._doneHoles = true;
        fillHoles(l);r++;
      }
      if(!l.e._doneEdges && l.e.length != _size && isUniform(l) && l.e.ALength[0] != _size){
        l.e._doneEdges = true;
        for (var j = 0; j < l.e.start.length; j++) {
          var start = l.e.start[j];
          if(l.l[start].v == 1){
            fillLine(l,1,start,start+l.d[0]);
            if(l.l[start+l.d[0]])l.l[start+l.d[0]].v = -1;r++;
          }
          var end = l.e.start[j]+l.e.ALength[j];
          if(end < _size && l.l[end-1].v == 1){
            fillLine(l,1,end-l.d[0],end);
            if(l.l[end-l.d[0]-1])l.l[end-l.d[0]-1].v = -1;r++;
          }
        }
      }
      checkWinLine(l);
    }
  }
  return r;
}