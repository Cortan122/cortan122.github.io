precision highp float;
varying vec2 vPos0;
varying vec2 vPos;

#define pi 3.1415926535897932384626433832795

vec4 color(float n){
  return vec4(0.5-cos(n*17.0)/2.0,0.5-cos(n*13.0)/2.0,0.5-cos(n*23.0)/2.0,1.0);
}

vec4 color_hsv(vec3 c){
  vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
  rgb = rgb*rgb*(3.0-2.0*rgb);
  return vec4(c.z * mix( vec3(1.0), rgb, c.y),1.0);
}

vec4 color_hsv(vec4 c){
  vec4 t = color_hsv(c.xyz);
  t.w = c.w;
  return t;
}

vec4 color_hsv(float hue,float sat,float val,float a) {
  return color_hsv(vec4(hue,sat,val,a));
}

vec4 color_hsv(float hue,float sat,float val) {
  return color_hsv(vec3(hue,sat,val));
}

vec4 color_hsv(float hue,float val) {
  return color_hsv(hue,1.0,val);
}

vec4 color_hsv(float hue) {
  return color_hsv(hue,1.0);
}

float map(float n, float start1, float stop1, float start2, float stop2) {
  return (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
}

uniform vec4 uBounds;
uniform float uTime;

void main() {
  float x = vPos.x;
  float y = vPos.y;
  {0}
}
