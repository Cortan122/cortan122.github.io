function Pathfinder(p) {
  
  this.isValid = true;
  this.nodes = [];
  this.p = p;//plane
  var n = this.p.tiles.length;
  
  for(x = 0;x < n;x++){
    var line = [];
    for(y = 0;y < n;y++){
      line.push({p:this.p.tiles[x][y],c:[]});
    }
    this.nodes.push(line);
  }
  
  this.update = function()
  { 
    for(x = 0;x < this.nodes.length;x++){
      for(y = 0;y < this.nodes[x].length;y++){
        var n = this.nodes[x][y];
        //n.c = [];
        if(y > 0){
          n.c[0] = (this.p.checkForWall(x,y,0))?this.nodes[x][y-1]:undefined;
          this.nodes[x][y-1].c[2] = (n.c[0])?n:undefined;
        }
        if(x < this.nodes.length-1){
          n.c[1] = (this.p.checkForWall(x,y,1))?this.nodes[x+1][y]:undefined;
          this.nodes[x+1][y].c[3] = (n.c[1])?n:undefined;
        }
        this.nodes[x][y] = n;
      }
    }
    this.isValid = true;
  }
  
  this.update();
  
  this.heuristic = function(a, b)
  {
    if(Array.isArray(b))b = b[0];
    return dist(a.p.x,a.p.y,b.p.x,b.p.y);
  }
  
  this.findCords = function(x1,y1, x2,y2)
  { 
    return this.find(this.nodes[x1][y1],this.nodes[x2][y2]);
  }
  
  this.findVectors = function(v1,v2)
  { 
    if(!Array.isArray(v2))return this.findCords(v1.x,v1.y,v2.x,v2.y);
    var arr = [];
    for (var i = 0; i < v2.length; i++) {
      arr.push(this.nodes[v2[i].x][v2[i].y]);
    }
    return this.find(this.nodes[v1.x][v1.y],arr);
  }

  this.areWeThereYet = function(current, end)
  { 
    if(Array.isArray(end)){
      for (var i = 0; i < end.length; i++) {
        if(current.p == end[i].p)return true;
      }
    }else if(current.p == end.p){return true;}
    return false;
  }

  this.find = function(start, end)
  { 
    if(!this.isValid){this.update();}
    
    for(x = 0;x < this.nodes.length;x++){
      for(y = 0;y < this.nodes[x].length;y++){
        this.nodes[x][y].g = 0;
        this.nodes[x][y].h = 0;//heuristic
        this.nodes[x][y].f = 0;//g+h
        this.nodes[x][y].from = null;
      }
    }
    
    var openList   = [];
    var closedList = [];
    openList.push(start);
    
    if(Array.isArray(end)){
      if(end.length > 1){
        for (var i = 0; i < end.length; i++) {
          end[i].temp = this.heuristic(start,end[i]);
        }
        end.sort(function(a, b) {
          return a.temp - b.temp;
        });
      }else{end = end[0];}
    }

    while(openList.length > 0) {
      // Grab the lowest f(x) to process next
      var lowInd = 0;
      for(var i=0; i<openList.length; i++) {
        if(openList[i].f < openList[lowInd].f) { lowInd = i; }//todo:optimize
      }
      var currentNode = openList[lowInd];
      
      if(this.areWeThereYet(currentNode,end)) {
        var curr = currentNode;
        var ret = [];
        while(curr.from) {
          ret.push(curr.p);
          curr = curr.from;
        }
        return ret.reverse();
      }
      
      openList.splice(lowInd, 1);//remove currentNode from openList
      closedList.push(currentNode);
      var neighbors = currentNode.c;
      
      for(var i=0; i<neighbors.length;i++) {
        var neighbor = neighbors[i];
        if(closedList.indexOf(neighbor) != -1 || neighbor == undefined){continue;}
        
        var gScore = currentNode.g + 1; // 1 is the distance from a node to it's neighbor
        var gScoreIsBest = false;
        if(openList.indexOf(neighbor) == -1) {
          // This the the first time we have arrived at this node, it must be the best
          gScoreIsBest = true;
          neighbor.h = this.heuristic(neighbor, end);
          openList.push(neighbor);
        }else if(gScore < neighbor.g) {
          gScoreIsBest = true;
        }
        if(gScoreIsBest) {
          // Found an optimal (so far) path to this node.
          neighbor.from = currentNode;
          neighbor.g = gScore;
          neighbor.f = neighbor.g + neighbor.h;
          //neighbor.debug = "F: " + neighbor.f + "<br />G: " + neighbor.g + "<br />H: " + neighbor.h;
        }
      }
    }
    return [];
  }
  
}