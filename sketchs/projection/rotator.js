var rotator = {};

//Matrix
Object.defineProperty(rotator, "identityMatrix", {
  get: function() {
    return [[1,0,0],[0,1,0],[0,0,1]];
  }, configurable: true, enumerable: false
});

rotator.genericMatrixMult = function(m1,m2){
  if(m2.length != m1[0].length){throw 'wat';}
  var m = [];
  var flip = false;
  if(flip){
    m1 = this.transpose(m1);
    m2 = this.transpose(m2);
  }
  for (var x = 0; x < m2[0].length; x++) {
    m[x] = [];
    for (var y = 0; y < m1.length; y++) {
      m[x][y] = 0;
      for (var i = 0; i < m1[0].length; i++) {
        m[x][y] += m1[y][i]*m2[i][x];
      }
    }
  }
  if(!flip)return this.transpose(m);
  return m;
}

rotator.applyMatrix = function(m,v){
  nx = m[0][0]*v.x+m[0][1]*v.y+m[0][2]*v.z;
  ny = m[1][0]*v.x+m[1][1]*v.y+m[1][2]*v.z;
  nz = m[2][0]*v.x+m[2][1]*v.y+m[2][2]*v.z;
  return {x:nx,y:ny,z:nz};
}

rotator.applyMatrixG = function(m){
  if(this.history == undefined)this.history = this.identityMatrix;
  if(this.history2 == undefined)this.history2 = this.identityMatrix;
  this.history = this.genericMatrixMult(m,this.history);
  if(!isTemplating){
    this.history2 = this.genericMatrixMult(this.history2,this.inverse(m));
  }
  if(isNaN(this.history2[0][0]))throw 11;
  for (var i = 0; i < arrP.length; i++) {
    var v = this.applyMatrix(m,arrP[i]);
    arrP[i].x = v.x;arrP[i].y = v.y;arrP[i].z = v.z;
  }
}

rotator.returnToInit = function(){
  if(this.history==undefined)this.history = this.identityMatrix;
  this.applyMatrixG( this.inverse(this.history));
}

rotator.minorMatrix = function(m,x,y){
  var r = arrayDeepCopy(m);
  r.splice(x,1);//.remove(r[x]);
  for (var i = 0; i < r.length; i++) {
    r[i].splice(y,1);
  }
  return r;
}

rotator.minor = function(m,x,y){
  return this.determinant(this.minorMatrix(m,x,y));
}

rotator.determinant = function(m){
  if(m.length != m[0].length){throw 'wat';}
  if(m.length < 2){throw 'wat';}
  if(m.length == 2){
    return m[0][0]*m[1][1]-m[1][0]*m[0][1];
  }
  var r = 0;
  for (var i = 0; i < m[0].length; i++) {
    r += m[0][i]*this.minor(m,0,i)*((-1)**i);
  }
  return r;
}

rotator.transpose = function(m){
  var r = [];
  for (var i = 0; i < m[0].length; i++) {
    r[i] = [];//m[0][i]
    for (var j = 0; j < m.length; j++) {
      r[i][j] = m[j][i];
    }
  }
  return r;
}

rotator.inverse = function(m){
  var r = [];
  var det = this.determinant(m);
  for (var i = 0; i < m.length; i++) {
    r[i] = [];
    for (var j = 0; j < m[0].length; j++) {
      r[i][j] = this.minor(m,j,i)*((-1)**(j+i))/det;
    }
  }
  return r;
}

//Extra
rotator.isCoplanar = function(p0,p1,p2,p3){
  var m = [
    [p1.x-p0.x,p2.x-p0.x,p3.x-p0.x],
    [p1.y-p0.y,p2.y-p0.y,p3.y-p0.y],
    [p1.z-p0.z,p2.z-p0.z,p3.z-p0.z]
  ];
  return round10(this.determinant(m),-10)==0;//floating point errors
}

rotator.save = function(bool=true){
  if(this.stack == undefined)this.stack = [];
  var t = arrayDeepCopy(this.history);
  if(t == undefined)t = this.identityMatrix;
  var t2 = scl;
  if(!bool)t2 = undefined;
  var r = [t,isPlanarView,t2,zoom];
  this.stack.push(r);
  return r;
}

rotator.restore = function(){
  resetView();
  var r = this.stack.pop();
  if(r[1])planarView();
  this.applyMatrixG(r[0]);
  if(r[2] !== undefined)scl = r[2];
  if(r[3] !== undefined)zoom = r[3];
  return r;
}

//Quaternion
rotator.quaternionToMatrix = function(q){
  var m = [[],[],[]];
  this.fixQuaternion(q);
  m[0][0] = 1 - 2*q.y**2 - 2*q.z**2;
  m[0][1] = 2*q.x*q.y - 2*q.z*q.w;
  m[0][2] = 2*q.x*q.z + 2*q.y*q.w;
  m[1][0] = 2*q.x*q.y + 2*q.z*q.w;
  m[1][1] = 1 - 2*q.x**2 - 2*q.z**2;
  m[1][2] = 2*q.y*q.z - 2*q.x*q.w;
  m[2][0] = 2*q.x*q.z - 2*q.y*q.w;
  m[2][1] = 2*q.y*q.z + 2*q.x*q.w;
  m[2][2] = 1 - 2*q.x**2 - 2*q.y**2;
  return m;
}

rotator.fixQuaternion = function(q){
  if(q.a == undefined){q.a = q.w;}else{q.w = q.a;}
  if(q.b == undefined){q.b = q.x;}else{q.x = q.b;}
  if(q.c == undefined){q.c = q.y;}else{q.y = q.c;}
  if(q.d == undefined){q.d = q.z;}else{q.z = q.d;}
  return q;
}

rotator.makeQuaternion = function(v,a){
  var q = {};
  q.a = cos(a/2);
  q.b = v.x*sin(a/2);
  q.c = v.y*sin(a/2);
  q.d = v.z*sin(a/2);
  return q;
}

rotator.dirToQuaternion = function(d,a){
  if(a == undefined)a = tweakables.rotationSpeed;
  var rom = [[{x:1,y:0,z:0},a],[{x:0,y:1,z:0},a],[{x:1,y:0,z:0},-a],[{x:0,y:1,z:0},-a],[{x:0,y:0,z:1},-a],[{x:0,y:0,z:1},a]];
  return this.makeQuaternion(rom[d][0],rom[d][1]);
}

rotator.dirToMatrix = function(d,a){
  return this.quaternionToMatrix(this.dirToQuaternion(d,a));
}

rotator.applyQuaternion = function(q){
  this.applyMatrixG(this.quaternionToMatrix(q));
}

rotator.applyDir = function(d,a){
  this.applyMatrixG(this.dirToMatrix(d,a));
}

rotator.matrixToP5 = function(_m){
  var m = _m;
  m = m.map((e,i) => m[i].concat([0]));
  var arr = new Float32Array(m.flatten().concat([0,0,0,1]));
  var r = new p5.Matrix();
  r.mat4 = arr;
  return r;
}
