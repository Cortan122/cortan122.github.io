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
void gotoxy (int x, int y);
uint8_t parseColor (uint8_t c);
void setColor (uint8_t c);
Vector2 GetConsoleSize ();
class FrameBuffer
{
protected:
  uint8_t * arr;
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
  void randomize ();
  void forceRedraw (bool force = false);
  void draw (bool fast = false);
  void _setPixel (int x, int y, uint8_t c);
  void setPixel (int x, int y, uint8_t c);
  void fill (uint8_t c);
  void checkerboard (uint8_t a, uint8_t b);
  int getW () const;
  int getH () const;
};
#undef LZZ_INLINE
#endif
