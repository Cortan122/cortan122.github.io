module.exports = (function(){
  //<stolenCode>
  var Heap = function(fn){
    this.fn = fn || function(e) {
      return e;
    };
    this.items = [];
  };

  Heap.prototype = {
    swap: function(i, j) {
      this.items[i] = [
        this.items[j],
        this.items[j] = this.items[i]
      ][0];
    },
    bubble: function(index) {
      var parent = ~~((index - 1) / 2);
      if (this.item(parent) < this.item(index)) {
        this.swap(index, parent);
        this.bubble(parent);
      }
    },
    item: function(index) {
      return this.fn(this.items[index]);
    },
    pop: function() {
      return this.items.pop();
    },
    sift: function(index, end) {
      var child = index * 2 + 1;
      if (child < end) {
        if (child + 1 < end && this.item(child + 1) > this.item(child)) {
          child++;
        }
        if (this.item(index) < this.item(child)) {
          this.swap(index, child);
          return this.sift(child, end);
        }
      }
    },
    push: function() {
      var lastIndex = this.items.length;
      for (var i = 0; i < arguments.length; i++) {
        this.items.push(arguments[i]);
        this.bubble(lastIndex++);
      }
    },
    get length() {
      return this.items.length;
    }
  };

  var Huffman = {
    encode: function(data) {
      var prob = {};
      var tree = new Heap(function(e) {
        return e[0];
      });
      for (var i = 0; i < data.length; i++) {
        if (prob.hasOwnProperty(data[i])) {
          prob[data[i]]++;
        } else {
          prob[data[i]] = 1;
        }
      }
      Object.keys(prob).sort(function(a, b) {
        return prob[b]-prob[a];//~~(Math.random() * 2);
      }).forEach(function(e) {
        tree.push([prob[e], e]);
      });
      while (tree.length > 1) {
        var first = tree.pop(),
            second = tree.pop();
        tree.push([first[0] + second[0], [first[1], second[1]]]);
      }
      var dict = {};
      var recurse = function(root, string) {
        if (root.constructor === Array) {
          recurse(root[0], string + '0');
          recurse(root[1], string + '1');
        } else {
          dict[root] = string;
        }
      };
      tree.items = tree.pop()[1];
      recurse(tree.items, '');
      var result = '';
      for (var i = 0; i < data.length; i++) {
        result += dict[data.charAt(i)];
      }
      var header = Object.keys(dict).map(function(e) {
        return e.charCodeAt(0) + '|' + dict[e];
      }).join('-') + '/';
      return header + result;
    },
    decode: function(string) {
      string = string.split('/');
      var data = string[1].split(''),
          header = {};
      string[0].split('-').forEach(function(e) {
        var values = e.split('|');
        header[values[1]] = String.fromCharCode(values[0]);
      });
      var result = '';
      while (data.length) {
        var i = 0,
            cur = '';
        while (data.length) {
          cur += data.shift();
          if (header.hasOwnProperty(cur)) {
            result += header[cur];
            break;
          }
        }
      }
      return result;
    }
  };
  //</stolenCode>

  var node = function(v){
    this.array = [];
    this.value = v;
  };

  node.prototype = {
    get IsLeafNode(){
      return this.array.length == 0;
    },
    get valueString(){
      var t = this.value.toString(2);
      while(t.length < 8){
        t = "0"+t;
      }
      if(t.length != 8)throw 'you can not encode strings containing non ascii characters';
      return t;
    },
    toString:function(){
      if(this.IsLeafNode){
        return "1"+this.valueString;
      }else{
        return "0"+this.array[0].toString()+this.array[1].toString();
      }
    },
    flatten:function(path){
      if(path == undefined)path = "";
      if(this.IsLeafNode){
        return this.value.toString(10)+"|"+path;
      }else{
        var r = '';
        r += this.array[0].flatten(path+"0");
        r += '-';
        r += this.array[1].flatten(path+"1");
        return r;
      }
    }
  }; 

  Object.defineProperty(node.prototype, "0", {
    get: function(){
      if(this.array[0] != undefined)return this.array[0];
      return this.array[0] = new node();
    }
  });
  Object.defineProperty(node.prototype, "1", {
    get: function(){
      if(this.array[1] != undefined)return this.array[1];
      return this.array[1] = new node();
    }
  });

  var readTree = function(str){
    var arr = str.split("-").map(e => e.split("|"));
    var tree = new node();
    for (var i = 0; i < arr.length; i++) {
      var code = arr[i][1].split("");
      var t = tree;
      for (var j = 0; j < code.length; j++) {
        t = t[code[j]];
      }
      t.value = parseInt(arr[i][0]);
      if(t.value > 255)throw 'you can not encode strings containing non ascii characters';
    }
    return tree;
  };

  var readTree2 = function(strBox){
    if(typeof strBox == "string")strBox = [strBox];
    var str = strBox[0];
    var tree;
    var bit = str[0];
    str = str.substr(1);
    if(bit == "1"){
      tree = new node(parseInt(str.substr(0,8),2));
      str = str.substr(8);
    }else{
      strBox[0] = str;
      var n0 = readTree2(strBox);
      var n1 = readTree2(strBox);
      str = strBox[0];
      tree = new node();
      tree.array = [n0,n1];
    }
    strBox[0] = str;
    return tree;
  };

  var base64Rom = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','0','1','2','3','4','5','6','7','8','9','+','/'];

  var toBase64 = function(str){
    while(str.length%6!=0){
      str = "1"+str;
    }
    return str.match(/.{1,6}/g).map(e => base64Rom[parseInt(e,2)]).join("");
  };

  var fromBase64 = function(str){
    var r = str.split("").map(e => {
      var t = base64Rom.indexOf(e).toString(2);
      while(t.length < 6){
        t = "0"+t;
      }
      return t;
    }).join('');
    return r.replace(/^1*/,"");
  };

  var result = {toBase64:toBase64,fromBase64:fromBase64};
  result.encode = function(str){
    var t = Huffman.encode(str).split("/");
    var r = readTree(t[0]).toString()+t[1];
    r = toBase64(r);
    return (r); 
  };

  result.decode = function(str){
    str = fromBase64(str);
    var box = [str];
    var f = readTree2(box).flatten();
    return Huffman.decode(f+"/"+box[0]);
  };

  return result;
})();