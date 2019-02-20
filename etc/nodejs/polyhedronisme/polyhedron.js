// Polyhédronisme
//===================================================================================================
//
// A toy for constructing and manipulating polyhedra.
//
// Copyright 2019, Anselm Levskaya
// Released under the MIT License
//

const _ = require('underscore');
const {
  sigfigs,
  linePointDist2,
  normal,
  planararea,
  faceSignature,
  mult,
  add,
  sub,
  mag2,
} = require('./geo.js');
const {
  random,
  sqrt,
} = Math;

// Polyhedra Functions
//=================================================================================================
//
// Topology stored as set of faces.  Each face is list of n vertex indices
// corresponding to one oriented, n-sided face.  Vertices listed clockwise as seen from outside.

// Generate an array of edges [v1,v2] for the face.
const faceToEdges = function(face) {
  const edges = [];
  let [v1] = face.slice(-1);
  for(let v2 of face) {
    edges.push([v1, v2]);
    v1 = v2;
  }
  return edges;
};

const vertColors = function(poly) {
  const vertcolors = [];
  for(let i = 0; i < poly.faces.length; i++) {
    const face = poly.faces[i];
    for(let v of face) {
      vertcolors[v] = poly.face_classes[i];
    }
  }
  return vertcolors;
};

// Polyhedra Coloring Functions
//=================================================================================================
const rwb_palette = ["#ff7777", "#dddddd", "#889999", "#fff0e5", "#aa3333", "#ff0000", "#ffffff", "#aaaaaa"];
let PALETTE = rwb_palette; // GLOBAL
/** @type {"signature"|"area"|"edges"} */
let COLOR_METHOD = "signature";
let COLOR_SENSITIVITY = 2; // color sensitivity to variation in congruence signature or planar area
/** @type {"fixed"|"precision"} */
let COLOR_FUNCTION = "precision";
const palette = function(n) {
  const k = n % PALETTE.length;
  return hextofloats(PALETTE[k]);
};

function setPalette(palette=undefined,colorSensitivity=undefined,colorFunction=undefined,colorMethod=undefined){
  if(palette!=undefined)PALETTE = palette;
  if(colorSensitivity!=undefined)COLOR_SENSITIVITY = colorSensitivity;
  if(colorFunction!=undefined)COLOR_FUNCTION = colorFunction;
  if(colorMethod!=undefined)COLOR_METHOD = colorMethod;
}

