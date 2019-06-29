#include "config.h"
#include "ascii.h"
#include "palette.c"

extern void plot_pixel(int x, int y, uint8_t r, uint8_t g, uint8_t b);

uint8_t dirArr[0x100];
uint8_t pixelArr[0x10000];
int mult;
int screenOffset_x = 0;
int screenOffset_y = 0;

void pixel(uint16_t pos, uint8_t colorid){
  pixelArr[pos] = colorid;
  uint32_t c = palette[colorid];
  int x0 = (pos%0x100)*mult + screenOffset_x;
  int y0 = (pos/0x100)*mult + screenOffset_y;
  for(int x = 0; x < mult; x++){
    for(int y = 0; y < mult; y++){
      plot_pixel(x0+x, y0+y, (c>>0)&0xff, (c>>8)&0xff, (c>>16)&0xff);
    }
  }
}

void memset(uint8_t *p, int c, size_t n){
  while(n--)*p++ = (uint8_t)c;
}

void memcpy(uint8_t *dest, const uint8_t *src, size_t n){
  while(n--)*dest++ = *src++;
}

char sprintint_buffer[] = "000000";

char* sprintint(uint16_t t,char* str){
  if(str==0){
    str = sprintint_buffer+5;
    if(t==0){
      str[0] = '0';
      return str;
    }
  }
  if(t==0){
    return str+1;
  }
  str[0] = t%10+'0';
  t = t/10;
  return sprintint(t,str-1);
}

const uint8_t charSize = 6;
const uint8_t bgColor = 0;
const uint8_t fgColor = 255;
const uint8_t sizeInBits_screen = 6;

uint8_t sizeInBits;
uint8_t timerMax;
bool usePixelMultiplier;
bool centerScreen;
bool loopAround;
bool permadeath;
uint16_t initPos_text = 12;

uint8_t cursorX = 0;
uint8_t cursorY = 0;
uint8_t headX = 0;
uint8_t headY = 0;
uint8_t tailX;
uint8_t tailY;
uint8_t appleX;
uint8_t appleY;
uint8_t prevdir = 0;
uint8_t timer = 0;
bool invertedSnakeParity = 0;
bool tailParity = 0;
uint16_t score = 1;
uint16_t moves = 0;
uint16_t deaths = 0;
uint16_t rngState = 0;

