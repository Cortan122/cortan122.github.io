//only used by truncate()
function _edgeSplit(edge,ratio){
  if(ratio == 1||ratio == 0)return;
  var fs;// = edge._faces;
  if(fs == undefined){
    fs = arrTF.filter( e => (e.includes(edge[0]) && e.includes(edge[1])) );
  }
  if(fs.length != 2)throw 'edgeSplit: edge is not between 2 faces';
  var e = edge;
  var v = p5.Vector.lerp(p5.Vector.convert(e[0]),p5.Vector.convert(e[1]),ratio);
  arrP.push(v);
  arrE.remove_fast(e);
  var e1;var e2;
  arrE.push(e1 = [e[0],v]);
  arrE.push(e2 = [e[1],v]);
  /*e[0]._edges.push(e1);
  e[1]._edges.push(e2);
  e[0]._edges.remove(e);
  e[1]._edges.remove(e);
  v._edges = [e1,e2];*/
  for (var i = 0; i < fs.length; i++) {
    var i1 = fs[i].indexOf(e[0]);var i2 = fs[i].indexOf(e[1]);
    if(i1 + 1 == i2){
      fs[i].splice(i1+1,0,v);
    }else if(i1 - 1 == i2){
      fs[i].splice(i2+1,0,v);
    }else if((i1 == fs[i].length-1&&i2 == 0)||(i2 == fs[i].length-1&&i1 == 0)){
      fs[i].push(v);
    }else{throw 'edgeSplit';}
  }
  return {v:v,e1:e1,e2:e2};
}

function truncate(ratio){
  if(!arrTF.length)findTrueFaces();
  arrP.forEach(e => {e._edges=e._faces=undefined;});
  /*arrP.forEach(e => {e._faces=[];});
  for (var j = 0; j < arrTF.length; j++) {
    var face = arrTF[j];
    face.forEach(e=>e._faces.push(face));
  }
  for (var i = 0; i < arrE.length; i++) {
    var edge = arrE[i];
    edge._faces = edge[0]._faces.filter(e => edge[1]._faces.includes(e));
  }*/
  var oldEdges = arrE.slice();//.map(getFaceId);
  var oldVerts = arrP.slice();
  for (var j = 0; j < oldVerts.length; j++) {
    var vert = oldVerts[j];
    var es = /*vert._edges;//*/arrE.filter( e => e.includes(vert) );
    if(ratio == undefined){
      var as = [];
      for (var i = 0; i < es.length; i++) {
        for (var i1 = 0; i1 < es.length; i1++) {
          if(i1 == i)continue;
          var v1 = p5.Vector.sub((es[i][1] == vert)?es[i][0]:es[i][1],vert);
          var v2 = p5.Vector.sub((es[i1][1] == vert)?es[i1][0]:es[i1][1],vert);
          //as.push(round10(p5.Vector.angleBetween(v1,v2),-10));
          as.push(round10(p5.Vector.angleBetween(v1,v2),-10));
        }
      }
      var s = uniq(as).sort();
      var a = degrees(s[0]);//fixme
    }
    for (var i = 0; i < es.length; i++) {
      var r = ratio;
      if(ratio == undefined){
        //var a = v1.angleBetween(v2)
        r = 1/( 2+sin(a/2)*2 );
      }//fixme
      if(!oldEdges.includes(es[i])){
        r = r/(1-r);
      }
      r = (es[i][1] == vert)?1-r:r;
      _edgeSplit(es[i],r);
    }
    snub(vert);
    //if(ratio != undefined){snub(vert);}else{vert.isHidden = 1;}
  }
}

function snub(vert){//very slow
  if(!arrTF.length)findTrueFaces();
  var es = vert._edges;
  if(es == undefined){
    es = arrE.filter( e => e.includes(vert) );
  }
  var fs;// = vert._faces;
  if(fs == undefined){
    fs = arrTF.filter( e => e.includes(vert) );
  }
  var face = [];
  targetRotation(vert);
  es = es.sort(function(a,b){return edgeAngle(a,vert)-edgeAngle(b,vert);});
  for (var i = 0; i < es.length; i++) {
    arrE.remove_fast(es[i]);
    face.push((es[i][0] == vert)?es[i][1]:es[i][0]);
    //fixme:makes self intersecting faces
    //depends on tweakables.isometric (not anymore)
  }
  for (var i = 0; i < fs.length; i++) {
    fs[i].remove(vert);
    if(fs[i].length <= 2)arrTF.remove_fast(fs[i]);
  }
  for (var i = 0; i < face.length; i++) {
    arrE.push([face[i],face[(i+1)%face.length]])
  }
  //fixNormal(face);
  arrTF.push(face);
  arrP.remove_fast(vert);
}

