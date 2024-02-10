"use strict";

/** @type WebGLRenderingContext */
let gl = undefined;

let previous = undefined;
let wasm = undefined;
let dt = undefined;
let should_stop = false;
let drawFunction = undefined;
let resizeCallback = undefined;
let libwebgl = library_webgl();

function make_environment(env) {
  return new Proxy(env, {
    get(target, prop, receiver) {
      if (env[prop] !== undefined) {
        return env[prop].bind(env);
      } else if (libwebgl[prop] !== undefined) {
        return (...args) => {
          libwebgl.__reset_buffers();
          return libwebgl[prop](...args);
        }
      }

      console.warn(`Theoretically Not Implemented: `, prop);
      return (...args) => {
        console.error(`NOT IMPLEMENTED: `, prop, args);
        should_stop = true;
        throw new Error();
      }
    }
  });
}

function cstrlen(mem, ptr) {
  let len = 0;
  while (mem[ptr] != 0) {
    len++;
    ptr++;
  }
  return len;
}

function cstr_by_ptr(ptr) {
  const mem_buffer = wasm.instance.exports.memory.buffer;
  const mem = new Uint8Array(mem_buffer);
  const len = cstrlen(mem, ptr);
  const bytes = new Uint8Array(mem_buffer, ptr, len);
  return new TextDecoder().decode(bytes);
}

function set_canvas_size(width, height) {
  var pixelRatio = window.devicePixelRatio || 1;
  gl.canvas.width = width;
  gl.canvas.height = height;
  gl.canvas.style.width = `${width / pixelRatio}px`;
  gl.canvas.style.height = `${height / pixelRatio}px`;
}

function resize_event() {
  if (!resizeCallback) return;

  var pixelRatio = window.devicePixelRatio || 1;
  var width = window.innerWidth * pixelRatio | 1;
  var height = window.innerHeight * pixelRatio | 1;
  gl.canvas.width = width;
  gl.canvas.height = height;
  gl.canvas.style.width = `${width / pixelRatio}px`;
  gl.canvas.style.height = `${height / pixelRatio}px`;
  gl.canvas.style.position = "absolute";
  gl.canvas.classList.remove("centered-canvas");
  resizeCallback(null, width, height);
}
window.addEventListener("resize", resize_event);

WebAssembly.instantiateStreaming(fetch('hw_shader.wasm'), {
  env: make_environment({
    glfwInit: () => true,
    glfwTerminate: () => { },
    glfwSwapBuffers: () => { },
    glfwMakeContextCurrent: _ => { },
    glfwSetFramebufferSizeCallback: (_, callback) => {
      resizeCallback = wasm.instance.exports.__indirect_function_table.get(callback);
      setTimeout(resize_event, 0);
    },
    glfwCreateWindow: (width, height, title_ptr, _1, _2) => {
      set_canvas_size(width, height);
      document.title = cstr_by_ptr(title_ptr);
      return 1;
    },

    jsStartMainLoop: (draw) => {
      drawFunction = wasm.instance.exports.__indirect_function_table.get(draw);
    },
    jsConsoleLog: (str_prt) => {
      console.log(cstr_by_ptr(str_prt));
    },
  })
}).then(w => {
  wasm = w;

  const canvas = document.getElementById("game");
  gl = canvas.getContext("webgl");
  libwebgl.__init(wasm, gl);

  w.instance.exports.main();
  function first(timestamp) {
    previous = timestamp;
    window.requestAnimationFrame(next);
  }
  function next(timestamp) {
    dt = (timestamp - previous) / 1000.0;
    previous = timestamp;
    drawFunction();
    if (!should_stop) {
      window.requestAnimationFrame(next);
    }
  }
  window.requestAnimationFrame(first);
}).catch(err => console.log(err));
