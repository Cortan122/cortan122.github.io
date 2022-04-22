precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uTex;

const float PI = 3.1415926535897932384626433;

const float D65X = 0.950456;
const float D65Y = 1.0;
const float D65Z = 1.088754;
const float CIEEpsilon = 216.0/24389.0;
const float CIEK = 24389.0/27.0;

// All components are in the range [0..1], including hue.
vec3 rgb2hsv(vec3 c){
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// All components are in the range [0..1], including hue.
vec3 hsv2rgb(vec3 c){
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 rgb2xyz(vec3 c){
  vec3 tmp;
  tmp.x = ( c.r > 0.04045 ) ? pow( ( c.r + 0.055 ) / 1.055, 2.4 ) : c.r / 12.92;
  tmp.y = ( c.g > 0.04045 ) ? pow( ( c.g + 0.055 ) / 1.055, 2.4 ) : c.g / 12.92,
  tmp.z = ( c.b > 0.04045 ) ? pow( ( c.b + 0.055 ) / 1.055, 2.4 ) : c.b / 12.92;
  const mat3 mat = mat3(
		0.4124, 0.3576, 0.1805,
    0.2126, 0.7152, 0.0722,
    0.0193, 0.1192, 0.9505
	);
  return 100.0 * (tmp * mat);
}

vec3 xyz2lab(vec3 c){
  vec3 n = c / vec3(95.047, 100, 108.883);
  vec3 v;
  v.x = ( n.x > 0.008856 ) ? pow( n.x, 1.0 / 3.0 ) : ( 7.787 * n.x ) + ( 16.0 / 116.0 );
  v.y = ( n.y > 0.008856 ) ? pow( n.y, 1.0 / 3.0 ) : ( 7.787 * n.y ) + ( 16.0 / 116.0 );
  v.z = ( n.z > 0.008856 ) ? pow( n.z, 1.0 / 3.0 ) : ( 7.787 * n.z ) + ( 16.0 / 116.0 );
  return vec3(( 116.0 * v.y ) - 16.0, 500.0 * ( v.x - v.y ), 200.0 * ( v.y - v.z ));
}

vec3 rgb2lab(vec3 c){
  vec3 lab = xyz2lab( rgb2xyz( c ) );
  return vec3( lab.x / 100.0, 0.5 + 0.5 * ( lab.y / 127.0 ), 0.5 + 0.5 * ( lab.z / 127.0 ));
}

vec3 lab2xyz(vec3 c){
  float fy = ( c.x + 16.0 ) / 116.0;
  float fx = c.y / 500.0 + fy;
  float fz = fy - c.z / 200.0;
  return vec3(
     95.047 * (( fx > 0.206897 ) ? fx * fx * fx : ( fx - 16.0 / 116.0 ) / 7.787),
    100.000 * (( fy > 0.206897 ) ? fy * fy * fy : ( fy - 16.0 / 116.0 ) / 7.787),
    108.883 * (( fz > 0.206897 ) ? fz * fz * fz : ( fz - 16.0 / 116.0 ) / 7.787)
  );
}

vec3 xyz2rgb(vec3 c){
	const mat3 mat = mat3(
    3.2406, -1.5372, -0.4986,
    -0.9689, 1.8758, 0.0415,
    0.0557, -0.2040, 1.0570
	);
  vec3 v = (c / 100.0 * mat);
  vec3 r;
  r.x = ( v.r > 0.0031308 ) ? (( 1.055 * pow( v.r, ( 1.0 / 2.4 ))) - 0.055 ) : 12.92 * v.r;
  r.y = ( v.g > 0.0031308 ) ? (( 1.055 * pow( v.g, ( 1.0 / 2.4 ))) - 0.055 ) : 12.92 * v.g;
  r.z = ( v.b > 0.0031308 ) ? (( 1.055 * pow( v.b, ( 1.0 / 2.4 ))) - 0.055 ) : 12.92 * v.b;
  return r;
}

vec3 lab2rgb(vec3 c){
  return xyz2rgb( lab2xyz( vec3(100.0 * c.x, 2.0 * 127.0 * (c.y - 0.5), 2.0 * 127.0 * (c.z - 0.5)) ) );
}

vec3 xyz2luv(vec3 c){
  float L = (c.y/D65Y > CIEEpsilon)? 116.0*pow(c.y/D65Y,1.0/3.0)-16.0 : CIEK*c.y/D65Y;
  float alpha = 1./(c.x+15.0*c.y+3.0*c.z);
  float u = 13.0*L*((4.0*alpha*c.x)-(4.0*D65X/(D65X+15.0*D65Y+3.0*D65Z)));
  float v = 13.0*L*((9.0*alpha*c.y)-(9.0*D65Y/(D65X+15.0*D65Y+3.0*D65Z)));
  return vec3(L,u,v);
}

vec3 luv2xyz(vec3 c){
  float Y = (c.x > CIEK*CIEEpsilon)? pow((c.x+16.0)/116.0,3.0) : c.x/CIEK;
  float gamma = 1./((((52.0*c.x/(c.y+13.0*c.x*(4.0*D65X/(D65X+15.0*D65Y+3.0*D65Z))))-1.0)/3.0)-(-1.0/3.0));
  float X = gamma*((Y*((39.0*c.x/(c.z+13.0*c.x*(9.0*D65Y/(D65X+15.0*D65Y+3.0*D65Z))))-5.0))+5.0*Y);
  float Z = (X*(((52.0*c.x/(c.y+13.0*c.x*(4.0*D65X/(D65X+15.0*D65Y+3.0*D65Z))))-1.0)/3.0))-5.0*Y;
  return vec3(X,Y,Z);
}

vec3 luv2rgb(vec3 c){
  return xyz2rgb( luv2xyz( c ) );
}

vec3 rgb2luv(vec3 c){
  return xyz2luv( rgb2xyz( c ) );
}

vec3 rotatehsv(vec3 color, float a){
  vec3 hsv = rgb2hsv(color);
  hsv.x = mod(hsv.x-a, 1.);
  return hsv2rgb(hsv);
}

vec3 rotatelab(vec3 color, float a){
  vec3 lab = rgb2lab(color);
  lab.yz -= 0.5;
  float len = length(lab.yz);
  float arg = atan(lab.z, lab.y);
  arg = mod(arg - a*PI*2., PI*2.);
  lab.yz = len*vec2(cos(arg),sin(arg));
  lab.yz += 0.5;
  return lab2rgb(lab);
}

vec3 rotateluv(vec3 color, float a){
  vec3 luv = rgb2luv(color);
  luv.yz -= 0.5;
  float len = length(luv.yz);
  float arg = atan(luv.z, luv.y);
  arg = mod(arg - a*PI*2., PI*2.);
  luv.yz = len*vec2(cos(arg),sin(arg));
  luv.yz += 0.5;
  return luv2rgb(luv);
}

void main(){
  vec2 pos = gl_FragCoord.xy/uResolution;
  pos.y = 1.-pos.y;
  vec3 color = texture2D(uTex, pos).rgb;

  vec2 cpos = pos-.5;
  float a = atan(cpos.x, cpos.y)/PI/2. + .25;
  color = rotatehsv(color, a + uTime);

  gl_FragColor = vec4(color, 1.0);
}
