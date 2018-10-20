var env = {
  0:(a,b,c,d)=>a,
  1:(a,b,c,d)=>c,
  2:(a,b,c,d)=>a[b],
  3:(a,b,c,d)=>a+b,
  4:(a,b,c,d)=>delete env[c],
  8:()=>env,
  9:global,
};

for(var i = 0;i < code.length;i += 4){
  var tar  = code[0+i];
  var fn   = code[1+i];
  var arg1 = code[2+i];
  var arg2 = code[3+i];
  env[tar] = env[fn](env[arg1],env[arg2],arg1,arg2);
}
