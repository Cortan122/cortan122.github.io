templates = [];

//formula: StringReplace[StringReplace[ ToString[Map[N,x,{2}]] ,"{"->"["],"}"->"]"]
//Escher solid //fixme
  templates[2] = {v:[[-1.63299,0.,0.],[-0.816497,-0.816497,-1.1547],[-0.816497,-0.816497,0.],[-0.816497,
  -0.816497,1.1547],[-0.816497,0.,-0.57735],[-0.816497,0.,0.57735],[-0.816497,
  0.816497,-1.1547],[-0.816497,0.816497,0.],[-0.816497,0.816497,1.1547],[0.,-1.63299,
  0.],[0.,-0.816497,-0.57735],[0.,-0.816497,0.57735],[0.,0.,-1.1547],[0.,0.,1.1547],
  [0.,0.816497,-0.57735],[0.,0.816497,0.57735],[0.,1.63299,0.],[0.816497,-0.816497,
  -1.1547],[0.816497,-0.816497,0.],[0.816497,-0.816497,1.1547],[0.816497,0.,-0.57735],
  [0.816497,0.,0.57735],[0.816497,0.816497,-1.1547],[0.816497,0.816497,0.],[0.816497,
  0.816497,1.1547],[1.63299,0.,0.]],edgeLengths:[1,1.155]};

var _edgeOnRotation = [
  [0.7071067811865497,0.7071067811865464,1.9984014443252818e-15],
  [-0.40860374744189343,0.4086037474418974,-0.8161408917294111],
  [-0.5770987589455023,0.5770987589455029,0.5778529612687995]
];

