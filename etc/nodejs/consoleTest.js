const size = require('window-size');

var r = "";
for(var i = 0 ; i < size.height-2; i++){
  for(var j = 0 ; j < size.width; j++){
    r += `\x1b[38;2;${Math.floor(Math.random()*256)};${Math.floor(Math.random()*256)};${Math.floor(Math.random()*256)}m`;
    r += `\x1b[48;2;${Math.floor(Math.random()*256)};${Math.floor(Math.random()*256)};${Math.floor(Math.random()*256)}m`;
    r += String.fromCharCode(Math.floor(Math.random()*0x5d)+0x21);
  }
}

r += '\x1b[0m'
console.clear();
console.time();
if(process.argv[2]=='--fast'){
  process.stdout.write(r);
}else{
  console.log(r);
}
console.timeEnd();
