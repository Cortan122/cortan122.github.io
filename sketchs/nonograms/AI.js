function AI_fill(line,val=-1,cond=e=>e==0){
  var r = 0;
  for(var i = 0; i < line.l.length; i++){
    var t = line.l[i];
    if(cond(t.v,i)&&t.v!=val){
      t.v = val;
      updateTile(t.x,t.y);
      r++;
    }
  }
  return r;
}

function AI_fillSeg(line,val,s,e){
  var r = 0;
  for(var i = s; i < e; i++){
    var t = line.l[i];
    if(t.v!=val){
      t.v = val;
      updateTile(t.x,t.y);
      r++;
    }
  }
  return r;
}
 
function AI_fillSpaces(line){
  for (var i = 0; i < line.spaces.length; i++) {
    var s = line.spaces[i];
    if(s.l>=line.tmin)continue;
    AI_fill(line,-1,(e,i)=>i>=s.s&&i<s.e);
  }
  return 1;
}

function AI_fillSpacesc(line){
  var start,end;
  var t = line.t[0];
  for(var i = 0;i < line.spaces.length;i++){
    var s = line.spaces[i];
    if(s.l>=t){
      start = s.s;
      break;
    }
  }
  t = line.t[line.t.length-1];
  for(var i = 0;i < line.spaces.length;i++){
    var s = line.spaces[line.spaces.length-i-1];
    if(s.l>=t){
      end = s.e;
      break;
    }
  }
  return AI_fill(line,-1,(e,i)=>i<start||i>=end);
}

function AI_calcSpaces(line,cond=e=>e==-1){
  var r = [];
  var acc = 0;
  var full = true;
  var empty = true;
  for (var i = 0; i < line.length; i++) {
    var cell = line[i].v;
    if(cond(cell,i)){
      if(acc)r.push({l:acc,e:i,full,empty});
      acc = 0;
      full = true;
      empty = true;
      continue;
    }
    if(cell!=1)full = false;
    if(cell!=0)empty = false;
    acc++;
  }
  if(acc)r.push({l:acc,e:i,full,empty});
  return r.map(e=>{e.s = e.e-e.l;return e;});
}

function AI_calc(line){
  if(line.tlen==undefined){
    line.tlen = line.t.sum()+line.t.length-1;
  }
  if(line.tmin==undefined){
    line.tmin = line.t.min();
  }
  if(line.tmax==undefined){
    line.tmax = line.t.max();
  }
  line.spaces = AI_calcSpaces(line.l);
  line.space = line.spaces.map(e=>e.l);
  line.states = AI_calcSpaces(line.l,e=>e!=1);
}

function AI_write(line){
  var j = 0;
  for(var i = 0; i < line.t.length; i++){
    var l = line.t[i];
    for(var k = 0; k < l; k++){
      var t = line.l[j];
      t.v = 1;
      updateTile(t.x,t.y);
      j++;
    }
    j++;
  }
  AI_fill(line,-1,e=>e==0);
  return 1;
}

function AI_writec(line){
  //alert(JSON.stringify(line));
  var r = false;
  var size = line.l.length;
  var d = size-line.tlen;
  var t = line.t;
  var ind = d;
  for(var i = 0; i < t.length; i++){
    var len = t[i]-d;
    if(len>0){
      r = r || AI_fillSeg(line,1,ind,ind+len);
      ind += len;
    }else{
      ind += len;
    }
    ind += d+1;
  }
  return r;
}

