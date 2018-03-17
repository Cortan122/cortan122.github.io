var fs = require('fs');

var abc = "\x61\u0430";
var getvarname = (t)=>{
  if(typeof t == "string")t = parseInt(t);
  var str='';
  for(var ii=0;ii<16;ii++){
    str+=abc[t&1];
    t>>=1;
  }
  return str;
};

function getsemicols(str){
  var numb = 0;
  var r = [];
  for (var i = 0; i < str.length; i++) {
    if(str[i] == '{')numb++;
    if(str[i] == '}')numb--;
    if(numb<0)throw 'numb<0';
    if(numb==0&&str[i] == ';')r.push(i);
  }
  return r;
}

function setCharAt(str,index,chr) {
  if(index > str.length-1) return str;
  return str.substr(0,index) + chr + str.substr(index+1);
}

fs.readFile('obinit.js', 'utf8', function(err, contents) {
  if(err)throw err;

  var r = (a,b)=>{contents = contents.replace(a,b);};

  r(/GOT/g,getvarname(0));
  r(/crtvar/g,getvarname(1));
  //r(/chooseA/g,getvarname(2));

  var arr = [];
  var i = 0;
  r(/\/\/@(\w+) \/\*@([0-9]+)\*\//g,(_0,_1,_2)=>{
    if(_2=="000"){
      arr.push([_1,getvarname(i+100)]);
    }else{
      arr.push([_1,getvarname(_2)]);
    }
    i++;
    return "//";
  });
  for (var i = 0; i < arr.length; i++) {
    r(new RegExp('\\b'+arr[i][0]+'\\b','g'),arr[i][1]);
  }

  r(/\/\*@([0-9]+)\*\//g,(_0,_1)=>getvarname(_1));

  r(/\/\*[\s\S]*?\*\/|(.|^)\/\/.*$/gm,"$1");//remove comments

  r(/\s+/g,' ');
  r(/([^a-zA-Z0-9_а])( )([^a-zA-Z0-9_а])/gu,"$1$3");
  r(/([a-zA-Z0-9_а])( )([^a-zA-Z0-9_а])/gu,"$1$3");
  r(/([^a-zA-Z0-9_а])( )([a-zA-Z0-9_а])/gu,"$1$3");

  r(/\b([0-9]+)\b/g,(_0,_1)=>"0b"+parseInt(_1).toString(2));

  var cols = getsemicols(contents);
  for (var i = 0; i < cols.length; i++) {
    contents = setCharAt(contents,cols[i],',');
  }
  contents = '(()=>{})('+contents+'0)';

  fs.writeFile('main.js', contents, function(err) {if(err)throw err;});
});