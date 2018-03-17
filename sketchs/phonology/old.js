var diacritics = [
  '◌\u0308',//0ь
  '◌\u0323',//1ы
  '◌\u033c',//2у
  '◌\u0358',//3о
  //'◌\u1df8',//3о
  '◌\u0331',//4а
  '◌\u0324'//5э
];

/*var consonants = [
  {s1:'ꟼ',s2:'P',arr:[1,1,1,1]},
  {s1:'D',s2:'ᗡ',arr:[1,1,1,1]},
  {s1:'ᖷ',s2:'F',arr:[1,1,1,1]},
  {s1:'Ɔ',s2:'C',arr:[1,1,1,1]},
  {s1:'ʞ',s2:'k',arr:[1,1,1,1]},
  {s1:'Ƨ',s2:'S',arr:[0,1,0,1]},
  {s1:'M',s2:'M',arr:[1,1,0,0]},
  {s1:'H',s2:'H',arr:[1,1,0,0]},
  {s1:'V',s2:'V',arr:[1,1,0,0]},
  {s1:'∏',s2:'∏',arr:[1,1,0,0]},
  {s1:'o',s2:'o',arr:[1,0,0,0]},
  {s1:'T',s2:'T',arr:[0,0,1,0]},
  {s1:'Ш',s2:'Ш',arr:[0,0,1,0]},
  {s1:'X',s2:'X',arr:[0,0,0,1]},
  {s1:'∐',s2:'∐',arr:[0,0,0,1]},
  {s1:'⊢',s2:'⊣',arr:[0,1,0,1]}
];
*/
var consonants = [
  {s1:'B',s2:'P',arr:[1,1,1,1]},//0
  {s1:'D',s2:'T',arr:[1,1,1,1]},//1
  {s1:'V',s2:'F',arr:[1,1,1,1]},//2
  {s1:'Z',s2:'S',arr:[1,1,1,1]},//3
  {s1:'G',s2:'K',arr:[1,1,1,1]},//4
  {s1:'ʂ',s2:'ʃ',arr:[0,1,0,1]},//5
  {s1:'ð',s2:'θ',arr:[0,1,0,1]},//6
  {s1:'M',s2:'M',arr:[1,1,0,0]},//7
  {s1:'N',s2:'N',arr:[1,1,0,0]},//8
  {s1:'L',s2:'L',arr:[1,1,0,0]},//9
  {s1:'R',s2:'R',arr:[1,1,0,0]},//10
  {s1:'o',s2:'o',arr:[1,0,0,1]},//11
  {s1:'ʨ',s2:'ʨ',arr:[0,0,1,0]},//12
  {s1:'ɕ',s2:'ɕ',arr:[0,0,1,0]},//13
  {s1:'X',s2:'X',arr:[0,0,0,1]},//14
  {s1:'ʦ',s2:'ʦ',arr:[0,0,0,1]}//15
];

var convetionTable = {
  а:diacritics[4][1],
  б:[0,0],
  в:[2,0],
  г:[4,0],
  д:[1,0],
  е:diacritics[0][1]+diacritics[5][1],
  ё:diacritics[0][1]+diacritics[3][1],
  ж:[5,0],
  з:[3,0],
  и:diacritics[0][1]+diacritics[1][1],
  й:[11,0],
  к:[4,1],
  л:[9,0],
  м:[7,0],
  н:[8,0],
  о:diacritics[3][1],
  п:[0,1],
  р:[10,0],
  с:[3,1],
  т:[1,1],
  у:diacritics[2][1],
  ф:[2,1],
  х:[14,1],
  ц:[15,1],
  ч:[12,1],
  ш:[5,1],
  щ:[13,1],
  ъ:[11,1],
  ы:diacritics[1][1],
  ь:diacritics[0][1]+consonants[11].s1,
  э:diacritics[5][1],
  ю:diacritics[0][1]+diacritics[2][1],
  я:diacritics[0][1]+diacritics[4][1]
};

function table() {
  var r = '';
  for (var j = 0; j < consonants[0].arr.length; j++) {
    r += '\n';
    for (var i = 0; i < consonants.length; i++) {
      if(consonants[i].arr[j]){
        if(j & 0b10){
          r += consonants[i].s2;
        }else{r += consonants[i].s1;}
        if(!(j & 0b1)){
          r += diacritics[0][1];
        }
      }else{r += ' ';}
      r += '   ';
    }
    //r += '\n';
  }
  r += '\n';
  return r;
  // body...
}

function convert(data) {
  var r = '';
  data = data.toLocaleLowerCase();
  for (var i = 0; i < data.length; i++) {
    var t = convetionTable[data[i]];
    if(typeof t == 'string'){
      if(r.length == 0){r += consonants[11].s1;}
      if(t.length == 2){
        if(diacritics.includes('◌'+r[r.length-1])){
          r += consonants[11].s1;
        }
      }
      r += t;
    }
    if(typeof t == 'object'){
      var a = consonants[t[0]];
      if(a.arr[t[1]*2] == 1 && a.arr[t[1]*2+1] == 0){
        r += a['s'+(t[1]+1)]+diacritics[0][1];
      }else{
        r += a['s'+(t[1]+1)];
      }
    }
  }
  return r;
}

console.log(table());