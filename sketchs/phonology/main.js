var converter = {};
  converter.convetionTable = {
    ' ':' ',
    а:'a',
    б:'b',
    в:'v',
    г:'g',
    д:'d',
    е:'ʲe',
    ё:'ʲo',
    ж:'ʒ',
    з:'z',
    и:'ʲi',
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
    ч:'ʧʲ',
    ш:'ʃ',
    щ:'ɕʲ',
    ъ:'.',
    ы:'i',
    ь:'ʲ',
    э:'e',
    ю:'ʲu',
    я:'ʲa'
  };

  converter.convetionTable2 = {
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

  converter.convert = function(data) {
    var r = '';
    data = data.toLocaleLowerCase();
    for (var i = 0; i < data.length; i++) {
      var t = converter.convetionTable[data[i]];
      if(t[0] != 'ʲ'){
        r = r + t;
        continue;
      }
      if(r.match(/[ʲ.eaoui]$/)||r.length == 0){
        r = r + 'j' + t[1]; 
      }else{
        r = r + t;
      } 
    }
    r = r.replace('.','');
    r = r.replace('jʲ','j');

    r = r.replace('ʃʲ','ʃ');
    r = r.replace('ʒʲ','ʒ');
    r = r.replace('ʦʲ','ʦ');
    return r;
  };

  converter.convert2 = function(data) {
    var r = '';
    data = data.toLocaleLowerCase();
    for (var i = 0; i < data.length; i++) {
      var t = converter.convetionTable2[data[i]];
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

var writer = function(){
  var a = {};
  a.consonants = [
    'm','n','j',
    'p','t','k',
    'f','s','l'
  ];
  a.vowels = ['a','e','i','o','u'];
  a.initOffset = [50,50];
  a.curserx = 50;
  a.cursery = 50;
  a.size = 20;
  a.gap = 2;
  a.init = function(){
    a.curserx = a.initOffset[0];
    a.cursery = a.initOffset[1];
  };
  a.write = function(data){
    var t = converter.syllables(data);
    t = t.toLocaleLowerCase();
    var arr = t.split(' ');
    for (var i = 0; i < arr.length; i++) {
      arr[i].match(/.?.?./g).forEach(a.writeSyllable);
      a.writeSpace();
    }
  };
  a.rewrite = function(data){
    data = converter.convert2(data);//.toLocaleLowerCase();
    a.init();
    background(200);
    var t = '';
    try{
      t = converter.syllables(data);
    }catch(e){return;}
    stroke(0);
    text(t,a.initOffset[0],height-a.initOffset[1]);
    if(t != '')a.write(data);
  };
  a.writeSyllable = function(data){
    if(data[0] != '_')a.writeConsonant(data[0]);
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
  }
  a.writeSpace = function(){
    push();
    fill(0);
    rect(a.curserx,a.cursery,a.curserx+a.size,a.cursery+a.size);
    pop();
    a.advance();
  };
  a.advance = function() {
    a.curserx += a.size+a.gap;
    if(a.curserx > width-a.initOffset[0]*2){
      a.curserx = a.initOffset[0];
      a.cursery += a.size+a.gap;
    }
  };
  return a;
}();
//</writer>

var loremispum = 'nottoPiFiponaliotkuTaFoSnikajetetopLeFLatnojepLeTstaFlenijeluTejpoLitajusjiknaslaSTenijeiFoskFalajusjikstLaTanijaaLaskLojupeLeTFamiFsukaLtinuiLaSjasnuttoimennoKoFoLiletottjeloFekotkLiFsijistinukotoLoKoaPinaSFalSoTtjimstastliFojSiSniTejstFitelnoniktoneotFeLKajetnepLeSiLajetneiSPeKajetnaslaSTenijtolkoiSSatoKottoetonaslaSTenijanolisiSSatoKottotekktoneumejetLaSumnopLeTaFatsanaslaSTenijampostiKajutFelikijestLaTanijaLaFnokaknetnikoKoktoFoSluPilPipLeTpotjeliFoSSaSTalPisamostLaTanijetolkoSatottoetostLaTanijeanepotomuttoinojLaSFoSnikajuttakijeoPstojatelstFakoKTastLaTanijaiPolpLinosatnekojeinemalojenaslaSTenijeesliFospolSoFatsapLostejsimpLimeLomtoktoiSnasstalPiSanimatsakakimiPitoniPilotaKostnimifiSitjeskimiupLaSnenijamiesliPietonepLinosilossoPojnekojejpolSiiktomoKPipospLaFeTliFostiupLeknutstLemasjeKosaknaslaSTenijukotoLojenenesloPissoPojnikakiknepLijatnostejilitoKoktoiSPeKalPitakoKostLaTanijakotoLojenepLinosiloPissoPojnikakoKonaslaSTenijanomipoLitajemistjitajemPeSusloFnoSasluSiFajusjimispLaFeTliFoKoneKoToFanijatekktoPuTutjioPolsjennimiLaSFLasjennimsoPlaSnamipLeTstaFlajusjiksaimnaslaSTenijFisstuplenijistLastinepLeTFiTatkakijestLaTanijaikakijenestastjaikoSiTajutoniFinoFnitakSekakitektopoTuseFnojslaPostitoestiSSelanijaiSPeSatstLaTanijiPoliotkaSiFajetsaotispolnenijasFojeKoTolKaFpLotjemSTesotjenleKkoipLostopLoFestiLaSlitjijapotomuttokoKTamisFoPoTniinampLeTostaFlenapolnajaFoSmoSnostFiPoLaSelajemoKokoKTanittonemesajetnamTelattottonamPolsenLaFitsaluPojenaslaSTenijesleTujetpLiSnatSelannimaluPojestLaTanijeotFLatitelnimnopLinekotoLikoPstojatelstFakilipotLePoFanijuTolKailiFsilukakojtoneoPkoTimostitastopLikoTitsaSaPiFatonaslaSTenijakinePeSattaKostejpoetomumuTLetpLiTeLSiFajetsaFetomslutajesleTujusjeKopLintipaFiPoLailiotkaSiFajasotuToFolstFijaonpolutajetkakijetoinijeiTaSePolsijenaslaSTenijailipLeteLpeFajastLaTanijaoniSPaFlajetsaotPolejeSestokik';

var syllables = converter.syllables;

function setup() {
  createCanvas(500,500);
  background(200);
  noFill();
  //strokeCap(SQUARE);
  rectMode(CORNERS);

  $('body').append('<input type="text" id="mainInput" style="width: {0}px;display: block;margin: 0;" autofocus >'
    .format(round(width/*-$('#mainInputText').width()*/)));
  var f = e => writer.rewrite($('#mainInput').val());
  $('#mainInput').keyup(f).keydown(f).change(f);
}

//function draw() {}