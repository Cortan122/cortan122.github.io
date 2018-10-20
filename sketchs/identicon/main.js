var image;
var textbox;
var button;

var presets = {
  triangles:"https://www.gravatar.com/avatar/{0}?d=identicon&s=500",
  monster:"https://www.gravatar.com/avatar/{0}?d=monsterid&s=500",
  face:"https://www.gravatar.com/avatar/{0}?d=wavatar&s=500",
  atari:"https://www.gravatar.com/avatar/{0}?d=retro&s=500",
  robot:"https://www.gravatar.com/avatar/{0}?d=robohash&s=500",
  face:"https://www.gravatar.com/avatar/{0}?d=wavatar&s=500",
  unicorn:"https://unicornify.appspot.com/avatar/{0}?s=500",
  custom:"",
};

var tweakables = {
  preset:'triangles',
  customPreset:'http://example.com/{0}',
  incrementHash:true,
  metaStart:true,
};

var inputRom = [
  {keys:['enter'],action:'generate()'},
  {keys:['O','T'],action:'lib.tweaker.toggleTweakables()',description:'Toggle Tweakables'},
];

var numericAlphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_.~";

function tweakableEnum(name,rom){
  //var rom = ['dumb','layered','horizontal','vertical'];
  $('#tw_'+name).find('input').remove();
  var s = $(`
    <select>
      ${rom.map(e=>`<option value="${e}">${e}</option>`).join('\n')}
    </select>
  `);
  s.on('change',()=>{tweakables[name] = s.val();lib.tweaker.onChangeTweakable(name)});
  s.appendTo('#tw_'+name);
  s.val(tweakables[name]);
}

function hashToNum(str){
  var arr = str.split('').map(e=>{
    var t = numericAlphabet.indexOf(e);
    if(t!=-1){
      return t;
    }else{
      return numericAlphabet.length+e.charCodeAt(0);
    }
  });
  var res = BigInt(0);
  for(var e of arr){
    res += BigInt(e);
    res *= BigInt(numericAlphabet.length);
  }
  res /= BigInt(numericAlphabet.length);
  return res;
}

function numToHash(num){
  var res = "";
  while(num){
    res = numericAlphabet[num%BigInt(numericAlphabet.length)]+res;
    num /= BigInt(numericAlphabet.length);
  }
  return res;
}

function generate(){
  var hash = textbox.val();
  var hashn = hashToNum(hash);
  hash = hashn.toString(16);
  var preset = presets[tweakables.preset];
  if(tweakables.preset=="custom"){
    preset = tweakables.customPreset;
  }
  image.attr('src',preset.format(hash));
  if(tweakables.incrementHash){
    hashn++;
    textbox.val(numToHash(hashn));
  }
}

function setup(){
  height = width = 500;
  noCanvas();
  noLoop();
  image = $('<img id="img">');
  textbox = $('<input type="text" id="text">');
  button = $('<button id="button">Generate</button>');
  button.on('mousedown',generate);
  var tEnterFunc = (e)=>{
    if(e.which == 13)generate();
  };
  textbox.keypress(tEnterFunc);
  button.keypress(tEnterFunc);

  var box = $('<div id="box">');
  box.append(textbox).append(button);
  $('body').prepend(image).append(box);
  textbox.outerWidth(500-button.outerWidth());

  generate();

  tweakableEnum("preset",Object.keys(presets));
  lib.tweaker.events.push(onChange);
  onChange();
}

function onChange(name){
  var tw = tweakables;
  if(name==undefined||name=="preset"){
    var a = $('#tw_customPreset');
    if(tw.preset=="custom"){
      a.removeClass('deprecated');
    }else{
      a.addClass('deprecated');
    }
  }
}