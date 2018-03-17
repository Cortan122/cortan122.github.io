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
  "rectified":'r',
  "rectify":'r',
  "ambo":'r',
  "a":'r',
  "birectified":'d',
  "birectify":'d',
  "dual":'d',
  "2r":'d',
  "2t":"t d",
  "cantellated":"r r",
  "exploded":"r r",
  "expanded":"r r",
  "explode":"r r",
  "expand":"r r",
  "alternated":'h',
  "half":'h',
  "snub":'h t r',
  "s":'h t r',
  "zip":'t d',
  "bevel":'t r',
  "ortho":'d r r',
  "gyro":'d h t r',
  "needle":'d t',
  "join":'d r',
  "meta":'d t r',
  "k":'d t d',//todo
  "kis":"k",
  "canonicalized":'f',
  "canonicalize":'f',
  "canonical":'f',
  "canonized":'f',
  "canonize":'f',
  "canon":'f',
  "fix":'f',
  "cuboctahedron":"r {4,3}",
  "rhombic dodecahedron":"d r{4,3}",
  /*"snub cube":"snub cuboctahedron",*/
  "icosidodecahedron":"r {5,3}",
  "rhombic triacontahedron":"d r {5,3}",
  "triacontahedron":"d r {5,3}",
  "rhombicosidodecahedron":"r r {5,3}",
  "disdyakis triacontahedron":"d120",
  "hexakis icosahedron":"d120",
  "decakis dodecahedron":"d120",
  "kisrhombic triacontahedron":"d120",
  "d4":"tetrahedron",
  "d6":"cube",
  "d8":"octahedron",
  "d12":"{5,3}",
  "d20":"{3,5}",
  "d120":"f d t a {5,3}"
};

function template(data){
  $("#urlDispenser").attr("href","?s="+data);
  if(data.indexOf(' ') == -1&&templateStrings[data] === undefined&&data.match(/polygon[0-9]+$/)==null){
    data = data.match(/[^\(\)]\(?[0-9\.\-\,]*\)?/g).join(' ');
  }
  var t = arrayDeepCopy(rotator.history);
  if(t == undefined)t = rotator.identityMatrix;
  var t1 = isPlanarView;
  isPlanarView = false;
  __template(data);
  recenter();
  standardizeEdgeLengths(1);
  resetView();
  rotator.applyMatrixG(t);
  updateStats();
  doUpdate();
  if(t1)planarView();
}

function __template(data0){
  if(typeof data0 == 'number')return _template(data0);
  if(!isNaN(data0))return _template(parseInt(data0));
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
    if(arr[i] == 'r'){truncate(0.5);continue;}
    if(arr[i] == 'd'){dual();continue;}
    if(arr[i] == 'h'){snubAll();continue;}
    if(arr[i] == 'f'){canonicalizer.canonicalize(100);continue;}
    if(arr[i] == 'k'){kis(0.5);continue;}
    if(arr[i] == 'x'){extrude();continue;}
    if(arr[i] == 'z'){triangulate();continue;}
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