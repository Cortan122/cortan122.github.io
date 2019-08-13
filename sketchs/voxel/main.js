var scene, camera, controls, renderer, prevMesh, world, texture;

var tweakables = {
  fov: 75,
  cellSize: 32,
  bgColor: 'lightblue',
  color: 'none',
  material: 'Lambert',
  metaStart: true,
};

// in threejs y is vertical
var f = function(y,z,x){
  x *= 1.3;y *= 1.3;z *= 1.3;
  var t = (x**2+9/4*y**2+z**2-1)**3-x**2*z**3-9/200*y**2*z**3 < 0;
  if(t)return z*256;
  return 0;
}

function populateWorld(world, f){
  const startTime = Date.now();

  const t = world.cellSize-1;
  for(var x = 0; x < world.cellSize; x++){
    for(var y = 0; y < world.cellSize; y++){
      for(var z = 0; z < world.cellSize; z++){
        world.setVoxel(x, y, z, Math.ceil(f(x/t*2-1, y/t*2-1, z/t*2-1)));
      }
    }
  }

  const deltaTime = Date.now() - startTime;
  if(deltaTime > 1000/60)console.log(`populateWorld took ${deltaTime}ms`);
}

function makeMesh(scene, world){
  const startTime = Date.now();

  if(prevMesh)scene.remove(prevMesh);
  const {positions, normals, indices, uvs} = world.generateGeometryDataForCell(0, 0, 0);
  const geometry = new THREE.BufferGeometry();
  var t = {color: tweakables.color};
  if(tweakables.color == 'none')t = {map: texture};
  const material = new THREE[`Mesh${tweakables.material}Material`](t);

  geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
  geometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(indices);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  prevMesh = mesh;

  const deltaTime = Date.now() - startTime;
  if(deltaTime > 1000/60)console.log(`makeMesh took ${deltaTime}ms`);
}

function setup(){
  const tw = tweakables;
  const cellSize = tw.cellSize;

  initTextarea();

  world = new VoxelWorld(cellSize);
  renderer = new THREE.WebGLRenderer({canvas});
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(tw.fov, canvas.width/canvas.height, .1, 1000);
  controls = new THREE.OrbitControls(camera, renderer.domElement);

  //controls.update() must be called after any manual changes to the camera's transform
  camera.position.set(-cellSize*.3, cellSize*.8, -cellSize*.3);
  controls.target.set(cellSize/2, cellSize/2, cellSize/2);
  controls.update();

  scene.background = new THREE.Color(tw.bgColor);

  function addLight(x, y, z){
    const light = new THREE.DirectionalLight(0xFFFFFF, 1);
    light.position.set(x, y, z);
    scene.add(light);
  }
  addLight(-1,  2,  4);
  addLight( 1, -1, -2);

  const loader = new THREE.TextureLoader();
  texture = loader.load('texture.png');
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  populateWorld(world, f);
  makeMesh(scene, world);

  lib.tweaker.events.push(onChangeTw);
  lib.tweaker.makeEnum("material",["Basic","Depth","Lambert","Matcap","Normal","Phong","Physical","Standard","Toon"]);

  requestAnimationFrame(draw);
}

function draw(){
  const startTime = Date.now();

  requestAnimationFrame(draw);
  controls.update();
  renderer.render(scene, camera);

  const deltaTime = Date.now() - startTime;
  if(deltaTime > 1000/60)console.log(`draw took ${deltaTime}ms`);
}

function onChangeTw(name){
  const tw = tweakables;

  if(name=='fov'){
    camera.fov = tw.fov;
    camera.updateProjectionMatrix();
  }else if(name=='bgColor'){
    scene.background = new THREE.Color(tw.bgColor);
  }else if(name=='material' || name=='color'){
    makeMesh(scene, world);
  }else if(name=='cellSize'){
    const {cellSize} = tw;
    world = new VoxelWorld(cellSize);
    camera.position.set(-cellSize*.3, cellSize*.8, -cellSize*.3);
    controls.target.set(cellSize/2, cellSize/2, cellSize/2);
    controls.update();
    populateWorld(world, f);
    makeMesh(scene, world);
  }
}

function initTextarea(){
  $('body').append("<textarea></textarea>");
  $('<button value="undefined" id="runButton">run</button>').on('click', updateCode).appendTo('body');
  $(window).on('resize',e => updateTextarea());
  $('#pDiv').on('resize',e => updateTextarea());
  $("textarea").keydown(e => {if(e.keyCode==13&&e.shiftKey){updateCode();return false;}});
  var t = f.toString();
  var ti = t.indexOf('{');
  $("textarea").val(t.slice(ti));
  updateTextarea();
}

function updateTextarea(){
  const {height, width} = canvas;
  const [windowHeight, windowWidth] = [innerHeight, innerWidth];
  $('textarea').css({position:'relative',top: 0, left: 0});
  $('textarea').outerHeight(windowHeight-height);
  $('textarea').outerWidth(width);
  $('#runButton').css({bottom: 0, right: windowWidth-width, position:'absolute',"z-index":1});
}

function updateCode(){
  const {
    abs,acos,acosh,asin,asinh,atan,atanh,atan2,ceil,cbrt,expm1,clz32,cos,cosh,exp,
    floor,fround,hypot,imul,log,log1p,log2,log10,max,min,pow,random,round,sign,sin,
    sinh,sqrt,tan,tanh,trunc,E,LN10,LN2,LOG10E,LOG2E,PI,SQRT1_2,SQRT2,
  } = Math;
  const mod = euclideanModulo;

  var str = $('textarea').val();
  f = eval(`(y,z,x)=>${str}`);
  populateWorld(world, f);
  makeMesh(scene, world);
}

window.addEventListener('load',()=>setup());
