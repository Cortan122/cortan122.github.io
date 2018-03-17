var rotator = {};

rotator.genericMatrixMult = function(m1,m2){
  if(m2.length != m1[0].length){throw 'wat';}
  var m = [];
  for (var x = 0; x < m2[0].length; x++) {
    m[x] = [];
    for (var y = 0; y < m1.length; y++) {
      m[x][y] = 0;
      for (var i = 0; i < m1[0].length; i++) {
        m[x][y] += m1[y][i]*m2[i][x]; 
      }
    }
  }
  return m;
}

rotator.applyMatrix = function(m,v){
  nx = m[0][0]*v.x+m[0][1]*v.y+m[0][2]*v.z;
  ny = m[1][0]*v.x+m[1][1]*v.y+m[1][2]*v.z;
  nz = m[2][0]*v.x+m[2][1]*v.y+m[2][2]*v.z;
  return {x:nx,y:ny,z:nz};
}

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

rotator.dirToQuaternion = function(d){
  var a = rotationSpeed;
  var rom = [[{x:1,y:0,z:0},a],[{x:0,y:1,z:0},a],[{x:1,y:0,z:0},-a],[{x:0,y:1,z:0},-a]];
  return this.makeQuaternion(rom[d][0],rom[d][1]);
}

rotator.dirToMatrix = function(d){
  return this.quaternionToMatrix(this.dirToQuaternion(d));
}

rotator.applyQuaternion = function(q){
  this.applyMatrixG(this.quaternionToMatrix(q));
}

rotator.applyMatrixG = function(m){
  for (var i = 0; i < arrP.length; i++) {
    var v = this.applyMatrix(m,arrP[i]);
    arrP[i].x = v.x;arrP[i].y = v.y;arrP[i].z = v.z;
  }
}

rotator.applyDir = function(d){
  this.applyMatrixG(this.dirToMatrix(d));
}