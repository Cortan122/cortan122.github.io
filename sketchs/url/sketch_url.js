var inp;
var button;
function setup() {  
  if (localStorage["yourName"]){
    createP('welcome back');
    createP('here is youre link');
    var a = createA('http://192.168.1.68/sketchs/sketch_url/?name=' + localStorage["yourName"],'http://192.168.1.68/sketchs/sketch_url/?name=' + localStorage["yourName"]);
    button = createButton('debug');
    button.mousePressed(new Function('localStorage["yourName"] = "";'));
  }else{
    inp = createInput('name');
    button = createButton('confirm');
    //button.position(19, 19);
    button.mousePressed(popup);
  }
}

function draw() {}

function popup() {
  createP('here is youre link');
  var a = createA('http://192.168.1.68/sketchs/sketch_url/?name=' + inp.value(),'http://192.168.1.68/sketchs/sketch_url/?name=' + inp.value());
  localStorage["yourName"] = inp.value();
  var pname = getParameterByName('name');
  if(pname !== null){
    createP(pname + ' will be happy');
  }
}


//not my code
function getParameterByName(name, url) {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function permutations(/*Set<Integer> */items, /*Stack<Integer>*/ permutation, /*int*/ size) {
  var r = [];
  /* permutation stack has become equal to size that we require */
  if(permutation.length == size) {
    /* print the permutation */
    //System.out.println(Arrays.toString(permutation.toArray(new Integer[0])));
    //print(permutation);
    return [permutation.slice()];
  }

  /* items available for permutation */
  var availableItems = items.slice();
  for (var _i = 0; _i < availableItems.length; _i++) {
    var i = availableItems[_i];
    if(i === null||i === undefined)continue;
    /* add current item */
    permutation.push(i);

    /* remove item from available item set */
    items.remove(i);

    /* pass it on for next permutation */
    r = r.concat(permutations(items, permutation, size));

    /* pop and put the removed item back */
    items.push(permutation.pop());
  }
  return r;
}

function convertToBase(n,base) {
  var r = [];
  var t = n;
  while(t.compare(1) != -1){
    r.push(t.mod(base).toJSNumber());
    t = t.divide(base);
  }
  return r.reverse();
}

var dic = ['0','1','2','3','4','5','6','7','8','9',"A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z",'!','#','$','%','&','(',')','*','+','-',';','<','=','>','?','@','^','_','`','{','|','}','~'];