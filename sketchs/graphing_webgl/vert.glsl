precision highp float;
varying vec2 vPos0;
varying vec2 vPos;

uniform vec4 uBounds;

float map(float n, float start1, float stop1, float start2, float stop2) {
  return (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
}

attribute vec3 aPosition;
void main() { 
  vPos0 = (gl_Position = vec4(aPosition,1.0)).xy;
  float x = map(vPos0.x,-1.0,1.0,uBounds.x,uBounds.z);
  float y = map(vPos0.y,-1.0,1.0,uBounds.y,uBounds.w);
  vPos = vec2(x,y); 
}