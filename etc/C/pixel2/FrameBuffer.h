// FrameBuffer.h
//

#ifndef LZZ_FrameBuffer_h
#define LZZ_FrameBuffer_h
#include <iostream>
#include <math.h>
#include <cstdint>
#include <sys/ioctl.h>
#include <stdio.h>
#define LZZ_INLINE inline
struct Vector2
{
  int x;
  int y;
  Vector2 (int _x, int _y);
  Vector2 (int (a) [2]);
  Vector2 ();
};
Vector2 operator + (Vector2 a, Vector2 b);
struct colorRGB
{
  uint8_t R;
  uint8_t G;
  uint8_t B;
  colorRGB (uint8_t _R, uint8_t _G, uint8_t _B);
  colorRGB ();
};
bool operator == (colorRGB & a, colorRGB & b);
void gotoxy (int x, int y);
uint8_t parseColor (uint8_t c);
void setColor (uint8_t c);
void setColorRGB (int mode, uint8_t r, uint8_t g, uint8_t b);
void setColorRGB (int mode, colorRGB & c);
Vector2 GetConsoleSize ();
class FrameBuffer
{
protected:
  colorRGB * arr;
  bool * bits;
  int len;
  int w;
  int w1;
  int h;
public:
  Vector2 size;
  Vector2 offset;
  void resize (int x, int y);
  FrameBuffer (int x, int y);
  void forceRedraw ();
  void draw ();
  void setPixel (int x, int y, uint8_t r, uint8_t g, uint8_t b);
  void setPixel (int x, int y, uint8_t gray);
  int getW () const;
  int getH () const;
};
#undef LZZ_INLINE
#endif
