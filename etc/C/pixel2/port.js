const fs = require('fs');
const png = require('pngjs').PNG.sync;

const img = png.read(fs.readFileSync("in.png"));
const print = (...x)=>process.stdout.write(x.join(''));
const windowSizeY = img.height;
const halfChar = "\xde"; // \xde ▐

function line(y){
  if(y<0 || y>=img.height)return '';
  var res = "";
  for(var x = 0; x < img.width; x++){
    var idx = (img.width * y + x) << 2;
    var r = img.data[idx+0];
    var g = img.data[idx+1];
    var b = img.data[idx+2];
    if(x%2)res += `\x1b[38;2;${r};${g};${b}m${halfChar}`;
    res += `\x1b[48;2;${r};${g};${b}m `;
  }
  res += '\x1b[0m';
  return res;
}

var res = "\x1b[?1049h\x1b[?25l";
for(var y = 0; y < img.height; y++){
  res += line(y);
  if(y != img.height-1)res += '\n';
}

process.on('exit', ()=>{
  print("\x1b[0m\x1b[?1049l\x1b[?25h");
});
print(res);

var shiftY = 0;
var shiftX = 0;

process.stdin.setRawMode(1);
process.stdin.on('data',x=>{
  while(x.length){
    if(x[0] == 3){
      x = x.slice(1);
      process.exit();
    }else if(x[0] >= 0x20){
      x = x.slice(1);
      print("\x1b[0m","\x1b[1;1H","\x1b[0K","Use Ctrl-c to exit!!");
    }else if(x.toString('ascii').startsWith("\x1b[A")){
      shiftY++;
      x = x.slice(3);
      print("\x1b[1S");
      print(`\x1b[${windowSizeY};1H`, line(shiftY+windowSizeY));
    }else if(x.toString('ascii').startsWith("\x1b[B")){
      shiftY--;
      x = x.slice(3);
      print("\x1b[1T");
      print(`\x1b[1;1H`, line(shiftY));
    }else{
      console.log(x);
      return;
    }
  }
});

