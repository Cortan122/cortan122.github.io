var len = (a)=>a.length;
var sub = (...a)=>"".substr.call(...a);
var str = str1+str2;
var o = function(mode,string){
  if(!mode){
    return o(1,sub(str,0,str1.length));
  }else if(len(mode)){
    if(string[0]==mode)return string[str2.length/2];
    return o(mode,sub(string,1));
  }else if(mode<len(string)+1){
    return o(string[mode-1], sub(str,str1.length) )+o(mode+1,string);
  }
  return "";
}

o();
