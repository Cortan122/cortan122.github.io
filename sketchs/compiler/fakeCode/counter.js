eval loadString('1 2 10 20 13 23 31 32 40 50 43 53 61 62 64 64',16,0x3d0);
eval loadString('77 24 5d 6d 2e 6b 7b 25 7f 6f 3f 7a 53 7c 5b 1b 0 3a 12 74 0 52 0 38 77 1f 2f 0 6b 5a 76',16,0x3a0);
eval drawMode1 = true;
var arr array(16) as %0x3d0;
var charTable array(42) as %0x3a0;
/*var PIXEL as %0xfe;
var COLOR as %0xff;
var INPUT as %0xfd;*/
var data;var data1;var offset;var inc;var cat;var t;var inc1;var cat1;var t1;

function drawSegments{
  inc = 0;cat = 1;
  do{
    var a = inc << 1;
    PIXEL = arr[a];
    PIXEL += offset;
  
    t = data & cat;
    cat <<= 1;
    COLOR = 0;
    if(t <= 255){
      COLOR = 255;
    };
    
    # dis;//t = 1*127;//wait
    a++;//a += 1;
    PIXEL = arr[a];
    PIXEL += offset;
    # dis;//t = 1*127;//wait
    
    inc++;
  }while(inc <= 6);
};

function drawChar{
  data = charTable[INPUT];
  drawSegments();
  //offset += 0x3fb;
  offset += MAX_VALUE-5;
};

function drawNumber{
  inc1 = 0;cat1 = 15;offset = 10;t1 = data1;
  do{
    INPUT = t1 & cat1;
    t1 >>= 4;
    drawChar();
    inc1++;
  }while(inc1 <= 1);
};

data1 = 0;
do{
  data1++;
  drawNumber();
}while(true);

/* //checing for inputs
do{
  if(input <= 255){
    input += 0x3ff;
    drawChar();
    input = 0;
  };
}while(true);
*/