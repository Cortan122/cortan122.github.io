eval drawMode = true;
eval scl = 5+1/2;                        
eval loadString('3E 51 49 45 3E 00 42 7F 40 00 42 61 51 49 46 21 41 45 4B 31 18 14 12 7F 10 27 45 45 45 39 3C 4A 49 49 30 01 71 09 05 03 36 49 49 49 36 06 49 49 29 1E 7E 11 11 11 7E 7F 49 49 49 36 3E 41 41 41 22 7F 41 41 22 1C 7F 49 49 49 41 7F 09 09 01 01 3E 41 41 51 32 7F 08 08 08 7F 00 41 7F 41 00 20 40 41 3F 01 7F 08 14 22 41 7F 40 40 40 40 7F 02 04 02 7F 7F 04 08 10 7F 3E 41 41 41 3E 7F 09 09 09 06 3E 41 51 21 5E 7F 09 19 29 46 46 49 49 49 31 01 01 7F 01 01 3F 40 40 40 3F 1F 20 40 20 1F 7F 20 18 20 7F 63 14 08 14 63 03 04 78 04 03 61 51 49 45 43 00 00 7F 41 41 02 04 08 10 20 41 41 7F 00 00 04 02 01 02 04 40 40 40 40 40 00 00 5F 00 00 00 07 00 07 00 14 7F 14 7F 14 24 2A 7F 2A 12 23 13 08 64 62 36 49 55 22 50 00 05 03 00 00 00 1C 22 41 00 00 41 22 1C 00 08 2A 1C 2A 08 08 08 3E 08 08 00 50 30 00 00 08 08 08 08 08 00 60 60 00 00 20 10 08 04 02 00 36 36 00 00 00 56 36 00 00 00 08 14 22 41 14 14 14 14 14 41 22 14 08 00 02 01 51 09 06 32 49 79 41 3E 20 54 54 54 78 7F 48 44 44 38 38 44 44 44 20 38 44 44 48 7F 38 54 54 54 18 08 7E 09 01 02 08 14 54 54 3C 7F 08 04 04 78 00 44 7D 40 00 20 40 44 3D 00 00 7F 10 28 44 00 41 7F 40 00 7C 04 18 04 78 7C 08 04 04 78 38 44 44 44 38 7C 14 14 14 08 08 14 14 18 7C 7C 08 04 04 08 48 54 54 54 20 04 3F 44 40 20 3C 40 40 20 7C 1C 20 40 20 1C 3C 40 30 40 3C 44 28 10 28 44 0C 50 50 50 3C 44 64 54 4C 44 00 01 02 04 00 00 08 36 41 00 00 00 7F 00 00 00 41 36 08 00 08 08 2A 1C 08 08 1C 2A 08 08 00 00 00 00 00',16,0x300);
var font array(255) as %0x300;

var i;var line;var t;
function drawLine{
  i = 1;
  do{ 
    t = line & i;
    COLOR = 0;
    if(t <= 255){
      COLOR = 255;
    };
    # dis;
    i <<= 1;
    PIXEL_Y++;
  }while(i != 0);
  PIXEL_Y += MAX_VALUE-7;
};

var i1;var char;var t1;
function drawChar{
  //PIXEL_X = 0;
  t1 = char*5;
  i1 = 5;
  do{
    line = font[t1];
    drawLine();
    PIXEL_X++;
    t1++;
    i1--;
  }while(i1 != 0);
  line = 0;
  drawLine();
  PIXEL_X++;
};

function drawFont{
  char = 0;
  do{
    drawChar(); 
    char++;
    t1 = char & 0b11111;
    if(t1 != 0){}else{
      PIXEL_Y += 8;
      PIXEL_X = 0;
    };
  }while(char != 50);
};

function drawCursor{
  i = 5;
  PIXEL_Y += 7;
  do{
    # dis;
    PIXEL_X++;
    i--;
  }while(i != 0);
  PIXEL_X += MAX_VALUE-4;
  PIXEL_Y+= MAX_VALUE-6;
};

function undrawCursor{
  COLOR = 0;
  drawCursor();
};

var timer = 0xff;
function blink{
  timer++;
  if(timer != 0){
    if(timer != 0x80){}else{
      undrawCursor();
    };
  }else{
    COLOR = MOUSE_X;
    drawCursor();
  };
};

drawFont();

do{
  if(INPUT != 0){
    undrawCursor();
    timer = 0xff;
    if(INPUT != 0xde){//enter
      if(INPUT != 0xf8){//->
        if(INPUT != 0xf6){//<-
          if(INPUT != 0xf7){//^
            if(INPUT != 0xf9){//\/
              //default behavior
              char = INPUT;
              char--;
              drawChar();
            }else{
              //\/
              PIXEL_Y += 8;
            };
          }else{
            //^
            PIXEL_Y += MAX_VALUE-7;
          };
        }else{
          //<-
          PIXEL_X += MAX_VALUE-5;
        };
      }else{
        //->
        PIXEL_X += 6;
      };
    }else{
      //enter
      PIXEL_Y += 8;
      PIXEL_X = 0;
    };
    INPUT = 0;
  };
  blink();
}while(true);