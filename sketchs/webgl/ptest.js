r = ''
for(var i = 0;i<11;i++){
  for(var j = 0;j<11;j++){
    r += 'v {0} {1} 0\n'.format(i,j);
  }
}

r += 'vn 0 0 1\n'

for(var i = 0;i<10;i++){
  for(var j = 0;j<10;j++){
    r += 'vt {0} {1}\n'.format(i/10,j/10);
  }
}

var t = 0;
for(var i = 0;i<10;i++){
  for(var j = 0;j<10;j++){
    t++;
    r += 'f {0}/{4}/1 {1}/{4}/1 {2}/{4}/1 {3}/{4}/1\n'.format(i*11+j+1,i*11+j+2,i*11+j+13,i*11+j+12,t);
  }
}