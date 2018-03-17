eval loadString('1 2 10 20 13 23 31 32 40 50 43 53 61 62 64 64',16,0x3d0);
eval loadString('77 24 5d 6d 2e 6b 7b 25 7f 6f 3f 7a 53 7c 5b 1b 0 3a 12 74 0 52 0 38 77 1f 2f 0 6b 5a 76',16,0x3a0);
eval drawMode1 = true;
var arr array(16) as %0x3d0;
var charTable array(42) as %0x3a0;
var graphicIndex as %0x3fe;
var color as %0x3ff;
var input as %0x3fd;
var data;var offset;var inc;var cat;var t;

function drawSegments{
  inc = 0;cat = 1;
  do{
    var a = inc << 1;
    //graphicIndex = arr _arrayget a;
    graphicIndex = arr[a];
    graphicIndex += offset;
  
    t = data & cat;
    cat <<= 1;
    color = 0;
    if(t <= 255){
      color = 255;
    };
    
    # dis;//t = 1*127;//wait
    a++;//a += 1;
    graphicIndex = arr[a];
    graphicIndex += offset;
    # dis;//t = 1*127;//wait
    
    inc++;
  }while(inc <= 6);
};

function drawChar{
  data = charTable[input];
  drawSegments();
  offset += 5;
};

//checing for inputs
do{
  if(input <= MAX_VALUE){
    input += MAX_VALUE;
    drawChar();
    input = 0;
  };
}while(true);
