'use strict';
const creationTime = Date.now();
const tw = {};
var time_offset = 0;

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
  const time_value = time_offset + (initTime-creationTime)/1000*tw.speed;

  gl.uniform2f(uResolution, canvas.width+2, canvas.height+2);
  gl.uniform1f(uTime, time_value);

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

let file_upload_id_counter = 0;
function makeImageInput(base_element, caption, default_value, callback = ()=>{}){
  const id = `file-upload-${file_upload_id_counter++}`;
  base_element.classList.add("csh-file");

  const title = document.createElement("span");
  title.classList.add("csh-input-title");
  title.innerText = caption;
  base_element.appendChild(title);

  const button = document.createElement("button");
  button.setAttribute("type", "button");
  const label = document.createElement("label");
  label.setAttribute("for", id);
  label.innerText = "Choose file";
  button.appendChild(label);
  base_element.appendChild(button);

  const input = document.createElement("input");
  input.setAttribute("type", "file");
  input.setAttribute("id", id);
  input.classList.add("csh-fake-file-input");
  base_element.appendChild(input);

  const image = document.createElement("img");
  image.setAttribute("src", default_value);
  image.classList.add("csh-preview");
  base_element.appendChild(image);

  input.addEventListener("dragover", () => base_element.classList.add("csh-dragging"));
  input.addEventListener("drop", () => base_element.classList.remove("csh-dragging"));
  input.addEventListener("dragleave", () => base_element.classList.remove("csh-dragging"));

  input.addEventListener("change", event => {
    const fileName = URL.createObjectURL(event.target.files[0]);
    image.setAttribute("src", fileName);
    callback(fileName);
  });

  // this fixes a race condition. i have not idea why it does that...
  function listener() {
    callback(default_value);
    image.removeEventListener("load", listener);
  }
  image.addEventListener("load", listener);
  return image;
}

function slider(min, max, value, name, callback = ()=>{}, map=null){
  const base_element = document.getElementById("sliders");
  const mapped_value = v => map ? map[v] : v;

  const input = document.createElement("input");
  input.setAttribute("draggable", "false");
  input.setAttribute("type", "range");
  input.setAttribute("min", min);
  input.setAttribute("max", max);
  input.setAttribute("id", "slider_"+name);
  input.setAttribute("title", name);
  input.setAttribute("step", Math.min(1, (max-min)/100));
  input.setAttribute("value", value);
  if(map){
    input.setAttribute("min", 0);
    input.setAttribute("max", map.length-1);
    input.setAttribute("step", 1);
  }

  input.classList.add("slider");

  const tr = document.createElement("tr");
  const td_name = document.createElement("td");
  td_name.innerText = name;
  td_name.classList.add("name");
  tr.appendChild(td_name);

  const td_res = document.createElement("td");
  td_res.appendChild(input);
  tr.appendChild(td_res);

  const td_text = document.createElement("td");
  td_text.classList.add("text");
  td_text.innerText = mapped_value(value);
  tr.appendChild(td_text);
  base_element.appendChild(tr);

  var prevValue = tw[name] = value;
  var update = () => {
    if(prevValue == input.value)return;
    var new_value = +input.value
    callback(prevValue, new_value);
    tw[name] = prevValue = new_value;
    td_text.innerText = mapped_value(new_value);
  };

  input.addEventListener('change', update);
  input.addEventListener('mousemove', update);

  return input;
}

function setupInputs(gl, shaderProgram){
  const img1 = document.getElementById("image-1");
  makeImageInput(img1, "Image №1", "example-51051.png", file=>{
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, loadTexture(gl, file));
    gl.uniform1i(gl.getUniformLocation(shaderProgram, 'uTex'), 0);
  });

  const img2 = document.getElementById("image-2");
  makeImageInput(img2, "Image №2", "bi.png", file=>{
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, loadTexture(gl, file));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, 'uFlagTex'), 1);
  });

  slider(.2, 2.2, .5, "speed", (old, val) => {
    const initTime = Date.now();
    const dt = (initTime-creationTime)/1000;
    time_offset = time_offset + dt*old - dt*val;
  });

  slider(0, 2, 0, "colorspace", (_, val) => {
    gl.uniform1i(gl.getUniformLocation(shaderProgram, 'uColorspace'), val);
  }, ["hsv", "lab", "luv"]);

  slider(0, 2, 0, "mode", (_, val) => {
    gl.uniform1i(gl.getUniformLocation(shaderProgram, 'uMode'), val);
    if(val == 2){
      img2.parentElement.classList.remove("csh-hidden");
    }else{
      img2.parentElement.classList.add("csh-hidden");
    }
  }, ["radial", "solid", "merge"]);
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
  setupInputs(gl, shaderProgram);

  draw({gl, canvas, uResolution, uTime});
}

fetch("frag.glsl").then(e => e.text()).then(e => main(e));
