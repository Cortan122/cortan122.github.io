'use strict';
const creationTime = Date.now();

const vsSource = `
  attribute vec4 aVertexPosition;

  void main(){
    gl_Position = aVertexPosition;
  }
`;

/**
 * @param {WebGLRenderingContext} gl
 */
function loadTexture(gl, url, err=()=>{}){
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([255, 0, 255, 255]);
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel,
  );

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image,
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  };

  image.onerror = err;
  image.src = url;

  return texture;
}

/**
 * @param {WebGLRenderingContext} gl
 */
function loadShader(gl, type, source){
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/**
 * @param {WebGLRenderingContext} gl
 */
function initShaderProgram(gl, vsSource, fsSource){
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgram} shader
 */
function addDummyQuad(gl, shader){
  const aVertexPosition = gl.getAttribLocation(shader, 'aVertexPosition');
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1.0,  1.0,
       1.0,  1.0,
      -1.0, -1.0,
       1.0, -1.0,
    ]),
    gl.STATIC_DRAW,
  );
  gl.vertexAttribPointer(aVertexPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aVertexPosition);
}

function draw(obj){
  const {gl, canvas, uResolution, uTime} = obj;
  const initTime = Date.now();

  gl.uniform2f(uResolution, canvas.width+2, canvas.height+2);
  gl.uniform1f(uTime, (initTime-creationTime)/1000);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  const deltaTime = Date.now() - initTime;
  if(deltaTime > 1000/60)console.log(`draw() took ${deltaTime}ms`);

  window.requestAnimationFrame(() => draw(obj));
}

function setDPI(canvas) {
  canvas.style.width = canvas.style.width || canvas.width + 'px';
  canvas.style.height = canvas.style.height || canvas.height + 'px';
  var scaleFactor = window.devicePixelRatio;
  canvas.width = Math.ceil(canvas.width * scaleFactor);
  canvas.height = Math.ceil(canvas.height * scaleFactor);
}

function main(fsSource){
  const canvas = document.querySelector("canvas");
  setDPI(canvas);
  const gl = canvas.getContext("webgl");
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  const uResolution = gl.getUniformLocation(shaderProgram, 'uResolution');
  const uTime = gl.getUniformLocation(shaderProgram, 'uTime');

  gl.useProgram(shaderProgram);
  addDummyQuad(gl, shaderProgram);
  gl.clearColor(1.0, 0.0, 1.0, 1.0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, loadTexture(gl, "example-51051.png"));
  gl.uniform1i(gl.getUniformLocation(shaderProgram, 'uTex'), 0);

  draw({gl, canvas, uResolution, uTime});
}

fetch("frag.glsl").then(e => e.text()).then(e => main(e));