const uint8_t font[] = {
  0x00,0x00,0x00,0x00,0x00,   //   0x20 32
  0x00,0x00,0x6f,0x00,0x00,   // ! 0x21 33
  0x00,0x07,0x00,0x07,0x00,   // " 0x22 34
  0x14,0x7f,0x14,0x7f,0x14,   // # 0x23 35
  0x24,0x2a,0x6b,0x2a,0x12,   // $ 0x24 36
  0x23,0x13,0x08,0x64,0x62,   // % 0x25 37
  0x36,0x49,0x56,0x20,0x50,   // & 0x26 38
  0x00,0x00,0x07,0x00,0x00,   // ' 0x27 39
  0x00,0x1c,0x22,0x41,0x00,   // ( 0x28 40
  0x00,0x41,0x22,0x1c,0x00,   // ) 0x29 41
  0x14,0x08,0x3e,0x08,0x14,   // * 0x2a 42
  0x08,0x08,0x3e,0x08,0x08,   // + 0x2b 43
  0x00,0x50,0x30,0x00,0x00,   // , 0x2c 44
  0x08,0x08,0x08,0x08,0x08,   // - 0x2d 45
  0x00,0x60,0x60,0x00,0x00,   // . 0x2e 46
  0x20,0x10,0x08,0x04,0x02,   // / 0x2f 47
  0x3e,0x51,0x49,0x45,0x3e,   // 0 0x30 48
  0x00,0x42,0x7f,0x40,0x00,   // 1 0x31 49
  0x42,0x61,0x51,0x49,0x46,   // 2 0x32 50
  0x21,0x41,0x45,0x4b,0x31,   // 3 0x33 51
  0x18,0x14,0x12,0x7f,0x10,   // 4 0x34 52
  0x27,0x45,0x45,0x45,0x39,   // 5 0x35 53
  0x3c,0x4a,0x49,0x49,0x30,   // 6 0x36 54
  0x01,0x71,0x09,0x05,0x03,   // 7 0x37 55
  0x36,0x49,0x49,0x49,0x36,   // 8 0x38 56
  0x06,0x49,0x49,0x29,0x1e,   // 9 0x39 57
  0x00,0x36,0x36,0x00,0x00,   // : 0x3a 58
  0x00,0x56,0x36,0x00,0x00,   // ; 0x3b 59
  0x08,0x14,0x22,0x41,0x00,   // < 0x3c 60
  0x14,0x14,0x14,0x14,0x14,   // = 0x3d 61
  0x00,0x41,0x22,0x14,0x08,   // > 0x3e 62
  0x02,0x01,0x51,0x09,0x06,   // ? 0x3f 63
  0x3e,0x41,0x5d,0x49,0x4e,   // @ 0x40 64
  0x7e,0x09,0x09,0x09,0x7e,   // A 0x41 65
  0x7f,0x49,0x49,0x49,0x36,   // B 0x42 66
  0x3e,0x41,0x41,0x41,0x22,   // C 0x43 67
  0x7f,0x41,0x41,0x41,0x3e,   // D 0x44 68
  0x7f,0x49,0x49,0x49,0x41,   // E 0x45 69
  0x7f,0x09,0x09,0x09,0x01,   // F 0x46 70
  0x3e,0x41,0x49,0x49,0x7a,   // G 0x47 71
  0x7f,0x08,0x08,0x08,0x7f,   // H 0x48 72
  0x00,0x41,0x7f,0x41,0x00,   // I 0x49 73
  0x20,0x40,0x41,0x3f,0x01,   // J 0x4a 74
  0x7f,0x08,0x14,0x22,0x41,   // K 0x4b 75
  0x7f,0x40,0x40,0x40,0x40,   // L 0x4c 76
  0x7f,0x02,0x0c,0x02,0x7f,   // M 0x4d 77
  0x7f,0x04,0x08,0x10,0x7f,   // N 0x4e 78
  0x3e,0x41,0x41,0x41,0x3e,   // O 0x4f 79
  0x7f,0x09,0x09,0x09,0x06,   // P 0x50 80
  0x3e,0x41,0x51,0x21,0x5e,   // Q 0x51 81
  0x7f,0x09,0x19,0x29,0x46,   // R 0x52 82
  0x46,0x49,0x49,0x49,0x31,   // S 0x53 83
  0x01,0x01,0x7f,0x01,0x01,   // T 0x54 84
  0x3f,0x40,0x40,0x40,0x3f,   // U 0x55 85
  0x0f,0x30,0x40,0x30,0x0f,   // V 0x56 86
  0x3f,0x40,0x30,0x40,0x3f,   // W 0x57 87
  0x63,0x14,0x08,0x14,0x63,   // X 0x58 88
  0x07,0x08,0x70,0x08,0x07,   // Y 0x59 89
  0x61,0x51,0x49,0x45,0x43,   // Z 0x5a 90
  0x00,0x00,0x7f,0x41,0x00,   // [ 0x5b 91
  0x02,0x04,0x08,0x10,0x20,   // \ 0x5c 92
  0x00,0x41,0x7f,0x00,0x00,   // ] 0x5d 93
  0x04,0x02,0x01,0x02,0x04,   // ^ 0x5e 94
  0x40,0x40,0x40,0x40,0x40,   // _ 0x5f 95
  0x00,0x00,0x03,0x04,0x00,   // ` 0x60 96
  0x20,0x54,0x54,0x54,0x78,   // a 0x61 97
  0x7f,0x48,0x44,0x44,0x38,   // b 0x62 98
  0x38,0x44,0x44,0x44,0x20,   // c 0x63 99
  0x38,0x44,0x44,0x48,0x7f,   // d 0x64 100
  0x38,0x54,0x54,0x54,0x18,   // e 0x65 101
  0x08,0x7e,0x09,0x01,0x02,   // f 0x66 102
  0x0c,0x52,0x52,0x52,0x3e,   // g 0x67 103
  0x7f,0x08,0x04,0x04,0x78,   // h 0x68 104
  0x00,0x44,0x7d,0x40,0x00,   // i 0x69 105
  0x20,0x40,0x44,0x3d,0x00,   // j 0x6a 106
  0x00,0x7f,0x10,0x28,0x44,   // k 0x6b 107
  0x00,0x41,0x7f,0x40,0x00,   // l 0x6c 108
  0x7c,0x04,0x18,0x04,0x78,   // m 0x6d 109
  0x7c,0x08,0x04,0x04,0x78,   // n 0x6e 110
  0x38,0x44,0x44,0x44,0x38,   // o 0x6f 111
  0x7c,0x14,0x14,0x14,0x08,   // p 0x70 112
  0x08,0x14,0x14,0x18,0x7c,   // q 0x71 113
  0x7c,0x08,0x04,0x04,0x08,   // r 0x72 114
  0x48,0x54,0x54,0x54,0x20,   // s 0x73 115
  0x04,0x3f,0x44,0x40,0x20,   // t 0x74 116
  0x3c,0x40,0x40,0x20,0x7c,   // u 0x75 117
  0x1c,0x20,0x40,0x20,0x1c,   // v 0x76 118
  0x3c,0x40,0x30,0x40,0x3c,   // w 0x77 119
  0x44,0x28,0x10,0x28,0x44,   // x 0x78 120
  0x0c,0x50,0x50,0x50,0x3c,   // y 0x79 121
  0x44,0x64,0x54,0x4c,0x44,   // z 0x7a 122
  0x00,0x08,0x36,0x41,0x41,   //  0x7b 123
  0x00,0x00,0x7f,0x00,0x00,   // | 0x7c 124
  0x41,0x41,0x36,0x08,0x00,   // } 0x7d 125
  0x04,0x02,0x04,0x08,0x04   // ~ 0x7e 126
};

