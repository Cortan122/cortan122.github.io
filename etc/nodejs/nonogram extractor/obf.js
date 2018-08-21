function parseData(d){
  var H = []
    , A = d[0][0] % d[0][3] * (d[0][0] % d[0][3]) + d[0][1] % d[0][3] * 2 + d[0][2] % d[0][3]
    , D = d[1][0] % d[1][3] + d[1][1] % d[1][3] - d[1][2] % d[1][3]
    , C = d[2][0] % d[2][3] + d[2][1] % d[2][3] - d[2][2] % d[2][3]
    , Aa = d[3][0] % d[3][3] + d[3][1] % d[3][3] - d[3][2] % d[3][3]
    , E = []
    , F = []
    , N = []
    , O = []
    , L = []
    , M = []
    , Ba = 0
    , Ca = 0
  for (x = 5; x < Aa + 5; x++) {
    var Ea = d[x][0] - d[4][1]
      , Fa = d[x][1] - d[4][0]
      , Ga = d[x][2] - d[4][3];
    z = d[x][3] - Ea - d[4][2];
    H[x - 5] = [(Ea + 256).toString(16).substring(1) + ((Fa + 256 << 8) + Ga).toString(16).substring(1), z]
  }
  for (w = 0; w < C; w++)
    for (E[w] = [],
    F[w] = [],
    v = 0; v < D; v++)
      E[w][v] = 0,
      F[w][v] = 0;
  var V = Aa + 5
    , Ha = d[V][0] % d[V][3] * (d[V][0] % d[V][3]) + d[V][1] % d[V][3] * 2 + d[V][2] % d[V][3]
    , Ia = d[V + 1];
  for (x = V + 2; x <= V + 1 + Ha; x++)
    for (v = d[x][0] - Ia[0] - 1; v < d[x][0] - Ia[0] + d[x][1] - Ia[1] - 1; v++)
      E[d[x][3] - Ia[3] - 1][v] = d[x][2] - Ia[2];
  var Ja = !1
    , W = Aa + 7 + Ha;
  if (d.length > W) {
    Ja = !0;
    var Ka = [];
    for (w = 0; w < C; w++)
      for (Ka[w] = [],
      v = 0; v < D; v++)
        Ka[w][v] = 0;
    var La = d[W][0] % d[W][3] * (d[W][0] % d[W][3]) + d[W][1] % d[W][3] * 2 + d[W][2] % d[W][3]
      , Ma = d[W + 1];
    for (x = W + 2; x <= W + 1 + La; x++)
      for (v = d[x][0] - Ma[0] - 1; v < d[x][0] - Ma[0] + d[x][1] - Ma[1] - 1; v++)
        Ka[d[x][3] - Ma[3] - 1][v] = d[x][2] - Ma[2]
  }
  for (w = 0; w < C; w++) {
    N[w] = [];
    L[w] = [];
    for (v = 0; v < D; ) {
      var Na = v;
      for (z = E[w][v]; v < D && E[w][v] == z; )
        v++;
      0 < v - Na && 0 < z && (N[w][N[w].length] = [v - Na, z],
      L[w][N[w].length] = !1)
    }
    N[w].length > Ba && (Ba = N[w].length)
  }
  for (v = 0; v < D; v++) {
    O[v] = [];
    M[v] = [];
    for (w = 0; w < C; ) {
      var Oa = w;
      for (z = E[w][v]; w < C && E[w][v] == z; )
        w++;
      0 < w - Oa && 0 < z && (O[v][O[v].length] = [w - Oa, z],
      M[v][O[v].length] = !1)
    }
    O[v].length > Ca && (Ca = O[v].length)
  }
  var func = e=>e.map(E=>E[0]);
  var r = {h:N.map(func),v:O.map(func)};
  //console.log(r);
  //console.log(JSON.stringify(r));
  return r;
}

module.exports = parseData;
