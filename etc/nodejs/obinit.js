global.GOT=(()=>{
    var /*@010*/=["\x76\x61\x72\x20","\x3D","\x61\u0430","","\x67\x6C\x6F\x62\x61\x6C\x2E","\x65\x76\x61\x6C","\x2E","\x31\x32\x32","\x31\x32\x32","\x61","\x72\x65\x74\x75\x72\x6E\x20","\x61\x3E\x30\x3F\x62\x28\x61\x2D\x31\x2C\x62\x29","\x31\x32\x32","\x2C\x62","\x61\x5B\x62\x5D","\x2C\x63","\x61\x3F\x62\x3A\x63","\x63\x6F\x6E\x73\x74\x72\x75\x63\x74\x6F\x72","\x67\x65\x74\x4F\x77\x6E\x50\x72\x6F\x70\x65\x72\x74\x79\x4E\x61\x6D\x65\x73","\x63\x6F\x6E\x73\x6F\x6C\x65","\x6C\x6F\x67","\x5F\x5F\x70\x72\x6F\x74\x6F\x5F\x5F","\x28\x5B\x61\x5D\x29\x3A\x5B\x30\x5D"];
  return /*@011*/=>/*@010*/[/*@011*/];
})();
global.crtvar=(()=>{
  var /*@010*/=100;
  return (/*@014*/)=>{
    var /*@011*/=/*@010*/<<1;
    var /*@012*/=GOT(3);
    for(var /*@013*/=0;/*@013*/<16;/*@013*/++)
      /*@012*/+=GOT(2)[(/*@011*/>>=1)&1];
    //global[GOT(5)](GOT(4)+/*@012*/+GOT(1)+GOT(9));
    global[/*@012*/] = /*@014*/;
    /*@010*/++;
    return /*@012*/;
  };
})();

crtvar(/*@010*/ => global[GOT(/*@010*/)]);//@GOTa /*@000*/
crtvar(/*@010*/ => GOTa(5)(/*@010*/));//@eval /*@000*/
crtvar(
  crtvar((/*@010*/,/*@011*/) => /*@010*/+/*@011*/)//@add /*@000*/
);//@at_add /*@000*/
crtvar((/*@010*/,/*@011*/) => /*@010*/-/*@011*/);//@sub /*@000*/
crtvar(eval(add(at_add,add(GOT(6),add(GOT(21),add(GOT(6),GOT(17)))))));//@crtfunc /*@000*/
crtvar(crtfunc(add(GOT(9),GOT(13)), add(GOT(10),GOT(14)) ));//@ind /*@000*/
crtvar(ind(ind(ind(GOT(3),GOT(21)),GOT(21)),GOT(17)));//@Object /*@000*/
crtvar(ind(Object,GOT(18)));//@keys /*@000*/
crtvar(ind(GOT(3),GOT(21)));//@stringProto /*@000*/
crtvar(ind(keys(stringProto),39));//@lit_repeat /*@000*/
crtvar(ind(ind(GOT(3),GOT(17)), ind(keys(ind(GOT(3),GOT(17))),4) ));//@crtstr /*@000*/
crtvar(ind(eval(crtstr(91,93)),GOT(21)));//@arrayProto /*@000*/
crtvar(ind(keys(arrayProto),7));//@lit_slice /*@000*/
crtvar(ind(keys(arrayProto),22));//@lit_join /*@000*/
crtvar(ind(keys(arrayProto),15));//@lit_map /*@000*/
crtvar(ind(keys(arrayProto),2));//@lit_concat /*@000*/
crtvar(ind(crtfunc,GOT(21)));//@funcProto /*@000*/
crtvar(ind(keys(funcProto),7));//@lit_call /*@000*/
crtvar(ind(keys(funcProto),6));//@lit_bind /*@000*/
crtvar(ind(crtfunc,lit_call));//@call_unbound /*@000*/
crtvar(crtfunc(add(GOT(9),GOT(13)),add(GOT(10),add(crtstr(97,46),add(lit_bind,crtstr(40,98,41))))));
//@bindcall /*@000*/
crtvar(bindcall(call_unbound,call_unbound));//@call /*@000*/
crtvar(bindcall(call_unbound,ind(arrayProto,lit_slice)));//@toArray /*@000*/
crtvar(bindcall(call_unbound,ind(arrayProto,lit_join)));//@join /*@000*/
crtvar(bindcall(call_unbound,ind(arrayProto,lit_map)));//@map /*@000*/
crtvar(bindcall(call_unbound,ind(arrayProto,lit_concat)));//@concat /*@000*/
crtvar(bindcall(call_unbound,ind(stringProto,lit_repeat)));//@repeat /*@000*/
crtvar(ind(toArray(GOT(3)),GOT(17)));//@Array /*@000*/
crtvar(crtfunc(add(add(GOT(9),GOT(13)),GOT(15)), add(GOT(10),GOT(16)) ));//@trist /*@000*/
crtvar(eval(add(GOT(19),add(crtstr(46),GOT(20)))));//@print /*@000*/
crtvar(crtfunc(add(GOT(9),GOT(13)),add(GOT(10),join(Array(GOT(11),crtstr(46),lit_concat,GOT(22)),GOT(3)))));
//@intArray /*@000*/

//deamonstration
crtvar(/*@010*/ => add(repeat(crtstr(32),sub(20,/*@010*/)),repeat(crtstr(42),add(/*@010*/,add(/*@010*/,1)))));
//@treeline /*@000*/
print(join( concat(map(intArray(7,intArray),treeline),Array(treeline(2),treeline(2))),crtstr(10)));