const uint8_t palettes[] = {
  //blueberry
  239,41,57,19,2,35,18,0,
  //redberry
  239,76,197,124,2,70,88,0,
  //cyanberry
  239,41,87,37,2,35,30,0,
  //orangeberry
  239,76,178,202,2,70,166,0
};

const uint8_t tilemap[] = {
  //empty
  0x00,0x00,
  0x00,0x00,
  0x00,0x00,
  0x00,0x00,
  //berry
  0x00,0x10,
  0x23,0x45,
  0x33,0x30,
  0x66,0x60,
  //head
  0x01,0x10,
  0x11,0x11,
  0x74,0x47,
  0x11,0x11,
  //body
  0x11,0x11,
  0x99,0x99,
  0x11,0x11,
  0x99,0x99,
  //tail
  0x11,0x11,
  0x99,0x99,
  0x01,0x10,
  0x00,0x00,
  //bend
  0x11,0x11,
  0x99,0x91,
  0x01,0x91,
  0x00,0x91
};

const uint8_t dirToRot[] = {0,6,3,5};
const uint8_t dirToRot_inverted[] = {1,4,2,7};

void printCharLineAtPos(uint16_t pos,uint8_t byte){
  uint8_t m = 1;
  while(m != 0x80){
    if(byte&m){
      pixel(pos, fgColor);
    }else{
      pixel(pos, bgColor);
    }
    pos = pos+0x100;
    m = m<<1;
  }
}

void printCharAtPos(char c,uint16_t pos){
  char i = 0;
  while(i != charSize-1){
    printCharLineAtPos(pos,font[c*(charSize-1)+i]);
    i++;
    pos++;
  }
  printCharLineAtPos(pos,0);
}

void printChar(char c){
  printCharAtPos(c-' ', cursorX*charSize + initPos_text + (cursorY<<11));
}

void printString(char* str){
  while(1){
    char c = str[0];
    if(c=='\0')return;
    printChar(c);
    cursorX++;
    str++;
  }
}

void drawTile(int x,int y,int tileId,int paletteId,int rot){
  uint8_t i = 0;

  i = sizeInBits_screen+4;
  x = (x<<2)+(y<<i);

  i = 0;
  const uint8_t* tile = tilemap+(tileId<<3);
  while(i != 16){
    uint8_t tx;uint8_t ty;
    if(rot&0b100){
      ty = i&3;
      tx = (i&12)>>2;
    }else{
      tx = i&3;
      ty = (i&12)>>2;
    }
    if(rot&0b010)ty = 3-ty;
    if(rot&0b001)tx = 3-tx;

    uint8_t tsh = sizeInBits_screen+2;
    uint16_t t = tx + (ty<<tsh) + x;
    uint8_t color = tile[i>>1];
    if((1+i)&1){
      color = color>>4;
    }
    color = ((color&0xf)^((paletteId&1)<<3)) | ((paletteId&0xfe)<<3);
    pixel(t, palettes[color]);
    i = i+1;
  }
}

