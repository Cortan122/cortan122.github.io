#include <iostream>
#include <math.h>
#include <cstdint>
#include <sys/ioctl.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/time.h>
#include <sys/types.h>
#include <unistd.h>
#include <fcntl.h>
#include <termios.h>
//#include <array>
#include "FrameBuffer.h"
#include "lodepng.h"
using namespace std;

enum bMode { NONE, INNER, OUTER, LEFT, RIGHT };
const bMode BOUNDARY_MODE = RIGHT;
const uint8_t COLOR_PALETTE[] = {7,15,11,10};//{boundary,zero,negative,positive}

void plot(FrameBuffer &fb,double (*foo)(double)){
  int w = fb.getW();
  int h = fb.getH();
  fb.fill(0);
  for (int i = 0; i < h; i++){
    fb.setPixel(0,i,i%2?0:10);
  }
  int prev = -1;
  for (int i = 0; i < w; i++){
    double res = foo(i/(double)(w-1) );
    int r = round(res*(h-1));
    fb.setPixel(i,(h-1)/2,2);
    fb.setPixel(i,h-1,2);
    fb.setPixel(i,0,2);
    if(prev != -1){
      int a = max(prev,r);
      int b = min(prev,r);
      for (int j = b+1; j < a; j++){
        fb.setPixel(i,j,7);
      } 
    }
    prev = r;
    fb.setPixel(i,r,15);
  }
}

uint8_t plot2_helper(double res){
  uint8_t r;
  if(res == 0)r = 1;
  else if(res > 0)r = 3;
  else if(res < 0)r = 2;
  return r;
}

uint8_t * plot2_getrom(){
  uint8_t * r;
  r = new uint8_t[2];
  switch(BOUNDARY_MODE){
    case NONE:
    r[0] = 2;
    r[1] = 2;
    break;
    case INNER:
    r[0] = 1;
    r[1] = 0;
    break;  
    case OUTER:
    r[0] = 0;
    r[1] = 1;
    break;
    case LEFT:
    r[0] = 1;
    r[1] = 1;
    break;
    case RIGHT:
    r[0] = 0;
    r[1] = 0;
    break;
  }
  return r;
}

void plot2(FrameBuffer &fb,double (*foo)(double,double)){
  int w = fb.getW();
  int h = fb.getH();
  fb.fill(0);
  uint8_t arr[w][h];//0-undefined,1-zero,2-negative,3-positive
  for (int i = 0; i < w; i++){
    for (int j = 0; j < h; j++){
      arr[i][j] = 0;
    }
  }
  uint8_t * rom = plot2_getrom();
  for (int i = 0; i < w; i++){
    for (int j = 0; j < h; j++){
      int sign = arr[i][j];
      bool b = rom[0]>1;
      if(sign == 0){
        double res = foo(i/(double)(w-1),j/(double)(h-1));
        sign = arr[i][j] = plot2_helper(res);
      }
      fb.setPixel(i,j,COLOR_PALETTE[sign]);
      if(sign == 1)b = true;
      if(!b&&i>0){
        int sign1 = arr[i-1][j];
        if(sign == 0){
          double res = foo( (i-1)/(double)(w-1),j/(double)(h-1));
          sign = arr[i-1][j] = plot2_helper(res);
        }
        if(sign1==2&&sign==3){
          fb.setPixel(i-rom[0],j,COLOR_PALETTE[0]);b = true;
        }else if(sign1==3&&sign==2){
          fb.setPixel(i-rom[1],j,COLOR_PALETTE[0]);b = true;
        }
      }
      if(!b&&j>0){
        int sign1 = arr[i][j-1];
        if(sign == 0){
          double res = foo(i/(double)(w-1),(j-1)/(double)(h-1));
          sign = arr[i][j-1] = plot2_helper(res);
        }
        if(sign1==2&&sign==3){
          fb.setPixel(i,j-rom[0],COLOR_PALETTE[0]);b = true;
        }else if(sign1==3&&sign==2){
          fb.setPixel(i,j-rom[1],COLOR_PALETTE[0]);b = true;
        }
      }
    }
  }
}

double ploter(double a){
  return sin(a*M_PI*2)/2.0+.5;
}

double ploter2(double x,double y){
  x = x*2-1;
  y = y*2-1;
  x = x*2*M_PI;
  y = y*2*M_PI;
  return sin(x)*sin(y);
}

//{"000","008","080","088","800","808","880","ccc","888","00f","0f0","0ff","f00","f0f","ff0","fff"}
const uint8_t COLOR_PALETTE1[] 
= {0,0,0,0,0,8,0,8,0,0,8,8,8,0,0,8,0,8,8,8,0,12,12,12,8,8,8,0,0,15,0,15,0,0,15,15,15,0,0,15,0,15,15,15,0,15,15,15};
uint8_t approxRGB(uint8_t r,uint8_t g,uint8_t b){
  int min = -1,mi = 15;  
  for (int i = 0; i < 16; i+=1){
    int delta = 0;
    delta += abs(COLOR_PALETTE1[i*3+2]*17-r);
    delta += abs(COLOR_PALETTE1[i*3+1]*17-g);
    delta += abs(COLOR_PALETTE1[i*3+0]*17-b);
    if(min==-1||min>delta){
      min = delta;
      mi = i;
    }
  }
  return mi;
}

