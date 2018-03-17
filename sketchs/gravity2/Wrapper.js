function Wrapper(){
  this.data = {};
  
  this.set = function(x,y,t){
    //if(t == undefined){this.remove(x,y);return;}
    if(this.data[x] == undefined){
      this.data[x] = {};
    }
    this.data[x][y] = t;
    if(t == undefined){this.data[x][y] = '';this.remove(x,y);return;}
  }
  
  this.get = function(x,y){
    if(this.data[x] != undefined){
      if(this.data[x][y] != undefined){
        return this.data[x][y];
      }
    }
    return undefined;
  }
  
  this.remove = function(x,y){
    if(this.data[x] != undefined){
      if(this.data[x][y] != undefined){
        delete this.data[x][y];
        if(Object.keys(this.data[x]).length == 0){
          delete this.data[x];
        }
        return;
      }
    }
    throw 'hi';
  }
}