void setdir(int x,int y,int dir){
  uint8_t t = sizeInBits-2;
  y = (y<<t)+(x>>2);
  t = (x&3)<<1;
  uint8_t* ptr = dirArr+y;
  ptr[0] = (ptr[0]&((3<<t)^0xff)) | (dir<<t);
}

int getdir(int x,int y){
  uint8_t t = sizeInBits-2;
  y = (y<<t)+(x>>2);
  t = (x&3)<<1;
  uint8_t* ptr = dirArr+y;
  return (ptr[0]&(3<<t))>>t;
}

bool isTileEmpty(int x,int y){
  uint8_t t = sizeInBits_screen+2;
  y = (y<<2)+1;
  uint8_t* z = pixelArr+(x<<2)+(y<<t)+1;
  y = 1<<t;
  t = palettes[0];
  return z[0] == t && z[1] == t && z[y] == t && z[1+y] == t;
}

void incrementScore(int ax){
  score = score+ax;
  cursorY = 1;
  cursorX = 7;
  printString(sprintint(score, 0));
  printString("    ");
}

void moveTail(){
  char dir2 = getdir(tailX,tailY);
  drawTile(tailX,tailY,0,0,0);
  if(dir2==0)tailY = (tailY-1)&((1<<sizeInBits)-1);
  if(dir2==1)tailX = (tailX-1)&((1<<sizeInBits)-1);
  if(dir2==2)tailY = (tailY+1)&((1<<sizeInBits)-1);
  if(dir2==3)tailX = (tailX+1)&((1<<sizeInBits)-1);

  char dir3 = getdir(tailX,tailY);
  if(dir3 != dir2){
    tailParity = tailParity^1;
  }
  drawTile(tailX,tailY,4,tailParity,dirToRot[getdir(tailX,tailY)]);
}

char rng(){
  repeat:
  rngState = rngState*97+99;
  if(rngState==0)goto repeat;
  rngState = ((rngState&0x00ff)<<8) + ((rngState&0xff00)>>8);
  return rngState;
}

void moveApple(){
  if(score+1 == (1<<sizeInBits)<<sizeInBits){
    appleX = appleY = 0xff;
    cursorX = 0;//7;
    cursorY = 0;
    printString("You win!!");
    timerMax = 0xff;
    return;
  }

  repeat:
  appleX = ((1<<sizeInBits)-1) & rng();
  appleY = ((1<<sizeInBits)-1) & rng();
  if(isTileEmpty(appleX,appleY)){
    drawTile(appleX, appleY, 1, 3&rng(), 7&rng());
  }else{
    goto repeat;
  }
}

void incrementDeaths(){
  if(permadeath)reboot();
  deaths = deaths+1;
  cursorX = 7;
  cursorY = 3;
  printString(sprintint(deaths, 0));
  printString("    ");
}

void move(uint8_t dx,uint8_t dy){
  uint8_t dir = 2;
  if(dx!=0)dir = dir|1;
  if((dx&0x80) || (dy&0x80))dir = dir&1;

  if(prevdir == dir){
    drawTile(headX,headY,3,invertedSnakeParity,dirToRot[dir]);
  }else{
    const uint8_t* tempptr = dirToRot;
    if( ((prevdir+1)&3) == dir ){
      tempptr = dirToRot_inverted;
    }
    invertedSnakeParity = invertedSnakeParity^1;
    drawTile(headX,headY,5,invertedSnakeParity,tempptr[dir]);
  }
  setdir(headX,headY,dir);

  headX += dx;
  headY += dy;
  uint8_t bitmask = (1<<sizeInBits)-1;
  if(loopAround){
    headX &= bitmask;
    headY &= bitmask;
  }else if((headX|headY) & ~bitmask){
    headX -= dx;
    headY -= dy;
    if(score==1)goto skipScoreCheck;
    incrementDeaths();
    moveTail();
    incrementScore(0xffff);
    goto skipScoreCheck;
  }

  if(headX == appleX && headY == appleY){
    incrementScore(1);
    moveApple();
  }else{
    moveTail();
    if(!isTileEmpty(headX,headY))incrementDeaths();
    while(!isTileEmpty(headX,headY)){
      moveTail();
      incrementScore(0xffff);
    }
  }
  skipScoreCheck:
  drawTile(headX,headY,2,invertedSnakeParity+1,dirToRot[dir]);

  prevdir = dir;
  moves = moves+1;
  cursorX = 7;
  cursorY = 2;
  printString(sprintint(moves, 0));
  printString("    ");
}