function snubAll(dir){
  arrP.forEach(e=>{e.c = undefined;e._edges = [];});
  arrE.forEach(e=>{e.forEach(v => v._edges.push(e))});
  labelVert(arrP[0],dir==true);//very slow (fixed)
  var a = arrP.filter(e => e.c).slice();
  for (var i = 0; i < a.length; i++) {a[i].isHidden = 1;}
  for (var i = 0; i < a.length; i++) {
    snub(a[i]);//very slow
  }
  removeIdenticalEdges();//very slow (fixed)
  return a;
}

//only used by snubAll()
function labelVert(vert,c){
  if(vert.c == c)return;
  if(vert.c != c && vert.c !== undefined)throw 'unable to snub';
  vert.c = c;
  var es = vert._edges;
  if(es == undefined){
    es = arrE.filter( e => e.includes(vert) );
  }
  for (var i = 0; i < es.length; i++) {
    labelVert((es[i][0] == vert)?es[i][1]:es[i][0],!c);
  }
}

var dualCoplanarity = true;
function dual(){
  var newVerts = [];
  arrP.forEach(e => {e._faces=[];e._edges = [];});
  for (var i = 0; i < arrTF.length; i++) {
    var f = arrTF[i];
    var r = createVector(0,0,0);
    for (var j = 0; j < f.length; j++) {
      r.x += f[j].x;r.y += f[j].y;r.z += f[j].z;
    }
    if(!dualCoplanarity)r.mult(1/f.length);
    newVerts.push(r);
    f.forEach(e => e._faces.push(f));
    f.dualVert = r;
  }
  var newEdges = [];
  for (var i = 0; i < arrE.length; i++) {
    var edge = arrE[i];
    //var fs = arrTF.filter( e => (e.includes(edge[0]) && e.includes(edge[1])) );
    var fs = edge[0]._faces.filter(e => edge[1]._faces.includes(e));
    var e = [];
    if(fs.length != 2){
      fs = arrTF.filter( e => (e.includes(edge[0]) && e.includes(edge[1])) );
    }
    if(fs.length != 2)throw 'edge dual error';
    for (var j = 0; j < 2; j++) {
      e.push(fs[j].dualVert);
      edge[j]._edges.push(e);
    }
    newEdges.push(e);
  }
  var newFaces = [];
  for (var i = 0; i < arrP.length; i++) {
    var vert = arrP[i];
    var fs = vert._faces;//arrTF.filter( e => (e.includes(vert)) );
    var f = [];
    for (var j = 0; j < fs.length; j++) {
      f.push(fs[j].dualVert);
    }
    f._edges = vert._edges;
    newFaces.push(f);
  }
  resetMesh();
  arrP = newVerts;
  arrE = newEdges;
  arrTF = newFaces;
  //makeFaces();
  sortFaces();
  //arrTF.forEach(fixNormal);
  //standardizeEdgeLengths(true);
}

function kis(height){
  //fixme: creates edges of length 0
  if(height == -1)height += 10**-3;
  if(height == undefined)height = 0.5;
  var tfs = arrTF.slice(); 
  for (var i = 0; i < tfs.length; i++) {
    var f = tfs[i];
    fixNormal(f);
    var center = getSumOfArray(f).mult(1/f.length/**(height+1)*/);
    var normal = canonicalizer.approxNormal(f);
    center.add(normal.mult(height));
    arrP.push(center);
    arrTF.remove(f);
    for (var j = f.length - 1; j >= 0; j--) {
      arrE.push([f[j],center]);
      arrTF.push([f[j],f[(j+1)%f.length],center]);
    }
  }
  if(tfs.length == 1)arrTF.push(tfs[0]);
  arrF = arrTF;
  if(tfs.length != 1)findTrueFaces(true);
  removeIdenticalEdges();
  //makeFaces();
  sortFaces();
  recenter();
  if(tfs.length == 1)arrTF[arrTF.length-1].reverse()
}

function extrude(height,scl){
  if(height == -1)height += 10**-3;
  if(height == undefined)height = meshProperties().maxEdgeLength;
  if(scl == undefined)scl = 1;
  var tfs = arrTF.slice(); 
  for (var i = 0; i < tfs.length; i++) {
    var f = tfs[i];
    fixNormal(f);
    var normal = canonicalizer.approxNormal(f);
    var center = getSumOfArray(f).mult(1/f.length);
    normal = normal.mult(height);
    var f1 = arrTF[i] = f.map(e => e.copy());
    f1.forEach(e => e.mult(scl).add(p5.Vector.mult(center,1-scl)));
    f1.forEach(e => e.add(normal));
    arrP = arrP.concat(arrTF[i]);
    for (var j = 0; j < f.length; j++) {
      arrE.push([f1[j],f1[(j+1)%f.length]]);
      arrE.push([f1[j],f[j]]);
      arrTF.push([f1[j],f1[(j+1)%f.length],f[(j+1)%f.length],f[j]].reverse());
    }
    //arrTF[i].reverse();
  }
  if(tfs.length == 1)arrTF.push(tfs[0].reverse());
  recenter();
  //todo: refove coplainer faces
}

