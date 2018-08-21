var allowed = [];
var allowed_i = [];
var notallowed = [];
var notallowed_i = [];

var print = e => process.stdout.write(e);
var log = console.log;

for (var i = 0; i < 40000; i++) {
  var char = String.fromCharCode(i);
  var b = true;
  try{
    eval('let _'+char+' = 1');
  }catch(e){
    b = false;
    notallowed.push(char);
    notallowed_i.push(i);
  }
  if(b){
    allowed.push(char);
    allowed_i.push(i);
  }
}

log(allowed.join(''));