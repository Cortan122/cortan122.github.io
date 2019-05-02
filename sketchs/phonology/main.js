var tweakables = {
  backgroundColor:"#c8c8c8",
  strokeColor:"#000",
  type:'lines',
  metaStart:true,
};

var converter = {};
converter.conversionTable = {
  ' ':' ',
  а:'a',
  б:'b',
  в:'v',
  г:'g',
  д:'d',
  е:'E',
  ё:'O',
  ж:'ʒ',
  з:'z',
  и:'i',
  й:'j',
  к:'k',
  л:'l',
  м:'m',
  н:'n',
  о:'o',
  п:'p',
  р:'r',
  с:'s',
  т:'t',
  у:'u',
  ф:'f',
  х:'x',
  ц:'ʦ',
  ч:'ʧ',
  ш:'ʃ',
  щ:'ɕ',
  ъ:'.',
  ы:'ɨ',
  ь:'ʲ',
  э:'e',
  ю:'U',
  я:'A',
};

converter.conversionTable2 = {
  ' ':' ',
  g:'K',
  x:'k',
  r:'L',
  b:'P',
  z:'S',
  "ʒ":'S',
  "ʃ":'s',
  "ɕ":'s',
  d:'T',
  "ʦ":'t',
  "ʧ":'t',
  v:'F',
  w:'F',
  y:'j',
  c:'k'
};

converter.convert = function(data){
  var r = '';
  data = data.toLocaleLowerCase();
  for(var i = 0; i < data.length; i++){
    r += converter.conversionTable[data[i]];
  }
  return r;
};

converter.convert2 = function(data){
  var r = '';
  data = data.toLocaleLowerCase();
  for(var i = 0; i < data.length; i++){
    var t = converter.conversionTable2[data[i]];
    if(t == undefined){r = r + data[i];continue;}
    r = r + t;
  }
  return r;
};

converter.defaultVowel = 'a';

converter.syllables1 = function(data){
  var t = data;
  t += (t[t.length-1]==' ')?'':' ';
  if(t == 'n ')t = 'n{0} '.format(converter.defaultVowel);
  while(t.match(/([klpstfmj])([klpstfmjn ])/i) ){
    t = t.replace(/([klpstfmj])([klpstfmjn ])/ig,function(){return arguments[1]+converter.defaultVowel+arguments[2];});
  }
  while(t.match(/nn/) ){
    t = t.replace(/nn/g,'n{0}n'.format(converter.defaultVowel));
  }
  t = t.match(/[klpstfnmj]?[eaoui]n?/ig).map(converter.fixLength).join(',');
  t = t.replace(/n,_/g,'_,n');
  t = t.replace(/,/g,'');
  return t;
};

converter.syllables = function(data){
  var t = data;
  //t = t.toLocaleLowerCase();
  t = t.replace(/ +/g,' ');
  t = t.replace(/ +$/g,'');
  t = t.split(' ').map(converter.syllables1).join(' ');
  return t;
};

converter.fixLength = function(data){
  var t = data;
  if(t.match(/^[eaoui]/))t = '_'+t;
  if(t[t.length-1]!='n')t = t+'_';
  return t;
};
//</converter>

function baseWriter(){
  var a = {};
  a.initOffset = [50,50];
  a.curserx = 50;
  a.cursery = 50;
  a.size = 20;
  a.gap = 2;

  a.convert = converter.convert2;
  a.convert2 = converter.syllables;
  a.regex = /.?.?./g;

  a.init = function(){
    a.curserx = a.initOffset[0];
    a.cursery = a.initOffset[1];
  };
  a.write = function(data){
    var t = a.convert2(data);
    var arr = t.split(' ');
    for(var i = 0; i < arr.length; i++){
      arr[i].match(a.regex).forEach(a.writeSyllable);
      a.writeSpace();
    }
  };
  a.rewrite = function(data){
    data = a.convert(data);
    a.init();
    background(tweakables.backgroundColor);
    var t = '';
    try{
      t = a.convert2(data);
    }catch(e){return;}
    stroke(tweakables.strokeColor);
    push();
    noStroke();
    fill(tweakables.strokeColor);
    text(t,a.initOffset[0],height-a.initOffset[1]);
    pop();
    if(t != '')a.write(data);
  };
  a.writeSpace = function(){
    a.advance();
  };
  a.advance = function(){
    a.curserx += a.size+a.gap;
    if(a.curserx > width-a.initOffset[0]*1.5){
      a.curserx = a.initOffset[0];
      a.cursery += a.size+a.gap;
    }
  };

  a.writeSyllable = function(data){};

  return a;
}