//i need a better version
function triangulate(){
  var tfs = arrTF.slice();
  for (var i = 0; i < tfs.length; i++) {
    var f = tfs[i];
    if(f.length <= 3)continue;
    while(f.length > 3){
      arrE.push([f[0],f[2]]);
      arrTF.push([f[0],f[1],f[2]]);
      f.splice(1, 1);
    }
    arrTF[i] = f;
  }
}

function ontoUnitSphere(){
  arrP.map(e => e.normalize());
  cachedMeshProperties = undefined;
}

var canonicalizer = {
  const1:.2/*.5*/,
  const2:.2,
  closest:function(edge){
    var p1=edge[0],p2=edge[1];
    var l = p5.Vector.sub(p2,p1);
    return p5.Vector.sub(
      p1,
      l.mult((l.dot(p1))/l.dot(l))
    );
  },
  recenter:function(vs,es){
    var centroid = getSumOfArray(es.map(canonicalizer.closest)).mult(1/es.length);
    return vs.map(e => e.sub(centroid));
  },
  tangentify:function(vs,es) {
    vs.forEach(v => v.index = vs.indexOf(v));
    var oldes = es.map(e => e.map(e1 => {
      var t = e1.copy();
      t.index = e1.index;
      return t;
    }));
    oldes.forEach(function(e){
      var t = canonicalizer.closest(e);
      var c = t.mult(canonicalizer.const1*(1 - sqrt(t.dot(t))));
      vs[e[0].index].add(c);
      vs[e[1].index].add(c);
    });
    return vs;
  },
  approxNormal:function(face) {
    /*var f2 = face.slice();
    var f0 = f2.slice();
    f2.unshift(f2.pop());
    var f1 = f2.slice();
    f2.unshift(f2.pop());*/
    var r = createVector(0,0,0);
    var f = function(a,b,c){return p5.Vector.sub(a,b).cross(p5.Vector.sub(b,c)).normalize();};
    for (var i = 0; i < face.length; i++) {
      r.add(f(face[i],face[(i+1)%face.length],face[(i+2)%face.length]));
    }
    return r.normalize();
  },
  planarize:function(vs,fs) {
    vs.forEach(v => v.index = vs.indexOf(v));
    var oldvs = vs.map(e => e.copy());
    var oldfs = fs.map(e => e.map(e1 => {
      var t = e1.copy();
      t.index = e1.index;
      return t;
    }));
    oldfs.forEach(function(f){
      var n = canonicalizer.approxNormal(f);
      var centroid = getSumOfArray(f).mult(1/f.length);
      if(n.dot(centroid) < 0)n = n.mult(-1);
      f.forEach(v => vs[v.index].add( n.mult(n.mult(canonicalizer.const2).dot(centroid.sub( oldvs[v.index] ))) ));
    });
    return vs;
  },
  canonicalize:function(itarations,b1,b2,b3) {
    ontoUnitSphere();
    var maxChange;
    var newV = arrP;
    var e = arrE;
    var f = arrTF;
    for (var i = 0; i < itarations; i++) {
      oldV = newV.map(e => e.copy());
      standardizeEdgeLengths();
      if(!b1)newV = canonicalizer.tangentify(newV,e);
      if(!b2)newV = canonicalizer.recenter(newV,e); 
      if(!b3)newV = canonicalizer.planarize(newV,f);
      //continue;
      var a = [];
      for (var j = 0; j < oldV.length; j++) {
        a.push(oldV[j].sub(newV[j]).mag());
      }
      maxChange = getMaxOfArray(a);
      if(maxChange < 10**(-8))break;
    }
    print(i+" itarations, Solved within "+ maxChange);
    standardizeEdgeLengths(true);
    return newV;
  }
};

