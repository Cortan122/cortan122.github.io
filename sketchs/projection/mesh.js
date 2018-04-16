function edgeSplitAll(recursive){
  if(!arrTF.length)findTrueFaces();
  var copy = arrE.slice();
  for (var i = 0; i < copy.length; i++) {
    edgeSplit(copy[i],recursive);
  }
}

function edgeSplit(e,recursive){
  var t = _edgeSplit(e,0.5);
  var e1 = t.e1; 
  var e2 = t.e2;
  t.v.isHidden = true;  
  if(recursive > 0 && recursive != undefined){
    edgeSplit(e1,recursive-1);
    edgeSplit(e2,recursive-1);
  }
}

function _edgeSplit(edge,ratio){
  if(ratio == 1||ratio == 0)return;
  var fs;// = edge._faces;
  if(fs == undefined){
    fs = arrTF.filter( e => (e.includes(edge[0]) && e.includes(edge[1])) );
  }
  if(fs.length != 2)throw 'edgeSplit';
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
  //arrP.forEach(e => {e._edges=e._faces=undefined;});
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

function removeIdenticalEdges(){
  var a = arrE.slice();
  for (var i = 0; i < a.length; i++) {
    var edge = a[i];
    if(!arrE.includes(edge))continue;
    var t = arrE.filter( e => (e.includes(edge[0]) && e.includes(edge[1]) && e != edge) );
    t.forEach(e => arrE.remove(e));
  }
}

function polygon(n){
  resetMesh();
  for (var i = 0; i < n; i++) {
    arrP[i] = createVector(sin((i*360/n)+180),cos((i*360/n)+180),0);
  }
  arrTF[0] = arrP.slice();
  for (var i = 0; i < n; i++) {
    arrE[i] = [arrP[i],arrP[(i+1)%n]];
  }
}

function snub(vert){
  if(!arrTF.length)findTrueFaces();
  var es;// = vert._edges;
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
  arrP.forEach(function(e) {e.c = undefined;});
  labelVert(arrP[0],dir==true);
  var a = arrP.filter(e => e.c).slice();
  for (var i = 0; i < a.length; i++) {a[i].isHidden = 1;}
  for (var i = 0; i < a.length; i++) {
    snub(a[i]);
  }
  removeIdenticalEdges();
  return a;
}

function labelVert(vert,c){//very slow
  if(vert.c == c)return;
  if(vert.c != c && vert.c !== undefined)throw 'unable to snub';
  vert.c = c;
  var es = arrE.filter( e => e.includes(vert) );
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

function sortFaces(){
  for (var i = 0; i < arrTF.length; i++) {
    sortFace1(arrTF[i]);
  }
}

function sortFace1(f){
  if(f.length == 3)return;
  var es = f._edges;
  if(es == undefined){
    es = arrE.filter(e => f.includes(e[0])&&f.includes(e[1]));
  }
  var r = es[0].slice();
  var vert = es[0][1];
  var edge = es[0];
  while(r.length < f.length){
    edge = es.filter(e => e.includes(vert)&&e!=edge)[0];
    vert = edge.filter(e => e!=vert)[0];
    r.push(vert);
  }
  arrTF[arrTF.indexOf(f)] = r;
  //fixNormal(f);
}

function sortFace(f){
  //targetRotation(f[0]);
  var center = getSumOfArray(f).mult(1/f.length);
  var r = [];
  for (var i = 0; i < f.length; i++) {
    f[i].rot = angleBetweenCCW(p5.Vector.sub(f[0],center),p5.Vector.sub(f[i],center));
    r.push(f[i].rot);
  }
  //print(r);
  f = f.sort(function(a,b){return b.rot-a.rot;});
}

function angleBetweenCCW(v1,v2){
  if(v1.equals(v2))return 0;
  var n = p5.Vector.cross(v1,v2).normalize();
  var a = p5.Vector.angleBetween(v1,v2);
  if(Number.isNaN(a))a = PI;
  if((n.z+n.y+n.x) > 0
    ||((n.z+n.y+n.x) == 0&&n.x > 0)
    ||((n.z+n.y+n.x) == 0&&n.x == 0&&n.y > 0)
    ||((n.z+n.y+n.x) == 0&&n.x == 0&&n.y == 0&&n.z > 0)
    )a = TWO_PI-a;
  return a;  
  /*var x1 = v1.x,y1 = v1.y,z1 = v1.z,x2 = v2.x,y2 = v2.y,z2 = v2.z;
  var dot = x1*x2 + y1*y2 + z1*z2;//between [x1, y1, z1] and [x2, y2, z2]
  var lenSq1 = x1*x1 + y1*y1 + z1*z1;
  var lenSq2 = x2*x2 + y2*y2 + z2*z2; 
  return acos(dot/sqrt(lenSq1 * lenSq2));*/
}

function kis(height){//fixme: creates edges of length 0
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

function fixNormal(f,bool){
  if(bool===undefined){
    bool = (f.length==3);
  }
  var normal = canonicalizer.approxNormal(f);
  var center = getSumOfArray(f).normalize();
  if(bool){
    var t = normal.dot(center);
    var b = t>1||t<0;
  }else{
    var b = p5.Vector.angleBetween(normal,center)>PI/2;
  }  
  if(b)f.reverse();
  return b;
}

function fixNormals(bool,bool2){
  objString = model3D = undefined;
  doUpdate();
  if(bool){
    return arrTF.map(e=>[fixNormal(e,bool2),e]).filter(e => e[0]);
  }
  for(var i = 0; i < arrTF.length; i++){
    fixNormal(arrTF[i],bool2);
  }
}

function fixNormalsI(itaranions=1){
  for(var i = 0; i < itaranions; i++){
    var r = fixNormals(itaranions>1,0);
    if(r&&r.length == 0)return;
  }
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

function recenter(){
  var center = getSumOfArray(arrP).mult(1/arrP.length);
  arrP.forEach(e => e.sub(center));
}

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

function standardizeEdgeLengths(b=true){
  if(cachedMeshProperties){
    var mp = meshProperties();
    var t = Object.keys(mp.edgeLengths);
    var min = getMinOfArray(t/*.map(parseInt)*/);
  }else{
    var min;
    for (var i = 0; i < arrE.length; i++) {
      var dist = p5.Vector.convert(arrE[i][0]).distSq(p5.Vector.convert(arrE[i][1]));
      if(min == undefined||dist<min)min = dist;
    }
    min = sqrt(min);
  }
  if(!b&&min<=1)return;
  if(b)min/=1;
  arrP.forEach(function(e){e.x /= min;e.y /= min;e.z /= min;});
  cachedMeshProperties = undefined;
}

function loadMesh(data) {
  resetMesh();
  var s = data.split("\n");
  arrP.push(createVector(0,0,0));
  for(i = 0;i < s.length;i++){
    if(s[i][0] == 'v' || s[i][0] == 'f'){
      var c = s[i].split(" ").filter(isNotEmpty);
      if(c[0] == 'v'){
        arrP.push(createVector(c[1],c[2],c[3]));
      }
      if(c[0] == 'f'){
        c = c.map(function(e) {return e.split('/')[0];});
        arrF.push([arrP[c[1]],arrP[c[2]],arrP[c[3]]]);
      }
    }
  }
  doUpdate();
  rotator.history = undefined;
}

function makeObj(precision){
  if(precision == undefined)precision = -8;
  resetView();
  //fixNormals();
  calcFaceColors(true);
  var r = 'group {0}\n#vertices\n'.format($('#mainInput').val().replace(/[0-9\,\.\-\(\)]/g,''));
  for (var i = 0; i < arrP.length; i++) {
    var v = arrP[i].map(e => round10(e,precision));
    r += 'v {0} {1} {2}\n'.format(v.x,v.y,v.z);
  }
  r += '#texture coordinates\n';
  var maxHash = max(arrTF.map(e => e.paletteIndex));
  for(var i = 0; i <= maxHash; i++){
    r += 'vt {0} {1}\n'.format((i%10)/10,floor(i/10)/10);
  } 
  var normals = '#vertex normals\n';
  var face_defs = '#face defs\n';
  for (var i = 0; i < arrTF.length; i++) {
    face_defs += 'f ';
    var f = arrTF[i];
    var normal = canonicalizer.approxNormal(f);
    var v = normal.map(e => round10(e,precision));
    normals += 'vn {0} {1} {2}\n'.format(v.x,v.y,v.z);
    for (var j = 0; j < f.length; j++) {
      face_defs += '{0}/{2}/{1} '.format(arrP.indexOf(f[j])+1,i+1,f.paletteIndex+1);
    }
    face_defs += '\n';
  }
  return r+normals+face_defs;
}

function resetMesh(){
  arrF = [];
  arrP = [];
  arrE = [];
  arrTF = [];
  rotator.history = rotator.identityMatrix;
}

function loadMeshUrl(url){
  sendRequest(url,loadMesh);
}

var cachedMeshProperties;
function meshProperties(bool){
  if(!bool&&cachedMeshProperties != undefined){
    return cachedMeshProperties;
  }
  var r = {numVerts:arrP.length,numEdges:arrE.length,numFaces:arrTF.length};
  var edgeLengths = {};
  for (var i = 0; i < arrE.length; i++) {
    var dist = round10(p5.Vector.convert(arrE[i][0]).dist(p5.Vector.convert(arrE[i][1])),-3);
    if(!edgeLengths[dist])edgeLengths[dist] = 0;
    edgeLengths[dist]++;
  }
  r.edgeLengths = edgeLengths;
  var faceLengths = {};
  for (var i = 0; i < arrTF.length; i++) {
    var dist = arrTF[i].length;
    if(!faceLengths[dist])faceLengths[dist] = 0;
    faceLengths[dist]++;
  }
  r.faceLengths = faceLengths;
  r.maxRadius = getMaxOfArray(arrP.map(e => e.dist(createVector(0,0,0))));
  r.maxEdgeLength = getMaxOfArray(Object.keys(edgeLengths).map(parseFloat));
  return cachedMeshProperties = r;
}

function findTrueFaces(bool) {
  if(!bool&&(arrF.length==0||arrE.length!=0))return makeFaces();
  var temp = {};
  var tempE = {};
  var invalid = {};
  for (var i = 0; i < arrF.length; i++) {
    for (var j = 0; j < arrF.length; j++) {
      if(arrF[j] == arrF[i])continue;
      if(temp[i+' '+j]||temp[j+' '+i])continue;
      var b1 = arrF[j].includes(arrF[i][0]);
      var b2 = arrF[j].includes(arrF[i][1]);
      var b3 = arrF[j].includes(arrF[i][2]);
      if(b1+b2+b3 != 2)continue;
      var a = uniq(arrF[j].concat(arrF[i]));//.sort(function(a,b){return atan2(a.y,a.x)-atan2(b.y,b.x);});
      var b = rotator.isCoplanar.apply(rotator,a);
      if(b){
        temp[i+' '+j] = a;
        invalid[i] = arrF[i];
        invalid[j] = arrF[j];
      }else{
        if(!temp[i])temp[i] = arrF[i];
        if(!temp[j])temp[j] = arrF[j];
        if(b1&&b2)n = 0;
        if(b2&&b3)n = 1;
        if(b3&&b1)n = 2;
        tempE[i+' '+j] = [arrF[i][n],arrF[i][(n+1)%3]];
      }
    }
  }
  /*if(!bool)*/arrE = Object.values(tempE);
  return arrTF = Object.values(temp).diff(Object.values(invalid));
  //fixme:makes self intersecting faces
  //use the line below to get the right result
  return makeFaces();
}

function makeEdgesShortest(precision,arr){
  if(precision == undefined)precision = -4;
  var dist = function(a,b) {
    var r = round10((a.x-b.x)**2+(a.y-b.y)**2+(a.z-b.z)**2,precision);
    if(r == 0)r = 99999;
    return r;
  };
  var temp = {};
  if(arr)arr = arr.map(e => round10(e**2,precision));
  for (var i = 0; i < arrP.length; i++) {
    //arrP[i]
    var dists = arrP.map(e => dist(e,arrP[i]));
    var rs = [];
    var min = 9999;
    for (var j = 0; j < dists.length; j++) {
      if(arr){
        if(arr.includes(dists[j]))rs.push(j);
      }else{
        if(dists[j] < min){min = dists[j];rs = [j];}
        if(dists[j] == min)rs.push(j);
      }
    }
    for (var j = 0; j < rs.length; j++) {
      if(temp[i+''+rs[j]]||temp[rs[j]+''+i])continue;
      temp[i+''+rs[j]] = [ arrP[i] , arrP[rs[j]] ];
    }
  }
  return arrE = Object.values(temp);
}

function makeFaces(){
  if(arrE.length==0)makeEdgesShortest();
  sort1();
  arrP.forEach(e => (e.counter = 0));
  arrE.forEach(e => (e.counter = 0));
  var fs = [];
  fs.push(makeFace(arrP[0]));
  for (var i = 0; i < arrP.length; i++) {
    var vert = arrP[i]
    var es = arrE.filter(function(v){return v.includes(vert);});
    if(vert.counter >= es.length)continue;
    for (var j = 0; j < es.length; j++) {
      if(es[j].counter >= 2)continue;
      var f = makeFace(vert,es[j]);
      var ids = fs.map(e => e.id);
      var id = JSON.parse(f.id);
      if(ids.includes(f.id))continue;
      var b = false;
      for (var i1 = 0; i1 < id.length+1; i1++) {
        id.unshift(id.pop());
        if(ids.includes(JSON.stringify(id))){b = true;break;}
      }
      if(b){unmakeFace(vert,es[j]);continue;}
      id = id.reverse();
      for (var i1 = 0; i1 < id.length+1; i1++) {
        id.unshift(id.pop());
        if(ids.includes(JSON.stringify(id))){b = true;break;}
      }
      if(b){unmakeFace(vert,es[j]);continue;}
      fs.push(f);
    }
  }
  return arrTF = fs;
}

function unmakeFace(vert,edge){
  var done = [vert];
  var t = checkFaceEdge(vert,edge);
  for (var i = 0; i < 999; i++) {
    t.vert.counter--;
    t.edge.counter--;
    if(done.includes(t.vert))break;
    done.push(t.vert);
    t = checkFaceEdge(t.vert,t.edge);
  }
}

function makeFace(vert,edge){
  //targetRotation(vert);
  var done = [vert];
  done.id = '['+arrP.indexOf(vert);
  var t = checkFaceEdge(vert,edge);
  for (var i = 0; i < 999; i++) {
    t.vert.counter++;
    t.edge.counter++;
    if(done.includes(t.vert))break;
    done.push(t.vert);
    done.id += ','+arrP.indexOf(t.vert);
    t = checkFaceEdge(t.vert,t.edge);
  }
  if(i == 999)throw 'waaat';
  done.id += ']';
  return done;
}

function checkFaceEdge(vert,edge){
  targetRotation(vert);
  var es = arrE.filter(function(v){return v.includes(vert);});
  es = es.sort(function(a,b){return edgeAngle(a,vert)-edgeAngle(b,vert);});
  if(edge == undefined)edge = es[0];
  if(!es.includes(edge))throw 'haha';
  var i = (es.indexOf(edge)+1)%es.length;
  return {vert:(es[i][1] == vert?es[i][0]:es[i][1]),edge:es[i]};
}

function edgeAngle(e,v){
  var v1 = (e[1] == v)?e[0]:e[1];
  var f = e=>e;//_perspective;
  return atan2(f(v1).y-f(v).y,f(v1).x-f(v).x);
  //return atan2(v1.y-v.y,v1.x-v.x);//fixme
  //return atan2(sqrt((v1.y-v.y)**2+(v1.z-v.z)**2),v1.x-v.x);
}

function makeEdges(){
  arrE = [];
  for (var i = 0; i < arrTF.length; i++) {
    var f = arrTF[i];
    for (var j = 0; j < f.length; j++) {
      arrE.push([f[j],f[(j+1)%f.length]])
    }
  }
  removeIdenticalEdges();
  return arrE;
}

function makeEdgesEqual(goal,precision,vert){
  throw 'this dose not work';
  if(vert == undefined)vert = arrP[0];
  if(precision == undefined)precision = -8;
  if(goal == undefined)goal = 1;
  var es = arrE.filter( e => e.includes(vert) );
  for (var i = 0; i < es.length; i++) {
    var e = es[i];
    var length = round10(e[0].dist(e[1]),precision);
    if(length == goal)continue;
    var v2 = e[(e[0] == vert)?1:0];
    v2.set(p5.Vector.lerp(vert,v2,goal/length));
    length = round10(e[0].dist(e[1]),precision);
    if(length != goal)return;//throw '122';
    makeEdgesEqual(goal,precision,v2);
  }
}

function intoUnitSphere(){
  var t = 1/meshProperties().maxRadius;
  arrP.map(e => e.mult(t));
}

function ontoUnitSphere(){
  arrP.map(e => e.normalize());
  cachedMeshProperties = undefined;
}

var isPlanarView = false;
function planarView(i){//planarView() changes the mesh
  objString = model3D = undefined;
  ontoUnitSphere();
  var p = faceOnRotation(i);
  zoom = p;
  isPlanarView = true;
  doUpdate();
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
          arrTF.remove(f);
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

function buildRubiksCube(str){
  var cube = JSON.parse(str);
  var cubeSize = cube[0][0].length;
  var tempHistory = arrayDeepCopy(rotator.history);
  if(tempHistory == undefined)tempHistory = rotator.identityMatrix;
  resetMesh();
  calcFaceColors = e => {};
  var _1 = (cubeSize-1)/2;
  var colors = ['green','white','orange','blue','yellow','red'];
  var getVert = function(v){
    var r = undefined;
    for (var i = 0; i < arrP.length; i++) {
      if(arrP[i].equals(v)){r = arrP[i];break;}
    }
    if(r == undefined)arrP.push(r = v);
    return r;
  };
  var tempFunc = function(pos,a,b) {return getVert(pos.copy().add(a,b));};
  var buildFace = function(face){
    for (var x = 0; x < face.length; x++) {
      var t = face[x];
      for (var y = 0; y < t.length; y++) {
        var _color = color(colors[t[y]]);
        var pos = createVector(x-_1,y-_1,cubeSize/2);
        var f = [tempFunc(pos,.5,.5),tempFunc(pos,-.5,.5),tempFunc(pos,-.5,-.5),tempFunc(pos,.5,-.5)];
        f.color = _color;
        arrTF.push(f); 
      }
    }
  };

  var rom = [0,5,3,2];
  for (var i = 0; i < rom.length; i++) {
    buildFace(cube[rom[i]]);
    rotator.applyDir(3,90);
  }
  rotator.applyDir(0,90);
  buildFace(cube[4]);
  rotator.applyDir(2,180);
  buildFace(cube[1]);
  
  resetView();
  rotator.applyMatrixG(tempHistory);
  updateStats();
  doUpdate();
}