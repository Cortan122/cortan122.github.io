const _convertColor = require('color');
const util = require('util');

// const options = require("./options.js");
// const cache = {};

function convertColor(a){
  //if(options.cacheColors&&a in cache)return cache[a];
  var r = {};
  var color = _convertColor(a);
  r.alpha = color.alpha();
  r.rgb = color.rgb().object();
  //if(options.cacheColors)cache[a] = r;
  return r;
}

class Color{
  constructor(fg='#fff',bg='#000'){
    if(arguments.length==1&&fg instanceof Color){
      this.fg = fg.fg;
      this.bg = fg.bg;
      this.transparent = fg.transparent;
      return;
    }
    if(arguments.length==1&&fg.fg&&fg.bg){
      var {fg,bg} = fg;
    }
    //note: do not use transparent colors in buffer
    this.transparent = '';
    var tfg = convertColor(fg);
    var tbg = convertColor(bg);
    if(tfg.alpha<.5)this.transparent += 'fg';
    if(tbg.alpha<.5)this.transparent += 'bg';
    this.fg = tfg.rgb;
    this.bg = tbg.rgb;
  }
  toString(){
    return util.inspect(this);
  }
  toAnsiCode(mode){
    const moderom = {fg:38,bg:48};
    if(moderom[mode]!=undefined){
      var {r,g,b} = this[mode];
      return `\x1b[${moderom[mode]};2;${r};${g};${b}m`;
    }
    if(this.transparent=='fgbg')return '';
    if(this.transparent=='fg')return this.toAnsiCode('bg');
    if(this.transparent=='bg')return this.toAnsiCode('fg');
    return this.toAnsiCode('fg')+this.toAnsiCode('bg');
  }
  flip(){
    var {fg,bg} = this;
    this.bg = fg;
    this.fg = bg;
    return this;
  }
  negate(){
    var {fg,bg} = this;
    this.fg.r = 255-fg.r;
    this.fg.b = 255-fg.b;
    this.fg.g = 255-fg.g;
    this.bg.r = 255-bg.r;
    this.bg.b = 255-bg.b;
    this.bg.g = 255-bg.g;
    return this;
  }
  copy(){
    var t = new Color(this.fg,this.bg);
    t.transparent = this.transparent;
    return t;
  }
  equals(other){
    return 
      this.bg.r==other.bg.r &&
      this.bg.b==other.bg.b &&
      this.bg.g==other.bg.g &&
      this.fg.r==other.fg.r &&
      this.fg.b==other.fg.b &&
      this.fg.g==other.fg.g &&
      this.transparent==other.transparent;
  }
}

module.exports = new Proxy(Color, {
  // target = Color
  apply (target, thisArg, argumentsList) {
    return new target(...argumentsList);
  },
  construct (target, argumentsList) {
    return new target(...argumentsList);
  }
});

