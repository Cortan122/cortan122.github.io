// Polyhédronisme
//===================================================================================================
//
// A toy for constructing and manipulating polyhedra and other meshes
//
// Copyright 2019, Anselm Levskaya
// Released under the MIT License


//===================================================================================================
// Primitive Polyhedra Seeds
//===================================================================================================


const {polyhedron} = require("./polyhedron.js");
const {canonicalXYZ,adjustXYZ} = require('./geo_operators.js');
const {
  sqrt,
  sin,
  cos,
  pow,
  PI,
} = Math;

function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for(let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}

const tetrahedron = function() {
  const poly = new polyhedron();
  poly.name = "T";
  poly.faces = [
    [0, 1, 2],
    [0, 2, 3],
    [0, 3, 1],
    [1, 3, 2]
  ];
  poly.vertices = [
    [1.0, 1.0, 1.0],
    [1.0, -1.0, -1.0],
    [-1.0, 1.0, -1.0],
    [-1.0, -1.0, 1.0]
  ];
  return poly;
};

const octahedron = function() {
  const poly = new polyhedron();
  poly.name = "O";
  poly.faces = [
    [0, 1, 2],
    [0, 2, 3],
    [0, 3, 4],
    [0, 4, 1],
    [1, 4, 5],
    [1, 5, 2],
    [2, 5, 3],
    [3, 5, 4]
  ];
  poly.vertices = [
    [0, 0, 1.414],
    [1.414, 0, 0],
    [0, 1.414, 0],
    [-1.414, 0, 0],
    [0, -1.414, 0],
    [0, 0, -1.414]
  ];
  return poly;
};

const cube = function() {
  const poly = new polyhedron();
  poly.name = "C";
  poly.faces = [
    [3, 0, 1, 2],
    [3, 4, 5, 0],
    [0, 5, 6, 1],
    [1, 6, 7, 2],
    [2, 7, 4, 3],
    [5, 4, 7, 6]
  ];
  poly.vertices = [
    [0.707, 0.707, 0.707],
    [-0.707, 0.707, 0.707],
    [-0.707, -0.707, 0.707],
    [0.707, -0.707, 0.707],
    [0.707, -0.707, -0.707],
    [0.707, 0.707, -0.707],
    [-0.707, 0.707, -0.707],
    [-0.707, -0.707, -0.707]
  ];
  return poly;
};

const icosahedron = function() {
  const poly = new polyhedron();
  poly.name = "I";
  poly.faces = [
    [0, 1, 2],
    [0, 2, 3],
    [0, 3, 4],
    [0, 4, 5],
    [0, 5, 1],
    [1, 5, 7],
    [1, 7, 6],
    [1, 6, 2],
    [2, 6, 8],
    [2, 8, 3],
    [3, 8, 9],
    [3, 9, 4],
    [4, 9, 10],
    [4, 10, 5],
    [5, 10, 7],
    [6, 7, 11],
    [6, 11, 8],
    [7, 10, 11],
    [8, 11, 9],
    [9, 11, 10]
  ];

  poly.vertices = [
    [0, 0, 1.176],
    [1.051, 0, 0.526],
    [0.324, 1.0, 0.525],
    [-0.851, 0.618, 0.526],
    [-0.851, -0.618, 0.526],
    [0.325, -1.0, 0.526],
    [0.851, 0.618, -0.526],
    [0.851, -0.618, -0.526],
    [-0.325, 1.0, -0.526],
    [-1.051, 0, -0.526],
    [-0.325, -1.0, -0.526],
    [0, 0, -1.176]
  ];
  return poly;
};

