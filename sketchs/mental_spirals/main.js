var particles = [
  {v: [10,10], p: [100,250], c: 'green'}
];

var canvas_w = 400;
var canvas_h = 400;

var tweakables = {
  statingVelocity: 10,
  maxParticles: 100,
  decayFactor: .99,
  rotationFactor: .1,
  spawnChance: 200,
  fadingSpeed: .01,
  enableFade: false,
  enableZest: false,
  showFPS: true,
  metaStart: true,
};

var inputRom = [
  {keys:['T'], action: 'lib.tweaker.toggleTweakables()'},
  {keys:['S'], action: 'share()'},
];

function setup() {
  createCanvas(canvas_w, canvas_h);
  background(220);
}

function randomColor() {
  return `hsl(${round(random(0,360))}, 100%, 50%)`;
}

function draw() {
  for (let {v,p,c} of particles) {
    var old = [...p];
    p[0] += v[0];
    p[1] += v[1];

    var skip = false;
    if (p[0] < 0) {p[0] = (p[0]+canvas_w) % canvas_w; skip = true;}
    if (p[1] < 0) {p[1] = (p[1]+canvas_h) % canvas_h; skip = true;}
    if (p[0] > canvas_w) {p[0] = p[0]%canvas_w; skip = true;}
    if (p[1] > canvas_h) {p[1] = p[1]%canvas_h; skip = true;}

    var old_v = [...v];
    v[0] += old_v[1] * tweakables.rotationFactor;
    v[1] += -old_v[0] * tweakables.rotationFactor;
    v[0] *= tweakables.decayFactor;
    v[1] *= tweakables.decayFactor;

    stroke(c);
    if (!skip) line(old[0], old[1], p[0], p[1]);

    if (round(random(0, tweakables.spawnChance)) == 0) {
      var new_v = createVector(v[1], -v[0]);
      new_v.normalize();
      new_v.mult(tweakables.statingVelocity);

      if (!tweakables.enableZest) p = [...p];
      particles.push({v: [new_v.x, new_v.y], p, c: randomColor()});

      if (particles.length > tweakables.maxParticles) {
        particles.shift();
      }
    }
  }

  if (tweakables.enableFade)
    background(`rgba(200,220,200,${tweakables.fadingSpeed})`);
}
