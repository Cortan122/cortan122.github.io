const rom = {
  " ": "|",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  "a": ".-",
  "b": "-...",
  "c": "-.-.",
  "d": "-..",
  "e": ".",
  "f": "..-.",
  "g": "--.",
  "h": "....",
  "i": "..",
  "j": ".---",
  "k": "-.-",
  "l": ".-..",
  "m": "--",
  "n": "-.",
  "o": "---",
  "p": ".--.",
  "q": "--.-",
  "r": ".-.",
  "s": "...",
  "t": "-",
  "u": "..-",
  "v": "...-",
  "w": ".--",
  "x": "-..-",
  "y": "-.--",
  "z": "--..",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "'": ".----.",
  "!": "-.-.--",
  "/": "-..-.",
  "(": "-.--.",
  ")": "-.--.-",
  "&": ".-...",
  ":": "---...",
  ";": "-.-.-.",
  "=": "-...-",
  "+": ".-.-.",
  "-": "-....-",
  "_": "..--.-",
  "\"": ".-..-.",
  "$": "...-..-",
  "@": ".--.-.",
  "\n": ".-.-",
  "\0": "...-.-",
};

const rom2 = {
  "-": "1110",
  ".": "10",
  "|": "00",
};

const ccode = `
char* str = "{}";
int realFrequency = 8000;
int speed = 20;
int frequency = 500;

int main(){
  for(int i = 0; i < strlen(str); i++){
    char v = 0;
    for(int j = 0; j < realFrequency/speed; j++){
      putchar(str[i]=='1'?v:0);
      v += 256*frequency/realFrequency;
    }
  }
  return 0;
}
`;

const revrom = {};
for(var k in rom)revrom[rom[k]] = k;
const cp = require('child_process');

const code = str=>str.toLowerCase().split('').map(e=>rom[e]||"........").join('|');
const bin = str=>code(str).split('').map(e=>rom2[e]).join('');
const play = str=>void cp.exec("tcc -run - | aplay").stdin.end(ccode.replace('{}',bin(str)), a=>a);
const play_wav = str=>void cp.exec("tcc -run - > morseCode.raw && sox -r 8000 -e unsigned -b 8 -c 1 morseCode.raw morseCode.wav && termux-media-player play morseCode.wav").stdin.end(ccode.replace('{}',bin(str)), a=>a);
const decode = str=>str.replace(/\|\|\|/g,'| |').split('|').map(e=>revrom[e]||" ").join('');
const debin = str=>decode(Object.keys(rom2).reduce((s,e)=>s.replace(RegExp(rom2[e],'g'), e), str));

module.exports = {code,bin,play,decode,debin,play_wav};

if(require.main == module){
  var cmd = process.argv[2];
  if(!module.exports[cmd])return console.error("Unknown command: "+cmd);
  var f = e=>{
    var t = module.exports[cmd](e);
    if(t)console.log(t);
  }
  if(process.argv[3])f(process.argv[3]);
  else process.stdin.on('data', e=>f(e.toString('utf8')) );
}
