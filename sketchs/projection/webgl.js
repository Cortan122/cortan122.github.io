function __parseObj(model, lines) {
  // OBJ allows a face to specify an index for a vertex (in the above example),
  // but it also allows you to specify a custom combination of vertex, UV
  // coordinate, and vertex normal. So, "3/4/3" would mean, "use vertex 3 with
  // UV coordinate 4 and vertex normal 3". In WebGL, every vertex with different
  // parameters must be a different vertex, so loadedVerts is used to
  // temporarily store the parsed vertices, normals, etc., and indexedVerts is
  // used to map a specific combination (keyed on, for example, the string
  // "3/4/3"), to the actual index of the newly created vertex in the final
  // object.
  var loadedVerts = {
    v: [],
    vt: [],
    vn: []
  };
  var indexedVerts = {};
  model.strokeIndices = [];

  for (var line = 0; line < lines.length; ++line) {
    // Each line is a separate object (vertex, face, vertex normal, etc)
    // For each line, split it into tokens on whitespace. The first token
    // describes the type.
    var tokens = lines[line].trim().split(/\b\s+/);

    if (tokens.length > 0) {
      if (tokens[0] === 'v' || tokens[0] === 'vn') {
        // Check if this line describes a vertex or vertex normal.
        // It will have three numeric parameters.
        var vertex = new p5.Vector(
          parseFloat(tokens[1]),
          parseFloat(tokens[2]),
          parseFloat(tokens[3])
        );
        loadedVerts[tokens[0]].push(vertex);
      } else if (tokens[0] === 'vt') {
        // Check if this line describes a texture coordinate.
        // It will have two numeric parameters.
        var texVertex = [parseFloat(tokens[1]), parseFloat(tokens[2])];
        loadedVerts[tokens[0]].push(texVertex);
      } else if (tokens[0] === 'f') {
        var originalFace = [];
        // Check if this line describes a face.
        // OBJ faces can have more than three points. Triangulate points.
        for (var tri = 3; tri < tokens.length; ++tri) {
          var face = [];

          var vertexTokens = [1, tri - 1, tri];

          for (var tokenInd = 0; tokenInd < vertexTokens.length; ++tokenInd) {
            // Now, convert the given token into an index
            var vertString = tokens[vertexTokens[tokenInd]];
            var vertIndex = 0;

            // TODO: Faces can technically use negative numbers to refer to the
            // previous nth vertex. I haven't seen this used in practice, but
            // it might be good to implement this in the future.

            if (indexedVerts[vertString] !== undefined) {
              vertIndex = indexedVerts[vertString];
            } else {
              var vertParts = vertString.split('/');
              for (var i = 0; i < vertParts.length; i++) {
                vertParts[i] = parseInt(vertParts[i]) - 1;
              }

              vertIndex = indexedVerts[vertString] = model.vertices.length;
              model.vertices.push(loadedVerts.v[vertParts[0]].copy());
              if (loadedVerts.vt[vertParts[1]]) {
                model.uvs.push(loadedVerts.vt[vertParts[1]].slice());
              } else {
                model.uvs.push([0, 0]);
              }

              if (loadedVerts.vn[vertParts[2]]) {
                model.vertexNormals.push(loadedVerts.vn[vertParts[2]].copy());
              }
              originalFace.push(vertIndex);
            }

            face.push(vertIndex);
          }

          if (
            face[0] !== face[1] &&
            face[0] !== face[2] &&
            face[1] !== face[2]
          ) {
            model.faces.push(face);
          }
        }

        for(var i = 0,max = originalFace.length;i<max;i++){
          model.strokeIndices.push([originalFace[i],originalFace[(i+1)%max]])
        }
      }
    }
  }
  // If the model doesn't have normals, compute the normals
  if (model.vertexNormals.length === 0) {
    model.computeNormals();
  }

  return model;
}

var model3D;
var paletteimg;
var objString;

var _shaderRomHelperFunc = a=>{
  var t = color(palette[0]);
  a.ambientMaterial(t);
};

var shaderRom = {
  // none:[''],
  normal:['a.normalMaterial()'],
  texture:['a.texture(paletteimg)',setupLights],
  fill:[_shaderRomHelperFunc,setupLights]
};