void addError(vector<unsigned char> &img,double factor,int x,int y,int errR,int errG,int errB ,unsigned width,unsigned height) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  int index = (x+width*y)*4;
  img[index+0]= min((int)(img[index+0]+errR * factor),255);
  img[index+1]= min((int)(img[index+1]+errG * factor),255);
  img[index+2]= min((int)(img[index+2]+errB * factor),255);
}

void distributeError(vector<unsigned char> &img,int x,int y,int errR,int errG,int errB ,unsigned width,unsigned height) {
  addError(img, 7 / 16.0, x + 1, y, errR, errG, errB,width, height);
  addError(img, 3 / 16.0, x - 1, y + 1, errR, errG, errB,width, height);
  addError(img, 5 / 16.0, x, y + 1, errR, errG, errB,width, height);
  addError(img, 1 / 16.0, x + 1, y + 1, errR, errG, errB,width, height);
}

const char * IMAGE_FILE_PATH = /*"kitten.png";//*/"instagram.png";
void decodeOneStep(FrameBuffer &fb,const char* filename){
  std::vector<unsigned char> image; //the raw pixels
  unsigned width, height;

  //decode
  unsigned error = lodepng::decode(image, width, height, filename);

  //if there's an error, display it
  if(error) {
    std::cout << "decoder error " << error << ": " << lodepng_error_text(error) << std::endl;
    cin.get();
  }

  //the pixels are now in the vector "image", 4 bytes per pixel, ordered RGBARGBA

  for (int i = 0; i < width; i++){
    for (int j = 0; j < height; j++){
      int index = (i+width*j)*4;
      int c = approxRGB(image[index+0],image[index+1],image[index+2]);
      if(image[index+3]){
        fb.setPixel(i,j,c);
        int er[3];
        for (int ii = 0; ii < 3; ii++){
          er[ii] = (int)image[index+ii]-COLOR_PALETTE1[c*3+ii]*17;
        }
        distributeError(image,i,j,er[0],er[1],er[2],width, height);
      }else{
        fb.setPixel(i,j,0);
      }
    }
  }
}

int inputHandler(char * c,FrameBuffer &fb){
  //printf(":%d,%d,%d:\n",c[0],c[1],c[2]);
  printf("\n");
  if(c[0] == 'q')return 1;
  if(c[0] == 'i'){
    decodeOneStep(fb,IMAGE_FILE_PATH);
    fb.draw();
  }
  if(c[0] == 'u'){
    //decodeOneStep(fb,IMAGE_FILE_PATH);
    fb.draw();
    return 0;
  }
  if(c[0] == 'U'){
    //decodeOneStep(fb,IMAGE_FILE_PATH);
    fb.forceRedraw();
    fb.draw();
    return 0;
  }
  if(c[0] == 's'){
    fb.size = GetConsoleSize();
    fb.offset = Vector2(0,0);
    //decodeOneStep(fb,IMAGE_FILE_PATH);
    fb.forceRedraw();
    fb.draw();
    return 0;
  }
  if(c[0] == 27){
    if(c[1] == 91){
      if(c[2] == 65){//up
        fb.offset.y += 9;
      }else if(c[2] == 66){//down
        fb.offset.y -= 9;
      }else if(c[2] == 67){//right
        fb.offset.x -= 9;
      }else if(c[2] == 68){//left
        fb.offset.x += 9;
      }else{return 0;}
      setColor(15);
      cout<<fb.offset.x<<" "<<fb.offset.y;
      cin.get();
      fb.forceRedraw(true);
      fb.draw(true);
      return 0;
    }
  }
  return 0;
}

void initInputHandler(FrameBuffer &fb){
  struct termios oldSettings, newSettings;

  tcgetattr( fileno( stdin ), &oldSettings );
  newSettings = oldSettings;
  newSettings.c_lflag &= (~ICANON & ~ECHO);
  tcsetattr( fileno( stdin ), TCSANOW, &newSettings );
  char * c = (char *)malloc(10);    

  while ( 1 ){
    fd_set set;
    struct timeval tv;

    tv.tv_sec = 10;
    tv.tv_usec = 0;

    FD_ZERO( &set );
    FD_SET( fileno( stdin ), &set );

    int res = select( fileno( stdin )+1, &set, NULL, NULL, &tv );

    if( res > 0 ){
      //printf( "Input available\n" );
      read( fileno( stdin ), c, 3 );
      if(inputHandler(c,fb))break;
      //printf(":%d,%d,%d:\n",c[0],c[1],c[2]);
      //printf(":%c:\n",c);
    }else if( res < 0 ){
      perror( "select error" );
      break;
    }
  }

  tcsetattr( fileno( stdin ), TCSANOW, &oldSettings );
}

int main() {
  system("clear");
  //FrameBuffer fb = FrameBuffer(size.x*2,size.y-10-(size.y%2)+1);
  FrameBuffer fb = FrameBuffer(400,400);

  initInputHandler(fb);
  //plot2(fb,ploter2);
  //decodeOneStep(fb,IMAGE_FILE_PATH);
  //fb.draw();

  setColor(15);
  //cin.get();//cin.get();
  return 0;
}