const dodecahedron = function() {
  const poly = new polyhedron();
  poly.name = "D";
  poly.faces = [
    [0, 1, 4, 7, 2],
    [0, 2, 6, 9, 3],
    [0, 3, 8, 5, 1],
    [1, 5, 11, 10, 4],
    [2, 7, 13, 12, 6],
    [3, 9, 15, 14, 8],
    [4, 10, 16, 13, 7],
    [5, 8, 14, 17, 11],
    [6, 12, 18, 15, 9],
    [10, 11, 17, 19, 16],
    [12, 13, 16, 19, 18],
    [14, 15, 18, 19, 17]
  ];
  poly.vertices = [
    [0, 0, 1.07047],
    [0.713644, 0, 0.797878],
    [-0.356822, 0.618, 0.797878],
    [-0.356822, -0.618, 0.797878],
    [0.797878, 0.618034, 0.356822],
    [0.797878, -0.618, 0.356822],
    [-0.934172, 0.381966, 0.356822],
    [0.136294, 1.0, 0.356822],
    [0.136294, -1.0, 0.356822],
    [-0.934172, -0.381966, 0.356822],
    [0.934172, 0.381966, -0.356822],
    [0.934172, -0.381966, -0.356822],
    [-0.797878, 0.618, -0.356822],
    [-0.136294, 1.0, -0.356822],
    [-0.136294, -1.0, -0.356822],
    [-0.797878, -0.618034, -0.356822],
    [0.356822, 0.618, -0.797878],
    [0.356822, -0.618, -0.797878],
    [-0.713644, 0, -0.797878],
    [0, 0, -1.07047]
  ];
  return poly;
};

const prism = function(n) {
  let i;
  const theta = (2 * PI) / n; // pie angle
  const h = Math.sin(theta / 2); // half-edge
  let poly = new polyhedron();
  poly.name = `P${n}`;

  for(i = 0; i < n; i++) { // vertex #'s 0 to n-1 around one face
    poly.vertices.push([-cos(i * theta), -sin(i * theta), -h]);
  }
  for(i = 0; i < n; i++) { // vertex #'s n to 2n-1 around other
    poly.vertices.push([-cos(i * theta), -sin(i * theta), h]);
  }

  poly.faces.push(__range__(n - 1, 0, true)); //top
  poly.faces.push(__range__(n, 2 * n, false)); //bottom
  for(i = 0; i < n; i++) { //n square sides
    poly.faces.push([i, (i + 1) % n, ((i + 1) % n) + n, i + n]);
  }

  poly = adjustXYZ(poly, 1);
  return poly;
};

const antiprism = function(n) {
  let i;
  const theta = (2 * PI) / n; // pie angle
  let h = sqrt(1 - (4 / ((4 + (2 * cos(theta / 2))) - (2 * cos(theta)))));
  let r = sqrt(1 - (h * h));
  const f = sqrt((h * h) + pow(r * cos(theta / 2), 2));
  // correction so edge midpoints (not vertices) on unit sphere
  r = -r / f;
  h = -h / f;
  let poly = new polyhedron();
  poly.name = `A${n}`;

  for(i = 0; i < n; i++) { // vertex #'s 0...n-1 around one face
    poly.vertices.push([r * cos(i * theta), r * sin(i * theta), h]);
  }
  for(i = 0; i < n; i++) { // vertex #'s n...2n-1 around other
    poly.vertices.push([r * cos((i + 0.5) * theta), r * sin((i + 0.5) * theta), -h]);
  }

  poly.faces.push(__range__(n - 1, 0, true)); //top
  poly.faces.push(__range__(n, (2 * n) - 1, true)); //bottom
  for(i = 0; i <= n - 1; i++) { //2n triangular sides
    poly.faces.push([i, (i + 1) % n, i + n]);
    poly.faces.push([i, i + n, ((((n + i) - 1) % n) + n)]);
  }

  poly = adjustXYZ(poly, 1);
  return poly;
};

const pyramid = function(n) {
  let i;
  const theta = (2 * PI) / n; // pie angle
  const height = 1;
  let poly = new polyhedron();
  poly.name = `Y${n}`;

  for(i = 0; i < n; i++) { // vertex #'s 0...n-1 around one face
    poly.vertices.push([-cos(i * theta), -sin(i * theta), -0.2]);
  }
  poly.vertices.push([0, 0, height]); // apex

  poly.faces.push(__range__(n - 1, 0, true)); // base
  for(i = 0; i < n; i++) { // n triangular sides
    poly.faces.push([i, (i + 1) % n, n]);
  }

  poly = canonicalXYZ(poly, 3);
  return poly;
};

