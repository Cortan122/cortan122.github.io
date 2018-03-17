// FrameBuffer.cpp
//

#include "FrameBuffer.h"
#define LZZ_INLINE inline
using namespace std;
bool const FORCE_SQUARE_FRAMEBUFFER = true;
int const FOREGROUND = 38;
int const BACKGROUND = 48;
Vector2::Vector2 (int _x, int _y)
                         {
    x = _x;
    y = _y;
  }
Vector2::Vector2 (int (a) [2])
                   {
    x = a[0];
    y = a[1];
  }
Vector2::Vector2 ()
           {}
Vector2 operator + (Vector2 a, Vector2 b)
                                       {
  Vector2 r;
  r.x = a.x+b.x;
  r.y = a.y+b.y;
  return r;
}
colorRGB::colorRGB (uint8_t _R, uint8_t _G, uint8_t _B)
                                              {
    R = _R;
    G = _G;
    B = _B;
  }
colorRGB::colorRGB ()
            {}
bool operator == (colorRGB & a, colorRGB & b)
                                           {
  return (a.R==b.R)&&(a.G==b.G)&&(a.B==b.B);
}
void gotoxy (int x, int y)
                        {
  printf("%c[%d;%df",0x1B,y,x);
}
uint8_t parseColor (uint8_t c)
                             {
  uint8_t r = 0;
  r = (c&0b1000)?90:30;
  c =  c&0b0111;
  r += c;
  return r;
}
void setColor (uint8_t c)
                        {
  uint8_t f = parseColor(c&0xf);
  uint8_t b = parseColor((c&0xf0)>>4)+10;
  printf("%c[%d;%dm",0x1B,unsigned(f),unsigned(b) );
}
void setColorRGB (int mode, uint8_t r, uint8_t g, uint8_t b)
                                                        {
  printf("%c[%d;2;%d;%d;%dm",0x1B,mode,unsigned(r),unsigned(g),unsigned(b));
}
void setColorRGB (int mode, colorRGB & c)
                                       {
  setColorRGB(mode,c.R,c.G,c.B);
}
Vector2 GetConsoleSize ()
                        {
  struct winsize size;
  ioctl(0,TIOCGWINSZ,&size);
  return Vector2(size.ws_col,size.ws_row);
}
void FrameBuffer::resize (int x, int y)
                          {
    if(FORCE_SQUARE_FRAMEBUFFER){
      x = y = min(x,y);
    }
    w = x;
    h = y;
    w1 = (int)ceil(x*3.0/2.0);
    len = x*y;
    delete arr;
    delete bits;
    arr = new colorRGB[len];
    bits = new bool[len];
  }
FrameBuffer::FrameBuffer (int x, int y)
                          {
    arr = NULL;
    bits = NULL;
    size = GetConsoleSize();
    offset = Vector2(0,0);
    resize(x,y);
  }
void FrameBuffer::forceRedraw ()
                    {
    for (int i = 0; i < len; i++){
      /*if(force||arr[i])*/bits[i] = true;
    }
  }
void FrameBuffer::draw ()
             {
    for (int j = 0; j < h; j++){
      for (int i = 0; i < w1; i++){
        if(i%3==1){
          int index1 = 2*(i/3)+j*w;
          int index2 = index1+1;
          if(index2<len&&(bits[index1]||bits[index2])){
            //bits[index2] = bits[index1] = false;
            gotoxy(i+1,j+1);
            setColorRGB(FOREGROUND,arr[index1]);
            setColorRGB(BACKGROUND,arr[index2]);
            cout<<"\u258C";
          }
        }else{
          int index = 2*(i/3)+(i%3)/2+j*w;
          if(index<len&&bits[index] == true){
            //bits[index] = false;
            gotoxy(i+1,j+1);
            setColorRGB(FOREGROUND,arr[index]);
            setColorRGB(BACKGROUND,arr[index]);
            cout<<"\u258C";//"\xdd";
          }
        }
      }
    }
    for (int i = 0; i < len; i++){
      bits[i] = false;
    }
  }
void FrameBuffer::setPixel (int x, int y, uint8_t r, uint8_t g, uint8_t b)
                                                          {
    //c = c&0xf;
    //x = x%w;
    //y = y%h;
    //int offset = x%2;
    //int pos = x/2;
    int index = x+y*w;
    if(index>=len)throw "overflow";
    colorRGB res = colorRGB(r,g,b);
    if(!(arr[index] == res))bits[index] = true;
    arr[index] = res;
  }
void FrameBuffer::setPixel (int x, int y, uint8_t gray)
                                         {
    setPixel(x,y,gray,gray,gray);
  }
int FrameBuffer::getW () const
                 {return w;}
int FrameBuffer::getH () const
                 {return h;}
#undef LZZ_INLINE
