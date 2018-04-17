OutlineVertShaderSrc = `
  precision mediump float;
  attribute vec3 a_position;
  attribute vec3 a_normal;

  uniform mat4 u_projectionMat;
  uniform mat4 u_modelviewMat;
  uniform float u_offset;

  void main() {
    vec4 p = vec4(a_position+a_normal*u_offset, 1.0);
    gl_Position = u_projectionMat * u_modelviewMat * p;
  }
`;

OutlineFragShaderSrc = `
  precision mediump float;
  uniform vec4 u_color;

  void main() {
    gl_FragColor = u_color;
  }
`;

CelVertShaderSrc = `
  precision mediump float;
  attribute vec3 a_position;
  attribute vec3 a_normal;

  uniform mat4 u_projectionMat;
  uniform mat4 u_modelviewMat;
  uniform mat3 u_normalMat;
  uniform vec3 u_diffuse;

  varying vec3 v_eyeNormal;
  varying vec3 v_diffuse;

  void main() {
    v_eyeNormal = u_normalMat * a_normal;
    v_diffuse = u_diffuse;
    gl_Position = u_projectionMat * u_modelviewMat * vec4(a_position, 1.0);
  }
`;

CelFragShaderSrc = `
  precision mediump float;
  varying vec3 v_eyeNormal;
  varying vec3 v_diffuse;

  uniform vec3 u_light;
  uniform vec3 u_ambient;
  uniform vec3 u_specular;
  uniform float u_shine;
  uniform float u_celShading;

  float celShade(float d) {
    float E = 0.05;
    d *= u_celShading;
    float r = 1.0 / (u_celShading-0.5);
    float fd = floor(d);
    float dr = d * r;
    if (d > fd-E && d < fd+E) {
      float last = (fd - sign(d - fd))*r;
      return mix(last, fd*r, 
        smoothstep((fd-E)*r, (fd+E)*r, dr));
    } else {
      return fd*r;
    }
  }

  void main() {
    vec3 en = normalize(v_eyeNormal);
    vec3 ln = normalize(u_light);
    vec3 hn = normalize(ln + vec3(0, 0, 1));
    float E = 0.05;

    float df = max(0.0, dot(en, ln));
    float sf = max(0.0, dot(en, hn));

    float cdf = celShade(df);  

    sf = pow(sf, u_shine);

    if (sf > 0.5 - E && sf < 0.5 + E) {
      sf = smoothstep(0.5 - E, 0.5 + E, sf);
    } else {
      sf = step(0.5, sf);
    }

    float csf = sf;

    vec3 color = u_ambient + cdf * v_diffuse + csf * u_specular;

    gl_FragColor = vec4(color, 1.0);
  }
`;

/*
  cellSheder = createShader(CelVertShaderSrc,CelFragShaderSrc);
  shader(cellSheder);
  noStroke();
  cellSheder.setUniform('u_diffuse',createVector(1.00, 0.66, 0.00));
  cellSheder.setUniform('u_light',createVector(0.25, 0.25, 1));
  cellSheder.setUniform('u_ambient',createVector(0.1, 0.1, 0.1));
  cellSheder.setUniform('u_specular',createVector(0.50, 0.50, 0.50));
  cellSheder.setUniform('u_shine',50);
  cellSheder.setUniform('u_celShading',4);

  cellSheder.setUniform('u_projectionMat',rend.uPMatrix.mat4);
  cellSheder.setUniform('u_modelviewMat',rend.uMVMatrix.mat4);
  cellSheder.setUniform('u_normalMat',rend.uNMatrix.mat3);
*/

LightVertShaderSrc = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  attribute vec2 aTexCoord;

  uniform mat4 uViewMatrix;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform mat3 uNormalMatrix;
  uniform int uAmbientLightCount;
  uniform int uDirectionalLightCount;
  uniform int uPointLightCount;

  uniform vec3 uAmbientColor[8];
  uniform vec3 uLightingDirection[8];
  uniform vec3 uDirectionalColor[8];
  uniform vec3 uPointLightLocation[8];
  uniform vec3 uPointLightColor[8];
  uniform bool uSpecular;

  varying vec3 vVertexNormal;
  varying vec2 vVertTexCoord;
  varying vec3 vLightWeighting;

  void main(void){

    vec4 positionVec4 = vec4(aPosition, 1.0);
    gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;

    vec3 vertexNormal = normalize(vec3( uNormalMatrix * aNormal ));
    vVertexNormal = vertexNormal;
    vVertTexCoord = aTexCoord;

    vec4 mvPosition = uModelViewMatrix * vec4(aPosition, 1.0);
    vec3 eyeDirection = normalize(-mvPosition.xyz);

    float shininess = 32.0;
    float specularFactor = 2.0;
    float diffuseFactor = 0.3;

    vec3 ambientLightFactor = vec3(0.0);

    for (int i = 0; i < 8; i++) {
      if (uAmbientLightCount == i) break;
      ambientLightFactor += uAmbientColor[i];
    }


    vec3 directionalLightFactor = vec3(0.0);

    for (int j = 0; j < 8; j++) {
      if (uDirectionalLightCount == j) break;
      vec3 dir = uLightingDirection[j];
      float directionalLightWeighting = max(dot(vertexNormal, -dir), 0.0);
      directionalLightFactor += uDirectionalColor[j] * directionalLightWeighting;
    }


    vec3 pointLightFactor = vec3(0.0);

    for (int k = 0; k < 8; k++) {
      if (uPointLightCount == k) break;
      vec3 loc = (uViewMatrix * vec4(uPointLightLocation[k], 1.0)).xyz;
      vec3 lightDirection = normalize(loc - mvPosition.xyz);

      float directionalLightWeighting = max(dot(vertexNormal, lightDirection), 0.0);

      float specularLightWeighting = 0.0;
      if (uSpecular ){
        vec3 reflectionDirection = reflect(-lightDirection, vertexNormal);
        specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), shininess);
      }

      pointLightFactor += uPointLightColor[k] * (specularFactor * specularLightWeighting
        + directionalLightWeighting * diffuseFactor);
    }

    vLightWeighting = ambientLightFactor + directionalLightFactor + pointLightFactor;

    /*vLightWeighting *= 100.0;
    vLightWeighting = vec3(floor(vLightWeighting[0] + 0.5),floor(vLightWeighting[1] + 0.5),floor(vLightWeighting[2] + 0.5));
    vLightWeighting /= 100.0;*/
  }