//cube
templates[0] = [[1,1,1],[1,1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[-1,-1,-1],[-1,1,-1],[-1,1,1]];

//icosahedron
templates[1] = [[0,-0.525731,0.850651],[0.850651,0,0.525731],[0.850651,0,-0.525731],
[-0.850651,0,-0.525731],[-0.850651,0,0.525731],[-0.525731,0.850651,0],[0.525731,0.850651,0],
[0.525731,-0.850651,0],[-0.525731,-0.850651,0],[0,-0.525731,-0.850651],[0,0.525731,-0.850651],
[0,0.525731,0.850651]];

templateStrings = {
  "{4,3}":0,
  "{3,3}":"d h {4,3}",//fixme
  "{3,5}":1,
  "{5,3}":"d {3,5}",
  "{3,4}":"d {4,3}",
  "tetrahedron":"{3,3}",
  "cube":"{4,3}",
  "octahedron":"{3,4}",
  "icosahedron":"{3,5}",
  "dodecahedron":'{5,3}',
  "truncated":'t',
  "truncate":'t',
  "hypertruncated":'t(0.75)',
  "hypertruncate":'t(0.75)',
  "antitruncated":'t(-1)',
  "antitruncate":'t(-1)',
  "bitruncated":"t d",
  "bitruncate":"t d",
  "rectified":'a',
  "rectify":'a',
  "ambo":'a',
  //"r":'a',
  "birectified":'d',
  "birectify":'d',
  "dual":'d',
  "2r":'d',
  "2t":"t d",
  "cantellated":"a a",
  "exploded":"a a",
  "expanded":"a a",
  "explode":"a a",
  "expand":"a a",
  "alternated":'h',
  "half":'h',
  "snub":'h t a',
  "s":'h t a',
  "zip":'t d',
  "bevel":'t a',
  "ortho":'d a',
  "gyro":'d h t a',
  "needle":'d t',
  "join":'d a',
  "meta":'d t a',
  "k":'d t d',//todo
  "kis":"k",
  "sphere":"u",
  "canonicalized":'f',
  "canonicalize":'f',
  "canonical":'f',
  "canonized":'f',
  "canonize":'f',
  "canon":'f',
  "fix":'f',
  "cuboctahedron":"a {4,3}",
  "rhombic dodecahedron":"d a{4,3}",
  /*"snub cube":"snub cuboctahedron",*/
  "icosidodecahedron":"a {5,3}",
  "rhombic triacontahedron":"d a {5,3}",
  "triacontahedron":"d a {5,3}",
  "rhombicosidodecahedron":"a a {5,3}",
  "disdyakis triacontahedron":"d120",
  "hexakis icosahedron":"d120",
  "decakis dodecahedron":"d120",
  "kisrhombic triacontahedron":"d120",
  "d4":"tetrahedron",
  "d6":"cube",
  "d8":"octahedron",
  "d12":"{5,3}",
  "d20":"{3,5}",
  "d120":"u d t a {5,3}", //"f d t a {5,3}"
  "football":"t icosahedron",
  "ball":"football"
};

var isTemplating = false;
var prevTemplateStr = undefined;

function template(data){
  isTemplating = true;
  if(data.indexOf('//') != -1){
    data = data.split('//')[0];
  }
  if(data.endsWith(' ')){
    data = data.replace(/( )*$/g,'');
  }
  rotator.save(prevTemplateStr==data);
  isPlanarView = false;
  cachedMeshProperties = undefined;

  var time = (new Date).getTime();
  var time1;
  if(tweakables.polyhedronisme){
    time1 = template_poly(data);
  }else{
    time1 = template_basic(data);
  }

  doUpdate();
  isTemplating = false;
  rotator.restore();
  prevTemplateStr = data+tweakables.polyhedronisme;

  var time2 = (new Date).getTime();
  print('template({1}) took {0}+{2}={3} ms'.format(time1-time,data,time2-time1,time2-time));
}

function template_basic(data){
  $("#urlDispenser").attr("href","?tw_polyhedronisme=false&s="+data);
  __template(data);
  var time1 = (new Date).getTime();

  model3D = undefined;
  objString = undefined;
  cachedMeshProperties = undefined;
  recenter();
  standardizeEdgeLengths();
  resetView();
  fixNormalsI(10,true);//fixNormals();
  updateStats();
  if(tweakables.useWebGL){
    objString = makeObj();
  }

  return time1;
}

function template_poly(data){
  $("#urlDispenser").attr("href","?tw_polyhedronisme=true&s="+data);
  data = data.replace(/[^0-9.a-zA-Z(),\-]/g,'');
  const polyhedronisme = require('polyhedronisme');

  // polyhedronisme.setPalette(palette,tweakables.hashSensitivity,"fixed","signature");
  polyhedronisme.setPalette(palette);
  var poly = polyhedronisme(data);
  var time1 = (new Date).getTime();

  model3D = undefined;
  cachedMeshProperties = undefined;
  objString = poly.toOBJ(100);
  resetView();
  loadMesh_poly(poly);
  updateStats();

  return time1;
}

function __template(data0){
  if(typeof data0 == 'number')return _template(data0);
  if(!isNaN(data0))return _template(parseInt(data0));
  if(data0.indexOf(' ') == -1 && templateStrings[data0] == undefined && data0.match(/polygon[0-9]+$/)==null){
    data0 = data0.match(/[^\(\)]\(?[0-9\.\-\,]*\)?/g).join(' ');
  }
  data0 = data0.replace(/ *$/,'');
  var data = data0.toLowerCase();
  if(templateStrings[data] !== undefined)return __template(templateStrings[data]);
  if(data[data.length-1] != data0[data0.length-1]){
    var t = data0[data0.length-1];
    var rom = {'T':'{3,3}','C':'{4,3}','O':'{3,4}','I':'{3,5}','D':'{5,3}'};
    data = data.slice(0,-1);
    data += rom[t];
  }

  var m = data.match(/polygon[0-9]+$/);
  if(m != null){
    var i = m.index;
    polygon(parseInt(data.slice(i).replace('polygon','')));
    compilePrefix(data.slice(0,i));
  }else if(data[data.length-1] == '}'){
    var i = data.lastIndexOf('{');
    __template(data.slice(i));
    compilePrefix(data.slice(0,i));
  }else if(data.indexOf(' ') != -1){
    __template(templateReplacer(data));
  }else{throw 'Syntax error: '+data0;}
}

function templateReplacer(data){
  var data = data.toLowerCase();
  if(templateStrings[data] !== undefined)return templateReplacer(templateStrings[data]);
  if(data.indexOf(' ') != -1){
    var arr = data.split(' ');
    var b = false;
    for (var i = 0; i < arr.length; i++) {
      var t = arr[i];
      while(
        templateStrings[t] !== undefined
        && typeof templateStrings[t] == 'string'
      ){arr[i] = t = templateStrings[t];b = true;}
    }
    if(b)return templateReplacer(arr.join(' '));
  }
  return data;
}

function compilePrefix(data){
  var arr = [];
  data = templateReplacer(data);
  if(data.indexOf(' ') != -1){
    arr = data.split(' ').reverse();
  }else /*if(data.length == 1)*/{
    arr = [data]
  }//todo
  for (var i = 0; i < arr.length; i++) {
    if(arr[i] == ' '||arr[i] == '')continue;
    if(arr[i] == 't'){truncate(/*1/(sqrt(2)+2)*/);continue;}
    if(arr[i] == 'a'){truncate(0.5);continue;}
    if(arr[i] == 'd'){dual();continue;}
    if(arr[i] == 'h'){snubAll();continue;}
    if(arr[i] == 'f'){canonicalizer.canonicalize(100);continue;}
    if(arr[i] == 'k'){kis(0.5);continue;}
    if(arr[i] == 'x'){extrude();continue;}
    if(arr[i] == 'z'){triangulate();continue;}
    if(arr[i] == 'u'){ontoUnitSphere();continue;}
    if(arr[i] == 'i'){print(intersectionChecker.fixAll()+' intersections found');continue;}
    if(arr[i][0] == 't' && arr[i][1] == '(' && arr[i][arr[i].length-1] == ')'){
      truncate(parseFloat(arr[i].slice(2,-1)));
      continue;
    }
    if(arr[i][0] == 'k' && arr[i][1] == '(' && arr[i][arr[i].length-1] == ')'){
      kis(parseFloat(arr[i].slice(2,-1)));
      continue;
    }
    if(arr[i][0] == 'f' && arr[i][1] == '(' && arr[i][arr[i].length-1] == ')'){
      eval('canonicalizer.canonicalize({0})'.format(arr[i].slice(2,-1)));
      continue;
    }
    if(arr[i][0] == 'x' && arr[i][1] == '(' && arr[i][arr[i].length-1] == ')'){
      eval('extrude({0})'.format(arr[i].slice(2,-1)));
      continue;
    }
    throw 'unable to compile prefix: '+data;
  }
}

function _template(i){
  resetMesh();
  var verts;
  if(Array.isArray(templates[i])){verts = templates[i];}else{
    (verts = templates[i].v)||(verts = templates[i].points)
    ||(verts = templates[i].verts)||(verts = templates[i].vertices);
  }
  arrP = verts.map(function(n){return createVector(n[0],n[1],n[2]);});
  if(!templates[i].loops)templates[i].loops = 1;
  for (var j = 0; j < templates[i].loops; j++) {
    makeEdgesShortest((templates[i].precision)?templates[i].precision:-4,templates[i].edgeLengths);
    makeFaces();
  }
  rotator.returnToInit();
}