//todo: use function*(){}
function AI_line(line){
  if(line.score==undefined)updateLine(line,false);
  if(line.score){
    return AI_fill(line,-1,e=>e==0);
  }
  AI_calc(line);
  var size = line.l.length;
  if(line.tlen > size)throw new RangeError('line size too big');
  if(line.tlen == size){
    return AI_write(line);
  }
  if(line.t.length == 1){
    var l = line.t[0];
    if(l>size/2){
      var r = AI_fillSeg(line,1,size-l,l);
      if(r)return r;
    }
    if(line.states.length>1){
      var st = line.states[0].s;
      var end = line.states[line.states.length-1].e;
      var r = AI_fillSeg(line,1,st,end);
      if(r)return r;
    }
    if(line.states.length==1){
      var s = line.states[0];
      var st = s.e+l-s.l;
      var end = s.s-l+s.l;
      var r = AI_fill(line,-1,(e,i)=>i>=st||i<end);
      if(r)return r;
    }
  }else if(line.tmax>size-line.tlen){
    var r = AI_writec(line);
    if(r)return r;
  }
  if(compareArray(line.space,line.t)){
    return AI_fill(line,1,e=>e==0);
  }
  if(line.tmin>line.space.min()){
    return AI_fillSpaces(line);
  }
  if(line.t.length>1&&line.tmax>line.space.min()){
    var r = AI_fillSpacesc(line);
    if(r)return r;
  }
  if(line.t.length>1){
    for(var i = 0;i < line.states.length;i++){
      var s = line.states[i];
      if(i>0){
        var s1 = line.states[i-1];
        var gap = s.s-s1.e;
        if(gap==1&&s1.l+s.l+1>line.tmax){
          var r = AI_fill(line,-1,(e,i)=>i==s1.e);
          if(r)return r;
        }
      }
      if(s.l==line.tmax){
        var r = AI_fill(line,-1,(e,i)=>i==s.s-1||i==s.e);
        if(r)return r;
      }
    }
  }
  var s = line.spaces[0];
  if(!s.empty&&!s.full){
    var t = line.t[0];
    if(s.l==t){
      return AI_fillSeg(line,1,s.s,s.e);
    }
    var firstpos = line.states[0].s-s.s;
    if(firstpos<t-1||firstpos==0){
      var end = s.s+t;
      var r = AI_fillSeg(line,1,s.s+firstpos,end);
      if(firstpos==0)r = r || AI_fill(line,-1,(e,i)=>i==end);
      if(r)return r; 
    }
  }
  var s = line.spaces[line.spaces.length-1];
  if(!s.empty&&!s.full){
    var t = line.t[line.t.length-1];
    if(s.l==t){
      return AI_fillSeg(line,1,s.s,s.e);
    }
    var firstpos = s.e-line.states[line.states.length-1].e;
    if(firstpos<t-1||firstpos==0){
      var end = s.e-t-1;
      var r = AI_fillSeg(line,1,end+1,s.e-firstpos);
      if(firstpos==0)r = r || AI_fill(line,-1,(e,i)=>i==end);
      if(r)return r;
    }
  }
  var nnotempty = line.spaces.filter(e=>!e.empty).length;
  if(nnotempty==line.t.length&&line.spaces.length!=1){
    var r = false;
    var j = 0;
    for(var i = 0;i < line.spaces.length;i++){
      var s = line.spaces[i];
      if(!s.empty){
        if(!s.full){
          let r = AI_line({t:[line.t[j]],l:line.l.slice(s.s,s.e)});
          if(r)return r;
        }
        j++;
        continue;
      }
      r = r || AI_fillSeg(line,-1,s.s,s.e);
    }
    if(r)return r;
  }
  var maxspace = line.space.max();
  var tmax = line.tmax;
  var one = line.tmin;
  var ind = line.spaces.filter(e=>e.l-tmax>=0&&e.l-tmax<=one);
  var ind2 = line.t.filter(e=>e==tmax);
  var d = maxspace-tmax;
  if(d>=0&&d<=one&&ind.length==ind2.length&&maxspace!=size){
    for(var i = 0;i < ind.length;i++){
      var s = ind[i];
      if(s.full)continue;
      var r = AI_line({t:[tmax],l:line.l.slice(s.s,s.e)});
      if(r)return r;
    }
  }
  var two = line.t.copy().remove_fast(one).min();
  if(line.t.length>1&&maxspace<one+two+1&&line.spaces.length==line.t.length){
    for(var i = 0;i < line.spaces.length;i++){
      var s = line.spaces[i];
      var t = line.t[i];
      if(s.full)continue;
      var r = AI_line({t:[t],l:line.l.slice(s.s,s.e)});
      if(r)return r;
    }
  }
  if(line.space.length==1&&line.space[0]<size){
    var s = line.spaces[0];
    var r = AI_line({t:line.t,l:line.l.slice(s.s,s.e)});
    if(r)return r;
  }
  var start,starti,end,endi;
  for(var i = 0;i < line.spaces.length;i++){
    var s = line.spaces[i];
    if(!s.full){
      start = s.s;
      starti = i;
      break;
    }
  }
  for(var i = 0;i < line.spaces.length;i++){
    var s = line.spaces[line.spaces.length-i-1];
    if(!s.full){
      end = s.e;
      endi = line.t.length-i;
      break;
    }
  }
  if(!Number.isNaN(end-start)&&end-start!=size&&end-start!=0){
    var r = AI_line({t:line.t.slice(starti,endi),l:line.l.slice(start,end)});
    if(r)return r;
  }
}

function AI(max=Infinity){
  var lines = grid.lines.all;
  var r = 0;
  for(var i = 0; i < lines.length; i++){
    if(AI_line(lines[i])){
      r++;
      if(r>=max)return r;
    }
  }
  return r;
}

function AI_all(){
  var time = (new Date).getTime();
  var r = 0
  var t;
  while(t = AI()){
    r += t;
  }
  var time1 = (new Date).getTime();
  //console.log(`AI_all("${jsonCache[grid.id].name}") took ${time1-time} ms`);
  return r;
}