var writer;
const writerRom = {
  "lines":function(){
    var a = baseWriter();
    a.consonants = [
      'm','n','j',
      'p','t','k',
      'f','s','l','_'
    ];
    a.vowels = ['a','e','i','o','u'];
    a.writeSpace = function(){
      push();
      fill(tweakables.strokeColor);
      rect(a.curserx,a.cursery,a.curserx+a.size,a.cursery+a.size);
      pop();
      a.advance();
    };
    a.writeSyllable = function(data){
      if(data[0] != '_')a.writeConsonant(data[0].toLocaleLowerCase());
      if(data[1] != '_')a.writeVowel(data[1]);
      if(data[2] != '_')a.writeNasal(data[2]);
      a.advance();
    };
    a.writeConsonant = function(data){
      var i = a.consonants.indexOf(data);
      var ix = i%3;
      var iy = floor(i/3);
      var x = a.curserx+a.size/2*ix;
      line(x,a.cursery,x,a.cursery+a.size);
      var y = a.cursery+a.size/2*iy;
      line(a.curserx,y,a.curserx+a.size,y);
    };
    a.vowelGraphics = ['',
      'line(acx,acy,acx+as,acy+as);line(acx+as,acy,acx,acy+as);',
      'line(acx+as,acy,acx,acy+as);',
      'ellipse(acx+(as/2)+.5,acy+(as/2)+.5,as,as);',
      'line(acx,acy,acx+as,acy+as);'
    ];
    a.writeVowel = function(data){
      var i = a.vowels.indexOf(data);
      var acx = a.curserx;
      var acy = a.cursery;
      var as = a.size;
      eval(a.vowelGraphics[i]);
    };
    a.writeNasal = function(data){
      point(a.curserx+a.size/4*3,a.cursery+a.size/4);
      ellipse(a.curserx+a.size/4*3+.5,a.cursery+a.size/4+.5,a.size/2,a.size/2);
    };
    return a;
  },
  "triangles":function(){
    var a = writerRom.lines();
    var consonantGraphics = [
      'ln(0,0,1,0);ln(0,0,1,1);',//'m'
      'ellipse(0.5,0.5,1,1);ln(0,0,0,1);',//'n'
      'ln(0,0,1,0);ln(0,1,1,0);',//'j'
      'ln(0,0,1,1);ln(0.5,0.5,0,1);',//'p'
      'ln(0,1,.5,0);ln(1,1,.5,0);',//'t'
      'ln(0,1,1,0);ln(0.5,0.5,1,1);',//'k'
      'ln(0,1,1,1);ln(0,1,1,0);',//'f'
      'ln(0,0,.5,1);ln(1,0,.5,1);',//'s'
      'ln(0,1,1,1);ln(0,0,1,1);',//'l'
      'ellipse(0.5,0.5,1,1);'//'_'
    ];

    var vowelGraphics = [
      '',//a
      ['ln(.5,.5,.5,0)','ln(.5,.25,.5,.75)','$0','$0','ln(.5,0,.5,.75)','$0','ln(.5,.5,.5,1)','ln(.5,.25,.5,1)','$6'],//e
      ['pnt(.66,.33)','pnt(.5,.5)','pnt(.33,.33)','$0','$1','$2','pnt(.66,.66)','$1','pnt(.33,.66)'],//i
      'ln(0,.5,1,.5)',//o
      ['ln(.5,.5,1,.5)','ln(.25,.5,.75,.5)','ln(.5,.5,0,.5)','$0','$1','$2','$0','$1','$2']//u
    ];

    a.writeSpace = a.advance;

    a.writeSyllable = function(data){
      push();
      var scl = 2/a.size;
      var pnt = (x,y)=>ellipse(x,y,scl,scl);
      var ln = line;
      strokeWeight(scl);
      translate(a.curserx,a.cursery);
      scale(a.size);
      var cind = a.consonants.indexOf(data[0].toLocaleLowerCase());
      var cmd = consonantGraphics[cind];
      eval(cmd);
      if(data[0].match(/[A-Z]/)){
        line(0,0,1,0);
      }
      if(data[2] != '_')line(1,0,1,1);
      var vind = a.vowels.indexOf(data[1].toLocaleLowerCase());
      cmd = vowelGraphics[vind];
      if(typeof cmd == 'string'){
        eval(cmd);
      }else{
        if(cind == 9)cind = 1;
        var str = cmd[cind];
        if(str[0] == '$'){
          str = cmd[parseInt(str[1])];
        }
        eval(str);
      }
      pop();
      a.advance();
    }

    return a;
  },
  "russian":function(){
    var a = baseWriter();

    const graphics = {
      "a":"ln(0,0,0,1);ln(.5,0,.5,1);ln(0,.5,.5,.5);ln(0,0,.5,0);ti();",
      "b":"ln(0,0,0,1);ln(.5,.5,0,.5);ln(.5,.5,.5,1);ln(.5,1,0,1);ln(.5,0,0,0);ti();",
      "v":"ln(0,0,0,1);ln(.5,.5,0,.5);ln(.5,0,.5,1);ln(.5,1,0,1);ln(.5,0,0,0);ti();",
      "g":"ln(0,0,0,1);ln(.5,0,0,0);ti();",
      "d":"ln(0,1,.5,0);ln(1,1,.5,0);ln(0,1,1,1);",
      "E":"ln(0,0,0,1);ln(.5,.5,0,.5);ln(.5,1,0,1);ln(.5,0,0,0);ti();",
      "O":"ln(0,0,0,1);ln(.5,.5,0,.5);ln(.5,1,0,1);ln(.5,0,0,0);pnt(.25,.25);ti();",
      "ʒ":"ln(0,0,1,1);ln(1,0,0,1);ln(.5,0,.5,1);",
      "z":"ln(.5,0,.5,1);ln(.5,.5,0,.5);ln(.5,1,0,1);ln(.5,0,0,0);ti();",
      "i":"ln(0,0,0,1);ln(.5,1,0,1);ln(.5,0,.5,1);ti();",
      "j":"ln(0,0,0,1);ln(.5,1,0,1);ln(.5,0,.5,1);pnt(.25,0);ti();",
      "k":"ln(0,0,0,1);ln(0,.5,.5,0);ln(0,.5,.5,1);ti();",
      "l":"ln(0,1,.5,0);ln(1,1,.5,0);",
      "m":"ln(0,0,0,1);ln(1,0,1,1);ln(.5,0,.5,1);ln(0,0,1,0);",
      "n":"ln(0,0,0,1);ln(.5,.5,0,.5);ln(.5,0,.5,1);ti();",
      "o":"ln(0,0,0,1);ln(0,1,1,1);ln(1,1,1,0);ln(1,0,0,0);",//ti();
      "p":"ln(0,0,0,1);ln(.5,0,0,0);ln(.5,0,.5,1);ti();",
      "r":"ln(0,0,0,1);ln(.5,.5,0,.5);ln(.5,0,0,0);ln(.5,0,.5,.5);ti();",
      "s":"ln(0,0,0,1);ln(0,1,1,1);ln(1,0,0,0);",//ti();
      "t":"ln(1,0,0,0);ln(.5,0,.5,1);",
      "u":"ln(0,0,.5,.5);ln(1,0,0,1);",
      "f":"ln(1,0,0,0);ln(.5,0,.5,1);ln(0,.5,1,.5);ln(0,.5,0,0);ln(1,.5,1,0);",
      "x":"ln(0,0,1,1);ln(1,0,0,1);",
      "ʦ":"ln(0,0,0,1);ln(0,1,1,1);ln(1,0,1,1);pnt(.75,.75);",
      "ʧ":"ln(0,0,0,.5);ln(.5,0,.5,1);ln(0,.5,.5,.5);ti();",
      "ʃ":"ln(0,0,0,1);ln(1,0,1,1);ln(.5,0,.5,1);ln(0,1,1,1);",
      "ɕ":"ln(0,0,0,1);ln(1,0,1,1);ln(.5,0,.5,1);ln(0,1,1,1);pnt(.75,.75);",
      ".":"ln(0,0,.5,0);ln(.5,0,.5,1);ln(1,.5,.5,.5);ln(1,.5,1,1);ln(1,1,.5,1);",
      "ɨ":"ln(0,0,0,1);ln(.5,.5,0,.5);ln(.5,.5,.5,1);ln(.5,1,0,1);ln(1,0,1,1);",
      "ʲ":"ln(0,0,0,1);ln(.5,.5,0,.5);ln(.5,.5,.5,1);ln(.5,1,0,1);ti();",
      "e":"ln(0,.5,.5,.5);ln(0,0,.5,.5);ln(0,1,.5,.5);ti();",
      "U":"ln(0,0,0,1);ln(0,.5,.5,.5);ln(.5,1,.5,0);ln(.5,1,1,1);ln(.5,0,1,0);ln(1,1,1,0);",
      "A":"ln(.5,0,.5,1);ln(.5,.5,0,.5);ln(.5,0,0,0);ln(0,0,0,.5);ln(0,1,.5,.5);ti();",
    };

    a.convert = data=>data.replace(/[а-яё]/ig,e=>converter.convert(e));
    // a.convert = converter.convert;
    a.convert2 = data=>data;
    a.regex = /./g;

    a.gap = 5;

    a.writeSyllable = function(data){
      push();

      var scl = 2/a.size;
      var pnt = (x,y)=>ellipse(x,y,scl,scl);
      var ln = line;
      var ti = ()=>{a.curserx -= a.size/2;};
      strokeWeight(scl);
      translate(a.curserx,a.cursery);
      scale(a.size);
      var cmd = graphics[data];
      if(!cmd)console.log('no cmd',data);
      eval(cmd);

      pop();
      a.advance();
    };

    return a;
  },
};

//а б в г д е ё ж з и й к л м н о п р с т у ф х ц ч ш щ ъ ы ь э ю я

function rewrite(){
  if($('#mainInput').val() != undefined)writer.rewrite($('#mainInput').val());
}

function setup(){
  createCanvas(500,500);
  noFill();
  //strokeCap(SQUARE);
  textStyle(BOLD);
  strokeWeight(2);
  rectMode(CORNERS);

  lib.tweaker.makeEnum("type",Object.keys(writerRom));
  lib.tweaker.events.push(onChange);
  onChange();

  $('body').append('<input type="text" id="mainInput" style="width: {0}px;display: block;margin: 0;" autofocus >'
    .format(round(width/*-$('#mainInputText').width()*/)));

  $('#mainInput').keyup(rewrite).keydown(rewrite).change(rewrite).val('абвгдеёжзийклмнопрстуфхцчшщъыьэюя');
}

function onChange(name){
  var tw = tweakables;
  if(name==undefined||name=="type"){
    writer = writerRom[tw.type]();
  }
  background(tw.backgroundColor);
  stroke(tw.strokeColor);
  rewrite();
}