function trueDraw3D(){
  var a = renderer3D;
  if(model3D == undefined){
    model3D = new p5.Geometry();
    model3D.gid = $('#mainInput').val()+random();
    if(objString == undefined)objString = makeObj();
    __parseObj(model3D,objString.split('\n'));
  }
  var rend = a._renderer;
  rend.uMVMatrix = rotator.matrixToP5(rotator.history2).mult(rend.cameraMatrix||rend._curCamera.cameraMatrix);
  if(tweakables.transparency==0){
    a.noFill();
  }else{
    rend._setProperty('_doFill', true);
    var sdr = shaderRom[tweakables.shader];
    if(sdr instanceof Array)sdr = sdr[0];
    else return;
    if(sdr instanceof Function)sdr(a);
    else if(typeof sdr == 'string')eval(sdr);
    else throw 'invalid shader';
  }
  if(model3D.vertices.length == 0)return;

  if(tweakables.edgeThickness>0){
    a.strokeWeight(tweakables.edgeThickness);
    a.stroke(tweakables.accentColor);
  }else{
    a.noStroke();
  }

  a.scale(scl);
  a.background(tweakables.backgroundColor);
  a.model(model3D);
}

function setupLights(a){
  //if(a==undefined)a = renderer3D;
  resetLights(a);
  a.ambientLight(100);
  //a.pointLight(color(250), -250, -250, 0);
  a.directionalLight(color(255), .25, .25, -.25);
}

function resetLights(a){
  //if(a==undefined)a = renderer3D;
  var shader =  a._renderer._useLightShader();
  shader.setUniform('uAmbientLightCount',0);
  shader.setUniform('uUseLighting',false);
  shader.setUniform('uDirectionalLightCount',0);
  shader.setUniform('uPointLightCount',0);

  var rend = a._renderer;
  rend.ambientLightColors.length = 0;
  rend.directionalLightDirections.length = 0;
  rend.directionalLightColors.length = 0;
  rend.pointLightPositions.length = 0;
  rend.pointLightColors.length = 0;
}

function onChangeDrawMode(name){
  var tw = tweakables;
  if(name=="polyhedronisme"){
    setTimeout(readRecipe,1);
  }
  if(name==undefined||name=="polyhedronisme"){
    let a = $('#help_atag');
    let b = $('#tw_hashSensitivity');
    if(tw.polyhedronisme){
      a.removeClass('deprecated');
      b.addClass('deprecated');
    }else{
      a.addClass('deprecated');
      b.removeClass('deprecated');
    }
  }
  if(name==undefined||name=="useWebGL"){
    let a = $('#tw_shader');
    let b = $('#tw_vertexLabels,#tw_vertexSize,#tw_drawInvisibleLines');
    if(tw.useWebGL){
      a.removeClass('deprecated');
      b.addClass('deprecated');
    }else{
      a.addClass('deprecated');
      b.removeClass('deprecated');
    }
  }
  if(name==undefined||name=="showFPS"){
    if(tw.showFPS){
      $("#frDiv").css('display','inline');
    }else{
      $("#frDiv").css('display','none');
    }
  }
  if(name==undefined||name=="shader"||name=="useWebGL"){
    let a = $();
    let b = $('#tw_enableLighting,#tw_transparency');
    if(tw.useWebGL && tw.shader=='normal'){
      a.removeClass('deprecated');
      b.addClass('deprecated');
    }else{
      a.addClass('deprecated');
      b.removeClass('deprecated');
    }
  }
  if(name==undefined||name=="transparency"){
    updatePalette();
  }
  if(!tw.useWebGL)return;
  var a = renderer3D;
  if(name==undefined||name=="shader"||name=="useWebGL"){
    let m = $('#shader.invalid.message');
    var sdr = shaderRom[tweakables.shader];
    if(sdr instanceof Array){
      m.css('display','none');
      sdr = sdr[1];
      if(sdr != undefined){
        if(sdr instanceof Function)sdr(a);
        else if(typeof sdr == 'string')eval(sdr);
        else throw 'invalid shader';
      }
    }else{
      m.css('display','inline');
    }
  }
  if(name==undefined||name=="isometric"||name=="useWebGL"){
    if(tw.isometric){
      a.ortho(-width / 2, width / 2, -height / 2, height / 2,0,5000);
    }else{
      a.perspective();
    }
  }
  if(name==undefined||name=="enableLighting"||name=="useWebGL"||name=="shader"){
    if(tw.enableLighting){
      setupLights(a);
    }else{
      resetLights(a);
    }
  }
  if(name==undefined||name=="hashSensitivity"){
    model3D = objString = undefined;
  }
}