var intersectionChecker = {
  onSegment:function(p,q,r){
    return (q.x <= max(p.x, r.x) && q.x >= min(p.x, r.x) &&
      q.y <= max(p.y, r.y) && q.y >= min(p.y, r.y));
  },
  orientation:function(p,q,r){
    // See http://www.geeksforgeeks.org/orientation-3-ordered-points/
    // for details of below formula.
    var val = (q.y - p.y) * (r.x - q.x) -
              (q.x - p.x) * (r.y - q.y);
    if (val == 0) return 0;  // colinear
    return (val > 0)? 1: 2; // clock or counterclock wise
  },
  doIntersect:function(p1, q1, p2, q2){
    // Find the four orientations needed for general and
    // special cases
    var o1 = intersectionChecker.orientation(p1, q1, p2);
    var o2 = intersectionChecker.orientation(p1, q1, q2);
    var o3 = intersectionChecker.orientation(p2, q2, p1);
    var o4 = intersectionChecker.orientation(p2, q2, q1);
    // General case
    if (o1 != o2 && o3 != o4)
      return true;
    // Special Cases
    // p1, q1 and p2 are colinear and p2 lies on segment p1q1
    if (o1 == 0 && intersectionChecker.onSegment(p1, p2, q1)) return true;
    // p1, q1 and p2 are colinear and q2 lies on segment p1q1
    if (o2 == 0 && intersectionChecker.onSegment(p1, q2, q1)) return true;
    // p2, q2 and p1 are colinear and p1 lies on segment p2q2
    if (o3 == 0 && intersectionChecker.onSegment(p2, p1, q2)) return true;
    // p2, q2 and q1 are colinear and q1 lies on segment p2q2
    if (o4 == 0 && intersectionChecker.onSegment(p2, q1, q2)) return true;
    return false; // Doesn't fall in any of the above cases
  },
  doIntersectE:function(e1,e2){
    return intersectionChecker.doIntersect(e1[0],e1[1],e2[0],e2[1]);
  },
  intersectionPoint2D:function(e1,e2){
    if(!intersectionChecker.doIntersectE(e1,e2))return undefined;
    var p1 = e1[0],p2 = e1[1],p3 = e2[0],p4 = e2[1];
    return createVector(((p1.x*p2.y-p1.y*p2.x)*(p3.x-p4.x)-(p1.x-p2.x)*(p3.x*p4.y-p3.y*p4.x))/((p1.x-p2.x)*(p3.y-p4.y)-(p1.y-p2.y)*(p3.x-p4.x)),((p1.x*p2.y-p1.y*p2.x)*(p3.y-p4.y)-(p1.y-p2.y)*(p3.x*p4.y-p3.y*p4.x))/((p1.x-p2.x)*(p3.y-p4.y)-(p1.y-p2.y)*(p3.x-p4.x)));
  },
  intersectionPoint3D:function(e1,e2){
    var r = intersectionChecker.intersectionPoint2D(e1,e2);
    if(r == undefined)return undefined;
    var ratio = (r.x-e1[0].x)/(e1[1].x-e1[0].x);
    var z = lerp(e1[0].z,e1[1].z,ratio);
    r.z = z;
    return r;
  },
  intersectionPoint3Dp:function(p1, q1, p2, q2){
    return intersectionChecker.intersectionPoint3D([p1, q1],[p2, q2]);
  },
  fix:function(){
    var fs = arrTF.slice();
    for (var i = 0; i < fs.length; i++) {
      var f = fs[i];
      if(f.length <= 3)continue;
      for (var n = 0; n < f.length; n++) {
        for (var j = n+2; j < f.length; j++) {
          var es = [[f[n],f[(n+1)%f.length]],[f[j],f[(j+1)%f.length]]];
          if(
            es[0].map(e => createVector(e.x,e.y))[0]
            .messyEquals(es[1].map(e => createVector(e.x,e.y))[1])
          )continue;
          var p = intersectionChecker.intersectionPoint3D(es[0],es[1]);
          if(p == undefined)continue;
          var filter = arrP.filter(e => e.messyEquals(p));
          if(filter.length != 0){
            p = filter[0];
          }else{
            arrP.push(p);
          }
          for (var _i1 = 0; _i1 < es.length; _i1++) {
            var e = es[_i1];
            var i1 = f.indexOf(e[0]);//var i2 = f.indexOf(e[1]);
            if(i1 != f.length-1){f.splice(i1+1,0,p);}else{f.push(p);}
            /*if(i1 + 1 == i2){
              f.splice(i1+1,0,p);
            }else if(i1 - 1 == i2){
              f.splice(i2+1,0,p);
            }else if((i1 == f.length-1&&i2 == 0)||(i2 == f.length-1&&i1 == 0)){
              f.push(p);
            }else{throw 'edgeSplit:fix';}*/
          }
          var i1 = f.indexOf(p);var i2 = f.indexOf(p,i1+1); 
          var f2 = f.slice();
          var f1 = f2.splice(i1, i2-i1);
          arrTF.remove_fast(f);
          arrTF.push(f1);
          arrTF.push(f2);
          return true;
        }
      }
    }
    return false;
  },
  fixAll:function(){
    randomRotation();
    var i = 0;
    while(i<99&&intersectionChecker.fix()){i++;}
    makeEdges();
    return i;
  }
};