const cupola = function(n, alpha, height) {
  let i;
  if(n === undefined) {
    n = 3;
  }
  if(alpha === undefined) {
    alpha = 0.0;
  }

  let poly = new polyhedron();
  poly.name = `U${n}`;

  if(n < 2) {
    return poly;
  }

  let s = 1.0;
  // alternative face/height scaling 
  //let rb = s / 2 / sin(PI / 2 / n - alpha);
  let rb = s / 2 / sin(PI / 2 / n);
  let rt = s / 2 / sin(PI / n);
  if(height === undefined) {
    height = (rb - rt);
    // set correct height for regularity for n=3,4,5
    if(2 <= n && n <= 5) {
      height = s * sqrt(1 - 1 / 4 / sin(PI / n) / sin(PI / n));
    }
  }
  // init 3N vertices
  for(i = 0; i < 3 * n; i++) {
    poly.vertices.push([0, 0, 0]);
  }
  // fill vertices
  for(i = 0; i < n; i++) {
    poly.vertices[2 * i] = [rb * cos(PI * (2 * i) / n + PI / 2 / n + alpha),
      rb * sin(PI * (2 * i) / n + PI / 2 / n + alpha),
      0.0
    ];
    poly.vertices[2 * i + 1] = [rb * cos(PI * (2 * i + 1) / n + PI / 2 / n - alpha),
      rb * sin(PI * (2 * i + 1) / n + PI / 2 / n - alpha),
      0.0
    ];
    poly.vertices[2 * n + i] = [rt * cos(2 * PI * i / n),
      rt * sin(2 * PI * i / n),
      height
    ];
  }

  poly.faces.push(__range__(2 * n - 1, 0, true)); // base
  poly.faces.push(__range__(2 * n, 3 * n - 1, true)); // top
  for(i = 0; i < n; i++) { // n triangular sides and n square sides
    poly.faces.push([(2 * i + 1) % (2 * n), (2 * i + 2) % (2 * n), 2 * n + (i + 1) % n]);
    poly.faces.push([2 * i, (2 * i + 1) % (2 * n), 2 * n + (i + 1) % n, 2 * n + i]);
  }

  return poly;
};

const anticupola = function(n, alpha, height) {
  let i;
  if(n === undefined) {
    n = 3;
  }
  if(alpha === undefined) {
    alpha = 0.0;
  }

  let poly = new polyhedron();
  poly.name = `U${n}`;

  if(n < 3) {
    return poly;
  }

  let s = 1.0;
  // alternative face/height scaling 
  //let rb = s / 2 / sin(PI / 2 / n - alpha);
  let rb = s / 2 / sin(PI / 2 / n);
  let rt = s / 2 / sin(PI / n);
  if(height === undefined) {
    height = (rb - rt);
  }
  // init 3N vertices
  for(i = 0; i < 3 * n; i++) {
    poly.vertices.push([0, 0, 0]);
  }
  // fill vertices
  for(i = 0; i < n; i++) {
    poly.vertices[2 * i] = [rb * cos(PI * (2 * i) / n + alpha),
      rb * sin(PI * (2 * i) / n + alpha),
      0.0
    ];
    poly.vertices[2 * i + 1] = [rb * cos(PI * (2 * i + 1) / n - alpha),
      rb * sin(PI * (2 * i + 1) / n - alpha),
      0.0
    ];
    poly.vertices[2 * n + i] = [rt * cos(2 * PI * i / n),
      rt * sin(2 * PI * i / n),
      height
    ];
  }

  poly.faces.push(__range__(2 * n - 1, 0, true)); // base
  poly.faces.push(__range__(2 * n, 3 * n - 1, true)); // top
  for(i = 0; i < n; i++) { // n triangular sides and n square sides
    poly.faces.push([(2 * i) % (2 * n), (2 * i + 1) % (2 * n), 2 * n + (i) % n]);
    poly.faces.push([2 * n + (i + 1) % n, (2 * i + 1) % (2 * n), (2 * i + 2) % (2 * n)]);
    poly.faces.push([2 * n + (i + 1) % n, 2 * n + (i) % n, (2 * i + 1) % (2 * n)]);
  }

  return poly;
};

module.exports = {
  tetrahedron,
  octahedron,
  cube,
  icosahedron,
  dodecahedron,
  prism,
  antiprism,
  pyramid,
  cupola,
  anticupola,
};
