function edgeSplitAll(recursive){
  console.warn("edgeSplitAll is depricated");
  if(!arrTF.length)findTrueFaces();
  var copy = arrE.slice();
  for (var i = 0; i < copy.length; i++) {
    edgeSplit(copy[i],recursive);
  }
}

function edgeSplit(e,recursive){
  console.warn("edgeSplit is depricated");
  var t = _edgeSplit(e,0.5);
  var e1 = t.e1;
  var e2 = t.e2;
  t.v.isHidden = true;
  if(recursive > 0 && recursive != undefined){
    edgeSplit(e1,recursive-1);
    edgeSplit(e2,recursive-1);
  }
}

function removeIdenticalEdges(){
  arrP.forEach(e=>{e._edges = [];});
  arrE.forEach(e=>{e.forEach(v => v._edges.push(e))});
  var a = arrE.slice();
  for (var i = 0; i < a.length; i++) {
    var edge = a[i];
    if(!arrE.includes(edge))continue;
    //var t = arrE.filter( e => (e.includes(edge[0]) && e.includes(edge[1]) && e != edge) );
    var t = edge[0]._edges.filter(e => edge[1]._edges.includes(e) && e != edge);
    t.forEach(e => arrE.remove_fast(e));
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
  console.warn("sortFace is depricated");
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

function fixNormalsI(itaranions=1,bool){
  for(var i = 0; i < itaranions; i++){
    if(bool)randomRotation();
    var r = fixNormals(itaranions>1,false);
    if(r&&r.length == 0)return i;
  }
}

function recenter(){
  var center = getSumOfArray(arrP).mult(1/arrP.length);
  arrP.forEach(e => e.sub(center));
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

function loadMesh_old(data) {
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

function loadMesh_poly(poly){
  cachedMeshProperties = undefined;
  arrP = poly.vertices.map(e=>createVector(...e));

  arrTF = arrF = poly.faces.map((face,i)=>{
    var r = face.map(e=>arrP[e]);
    r.paletteIndex = poly.face_classes[i];
    return r;
  });
  arrE = poly.edges().map(e=>e.map(e=>arrP[e]));
  // makeEdges(); // too slow
}

function makeObj(precision){
  rotator.save();
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
  rotator.restore();
  return r+normals+face_defs;
}

function resetMesh(){
  arrF = [];
  arrP = [];
  arrE = [];
  arrTF = [];
  rotator.history = rotator.identityMatrix;
  cachedMeshProperties = undefined;
  objString = undefined;
  model3D = undefined;
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
    var dist = p5.Vector.convert(arrE[i][0]).dist(p5.Vector.convert(arrE[i][1])).toFixed(3);
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
  console.warn("findTrueFaces is depricated");
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

var isPlanarView = false;
function planarView(i){//planarView() changes the mesh
  objString = model3D = undefined;
  ontoUnitSphere();
  var p = faceOnRotation(i);
  zoom = p;
  isPlanarView = true;
  doUpdate();
}

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