void restart(){
  char tsh3 = sizeInBits+2;
  int tsh2 = 1<<tsh3;

  initPos_text = tsh2+initPos_text;
  cursorX = 0;
  cursorY = 1;
  printString("Score:");
  incrementScore(0);
  cursorX = 0;
  cursorY = 2;
  printString("Moves:");
  cursorX = 0;
  cursorY = 3;
  printString("Death: 0");
  cursorX = 0;
  cursorY = 4;
  printString("Timer: 0");

  for(int i = 0; i < (1<<sizeInBits); i++){
    for(int j = 0; j < (1<<sizeInBits); j++){
      drawTile(i,j,0,0,0);
    }
  }

  tailX = headX;
  tailY = headY+score;
  moveApple();
  uint8_t i = 0;
  while(i != score){
    move(1,0);
    moves = moves-1;
    i = i+1;
  }
  cursorX = 7;
  cursorY = 2;
  printString("0    ");
}

void redrawTimer(int ax){
  timer = ax;

  if(timerMax == 0xff)return;
  if(timer == timerMax){
    timer = 0;
    if(prevdir==0)move(0,0xff);
    if(prevdir==1)move(0xff,0);
    if(prevdir==2)move(0,1);
    if(prevdir==3)move(1,0);
  }

  cursorX = 7;
  cursorY = 4;
  printString(sprintint(timer, 0));
  printString("    ");
}

void getInput(uint8_t c){
  if(c=='w' || c==KEY_UP){
    move(0, 0xff);
  }else if(c=='a' || c==KEY_LEFT){
    move(0xff, 0);
  }else if(c=='s' || c==KEY_DOWN){
    move(0, 1);
  }else if(c=='d' || c==KEY_RIGHT){
    move(1, 0);
  }else return;

  redrawTimer(0);
}

void userspace_timer(){
  rngState++;
  redrawTimer(timer+1);
}

void userspace_keyboard(char code){
  getInput(code);
}

void userspace_main(){
  int requiredres_y = 1<<(sizeInBits+2);
  int requiredres_x = requiredres_y + charSize*12 + initPos_text;
  requiredres_y = MAX(requiredres_y, 8*5);
  while(requiredres_x*mult < video_xres && requiredres_y*mult < video_yres)mult++;
  mult--;
  if(!usePixelMultiplier)mult = 1;
  requiredres_x *= mult;
  requiredres_y *= mult;
  if(centerScreen){
    screenOffset_x = (video_xres-requiredres_x)/2;
    screenOffset_y = (video_yres-requiredres_y)/2;
  }

  for(int i = 0; i < MAX(requiredres_x,requiredres_y) && drawDebugLines; i++){
    if(i < MIN(requiredres_x,requiredres_y))plot_pixel(i+screenOffset_x, screenOffset_y+i, 0,0,255);
    if(i < requiredres_y)plot_pixel(0+screenOffset_x, screenOffset_y+i, 0,0,255);
    if(i < requiredres_x)plot_pixel(i+screenOffset_x, screenOffset_y+0, 0,0,255);
    if(i < requiredres_y)plot_pixel(requiredres_x-1+screenOffset_x, screenOffset_y+i, 0,0,255);
    if(i < requiredres_x)plot_pixel(i+screenOffset_x, screenOffset_y+requiredres_y-1, 0,0,255);
    if(requiredres_x > requiredres_y){
      if(i < requiredres_y)plot_pixel(requiredres_y-1+screenOffset_x, screenOffset_y+i, 0,255,0);
    }else{
      if(i < requiredres_x)plot_pixel(i+screenOffset_x, screenOffset_y+requiredres_x-1, 0,255,0);
    }
  }
  for(int i = 0; i < screenOffset_x && drawDebugLines; i++){
    plot_pixel(i, screenOffset_y, 0,255,255);
  }
  for(int i = 0; i < screenOffset_y && drawDebugLines; i++){
    plot_pixel(screenOffset_x, i, 0,255,255);
  }

  restart();
}
