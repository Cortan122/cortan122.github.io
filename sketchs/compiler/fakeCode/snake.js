eval loadString('3ff 3e0 1 20',16,0x3d0);
eval loadString('01 02 20 40 23 43 61 62 80 a0 83 a3 c1 c2',16,0x3c2);
eval loadString('77 24 5d 6d 2e 6b 7b 25 7f 6f 3f 7a 53 7c 5b 1b 00',16,0x3b0);
//eval clockDelay = -100;
eval drawMode1 = false;
var dirs array(4) as %0x3d0;
var arr array(14) as %0x3c2;
var charTable array(17) as %0x3b0;
var snake array(176) as %0x300;
/*var PIXEL as %0x3fe;
var COLOR as %0x3ff;
var INPUT as %0x3fd;*/
var snakeLength = 1;var inc;var dir = 1;var t;var t1;var seed;
var data;var offset;var cat;var inc1;var cat1;var isShowingScore;

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
    # dis;
    a++;
    PIXEL = arr[a];
    PIXEL += offset;
    # dis;
    inc++;
  }while(inc <= 6);
};

function drawChar{
  data = charTable[INPUT];
  drawSegments();
  offset += MAX_VALUE-4;
};

function drawNumber{
  inc1 = 0;cat1 = 15;offset = 5;t1 = snakeLength + 1;
  do{
    INPUT = t1 & cat1;
    t1 >>= 4;
    drawChar();
    inc1++;
  }while(inc1 <= 1);
  INPUT = 0;
};

function draw{
  inc = 0;
  do{
    PIXEL = snake[inc];
    COLOR = inc+0x4f;//COLOR = 255;
    # dis;
    inc++;
  }while(inc <= snakeLength);
  PIXEL = seed;
  COLOR = 1;
  # dis;
};

function rand{
  seed = seed * 99;
  seed += 97;
};

function shift{
  inc = snakeLength;
  do{
    t = inc+MAX_VALUE;
    snake[inc] = snake[t];
    inc--;
  }while(inc != 0);
};

function isValid{
  inc = 1;t = snake[0];
  do{
    t1 = snake[inc];
    if(t != t1){}else{
      snakeLength = inc;
      return;
    };
    inc++;
  }while(inc <= snakeLength);
};

function isEating{
  t = snake[0];
  if(t != seed){}else{
    rand();
    t = snakeLength;
    snakeLength++;
    snake[snakeLength] = snake[t];
  };
};

function move{
  PIXEL = snake[snakeLength];
  COLOR = 0;
  # dis;
  shift();
  snake[0] = snake[1];
  snake[0] += dir;
  isValid();
  isEating();
  draw();
};

function updateDir{
  if(INPUT != 29){
    if(INPUT != 5){//checkValid ^= 1;snakeLength = 16;};
      t = INPUT + 10;
      dir = dirs[t];
      if(isShowingScore != 0){
        isShowingScore = 0;
        INPUT = 16;
        offset = 5;
        drawChar();
        drawChar();
      };
    }else{
      snakeLength++;
    };
  }else{
    dir = 0;
    isShowingScore = 1;
    drawNumber();
  };
};

do{
  if(INPUT <= MAX_VALUE){
    updateDir();
    INPUT = 0;
    if(dir != 0){move();};
  };
}while(true);