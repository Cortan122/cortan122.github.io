// Polyhédronisme
//===================================================================================================
//
// A toy for constructing and manipulating polyhedra and other meshes
//
// Copyright 2019, Anselm Levskaya
// Released under the MIT License

// Parser Routines
//===================================================================================================

const {johnson} = require('./johnson_solids.js');
const {
  paintPolyhedron,
  polyhedron,
  rndcolors,
  setPalette,
} = require('./polyhedron.js');
const {
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
} = require('./base_operators.js');
const {
  rescale,
  recenter,
  canonicalize,
  adjustXYZ,
  canonicalXYZ,
  unitSphere,
} = require('./geo_operators.js');
const {
  kisN,
  ambo,
  gyro,
  propellor,
  reflect,
  dual,
  chamfer,
  whirl,
  quinto,
  insetN,
  extrudeN,
  loft,
  hollow,
  perspectiva1,
  trisub,
} = require("./topo_operators.js");
const {triangulate} = require("./triangulate.js");

// fairly straightforward Parser Expression Grammar spec for simple
// operator-chain-on-base-polyhedra recipes
const op_parser = require('./pegjs-parser.js');

//applies func fn to array args i.e. f, [1,2,3] -> f(1,2,3)
const dispatch = function(fn, args) { return fn.apply(this, args || []); };

const basemap = {
  "T": tetrahedron,
  "O": octahedron,
  "C": cube,
  "I": icosahedron,
  "D": dodecahedron,
  "P": prism,       //takes integer arg
  "A": antiprism,   //takes integer arg
  "Y": pyramid,     //takes integer arg
  "J": johnson,     //takes integer arg
  "U": cupola,      //takes integer arg
  "V": anticupola,  //takes integer arg
};

const opmap = {
  "d": dual,
  "a": ambo,
  "k": kisN,
  "g": gyro,
  "p": propellor,
  "r": reflect,
  "c": chamfer,
  "w": whirl,
  "n": insetN, //-->needle
  "x": extrudeN,
  "l": loft,
  "P": perspectiva1,
  "q": quinto,
  "u": trisub,
  //z --> zip
  "H": hollow,
  "Z": triangulate,
  "C": canonicalize,
  "K": canonicalXYZ,
  "A": adjustXYZ,
  "U": unitSphere,
};
//unclaimed: yihfzv

// list of basic equivalences, easier to replace before parsing
const specreplacements = [
  [/e/g, "aa"],   // e --> aa   (abbr. for explode)
  [/b/g, "ta"],   // b --> ta   (abbr. for bevel)
  [/o/g, "jj"],   // o --> jj   (abbr. for ortho)
  [/m/g, "kj"],   // m --> kj   (abbr. for meta)
  [/t(\d*)/g, "dk$1d"],  // t(n) --> dk(n)d  (dual operations)
  [/j/g, "dad"],  // j --> dad  (dual operations) # Why not j --> da ?
  [/s/g, "dgd"],  // s --> dgd  (dual operations) # Why not s --> dg ?
  [/dd/g, ""],    // dd --> null  (order 2)
  [/ad/g, "a"],   // ad --> a   (a_ = ad_)
  [/gd/g, "g"],   // gd --> g   (g_ = gd_)
  [/aO/g, "aC"],  // aO --> aC  (for uniqueness)
  [/aI/g, "aD"],  // aI --> aD  (for uniqueness)
  [/gO/g, "gC"],  // gO --> gC  (for uniqueness)
  [/gI/g, "gD"],  // gI --> gD  (for uniqueness)
];

const getOps = function(notation) {
  let expanded = notation;
  for (let [orig,equiv] of specreplacements) {
    expanded = expanded.replace(orig,equiv);
  }
  console.log(`${notation} executed as ${expanded}`);
  return expanded;
};

// create polyhedron from notation
const generatePolyhedron = function(notation){
  const ops_spec = getOps(notation);
  const oplist = op_parser.parse(ops_spec).reverse();

  let op = oplist.shift();
  const basefunc = basemap[op["op"]];
  const baseargs = op["args"];
  if(basefunc==undefined)throw SyntaxError(`Unknown base '${op["op"]}'`);
  let poly = dispatch(basefunc, baseargs);

  for (op of oplist) {
    const opfunc = opmap[op["op"]];
    const opargs = [poly].concat(op["args"]);
    if(opfunc==undefined)throw SyntaxError(`Unknown operator '${op["op"]}'`);
    poly = dispatch(opfunc, opargs);
  }

  // Recenter polyhedra at origin (rarely needed)
  poly.vertices = recenter(poly.vertices, poly.edges());
  poly.vertices = rescale(poly.vertices);

  // Color the faces of the polyhedra for display
  poly = paintPolyhedron(poly);

  // return the poly object
  return poly;
};

generatePolyhedron.polyhedron = polyhedron;
generatePolyhedron.randomPalette = rndcolors;
generatePolyhedron.setPalette = setPalette;
module.exports = generatePolyhedron;

// @ts-ignore
if(require.main == module){
  console.dir(module.exports(process.argv[2]),{"depth":null});
}
