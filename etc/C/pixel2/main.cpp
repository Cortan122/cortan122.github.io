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

const char * IMAGE_FILE_PATH = "spiral.png";//"instagram.png";
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
      //int c = approxRGB(image[index+0],image[index+1],image[index+2]);
      if(image[index+3]){
        fb.setPixel(i,j,image[index+0],image[index+1],image[index+2]);
      }else{
        fb.setPixel(i,j,0);
      }
    }
  }
}

int main(int argc,char* argv[]) {
  system("clear");
  cout<<"\x1b[100T \x1b[1;1f";
  //FrameBuffer fb = FrameBuffer(size.x*2,size.y-10-(size.y%2)+1);
  FrameBuffer fb = FrameBuffer(256,256);//max 224 117

  //plot2(fb,ploter2);
  if(argc>1){
    decodeOneStep(fb,argv[1]);
  }else{
    decodeOneStep(fb,IMAGE_FILE_PATH);
  }
  //cin.get();
  fb.draw();

  cout<<"\x1b[0m";

  cin.get();

  //cin.get();//cin.get();
  return 0;
}