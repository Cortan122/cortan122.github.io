function Matrix(arr){
  if(arr instanceof Matrix)this.arr = arrayDeepCopy(arr.arr);
  if(arr){
    if(Array.isArray(arr[0])){
      this.arr = arr;
    }else{
      this.arr = [arr.slice(0,3),arr.slice(3,6),arr.slice(6,9)];
      //this.arr = this.transpose().arr;//?
    }
  }else{
    this.arr = Matrix.identity.arr;
  }
}

Object.defineProperty(Matrix, "identity", {
  get: function() {
    return new Matrix([[1,0,0],[0,1,0],[0,0,1]]);
  }, configurable: true, enumerable: false
});

Matrix.prototype.apply = function(v){
  m = this.arr;
  nx = m[0][0]*v.x+m[0][1]*v.y+m[0][2]*v.z;
  ny = m[1][0]*v.x+m[1][1]*v.y+m[1][2]*v.z;
  nz = m[2][0]*v.x+m[2][1]*v.y+m[2][2]*v.z;
  return createVector(nx,ny,nz);//{x:nx,y:ny,z:nz};
}

Matrix.prototype.transpose = function(){
  var r = [];
  var m = this.arr;
  for (var i = 0; i < m[0].length; i++) {
    r[i] = [];//m[0][i]
    for (var j = 0; j < m.length; j++) {
      r[i][j] = m[j][i];
    }
  }
  return new Matrix(r);
}

Matrix.prototype.minorMatrix = function(x,y){
  var r = arrayDeepCopy(this.arr);
  r.splice(x,1);//.remove(r[x]);
  for (var i = 0; i < r.length; i++) {
    r[i].splice(y,1);
  }
  return new Matrix(r);
}

Matrix.prototype.minor = function(x,y){
  return this.minorMatrix(x,y).determinant();
}

Matrix.prototype.determinant = function(){
  var m = this.arr;
  if(m.length != m[0].length){throw 'wat';}
  if(m.length < 2){throw 'wat';}
  if(m.length == 2){
    return m[0][0]*m[1][1]-m[1][0]*m[0][1];
  }
  var r = 0;
  for (var i = 0; i < m[0].length; i++) {
    r += m[0][i]*this.minor(0,i)*((-1)**i);
  }
  return r;
}

Matrix.prototype.inverse = function(){
  var m = this.arr;
  var r = [];
  var det = this.determinant();
  if(det == 0)throw 'wat';
  for (var i = 0; i < m.length; i++) {
    r[i] = [];
    for (var j = 0; j < m[0].length; j++) {
      r[i][j] = this.minor(j,i)*((-1)**(j+i))/det;
    }
  }
  return new Matrix(r);
}