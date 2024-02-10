/*
Copyright (c) 2010-2014 Emscripten authors, see AUTHORS file.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// with some modifications by me
function library_webgl() {
  var mem_buffer;
  var HEAP8;
  var HEAP16;
  var HEAPU8;
  var HEAPU16;
  var HEAP32;
  var HEAPU32;
  var HEAPF32;
  var HEAPF64;
  var wasm;
  var GLctx;

  function reset_buffers() {
    if (mem_buffer && !mem_buffer.detached) return;
    mem_buffer = wasm.instance.exports.memory.buffer;
    HEAP8 = new Int8Array(mem_buffer);
    HEAP16 = new Int16Array(mem_buffer);
    HEAPU8 = new Uint8Array(mem_buffer);
    HEAPU16 = new Uint16Array(mem_buffer);
    HEAP32 = new Int32Array(mem_buffer);
    HEAPU32 = new Uint32Array(mem_buffer);
    HEAPF32 = new Float32Array(mem_buffer);
    HEAPF64 = new Float64Array(mem_buffer);
  }

  function init(_wasm, _GLctx) {
    wasm = _wasm;
    GLctx = _GLctx;
    reset_buffers();
    webgl_enable_ANGLE_instanced_arrays(GLctx);
    webgl_enable_OES_vertex_array_object(GLctx);
    webgl_enable_WEBGL_draw_buffers(GLctx);
  }

  function err(...args) {
    console.error(...args)
  }

  function malloc(size) {
    return wasm.instance.exports.malloc(size);
  }

  function stringToNewUTF8(str) {
    var encoded = new TextEncoder().encode(str);
    var size = encoded.length + 1;
    var address = malloc(size);
    if (address) {
      HEAPU8[size - 1] = '\0';
      HEAPU8.set(encoded, address);
    }
    return address;
  }
  function stringToUTF8(str, address, size) {
    var encoded = new TextEncoder().encode(str);
    if (encoded.length + 1 > size) throw new Error(122);
    HEAPU8.set(encoded, address);
    HEAPU8[size - 1] = '\0';
    return encoded.length;
  }

  function cstrlen(mem, ptr) {
    let len = 0;
    while (mem[ptr] != 0) {
      len++;
      ptr++;
    }
    return len;
  }

  function UTF8ToString(ptr, len = undefined) {
    const mem = new Uint8Array(mem_buffer);
    if (len == undefined) {
      len = cstrlen(mem, ptr);
    }
    const bytes = new Uint8Array(mem_buffer, ptr, len);
    return new TextDecoder().decode(bytes);
  }

  function webgl_enable_ANGLE_instanced_arrays(ctx) {
    var ext = ctx.getExtension("ANGLE_instanced_arrays");
    if (ext) {
      ctx["vertexAttribDivisor"] = (index, divisor) => ext["vertexAttribDivisorANGLE"](index, divisor);
      ctx["drawArraysInstanced"] = (mode, first, count, primcount) => ext["drawArraysInstancedANGLE"](mode, first, count, primcount);
      ctx["drawElementsInstanced"] = (mode, count, type, indices, primcount) => ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount);
      return 1
    }
  }

  function webgl_enable_OES_vertex_array_object(ctx) {
    var ext = ctx.getExtension("OES_vertex_array_object");
    if (ext) {
      ctx["createVertexArray"] = () => ext["createVertexArrayOES"]();
      ctx["deleteVertexArray"] = vao => ext["deleteVertexArrayOES"](vao);
      ctx["bindVertexArray"] = vao => ext["bindVertexArrayOES"](vao);
      ctx["isVertexArray"] = vao => ext["isVertexArrayOES"](vao);
      return 1
    }
  }

  function webgl_enable_WEBGL_draw_buffers(ctx) {
    var ext = ctx.getExtension("WEBGL_draw_buffers");
    if (ext) {
      ctx["drawBuffers"] = (n, bufs) => ext["drawBuffersWEBGL"](n, bufs);
      return 1
    }
  }

  function webgl_enable_WEBGL_multi_draw(ctx) {
    return !!(ctx.multiDrawWebgl = ctx.getExtension("WEBGL_multi_draw"));
  }

  var GL = {
    counter: 1,
    buffers: [],
    programs: [],
    framebuffers: [],
    renderbuffers: [],
    textures: [],
    shaders: [],
    vaos: [],
    contexts: [],
    offscreenCanvases: {},
    queries: [],
    stringCache: {},
    unpackAlignment: 4,
    recordError: (errorCode) => {
      if (!GL.lastError) {
        GL.lastError = errorCode
      }
    },
    getNewId: table => {
      var ret = GL.counter++;
      for (var i = table.length; i < ret; i++) {
        table[i] = null
      }
      return ret
    },
    getSource: (shader, count, string, length) => {
      var source = "";
      for (var i = 0; i < count; ++i) {
        var len = length ? HEAP32[length + i * 4 >> 2] : -1;
        source += UTF8ToString(HEAP32[string + i * 4 >> 2], len < 0 ? undefined : len)
      }
      return source
    },
    createContext: (canvas, webGLContextAttributes) => {
      if (!canvas.getContextSafariWebGL2Fixed) {
        canvas.getContextSafariWebGL2Fixed = canvas.getContext;

        function fixedGetContext(ver, attrs) {
          var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
          return ver == "webgl" == gl instanceof WebGLRenderingContext ? gl : null
        }
        canvas.getContext = fixedGetContext
      }
      var ctx = canvas.getContext("webgl", webGLContextAttributes);
      if (!ctx) return 0;
      var handle = GL.registerContext(ctx, webGLContextAttributes);
      return handle
    },
    registerContext: (ctx, webGLContextAttributes) => {
      var handle = GL.getNewId(GL.contexts);
      var context = {
        handle: handle,
        attributes: webGLContextAttributes,
        version: webGLContextAttributes.majorVersion,
        GLctx: ctx
      };
      if (ctx.canvas) ctx.canvas.GLctxObject = context;
      GL.contexts[handle] = context;
      if (typeof webGLContextAttributes.enableExtensionsByDefault == "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
        GL.initExtensions(context)
      }
      return handle
    },
    makeContextCurrent: contextHandle => {
      GL.currentContext = GL.contexts[contextHandle];
      GLctx = GL.currentContext && GL.currentContext.GLctx;
      return !(contextHandle && !GLctx)
    },
    getContext: contextHandle => GL.contexts[contextHandle],
    deleteContext: contextHandle => {
      if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
      // if (typeof JSEvents == "object") JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
      if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
      GL.contexts[contextHandle] = null
    },
    initExtensions: context => {
      if (!context) context = GL.currentContext;
      if (context.initExtensionsDone) return;
      context.initExtensionsDone = true;
      var GLctx = context.GLctx;
      webgl_enable_ANGLE_instanced_arrays(GLctx);
      webgl_enable_OES_vertex_array_object(GLctx);
      webgl_enable_WEBGL_draw_buffers(GLctx);
      {
        GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query")
      }
      webgl_enable_WEBGL_multi_draw(GLctx);
      var exts = GLctx.getSupportedExtensions() || [];
      exts.forEach(ext => {
        if (!ext.includes("lose_context") && !ext.includes("debug")) {
          GLctx.getExtension(ext)
        }
      })
    },
    getExtensions() {
      var exts = GLctx.getSupportedExtensions() || [];
      exts = exts.concat(exts.map(e => "GL_" + e));
      return exts
    }
  };

  var env = {};
  env.glActiveTexture = (x0) => {
    GLctx.activeTexture(x0)
  }
  env.glAttachShader = (program, shader) => {
    GLctx.attachShader(GL.programs[program], GL.shaders[shader])
  };
  env.glBeginQueryEXT = (target, id) => {
    GLctx.disjointTimerQueryExt["beginQueryEXT"](target, GL.queries[id])
  };
  env.glBindAttribLocation = (program, index, name) => {
    GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name))
  };
  env.glBindBuffer = (target, buffer) => {
    GLctx.bindBuffer(target, GL.buffers[buffer])
  };
  env.glBindFramebuffer = (target, framebuffer) => {
    GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer])
  };
  env.glBindRenderbuffer = (target, renderbuffer) => {
    GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer])
  };
  env.glBindTexture = (target, texture) => {
    GLctx.bindTexture(target, GL.textures[texture])
  };
  env.glBindVertexArray = vao => {
    GLctx.bindVertexArray(GL.vaos[vao])
  };
  env.glBindVertexArrayOES = env.glBindVertexArray;

  env.glBlendColor = (x0, x1, x2, x3) => {
    GLctx.blendColor(x0, x1, x2, x3)
  }

  env.glBlendEquation = (x0) => {
    GLctx.blendEquation(x0)
  }

  env.glBlendEquationSeparate = (x0, x1) => {
    GLctx.blendEquationSeparate(x0, x1)
  }

  env.glBlendFunc = (x0, x1) => {
    GLctx.blendFunc(x0, x1)
  }

  env.glBlendFuncSeparate = (x0, x1, x2, x3) => {
    GLctx.blendFuncSeparate(x0, x1, x2, x3)
  }
  env.glBufferData = (target, size, data, usage) => {
    GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage)
  };
  env.glBufferSubData = (target, offset, size, data) => {
    GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data + size))
  };

  env.glCheckFramebufferStatus = (x0) => {
    return GLctx.checkFramebufferStatus(x0)
  }

  env.glClear = (x0) => {
    GLctx.clear(x0)
  }

  env.glClearColor = (x0, x1, x2, x3) => {
    GLctx.clearColor(x0, x1, x2, x3)
  }

  env.glClearDepthf = (x0) => {
    GLctx.clearDepth(x0)
  }

  env.glClearStencil = (x0) => {
    GLctx.clearStencil(x0)
  }
  env.glColorMask = (red, green, blue, alpha) => {
    GLctx.colorMask(!!red, !!green, !!blue, !!alpha)
  };
  env.glCompileShader = shader => {
    GLctx.compileShader(GL.shaders[shader])
  };
  env.glCompressedTexImage2D = (target, level, internalFormat, width, height, border, imageSize, data) => {
    GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, data ? HEAPU8.subarray(data, data + imageSize) : null)
  };
  env.glCompressedTexSubImage2D = (target, level, xoffset, yoffset, width, height, format, imageSize, data) => {
    GLctx.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, data ? HEAPU8.subarray(data, data + imageSize) : null)
  };

  env.glCopyTexImage2D = (x0, x1, x2, x3, x4, x5, x6, x7) => {
    GLctx.copyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7)
  }

  env.glCopyTexSubImage2D = (x0, x1, x2, x3, x4, x5, x6, x7) => {
    GLctx.copyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7)
  }
  env.glCreateProgram = () => {
    var id = GL.getNewId(GL.programs);
    var program = GLctx.createProgram();
    program.name = id;
    program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
    program.uniformIdCounter = 1;
    GL.programs[id] = program;
    return id
  };
  env.glCreateShader = shaderType => {
    var id = GL.getNewId(GL.shaders);
    GL.shaders[id] = GLctx.createShader(shaderType);
    return id
  };

  env.glCullFace = (x0) => {
    GLctx.cullFace(x0)
  }
  env.glDeleteBuffers = (n, buffers) => {
    for (var i = 0; i < n; i++) {
      var id = HEAP32[buffers + i * 4 >> 2];
      var buffer = GL.buffers[id];
      if (!buffer) continue;
      GLctx.deleteBuffer(buffer);
      buffer.name = 0;
      GL.buffers[id] = null
    }
  };
  env.glDeleteFramebuffers = (n, framebuffers) => {
    for (var i = 0; i < n; ++i) {
      var id = HEAP32[framebuffers + i * 4 >> 2];
      var framebuffer = GL.framebuffers[id];
      if (!framebuffer) continue;
      GLctx.deleteFramebuffer(framebuffer);
      framebuffer.name = 0;
      GL.framebuffers[id] = null
    }
  };
  env.glDeleteProgram = id => {
    if (!id) return;
    var program = GL.programs[id];
    if (!program) {
      GL.recordError(1281);
      return
    }
    GLctx.deleteProgram(program);
    program.name = 0;
    GL.programs[id] = null
  };
  env.glDeleteQueriesEXT = (n, ids) => {
    for (var i = 0; i < n; i++) {
      var id = HEAP32[ids + i * 4 >> 2];
      var query = GL.queries[id];
      if (!query) continue;
      GLctx.disjointTimerQueryExt["deleteQueryEXT"](query);
      GL.queries[id] = null
    }
  };
  env.glDeleteRenderbuffers = (n, renderbuffers) => {
    for (var i = 0; i < n; i++) {
      var id = HEAP32[renderbuffers + i * 4 >> 2];
      var renderbuffer = GL.renderbuffers[id];
      if (!renderbuffer) continue;
      GLctx.deleteRenderbuffer(renderbuffer);
      renderbuffer.name = 0;
      GL.renderbuffers[id] = null
    }
  };
  env.glDeleteShader = id => {
    if (!id) return;
    var shader = GL.shaders[id];
    if (!shader) {
      GL.recordError(1281);
      return
    }
    GLctx.deleteShader(shader);
    GL.shaders[id] = null
  };
  env.glDeleteTextures = (n, textures) => {
    for (var i = 0; i < n; i++) {
      var id = HEAP32[textures + i * 4 >> 2];
      var texture = GL.textures[id];
      if (!texture) continue;
      GLctx.deleteTexture(texture);
      texture.name = 0;
      GL.textures[id] = null
    }
  };
  env.glDeleteVertexArrays = (n, vaos) => {
    for (var i = 0; i < n; i++) {
      var id = HEAP32[vaos + i * 4 >> 2];
      GLctx.deleteVertexArray(GL.vaos[id]);
      GL.vaos[id] = null
    }
  };
  env.glDeleteVertexArraysOES = env.glDeleteVertexArrays;

  env.glDepthFunc = (x0) => {
    GLctx.depthFunc(x0)
  }
  env.glDepthMask = flag => {
    GLctx.depthMask(!!flag)
  };

  env.glDepthRangef = (x0, x1) => {
    GLctx.depthRange(x0, x1)
  }
  env.glDetachShader = (program, shader) => {
    GLctx.detachShader(GL.programs[program], GL.shaders[shader])
  };

  env.glDisable = (x0) => {
    GLctx.disable(x0)
  }
  env.glDisableVertexAttribArray = index => {
    GLctx.disableVertexAttribArray(index)
  };
  env.glDrawArrays = (mode, first, count) => {
    GLctx.drawArrays(mode, first, count)
  };
  env.glDrawArraysInstanced = (mode, first, count, primcount) => {
    GLctx.drawArraysInstanced(mode, first, count, primcount)
  };
  env.glDrawArraysInstancedANGLE = env.glDrawArraysInstanced;
  var tempFixedLengthArray = [];
  env.glDrawBuffers = (n, bufs) => {
    var bufArray = tempFixedLengthArray[n];
    for (var i = 0; i < n; i++) {
      bufArray[i] = HEAP32[bufs + i * 4 >> 2]
    }
    GLctx.drawBuffers(bufArray)
  };
  env.glDrawBuffersWEBGL = env.glDrawBuffers;
  env.glDrawElements = (mode, count, type, indices) => {
    GLctx.drawElements(mode, count, type, indices)
  };
  env.glDrawElementsInstanced = (mode, count, type, indices, primcount) => {
    GLctx.drawElementsInstanced(mode, count, type, indices, primcount)
  };
  env.glDrawElementsInstancedANGLE = env.glDrawElementsInstanced;

  env.glEnable = (x0) => {
    GLctx.enable(x0)
  }
  env.glEnableVertexAttribArray = index => {
    GLctx.enableVertexAttribArray(index)
  };
  env.glEndQueryEXT = target => {
    GLctx.disjointTimerQueryExt["endQueryEXT"](target)
  };

  env.glFinish = () => {
    GLctx.finish()
  }

  env.glFlush = () => {
    GLctx.flush()
  }
  env.glFramebufferRenderbuffer = (target, attachment, renderbuffertarget, renderbuffer) => {
    GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer])
  };
  env.glFramebufferTexture2D = (target, attachment, textarget, texture, level) => {
    GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level)
  };

  env.glFrontFace = (x0) => {
    GLctx.frontFace(x0)
  }
  var __glGenObject = (n, buffers, createFunction, objectTable) => {
    for (var i = 0; i < n; i++) {
      var buffer = GLctx[createFunction]();
      var id = buffer && GL.getNewId(objectTable);
      if (buffer) {
        buffer.name = id;
        objectTable[id] = buffer
      } else {
        GL.recordError(1282)
      }
      HEAP32[buffers + i * 4 >> 2] = id
    }
  };
  env.glGenBuffers = (n, buffers) => {
    __glGenObject(n, buffers, "createBuffer", GL.buffers)
  };
  env.glGenFramebuffers = (n, ids) => {
    __glGenObject(n, ids, "createFramebuffer", GL.framebuffers)
  };
  env.glGenQueriesEXT = (n, ids) => {
    for (var i = 0; i < n; i++) {
      var query = GLctx.disjointTimerQueryExt["createQueryEXT"]();
      if (!query) {
        GL.recordError(1282);
        while (i < n) HEAP32[ids + i++ * 4 >> 2] = 0;
        return
      }
      var id = GL.getNewId(GL.queries);
      query.name = id;
      GL.queries[id] = query;
      HEAP32[ids + i * 4 >> 2] = id
    }
  };
  env.glGenRenderbuffers = (n, renderbuffers) => {
    __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers)
  };
  env.glGenTextures = (n, textures) => {
    __glGenObject(n, textures, "createTexture", GL.textures)
  };

  env.glGenVertexArrays = (n, arrays) => {
    __glGenObject(n, arrays, "createVertexArray", GL.vaos)
  }
  env.glGenVertexArraysOES = env.glGenVertexArrays;

  env.glGenerateMipmap = (x0) => {
    GLctx.generateMipmap(x0)
  }
  var __glGetActiveAttribOrUniform = (funcName, program, index, bufSize, length, size, type, name) => {
    program = GL.programs[program];
    var info = GLctx[funcName](program, index);
    if (info) {
      var numBytesWrittenExclNull = name && stringToUTF8(info.name, name, bufSize);
      if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
      if (size) HEAP32[size >> 2] = info.size;
      if (type) HEAP32[type >> 2] = info.type
    }
  };
  env.glGetActiveAttrib = (program, index, bufSize, length, size, type, name) => {
    __glGetActiveAttribOrUniform("getActiveAttrib", program, index, bufSize, length, size, type, name)
  };
  env.glGetActiveUniform = (program, index, bufSize, length, size, type, name) => {
    __glGetActiveAttribOrUniform("getActiveUniform", program, index, bufSize, length, size, type, name)
  };
  env.glGetAttachedShaders = (program, maxCount, count, shaders) => {
    var result = GLctx.getAttachedShaders(GL.programs[program]);
    var len = result.length;
    if (len > maxCount) {
      len = maxCount
    }
    HEAP32[count >> 2] = len;
    for (var i = 0; i < len; ++i) {
      var id = GL.shaders.indexOf(result[i]);
      HEAP32[shaders + i * 4 >> 2] = id
    }
  };
  env.glGetAttribLocation = (program, name) => GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));
  var writeI53ToI64 = (ptr, num) => {
    HEAPU32[ptr >> 2] = num;
    var lower = HEAPU32[ptr >> 2];
    HEAPU32[ptr + 4 >> 2] = (num - lower) / 4294967296
  };
  var emscriptenWebGLGet = (name_, p, type) => {
    if (!p) {
      GL.recordError(1281);
      return
    }
    var ret = undefined;
    switch (name_) {
      case 36346:
        ret = 1;
        break;
      case 36344:
        if (type != 0 && type != 1) {
          GL.recordError(1280)
        }
        return;
      case 36345:
        ret = 0;
        break;
      case 34466:
        var formats = GLctx.getParameter(34467);
        ret = formats ? formats.length : 0;
        break
    }
    if (ret === undefined) {
      var result = GLctx.getParameter(name_);
      switch (typeof result) {
        case "number":
          ret = result;
          break;
        case "boolean":
          ret = result ? 1 : 0;
          break;
        case "string":
          GL.recordError(1280);
          return;
        case "object":
          if (result === null) {
            switch (name_) {
              case 34964:
              case 35725:
              case 34965:
              case 36006:
              case 36007:
              case 32873:
              case 34229:
              case 34068: {
                ret = 0;
                break
              }
              default: {
                GL.recordError(1280);
                return
              }
            }
          } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
            for (var i = 0; i < result.length; ++i) {
              switch (type) {
                case 0:
                  HEAP32[p + i * 4 >> 2] = result[i];
                  break;
                case 2:
                  HEAPF32[p + i * 4 >> 2] = result[i];
                  break;
                case 4:
                  HEAP8[p + i >> 0] = result[i] ? 1 : 0;
                  break
              }
            }
            return
          } else {
            try {
              ret = result.name | 0
            } catch (e) {
              GL.recordError(1280);
              err("GL_INVALID_ENUM in glGet" + type + "v: Unknown object returned from WebGL getParameter(" + name_ + ")! (error: " + e + ")");
              return
            }
          }
          break;
        default:
          GL.recordError(1280);
          err("GL_INVALID_ENUM in glGet" + type + "v: Native code calling glGet" + type + "v(" + name_ + ") and it returns " + result + " of type " + typeof result + "!");
          return
      }
    }
    switch (type) {
      case 1:
        writeI53ToI64(p, ret);
        break;
      case 0:
        HEAP32[p >> 2] = ret;
        break;
      case 2:
        HEAPF32[p >> 2] = ret;
        break;
      case 4:
        HEAP8[p >> 0] = ret ? 1 : 0;
        break
    }
  };
  env.glGetBooleanv = (name_, p) => {
    emscriptenWebGLGet(name_, p, 4)
  };
  env.glGetBufferParameteriv = (target, value, data) => {
    if (!data) {
      GL.recordError(1281);
      return
    }
    HEAP32[data >> 2] = GLctx.getBufferParameter(target, value)
  };
  env.glGetError = () => {
    var error = GLctx.getError() || GL.lastError;
    GL.lastError = 0;
    return error
  };
  env.glGetFloatv = (name_, p) => {
    emscriptenWebGLGet(name_, p, 2)
  };
  env.glGetFramebufferAttachmentParameteriv = (target, attachment, pname, params) => {
    var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
    if (result instanceof WebGLRenderbuffer || result instanceof WebGLTexture) {
      result = result.name | 0
    }
    HEAP32[params >> 2] = result
  };
  env.glGetIntegerv = (name_, p) => {
    emscriptenWebGLGet(name_, p, 0)
  };
  env.glGetProgramInfoLog = (program, maxLength, length, infoLog) => {
    var log = GLctx.getProgramInfoLog(GL.programs[program]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
  };
  env.glGetProgramiv = (program, pname, p) => {
    if (!p) {
      GL.recordError(1281);
      return
    }
    if (program >= GL.counter) {
      GL.recordError(1281);
      return
    }
    program = GL.programs[program];
    if (pname == 35716) {
      var log = GLctx.getProgramInfoLog(program);
      if (log === null) log = "(unknown error)";
      HEAP32[p >> 2] = log.length + 1
    } else if (pname == 35719) {
      if (!program.maxUniformLength) {
        for (var i = 0; i < GLctx.getProgramParameter(program, 35718); ++i) {
          program.maxUniformLength = Math.max(program.maxUniformLength, GLctx.getActiveUniform(program, i).name.length + 1)
        }
      }
      HEAP32[p >> 2] = program.maxUniformLength
    } else if (pname == 35722) {
      if (!program.maxAttributeLength) {
        for (var i = 0; i < GLctx.getProgramParameter(program, 35721); ++i) {
          program.maxAttributeLength = Math.max(program.maxAttributeLength, GLctx.getActiveAttrib(program, i).name.length + 1)
        }
      }
      HEAP32[p >> 2] = program.maxAttributeLength
    } else if (pname == 35381) {
      if (!program.maxUniformBlockNameLength) {
        for (var i = 0; i < GLctx.getProgramParameter(program, 35382); ++i) {
          program.maxUniformBlockNameLength = Math.max(program.maxUniformBlockNameLength, GLctx.getActiveUniformBlockName(program, i).length + 1)
        }
      }
      HEAP32[p >> 2] = program.maxUniformBlockNameLength
    } else {
      HEAP32[p >> 2] = GLctx.getProgramParameter(program, pname)
    }
  };
  env.glGetQueryObjecti64vEXT = (id, pname, params) => {
    if (!params) {
      GL.recordError(1281);
      return
    }
    var query = GL.queries[id];
    var param;
    {
      param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname)
    }
    var ret;
    if (typeof param == "boolean") {
      ret = param ? 1 : 0
    } else {
      ret = param
    }
    writeI53ToI64(params, ret)
  };
  env.glGetQueryObjectivEXT = (id, pname, params) => {
    if (!params) {
      GL.recordError(1281);
      return
    }
    var query = GL.queries[id];
    var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](query, pname);
    var ret;
    if (typeof param == "boolean") {
      ret = param ? 1 : 0
    } else {
      ret = param
    }
    HEAP32[params >> 2] = ret
  };
  env.glGetQueryObjectui64vEXT = env.glGetQueryObjecti64vEXT;
  env.glGetQueryObjectuivEXT = env.glGetQueryObjectivEXT;
  env.glGetQueryivEXT = (target, pname, params) => {
    if (!params) {
      GL.recordError(1281);
      return
    }
    HEAP32[params >> 2] = GLctx.disjointTimerQueryExt["getQueryEXT"](target, pname)
  };
  env.glGetRenderbufferParameteriv = (target, pname, params) => {
    if (!params) {
      GL.recordError(1281);
      return
    }
    HEAP32[params >> 2] = GLctx.getRenderbufferParameter(target, pname)
  };
  env.glGetShaderInfoLog = (shader, maxLength, length, infoLog) => {
    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
  };
  env.glGetShaderPrecisionFormat = (shaderType, precisionType, range, precision) => {
    var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
    HEAP32[range >> 2] = result.rangeMin;
    HEAP32[range + 4 >> 2] = result.rangeMax;
    HEAP32[precision >> 2] = result.precision
  };
  env.glGetShaderSource = (shader, bufSize, length, source) => {
    var result = GLctx.getShaderSource(GL.shaders[shader]);
    if (!result) return;
    var numBytesWrittenExclNull = bufSize > 0 && source ? stringToUTF8(result, source, bufSize) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
  };
  env.glGetShaderiv = (shader, pname, p) => {
    if (!p) {
      GL.recordError(1281);
      return
    }
    if (pname == 35716) {
      var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
      if (log === null) log = "(unknown error)";
      var logLength = log ? log.length + 1 : 0;
      HEAP32[p >> 2] = logLength
    } else if (pname == 35720) {
      var source = GLctx.getShaderSource(GL.shaders[shader]);
      var sourceLength = source ? source.length + 1 : 0;
      HEAP32[p >> 2] = sourceLength
    } else {
      HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname)
    }
  };
  env.glGetString = name_ => {
    var ret = GL.stringCache[name_];
    if (!ret) {
      switch (name_) {
        case 7939:
          ret = stringToNewUTF8(GL.getExtensions().join(" "));
          break;
        case 7936:
        case 7937:
        case 37445:
        case 37446:
          var s = GLctx.getParameter(name_);
          if (!s) {
            GL.recordError(1280)
          }
          ret = s ? stringToNewUTF8(s) : 0;
          break;
        case 7938:
          var glVersion = GLctx.getParameter(7938);
          {
            glVersion = "OpenGL ES 2.0 (" + glVersion + ")"
          }
          ret = stringToNewUTF8(glVersion);
          break;
        case 35724:
          var glslVersion = GLctx.getParameter(35724);
          var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
          var ver_num = glslVersion.match(ver_re);
          if (ver_num !== null) {
            if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
            glslVersion = "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")"
          }
          ret = stringToNewUTF8(glslVersion);
          break;
        default:
          GL.recordError(1280)
      }
      GL.stringCache[name_] = ret
    }
    return ret
  };
  env.glGetTexParameterfv = (target, pname, params) => {
    if (!params) {
      GL.recordError(1281);
      return
    }
    HEAPF32[params >> 2] = GLctx.getTexParameter(target, pname)
  };
  env.glGetTexParameteriv = (target, pname, params) => {
    if (!params) {
      GL.recordError(1281);
      return
    }
    HEAP32[params >> 2] = GLctx.getTexParameter(target, pname)
  };
  var jstoi_q = str => parseInt(str);
  var webglGetLeftBracePos = name => name.slice(-1) == "]" && name.lastIndexOf("[");
  var webglPrepareUniformLocationsBeforeFirstUse = program => {
    var uniformLocsById = program.uniformLocsById,
      uniformSizeAndIdsByName = program.uniformSizeAndIdsByName,
      i, j;
    if (!uniformLocsById) {
      program.uniformLocsById = uniformLocsById = {};
      program.uniformArrayNamesById = {};
      for (i = 0; i < GLctx.getProgramParameter(program, 35718); ++i) {
        var u = GLctx.getActiveUniform(program, i);
        var nm = u.name;
        var sz = u.size;
        var lb = webglGetLeftBracePos(nm);
        var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
        var id = program.uniformIdCounter;
        program.uniformIdCounter += sz;
        uniformSizeAndIdsByName[arrayName] = [sz, id];
        for (j = 0; j < sz; ++j) {
          uniformLocsById[id] = j;
          program.uniformArrayNamesById[id++] = arrayName
        }
      }
    }
  };
  env.glGetUniformLocation = (program, name) => {
    name = UTF8ToString(name);
    if (program = GL.programs[program]) {
      webglPrepareUniformLocationsBeforeFirstUse(program);
      var uniformLocsById = program.uniformLocsById;
      var arrayIndex = 0;
      var uniformBaseName = name;
      var leftBrace = webglGetLeftBracePos(name);
      if (leftBrace > 0) {
        arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0;
        uniformBaseName = name.slice(0, leftBrace)
      }
      var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
      if (sizeAndId && arrayIndex < sizeAndId[0]) {
        arrayIndex += sizeAndId[1];
        if (uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name)) {
          return arrayIndex
        }
      }
    } else {
      GL.recordError(1281)
    }
    return -1
  };
  var webglGetUniformLocation = location => {
    var p = GLctx.currentProgram;
    if (p) {
      var webglLoc = p.uniformLocsById[location];
      if (typeof webglLoc == "number") {
        p.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(p, p.uniformArrayNamesById[location] + (webglLoc > 0 ? "[" + webglLoc + "]" : ""))
      }
      return webglLoc
    } else {
      GL.recordError(1282)
    }
  };
  var emscriptenWebGLGetUniform = (program, location, params, type) => {
    if (!params) {
      GL.recordError(1281);
      return
    }
    program = GL.programs[program];
    webglPrepareUniformLocationsBeforeFirstUse(program);
    var data = GLctx.getUniform(program, webglGetUniformLocation(location));
    if (typeof data == "number" || typeof data == "boolean") {
      switch (type) {
        case 0:
          HEAP32[params >> 2] = data;
          break;
        case 2:
          HEAPF32[params >> 2] = data;
          break
      }
    } else {
      for (var i = 0; i < data.length; i++) {
        switch (type) {
          case 0:
            HEAP32[params + i * 4 >> 2] = data[i];
            break;
          case 2:
            HEAPF32[params + i * 4 >> 2] = data[i];
            break
        }
      }
    }
  };
  env.glGetUniformfv = (program, location, params) => {
    emscriptenWebGLGetUniform(program, location, params, 2)
  };
  env.glGetUniformiv = (program, location, params) => {
    emscriptenWebGLGetUniform(program, location, params, 0)
  };
  env.glGetVertexAttribPointerv = (index, pname, pointer) => {
    if (!pointer) {
      GL.recordError(1281);
      return
    }
    HEAP32[pointer >> 2] = GLctx.getVertexAttribOffset(index, pname)
  };
  var emscriptenWebGLGetVertexAttrib = (index, pname, params, type) => {
    if (!params) {
      GL.recordError(1281);
      return
    }
    var data = GLctx.getVertexAttrib(index, pname);
    if (pname == 34975) {
      HEAP32[params >> 2] = data && data["name"]
    } else if (typeof data == "number" || typeof data == "boolean") {
      switch (type) {
        case 0:
          HEAP32[params >> 2] = data;
          break;
        case 2:
          HEAPF32[params >> 2] = data;
          break;
        case 5:
          HEAP32[params >> 2] = Math.fround(data);
          break
      }
    } else {
      for (var i = 0; i < data.length; i++) {
        switch (type) {
          case 0:
            HEAP32[params + i * 4 >> 2] = data[i];
            break;
          case 2:
            HEAPF32[params + i * 4 >> 2] = data[i];
            break;
          case 5:
            HEAP32[params + i * 4 >> 2] = Math.fround(data[i]);
            break
        }
      }
    }
  };
  env.glGetVertexAttribfv = (index, pname, params) => {
    emscriptenWebGLGetVertexAttrib(index, pname, params, 2)
  };
  env.glGetVertexAttribiv = (index, pname, params) => {
    emscriptenWebGLGetVertexAttrib(index, pname, params, 5)
  };

  env.glHint = (x0, x1) => {
    GLctx.hint(x0, x1)
  }
  env.glIsBuffer = buffer => {
    var b = GL.buffers[buffer];
    if (!b) return 0;
    return GLctx.isBuffer(b)
  };

  env.glIsEnabled = (x0) => {
    return GLctx.isEnabled(x0)
  }
  env.glIsFramebuffer = framebuffer => {
    var fb = GL.framebuffers[framebuffer];
    if (!fb) return 0;
    return GLctx.isFramebuffer(fb)
  };
  env.glIsProgram = program => {
    program = GL.programs[program];
    if (!program) return 0;
    return GLctx.isProgram(program)
  };
  env.glIsQueryEXT = id => {
    var query = GL.queries[id];
    if (!query) return 0;
    return GLctx.disjointTimerQueryExt["isQueryEXT"](query)
  };
  env.glIsRenderbuffer = renderbuffer => {
    var rb = GL.renderbuffers[renderbuffer];
    if (!rb) return 0;
    return GLctx.isRenderbuffer(rb)
  };
  env.glIsShader = shader => {
    var s = GL.shaders[shader];
    if (!s) return 0;
    return GLctx.isShader(s)
  };
  env.glIsTexture = id => {
    var texture = GL.textures[id];
    if (!texture) return 0;
    return GLctx.isTexture(texture)
  };
  env.glIsVertexArray = array => {
    var vao = GL.vaos[array];
    if (!vao) return 0;
    return GLctx.isVertexArray(vao)
  };
  env.glIsVertexArrayOES = env.glIsVertexArray;

  env.glLineWidth = (x0) => {
    GLctx.lineWidth(x0)
  }
  env.glLinkProgram = program => {
    program = GL.programs[program];
    GLctx.linkProgram(program);
    program.uniformLocsById = 0;
    program.uniformSizeAndIdsByName = {}
  };
  env.glPixelStorei = (pname, param) => {
    if (pname == 3317) {
      GL.unpackAlignment = param
    }
    GLctx.pixelStorei(pname, param)
  };

  env.glPolygonOffset = (x0, x1) => {
    GLctx.polygonOffset(x0, x1)
  }
  env.glQueryCounterEXT = (id, target) => {
    GLctx.disjointTimerQueryExt["queryCounterEXT"](GL.queries[id], target)
  };
  var computeUnpackAlignedImageSize = (width, height, sizePerPixel, alignment) => {
    function roundedToNextMultipleOf(x, y) {
      return x + y - 1 & -y
    }
    var plainRowSize = width * sizePerPixel;
    var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
    return height * alignedRowSize
  };
  var colorChannelsInGlTextureFormat = format => {
    var colorChannels = {
      5: 3,
      6: 4,
      8: 2,
      29502: 3,
      29504: 4
    };
    return colorChannels[format - 6402] || 1
  };
  var heapObjectForWebGLType = type => {
    type -= 5120;
    if (type == 1) return HEAPU8;
    if (type == 4) return HEAP32;
    if (type == 6) return HEAPF32;
    if (type == 5 || type == 28922) return HEAPU32;
    return HEAPU16
  };
  var heapAccessShiftForWebGLHeap = heap => 31 - Math.clz32(heap.BYTES_PER_ELEMENT);
  var emscriptenWebGLGetTexPixelData = (type, format, width, height, pixels, internalFormat) => {
    var heap = heapObjectForWebGLType(type);
    var shift = heapAccessShiftForWebGLHeap(heap);
    var byteSize = 1 << shift;
    var sizePerPixel = colorChannelsInGlTextureFormat(format) * byteSize;
    var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);
    return heap.subarray(pixels >> shift, pixels + bytes >> shift)
  };
  env.glReadPixels = (x, y, width, height, format, type, pixels) => {
    var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
    if (!pixelData) {
      GL.recordError(1280);
      return
    }
    GLctx.readPixels(x, y, width, height, format, type, pixelData)
  };
  env.glReleaseShaderCompiler = () => { };

  env.glRenderbufferStorage = (x0, x1, x2, x3) => {
    GLctx.renderbufferStorage(x0, x1, x2, x3)
  }
  env.glSampleCoverage = (value, invert) => {
    GLctx.sampleCoverage(value, !!invert)
  };

  env.glScissor = (x0, x1, x2, x3) => {
    GLctx.scissor(x0, x1, x2, x3)
  }
  env.glShaderBinary = (count, shaders, binaryformat, binary, length) => {
    GL.recordError(1280)
  };
  env.glShaderSource = (shader, count, string, length) => {
    var source = GL.getSource(shader, count, string, length);
    GLctx.shaderSource(GL.shaders[shader], source)
  };

  env.glStencilFunc = (x0, x1, x2) => {
    GLctx.stencilFunc(x0, x1, x2)
  }

  env.glStencilFuncSeparate = (x0, x1, x2, x3) => {
    GLctx.stencilFuncSeparate(x0, x1, x2, x3)
  }

  env.glStencilMask = (x0) => {
    GLctx.stencilMask(x0)
  }

  env.glStencilMaskSeparate = (x0, x1) => {
    GLctx.stencilMaskSeparate(x0, x1)
  }

  env.glStencilOp = (x0, x1, x2) => {
    GLctx.stencilOp(x0, x1, x2)
  }

  env.glStencilOpSeparate = (x0, x1, x2, x3) => {
    GLctx.stencilOpSeparate(x0, x1, x2, x3)
  }
  env.glTexImage2D = (target, level, internalFormat, width, height, border, format, type, pixels) => {
    GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null)
  };

  env.glTexParameterf = (x0, x1, x2) => {
    GLctx.texParameterf(x0, x1, x2)
  }
  env.glTexParameterfv = (target, pname, params) => {
    var param = HEAPF32[params >> 2];
    GLctx.texParameterf(target, pname, param)
  };

  env.glTexParameteri = (x0, x1, x2) => {
    GLctx.texParameteri(x0, x1, x2)
  }
  env.glTexParameteriv = (target, pname, params) => {
    var param = HEAP32[params >> 2];
    GLctx.texParameteri(target, pname, param)
  };
  env.glTexSubImage2D = (target, level, xoffset, yoffset, width, height, format, type, pixels) => {
    var pixelData = null;
    if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
    GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData)
  };
  env.glUniform1f = (location, v0) => {
    GLctx.uniform1f(webglGetUniformLocation(location), v0)
  };
  var miniTempWebGLFloatBuffers = [];
  env.glUniform1fv = (location, count, value) => {
    if (count <= 288) {
      var view = miniTempWebGLFloatBuffers[count - 1];
      for (var i = 0; i < count; ++i) {
        view[i] = HEAPF32[value + 4 * i >> 2]
      }
    } else {
      var view = HEAPF32.subarray(value >> 2, value + count * 4 >> 2)
    }
    GLctx.uniform1fv(webglGetUniformLocation(location), view)
  };
  env.glUniform1i = (location, v0) => {
    GLctx.uniform1i(webglGetUniformLocation(location), v0)
  };
  var miniTempWebGLIntBuffers = [];
  env.glUniform1iv = (location, count, value) => {
    if (count <= 288) {
      var view = miniTempWebGLIntBuffers[count - 1];
      for (var i = 0; i < count; ++i) {
        view[i] = HEAP32[value + 4 * i >> 2]
      }
    } else {
      var view = HEAP32.subarray(value >> 2, value + count * 4 >> 2)
    }
    GLctx.uniform1iv(webglGetUniformLocation(location), view)
  };
  env.glUniform2f = (location, v0, v1) => {
    GLctx.uniform2f(webglGetUniformLocation(location), v0, v1)
  };
  env.glUniform2fv = (location, count, value) => {
    if (count <= 144) {
      var view = miniTempWebGLFloatBuffers[2 * count - 1];
      for (var i = 0; i < 2 * count; i += 2) {
        view[i] = HEAPF32[value + 4 * i >> 2];
        view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2]
      }
    } else {
      var view = HEAPF32.subarray(value >> 2, value + count * 8 >> 2)
    }
    GLctx.uniform2fv(webglGetUniformLocation(location), view)
  };
  env.glUniform2i = (location, v0, v1) => {
    GLctx.uniform2i(webglGetUniformLocation(location), v0, v1)
  };
  env.glUniform2iv = (location, count, value) => {
    if (count <= 144) {
      var view = miniTempWebGLIntBuffers[2 * count - 1];
      for (var i = 0; i < 2 * count; i += 2) {
        view[i] = HEAP32[value + 4 * i >> 2];
        view[i + 1] = HEAP32[value + (4 * i + 4) >> 2]
      }
    } else {
      var view = HEAP32.subarray(value >> 2, value + count * 8 >> 2)
    }
    GLctx.uniform2iv(webglGetUniformLocation(location), view)
  };
  env.glUniform3f = (location, v0, v1, v2) => {
    GLctx.uniform3f(webglGetUniformLocation(location), v0, v1, v2)
  };
  env.glUniform3fv = (location, count, value) => {
    if (count <= 96) {
      var view = miniTempWebGLFloatBuffers[3 * count - 1];
      for (var i = 0; i < 3 * count; i += 3) {
        view[i] = HEAPF32[value + 4 * i >> 2];
        view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
        view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2]
      }
    } else {
      var view = HEAPF32.subarray(value >> 2, value + count * 12 >> 2)
    }
    GLctx.uniform3fv(webglGetUniformLocation(location), view)
  };
  env.glUniform3i = (location, v0, v1, v2) => {
    GLctx.uniform3i(webglGetUniformLocation(location), v0, v1, v2)
  };
  env.glUniform3iv = (location, count, value) => {
    if (count <= 96) {
      var view = miniTempWebGLIntBuffers[3 * count - 1];
      for (var i = 0; i < 3 * count; i += 3) {
        view[i] = HEAP32[value + 4 * i >> 2];
        view[i + 1] = HEAP32[value + (4 * i + 4) >> 2];
        view[i + 2] = HEAP32[value + (4 * i + 8) >> 2]
      }
    } else {
      var view = HEAP32.subarray(value >> 2, value + count * 12 >> 2)
    }
    GLctx.uniform3iv(webglGetUniformLocation(location), view)
  };
  env.glUniform4f = (location, v0, v1, v2, v3) => {
    GLctx.uniform4f(webglGetUniformLocation(location), v0, v1, v2, v3)
  };
  env.glUniform4fv = (location, count, value) => {
    if (count <= 72) {
      var view = miniTempWebGLFloatBuffers[4 * count - 1];
      var heap = HEAPF32;
      value >>= 2;
      for (var i = 0; i < 4 * count; i += 4) {
        var dst = value + i;
        view[i] = heap[dst];
        view[i + 1] = heap[dst + 1];
        view[i + 2] = heap[dst + 2];
        view[i + 3] = heap[dst + 3]
      }
    } else {
      var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2)
    }
    GLctx.uniform4fv(webglGetUniformLocation(location), view)
  };
  env.glUniform4i = (location, v0, v1, v2, v3) => {
    GLctx.uniform4i(webglGetUniformLocation(location), v0, v1, v2, v3)
  };
  env.glUniform4iv = (location, count, value) => {
    if (count <= 72) {
      var view = miniTempWebGLIntBuffers[4 * count - 1];
      for (var i = 0; i < 4 * count; i += 4) {
        view[i] = HEAP32[value + 4 * i >> 2];
        view[i + 1] = HEAP32[value + (4 * i + 4) >> 2];
        view[i + 2] = HEAP32[value + (4 * i + 8) >> 2];
        view[i + 3] = HEAP32[value + (4 * i + 12) >> 2]
      }
    } else {
      var view = HEAP32.subarray(value >> 2, value + count * 16 >> 2)
    }
    GLctx.uniform4iv(webglGetUniformLocation(location), view)
  };
  env.glUniformMatrix2fv = (location, count, transpose, value) => {
    if (count <= 72) {
      var view = miniTempWebGLFloatBuffers[4 * count - 1];
      for (var i = 0; i < 4 * count; i += 4) {
        view[i] = HEAPF32[value + 4 * i >> 2];
        view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
        view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
        view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2]
      }
    } else {
      var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2)
    }
    GLctx.uniformMatrix2fv(webglGetUniformLocation(location), !!transpose, view)
  };
  env.glUniformMatrix3fv = (location, count, transpose, value) => {
    if (count <= 32) {
      var view = miniTempWebGLFloatBuffers[9 * count - 1];
      for (var i = 0; i < 9 * count; i += 9) {
        view[i] = HEAPF32[value + 4 * i >> 2];
        view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
        view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
        view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2];
        view[i + 4] = HEAPF32[value + (4 * i + 16) >> 2];
        view[i + 5] = HEAPF32[value + (4 * i + 20) >> 2];
        view[i + 6] = HEAPF32[value + (4 * i + 24) >> 2];
        view[i + 7] = HEAPF32[value + (4 * i + 28) >> 2];
        view[i + 8] = HEAPF32[value + (4 * i + 32) >> 2]
      }
    } else {
      var view = HEAPF32.subarray(value >> 2, value + count * 36 >> 2)
    }
    GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, view)
  };
  env.glUniformMatrix4fv = (location, count, transpose, value) => {
    if (count <= 18) {
      var view = miniTempWebGLFloatBuffers[16 * count - 1];
      var heap = HEAPF32;
      value >>= 2;
      for (var i = 0; i < 16 * count; i += 16) {
        var dst = value + i;
        view[i] = heap[dst];
        view[i + 1] = heap[dst + 1];
        view[i + 2] = heap[dst + 2];
        view[i + 3] = heap[dst + 3];
        view[i + 4] = heap[dst + 4];
        view[i + 5] = heap[dst + 5];
        view[i + 6] = heap[dst + 6];
        view[i + 7] = heap[dst + 7];
        view[i + 8] = heap[dst + 8];
        view[i + 9] = heap[dst + 9];
        view[i + 10] = heap[dst + 10];
        view[i + 11] = heap[dst + 11];
        view[i + 12] = heap[dst + 12];
        view[i + 13] = heap[dst + 13];
        view[i + 14] = heap[dst + 14];
        view[i + 15] = heap[dst + 15]
      }
    } else {
      var view = HEAPF32.subarray(value >> 2, value + count * 64 >> 2)
    }
    GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, view)
  };
  env.glUseProgram = program => {
    program = GL.programs[program];
    GLctx.useProgram(program);
    GLctx.currentProgram = program
  };
  env.glValidateProgram = program => {
    GLctx.validateProgram(GL.programs[program])
  };

  env.glVertexAttrib1f = (x0, x1) => {
    GLctx.vertexAttrib1f(x0, x1)
  }
  env.glVertexAttrib1fv = (index, v) => {
    GLctx.vertexAttrib1f(index, HEAPF32[v >> 2])
  };

  env.glVertexAttrib2f = (x0, x1, x2) => {
    GLctx.vertexAttrib2f(x0, x1, x2)
  }
  env.glVertexAttrib2fv = (index, v) => {
    GLctx.vertexAttrib2f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2])
  };

  env.glVertexAttrib3f = (x0, x1, x2, x3) => {
    GLctx.vertexAttrib3f(x0, x1, x2, x3)
  }
  env.glVertexAttrib3fv = (index, v) => {
    GLctx.vertexAttrib3f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2], HEAPF32[v + 8 >> 2])
  };

  env.glVertexAttrib4f = (x0, x1, x2, x3, x4) => {
    GLctx.vertexAttrib4f(x0, x1, x2, x3, x4)
  }
  env.glVertexAttrib4fv = (index, v) => {
    GLctx.vertexAttrib4f(index, HEAPF32[v >> 2], HEAPF32[v + 4 >> 2], HEAPF32[v + 8 >> 2], HEAPF32[v + 12 >> 2])
  };
  env.glVertexAttribDivisor = (index, divisor) => {
    GLctx.vertexAttribDivisor(index, divisor)
  };
  env.glVertexAttribDivisorANGLE = env.glVertexAttribDivisor;
  env.glVertexAttribPointer = (index, size, type, normalized, stride, ptr) => {
    GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr)
  };

  env.glViewport = (x0, x1, x2, x3) => {
    GLctx.viewport(x0, x1, x2, x3)
  }

  var miniTempWebGLFloatBuffersStorage = new Float32Array(288);
  for (var i = 0; i < 288; ++i) {
    miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i + 1)
  }
  var miniTempWebGLIntBuffersStorage = new Int32Array(288);
  for (var i = 0; i < 288; ++i) {
    miniTempWebGLIntBuffers[i] = miniTempWebGLIntBuffersStorage.subarray(0, i + 1)
  }

  env.__reset_buffers = reset_buffers;
  env.__init = init;
  return env;
}