// converts [h,s,l] float args to [r,g,b] list
function hsl2rgb(h, s, l) {
  let r, g, b;
  if(s == 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = function(p, q, t) {
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1 / 6) return p + (q - p) * 6 * t;
      if(t < 1 / 2) return q;
      if(t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [r, g, b];
}

// converts #xxxxxx / #xxx format into list of [r,g,b] floats
const hextofloats = function(hexstr) {
  let rgb;
  if(hexstr[0] === "#") {
    hexstr = hexstr.slice(1);
  }
  if(hexstr.length === 3) {
    rgb = hexstr.split('').map(c => parseInt(c + c, 16) / 255);
  } else {
    rgb = hexstr.match(/.{2}/g).map(c => parseInt(c, 16) / 255);
  }
  return rgb;
};

// converts [r,g,b] floats to #xxxxxx form
const floatstohex = function(rgb) {
  let r_hex = Math.floor(255 * rgb[0]).toString(16);
  let g_hex = Math.floor(255 * rgb[1]).toString(16);
  let b_hex = Math.floor(255 * rgb[2]).toString(16);
  return "#" + r_hex + g_hex + b_hex;
}

// randomize color palette
const rndcolors = function() {
  let newpalette = [];
  for(let i = 0; i < 100; i++) {
    let h = random();
    let s = 0.5 * random() + 0.3;
    let l = 0.5 * random() + 0.45;
    let rgb = hsl2rgb(h, s, l);
    newpalette.push(floatstohex(rgb));
  }
  return newpalette;
}

// Color the faces of the polyhedra for display
const paintPolyhedron = function(poly) {
  if(COLOR_FUNCTION=="fixed"){
    var func = (N,nsigs)=>''+N.toFixed(Math.min(100,nsigs));
  }else{
    var func = sigfigs;
  }

  poly.face_classes = [];
  const colormemory = {};

  // memoized color assignment to faces of similar areas
  const colorassign = function(hash, colormemory) {
    //const hash = ar;
    if(hash in colormemory) {
      return colormemory[hash];
    } else {
      const fclr = _.toArray(colormemory).length;
      colormemory[hash] = fclr;
      return fclr;
    }
  };

  for(var f of poly.faces) {
    var clr, face_verts;
    if(COLOR_METHOD === "area") {
      // color by face planar area assuming flatness
      face_verts = f.map(v => poly.vertices[v])
      clr = colorassign(func(planararea(face_verts), COLOR_SENSITIVITY), colormemory);
    } else if(COLOR_METHOD === "signature") {
      // color by congruence signature
      face_verts = f.map(v => poly.vertices[v])
      clr = colorassign(faceSignature(face_verts, COLOR_SENSITIVITY, func), colormemory);
    } else {
      // color by face-sidedness
      clr = f.length - 3;
    }
    poly.face_classes.push(clr);
  }
  console.log(_.toArray(colormemory).length + " face classes");
  return poly;
};

class polyhedron {
  // constructor of initially null polyhedron
  constructor(verts, faces, name) {
    // array of faces.  faces.length = # faces
    this.faces = faces || new Array();
    // array of vertex coords.  vertices.length = # of vertices
    this.vertices = verts || new Array();
    this.name = name || "null polyhedron";
    this.face_classes = [];
  }

  // return a non-redundant list of the polyhedron's edges
  edges() {
    let e, a, b;
    const uniqEdges = {};
    const faceEdges = this.faces.map(faceToEdges);
    for(let edgeSet of faceEdges) {
      for(e of edgeSet) {
        if(e[0] < e[1]) {
          [a, b] = e;
        } else {
          [b, a] = e;
        }
        uniqEdges[`${a}~${b}`] = e;
      }
    }
    return _.values(uniqEdges);
  }

  // get array of face centers
  centers() {
    const centersArray = [];
    for(let face of this.faces) {
      let fcenter = [0, 0, 0];
      // average vertex coords
      for(let vidx of face) {
        fcenter = add(fcenter, this.vertices[vidx]);
      }
      centersArray.push(mult(1.0 / face.length, fcenter));
    }
    // return face-ordered array of centroids
    return centersArray;
  }

  // get array of face normals
  normals() {
    const normalsArray = [];
    for(let face of this.faces) {
      normalsArray.push(normal(face.map(vidx => this.vertices[vidx])));
    }
    return normalsArray;
  }

  // informative string
  data() {
    const nEdges = (this.faces.length + this.vertices.length) - 2; // E = V + F - 2
    return `${this.faces.length} faces, ${nEdges} edges, ${this.vertices.length} vertices`;
  }

  moreData() {
    return `min edge length ${this.minEdgeLength().toPrecision(2)}<br>` +
      `min face radius ${this.minFaceRadius().toPrecision(2)}`;
  }

  minEdgeLength() {
    let min2 = Number.MAX_VALUE;
    // Compute minimum edge length
    for(let e of this.edges()) {
      // square of edge length
      const d2 = mag2(sub(this.vertices[e[0]], this.vertices[e[1]]));
      if(d2 < min2) {
        min2 = d2;
      }
    }
    // This is normalized if rescaling has happened.
    return sqrt(min2);
  }

  minFaceRadius() {
    let min2 = Number.MAX_VALUE;
    const nFaces = this.faces.length;
    const centers = this.centers();
    for(let f = 0, end = nFaces; f < end; f++) {
      const c = centers[f];
      for(let e of faceToEdges(this.faces[f])) {
        // Check distance from center to each edge.
        const de2 = linePointDist2(this.vertices[e[0]], this.vertices[e[1]], c);
        if(de2 < min2) {
          min2 = de2;
        }
      }
    }
    return sqrt(min2);
  }

  // Export / Formatting Routines --------------------------------------------------

  // produces vanilla OBJ files for import into 3d apps
  toOBJ(faceClasses=0) {
    let f;
    let v;
    let objstr = "#Produced by polyHédronisme http://levskaya.github.com/polyhedronisme\n";
    objstr += `group ${this.name}\n`;
    objstr += "#vertices\n";
    for(v of this.vertices) {
      objstr += `v ${v[0]} ${v[1]} ${v[2]}\n`;
    }
    objstr += "#normal vector defs\n";
    for(f of this.faces) {
      const norm = normal(f.map(v => this.vertices[v]))
      objstr += `vn ${norm[0]} ${norm[1]} ${norm[2]}\n`;
    }
    if(faceClasses){
      objstr += "#face color defs\n";
      for(var i = 0; i < Math.min(faceClasses,100); i++){
        objstr += `vt ${(i%10)/10} ${Math.floor(i/10)/10}\n`;
      }
    }
    objstr += "#face defs\n";
    for(let i = 0; i < this.faces.length; i++) {
      f = this.faces[i];
      objstr += "f ";
      for(v of f) {
        if(faceClasses){
          objstr += `${v+1}/${this.face_classes[i]%faceClasses + 1}/${i+1} `;
        }else{
          objstr += `${v+1}//${i+1} `;
        }
      }
      objstr += "\n";
    }
    return objstr;
  }

  toX3D(colors=undefined) {
    if(colors){
      PALETTE = colors;
    }else{
      PALETTE = rwb_palette;
    }
    let v;
    // ShapeWays uses 1unit = 1meter, so reduce to 3cm scale
    const SCALE_FACTOR = .03;
    // opening cruft
    let x3dstr = `\
<?xml version="1.0" encoding ="UTF-8"?>
<X3D profile="Interchange" version="3.0">
<head>
<component name="Rendering" level="3"/>
<meta name="generator" content="Polyhedronisme"/>
<meta name="version" content="0.1.0"/>
</head>
<Scene>
<Shape>
<IndexedFaceSet normalPerVertex="false" coordIndex="\
`;
    // face indices
    for(let f of this.faces) {
      for(v of f) {
        x3dstr += `${v} `;
      }
      x3dstr += '-1\n';
    }
    x3dstr += '">\n';

    // per-face Color
    x3dstr += '<Color color="';
    for(let cl of vertColors(this)) { //@face_class
      const clr = palette(cl);
      x3dstr += `${clr[0]} ${clr[1]} ${clr[2]} `;
    }
    x3dstr += '"/>';

    // re-scaled xyz coordinates
    x3dstr += '<Coordinate point="';
    for(v of this.vertices) {
      x3dstr += `${v[0]*SCALE_FACTOR} ${v[1]*SCALE_FACTOR} ${v[2]*SCALE_FACTOR} `;
    }
    x3dstr += '"/>\n';

    // end cruft
    x3dstr += `\
</IndexedFaceSet>
</Shape>
</Scene>
</X3D>`;

    return x3dstr;
  }

  toVRML(colors=undefined) {
    if(colors){
      PALETTE = colors;
    }else{
      PALETTE = rwb_palette;
    }
    let v;
    // ShapeWays uses 1unit = 1meter, so reduce to 3cm scale
    const SCALE_FACTOR = .03;
    // opening cruft
    let x3dstr = `\
#VRML V2.0 utf8
#Generated by Polyhedronisme
NavigationInfo {
	type [ "EXAMINE", "ANY" ]
}
Transform {
  scale 1 1 1
  translation 0 0 0
  children
  [
    Shape
    {
      geometry IndexedFaceSet
      {
        creaseAngle .5
        solid FALSE
        coord Coordinate
        {
          point
          [\
`;
    // re-scaled xyz coordinates
    for(v of this.vertices) {
      x3dstr += `${v[0]*SCALE_FACTOR} ${v[1]*SCALE_FACTOR} ${v[2]*SCALE_FACTOR},`;
    }
    x3dstr = x3dstr.slice(0, + -2 + 1 || undefined);
    x3dstr += `\
    ]
}
color Color
{
  color
  [\
`;
    // per-face Color
    for(let cl of this.face_classes) {
      const clr = palette(cl);
      x3dstr += `${clr[0]} ${clr[1]} ${clr[2]} ,`;
    }
    x3dstr = x3dstr.slice(0, + -2 + 1 || undefined);
    x3dstr += `\
  ]
}
colorPerVertex FALSE
coordIndex
[\
`;
    // face indices
    for(let f of this.faces) {
      for(v of f) {
        x3dstr += `${v}, `;
      }
      x3dstr += '-1,';
    }
    x3dstr = x3dstr.slice(0, + -2 + 1 || undefined);
    x3dstr += `\
          ]
      }
      appearance Appearance
      {
        material Material
        {
	       ambientIntensity 0.2
	       diffuseColor 0.9 0.9 0.9
	       specularColor .1 .1 .1
	       shininess .5
        }
      }
    }
  ]
}\
`;
    return x3dstr;
  }
}

module.exports = {
  polyhedron,
  rndcolors,
  paintPolyhedron,
  setPalette,
};