`;

LightFragShaderSrc = `
  precision mediump float;

  uniform vec4 uMaterialColor;
  uniform sampler2D uSampler;
  uniform bool isTexture;
  uniform bool uUseLighting;

  varying vec3 vLightWeighting;
  varying highp vec2 vVertTexCoord;

  void main(void) {
    gl_FragColor = isTexture ? texture2D(uSampler, vVertTexCoord) : uMaterialColor;
    if (uUseLighting)
      gl_FragColor.rgb *= vLightWeighting;
  }
`;

LineFragShaderSrc = `
  /*
  Part of the Processing project - http://processing.org
  Copyright (c) 2012-15 The Processing Foundation
  Copyright (c) 2004-12 Ben Fry and Casey Reas
  Copyright (c) 2001-04 Massachusetts Institute of Technology
  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation, version 2.1.
  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.
  You should have received a copy of the GNU Lesser General
  Public License along with this library; if not, write to the
  Free Software Foundation, Inc., 59 Temple Place, Suite 330,
  Boston, MA  02111-1307  USA
  */

  #define PROCESSING_LINE_SHADER

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform float uStrokeWeight;

  uniform vec4 uViewport;
  vec3 scale = vec3(1.0);

  attribute vec4 aPosition;
  attribute vec4 aDirection;
    
  void main() {
    vec4 posp = uModelViewMatrix * aPosition;
    vec4 posq = uModelViewMatrix * (aPosition + vec4(aDirection.xyz, 0));

    // Moving vertices slightly toward the camera
    // to avoid depth-fighting with the fill triangles.
    // Discussed here:
    // http://www.opengl.org/discussion_boards/ubbthreads.php?ubb=showflat&Number=252848  
    posp.xyz = posp.xyz * scale;
    posq.xyz = posq.xyz * scale;

    vec4 p = uProjectionMatrix * posp;
    vec4 q = uProjectionMatrix * posq;

    // formula to convert from clip space (range -1..1) to screen space (range 0..[width or height])
    // screen_p = (p.xy/p.w + <1,1>) * 0.5 * uViewport.zw

    // prevent division by W by transforming the tangent formula (div by 0 causes
    // the line to disappear, see https://github.com/processing/processing/issues/5183)
    // t = screen_q - screen_p
    //
    // tangent is normalized and we don't care which aDirection it points to (+-)
    // t = +- normalize( screen_q - screen_p )
    // t = +- normalize( (q.xy/q.w+<1,1>)*0.5*uViewport.zw - (p.xy/p.w+<1,1>)*0.5*uViewport.zw )
    //
    // extract common factor, <1,1> - <1,1> cancels out
    // t = +- normalize( (q.xy/q.w - p.xy/p.w) * 0.5 * uViewport.zw )
    //
    // convert to common divisor
    // t = +- normalize( ((q.xy*p.w - p.xy*q.w) / (p.w*q.w)) * 0.5 * uViewport.zw )
    //
    // remove the common scalar divisor/factor, not needed due to normalize and +-
    // (keep uViewport - can't remove because it has different components for x and y
    //  and corrects for aspect ratio, see https://github.com/processing/processing/issues/5181)
    // t = +- normalize( (q.xy*p.w - p.xy*q.w) * uViewport.zw )

    vec2 tangent = normalize((q.xy*p.w - p.xy*q.w) * uViewport.zw);

    // flip tangent to normal (it's already normalized)
    vec2 normal = vec2(-tangent.y, tangent.x);

    float thickness = aDirection.w * uStrokeWeight;
    vec2 offset = normal * thickness / 2.0;

    // Perspective ---
    // convert from world to clip by multiplying with projection scaling factor
    // to get the right thickness (see https://github.com/processing/processing/issues/5182)
    // invert Y, projections in Processing invert Y
    vec2 perspScale = (uProjectionMatrix * vec4(1, -1, 0, 0)).xy;

    // No Perspective ---
    // multiply by W (to cancel out division by W later in the pipeline) and
    // convert from screen to clip (derived from clip to screen above)
    vec2 noPerspScale = p.w / (0.5 * uViewport.zw);

    //gl_Position.xy = p.xy + offset.xy * mix(noPerspScale, perspScale, float(perspective > 0));
    gl_Position.xy = p.xy + offset.xy * perspScale;
    gl_Position.zw = p.zw;
  }
`