(function(){
  var lib = {};

  lib.sleep = function(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  lib.clone = function(obj){
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj){
      if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
  };

  lib.arrayDeepCopy = function(a){
    if(a == undefined)return undefined;
    var r = [];
    for (var i = 0; i < a.length; i++){
      if(Array.isArray(a[i])){
        r.push(arrayDeepCopy(a[i]));
      }else{
        r.push(a[i]);
      }
    }
    return r;
  };

  lib.getRandomInt = function(min, max){
    return Math.floor(random(0,1) * (max - min)) + min;
  };

  lib.round10 = function(value,exp){
    exp = Math.pow(10,exp);//(10**exp);
    return floor(value/exp)*exp;
    /*value = +value;
    exp = +exp;
    value = value.toString().split('e');
    value = round(+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));*/
  };

  lib.getSumOfArray = function(numArray){
    if(numArray[0] instanceof p5.Vector){
      var r = createVector(0,0,0);
      numArray.map(e => r=r.add(e));
      return r;
    }
    var r = 0;
    numArray.map(e => r+=e);
    return r;
  };

  lib.getAverageOfArray = function(numArray){
    return getSumOfArray(numArray)/numArray.length;
  };

  lib.getMaxOfArray = function(numArray){
    return Math.max.apply(null, numArray);
  };

  lib.getMinOfArray = function(numArray){
    return Math.min.apply(null, numArray);
  };

  lib.modulo = function(a,b){
    return a - b * floor(a/b);
  };

  try{
    lib.delayEval = async function(ms,str){
      await sleep(ms);
      eval(str);//setTimeout()
    };

    lib.delayApply = async function(ms,f,_this,args){
      await sleep(ms);
      f.apply(_this,args);//setTimeout()
    };
  }catch(e){
    Console.log(e);
  }

  var keyCodeDictionary = lib.keyCodeDictionary = {
    backspace:8,
    tab:9,
    enter:13,
    shift:16,
    ctrl:17,
    alt:18,
    'pause/break':19,
    capslock:20,
    escape:27,
    esc:27,
    space:32,
    pageup:33,
    pgup:33,
    pagedown:34,
    pgdn:34,
    end:35,
    home:36,
    leftarrow:37,
    uparrow:38,
    rightarrow:39,
    downarrow:40,
    left:37,
    up:38,
    right:39,
    down:40,
    insert:45,
    ins:45,
    delete:46,
    del:46,
    leftwindowkey: 91,
    rightwindowkey: 92,
    selectkey: 93,
    numpad0: 96,
    numpad1: 97,
    numpad2: 98,
    numpad3: 99,
    numpad4: 100,
    numpad5: 101,
    numpad6: 102,
    numpad7: 103,
    numpad8: 104,
    numpad9: 105,
    multiply: 106,
    'numpad*': 106,
    add: 107,
    'numpad+': 107,
    subtract: 109,
    'numpad-': 109,
    decimalpoint: 110,
    'numpad.': 110,
    divide: 111,
    'numpad/': 111,
    f1: 112,
    f2: 113,
    f3: 114,
    f4: 115,
    f5: 116,
    f6: 117,
    f7: 118,
    f8: 119,
    f9: 120,
    f10: 121,
    f11: 122,
    f12: 123,
    numlock: 144,
    scrolllock: 145,
    'semi-colon': 186,
    ';': 186,
    equalsign: 187,
    '=': 187,
    '+': 187,
    comma: 188,
    ',': 188,
    '<': 188,
    dash: 189,
    '-': 189,
    '_': 189,
    period: 190,
    '.': 190,
    '>': 190,
    forwardslash: 191,
    '/': 191,
    '?': 191,
    graveaccent: 192,
    '`': 192,
    '~': 192,
    openbracket: 219,
    '[': 219,
    '{': 219,
    backslash: 220,
    '\\': 220,
    '|': 220,
    closebraket: 221,
    ']': 221,
    '}': 221,
    singlequote: 222,
    '\'': 222,
    '\"': 222
  };
  lib.getKeyCodeOf = function(argument){
    if(typeof argument == 'number'){
      if(Number.isInteger(argument)){return argument;}else{return undefined;}
    }
    if(typeof argument == 'string'){
      if(argument.length == 1){
        argument = argument.toUpperCase();
        if(argument.match(/[^A-Z0-9 ]/))return keyCodeDictionary[argument.toLowerCase()];
        return argument.charCodeAt(0);
      }
    }
    argument = argument.toLowerCase();
    return keyCodeDictionary[argument];
  };

  var dirToVectorRom = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
  lib.dirToVector = function(dir){
    var v = dirToVectorRom[dir];
    if(window.p5&&window.p5.Vector.convert){
      return window.p5.Vector.convert(v);
    }else{
      return v;
    }
  }

  var isGithub = lib.isGithub = window.location.href.includes("cortan122.github.io");
  var isLocalhost = lib.isLocalhost = window.location.href.includes("localhost");

  lib.sendRequest = function(url,func,type,b,cache,data){
    if(cache === undefined){cache = true;}
    if(b === undefined){b = true;}
    if(type === undefined){type = "GET";data = undefined;}
    url = url.replace('https://','http://');
    if(data === undefined && url.startsWith('http://') && !isGithub){
      sendRequest('../../mirror.php',func,"POST",b,cache,url);
      return;
    }
    if(url.endsWith('.php')&&isGithub){
      url = url.substring(0,url.length-4)+'.txt';
    }
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open(type,url,b);
    if(!cache){
      xmlHttp.setRequestHeader('Expires',' Tue, 03 Jul 2001 06:00:00 GMT');
      xmlHttp.setRequestHeader('Last-Modified','{now} GMT');
      xmlHttp.setRequestHeader('Cache-Control','max-age=0, no-cache, must-revalidate, proxy-revalidate');
    }
    xmlHttp.onreadystatechange = function(){
      if (xmlHttp.readyState === 4){
        func(xmlHttp.responseText);
      }
    }
    xmlHttp.send(data);
  };

  lib.styleExists = function(string){
    var a = document.styleSheets;
    for (var i = 0; i < a.length; i++){
      var b;
      //chrome: .rules
      //firefox: .cssRules
      try{
        (b = a[i].rules)||(b = a[i].cssRules);
      }catch(e){
        return false;
      }
      for (var j = 0; j < b.length; j++){
        if(b[j].selectorText == undefined)continue;
        if(!(string instanceof RegExp)){
          if(b[j].selectorText == string)return b[j];
        }else{
          var m = b[j].selectorText.match(string);
          if(m && m[0] == m.input)return b[j];
        }
      }
    }
    return undefined;
  };

  lib.isMouseOverCanvas = function(c){
    //if(document.activeElement != document.body)return false;//fixme:unclear function name
    if(c == undefined)c = window.canvas;
    var box = c.getBoundingClientRect();
    return (mouseX>=0 && mouseX<=box.width && mouseY<=box.height && mouseY>=0);
  };

  lib.isFocusedOnCanvas = function(){
    return document.activeElement == document.body;
  };

  lib.getQueryParameterByName = function(name, url){
    if (!url){
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  };

  lib.addDrawEvent = function(event){
    //var p5.instance._draw = p5.instance._draw;
    if(!p5.instance._draw.isNew){
      p5.instance._draw = (function(){
        var cached_function = p5.instance._draw;
        return function(){
          if(this._drawEvents)this._drawEvents.map(e => e());
          var result = cached_function.apply(this, arguments); // use .apply() to call it
          return result;
        }.bind(p5.instance);
      })();
      p5.instance._draw.isNew = true;
      p5.instance._drawEvents = [];
    }
    p5.instance._drawEvents.push(event);
  };

  lib.init1 = function(){
    if(lib.isInit == true){console.log("lib already init1alized");return;}
    lib.isInit = true;
    //Object.assign(window,lib);
    for (var i in lib){
      if((window[i] === undefined)&&(lib[i] instanceof Function))window[i] = lib[i];
    }
    if(window.lib === undefined)window.lib = lib;

    if(window.setup == undefined){
      window.setup = lib.init2;
    }else{
      window.setup = (function(){
        var cached_function = window.setup;
        return function(){
          lib.init2();
          var result = cached_function.apply(this, arguments); // use .apply() to call it
          return result;
        }
      })();
    }
  };

  lib.init2 = function(){
    if(lib.isInit2 == true){console.log("lib already init2alized");return;}
    lib.isInit2 = true;

    if(window.tweakables && !window.initTweakables && window.$){
      var twr = lib.tweaker = {};
      var s;
      if(window.tweakables_name == undefined){
        s = window.location.pathname;
        s = s.replace(/index\.html?$/ig,'');
        if(s[s.length-1] == '/')s = s.substr(0,s.length-1);
        s = s.substr(s.lastIndexOf('/')+1);
      }else{
        s = tweakables_name;
      }
      twr.name = s+"_tweakables";

      twr.events = [];

      twr.getQuery = function(){
        var keys = Object.keys(tweakables);
        for (var i = 0; i < keys.length; i++){
          var name = keys[i];
          var t = lib.getQueryParameterByName("tw_"+name);
          if(t){
            if(typeof tweakables[name] == 'number'){
              tweakables[name] = parseFloat(t);
            }else if(typeof tweakables[name] == 'string'){
              tweakables[name] = t;
            }else if(typeof tweakables[name] == 'boolean'){
              t = t.toLowerCase();
              tweakables[name] = (t == 'true'||t == '1');
            }
          }
        }
      };

      twr.initTweakables = (function(){
        try{
          if(localStorage[this.name]){
            var t = JSON.parse(localStorage[this.name]);//var t = {};
            //eval('t = '+localStorage["tetris_tweakables"])
            tweakables = Object.assign(tweakables,t)
          }
          localStorage[this.name] = JSON.stringify(tweakables);
        }catch(e){localStorage[this.name] = '';}
        if(!$('#pDiv').length){
          $('body').append('<ul id="pDiv" style="display: inline-block;list-style-type:none;font-size: 20;text-decoration:;position: absolute;left: -500px;overflow-y: scroll;resize: vertical;height: 95%;margin-top: 0px;"><li style="margin-top: 20px;" class="tweakables"></li></ul>');
        }
        if(!styleExists(/.*\.tweakables/)){
          $('head').append('<style>:not(li).tweakables {display: inline-block; *display: inline; zoom: 1; vertical-align: top;margin: 0;}.input.tweakables {width: 50;}.checkbox.tweakables {position: relative;margin: 0;top: 5px;}li.tweakables {margin-bottom: 5px;}</style>')
        }
        //tweakables = Object.assign({metaResize:true,metaStart:false,metaSort:false},tweakables);
        if(tweakables.metaResize === undefined)tweakables.metaResize = true;
        if(tweakables.metaStart === undefined)tweakables.metaStart = false;
        if(tweakables.metaSort === undefined)tweakables.metaSort = false;

        this.getQuery();

        var displayTweakables = this.displayTweakables;
        displayTweakables();
        if(tweakables.metaStart){
          setTimeout(this.toggleTweakables, 1);
        }else{
          setTimeout(()=>{this.toggleTweakables();this.toggleTweakables()},1);
        }
      }).bind(twr);

      twr.isTweakablesShown = false;

      twr.toggleTweakables = (function(){
        var isTweakablesShown = this.isTweakablesShown;
        pdiv = $('#pDiv');
        var a = width;
        if(isTweakablesShown){
          pdiv.css('left','-'+a+'px').css('display','none');
        }else{
          pdiv.css('left',a+'px').css('display','inline-block');
        }
        this.isTweakablesShown = !isTweakablesShown;

        this.events.forEach(e => e("isTweakablesShown"));
      }).bind(twr);

      twr.displayTweakables = (function(){
        var onChangeTweakable = this.onChangeTweakable;
        pdiv = $('#pDiv');
        var keys = Object.keys(tweakables);
        if(tweakables.metaSort)keys = keys.sort();
        for (var i = 0; i < keys.length; i++){
          var name = keys[i];
          var text = $('<p>'+name+':'+'</p>');
          text.addClass('tweakables');
          var li = $("<li></li>");
          li.append(text);
          li.addClass('tweakables');
          li.attr('id','tw_'+name);
          if(typeof tweakables[name] == 'number'){
            var inp = $('<input type="text">');
            inp.val(tweakables[name]);
            inp.on('input',new Function('tweakables["{0}"] = parseFloat(this.value);lib.tweaker.onChangeTweakable("{0}")'.format(name)));
            inp.addClass('input');
          }else if(typeof tweakables[name] == 'string'){
            var inp = $('<input type="text">');
            inp.val(tweakables[name]);
            inp.on('input',new Function('tweakables["{0}"] = this.value;lib.tweaker.onChangeTweakable("{0}")'.format(name)));
            inp.addClass('input');
          }else if(typeof tweakables[name] == 'boolean'){
            var inp = $('<input type="checkbox">');
            inp[0].checked = tweakables[name];
            inp.on("change",new Function('tweakables["{0}"] = this.checked;lib.tweaker.onChangeTweakable("{0}")'.format(name)));
            inp.addClass('checkbox');
          }else{
            localStorage[this.name] = undefined;
            throw 'invalid tweakables';
          }
          inp.addClass('tweakables');
          li.append(inp);
          pdiv.append(li);
          //tweakables[name]
        }
        var li = $("<li></li>");
        var button = $('<button value="undefined">reset</button>');
        button.on('mousedown',new Function('localStorage["'+this.name+'"] = "";'));
        li.append(button);
        pdiv.append(li);

        var resizeTextbox = this.resizeTextbox;
        if(tweakables.metaResize)
          $(".input.tweakables")
          .keydown(resizeTextbox)
          .keyup(resizeTextbox)
          .change(resizeTextbox)
          .click(resizeTextbox)
          .each(function(i,e){
            resizeTextbox.call(e);
          });
      }).bind(twr);

      twr.onChangeTweakable = (function(name){
        this.events.forEach(e => e(name));
        var resizeTextbox = this.resizeTextbox;
        localStorage[this.name] = JSON.stringify(tweakables);
        if(tweakables.metaResize)
          $(".input.tweakables").each(function(i,e){resizeTextbox.call(e);});
      }).bind(twr);

      twr.makeEnum = function(name,rom){
        $('#tw_'+name).find('input,select').remove();
        var s = $(`
          <select>
            ${rom.map(e=>`<option value="${e}">${e}</option>`).join('\n')}
          </select>
        `);
        s.on('change',()=>{tweakables[name] = s.val();lib.tweaker.onChangeTweakable(name)});
        s.appendTo('#tw_'+name);
        s.val(tweakables[name]);
      };

      twr.resizeTextbox = function(){
        var t = 10;
        this.style.width = 0;
        var newWidth = this.scrollWidth + t;
        //if( this.scrollWidth >= this.clientWidth )newWidth += t;
        this.style.width = newWidth + 'px';
      };

      //setTimeout(twr.initTweakables, 1);
      twr.initTweakables();
    }else if(window.tweakables && !(window.createElement && window.$)){
      console.warn('you need jquery for tweakables');
    }

    if(window.inputRom && !window.parseInputRom){
      var mgr = lib.inputManager = {};
      mgr.parseInputRom = function(){
        for (var i = 0; i < inputRom.length; i++){
          var t;
          (t = inputRom[i].keys) || (t = inputRom[i].key);
          if(t.length == undefined){inputRom[i].key = getKeyCodeOf(t);inputRom[i].keys = undefined;continue;}
          if(t.length == 1){inputRom[i].key = getKeyCodeOf(t[0]);inputRom[i].keys = undefined;continue;}
          if(t.length == 0)throw 'waaat';
          inputRom[i].keys = [];
          inputRom[i].key = undefined;
          for (var j = 0; j < t.length; j++){
            inputRom[i].keys[j] = getKeyCodeOf(t[j]);
          }
        }
      }

      mgr.trueinput = function(i){
        try{
          eval(inputRom[i].action);
        }catch(e){alert(e.stack);}
      }

      mgr.longinput = (function(d){
        if(this.timer[d] > 0){
          this.timer[d]--;
        }else{
          this.trueinput(d);this.timer[d] = tweakables.inputRepeatSpeed;
        }
      }).bind(mgr);

      mgr.timer = [];

      mgr.shortinput = (function(d){
        this.trueinput(d);
        this.timer[d] = tweakables.inputRepeatDelay;
      }).bind(mgr);

      mgr.keyPressed = (function(){
        if(!isFocusedOnCanvas())return;
        for (var i = 0; i < inputRom.length; i++){
          if(inputRom[i].keys == undefined && inputRom[i].key != undefined){
            if(keyCode == inputRom[i].key){this.shortinput(i);return;}
          } else if(inputRom[i].keys != undefined){
            if(!inputRom[i].simultaneous){
              for (var j = 0; j < inputRom[i].keys.length; j++){
                if(keyCode == inputRom[i].keys[j]){this.shortinput(i);return;}
              }
            }else{
              if(inputRom[i].keys[inputRom[i].keys.length - 1] != keyCode)continue;
              for (var j = inputRom[i].keys.length - 2; j >= 0; j--){
                if(!keyIsDown(inputRom[i].keys[j])){j = -2;break;}
              }
              if(j == -1){this.shortinput(i);return;}
            }
          }
        }
      }).bind(mgr);

      mgr.updateKeyboard = (function(){
        if(!isFocusedOnCanvas())return;
        for (var i = 0; i < inputRom.length; i++){
          if(!inputRom[i].repeatable)continue;
          if(inputRom[i].keys == undefined && inputRom[i].key != undefined){
            if(keyIsDown(inputRom[i].key)){this.longinput(i);continue;}
          } else if(inputRom[i].keys != undefined){
            if(!inputRom[i].simultaneous){
              for (var j = 0; j < inputRom[i].keys.length; j++){
                if(keyIsDown(inputRom[i].keys[j])){this.longinput(i);break;}
              }
            }else{
              for (var j = inputRom[i].keys.length - 1; j >= 0; j--){
                if(!keyIsDown(inputRom[i].keys[j])){j = -2;break;}
              }
              if(j == -1){this.longinput(i);continue;}
            }
          }
        }
      }).bind(mgr);

      lib.addDrawEvent(mgr.updateKeyboard);

      if(window.keyPressed == undefined){
        window.keyPressed = mgr.keyPressed;
      }else{
        window.keyPressed = (function(){
          var cached_function = window.keyPressed;
          return function(){
            lib.inputManager.keyPressed();
            var result = cached_function.apply(this, arguments); // use .apply() to call it
            return result;
          }
        })();
      }

      mgr.buttonBoard = function(){
        var b = $('#buttonBoard');
        if(b.length == 0){
          b = $('<div id="buttonBoard"></div>');
          $('body').append(b);
        }
        for (var i = 0; i < inputRom.length; i++){
          var t = inputRom[i];
          var d = t.description;
          let l = i;
          if(!d)continue;
          b.append( $('<button>'+d+'</button>').on('click',e=>mgr.trueinput(l)) );
        }
        var f = e=>{
          if(e != "buttonBoard")return;
          if(tweakables.buttonBoard){
            $("#buttonBoard").css('display','block');
          }else{
            $("#buttonBoard").css('display','none');
          }
        };
        f("buttonBoard");
        lib.tweaker.events.push(f);
      }

      mgr.parseInputRom();

      if(window.tweakables&&tweakables.buttonBoard!==undefined)mgr.buttonBoard();

    }
  };

  lib.init3 = function(){
    if(lib.isInit3 == true)return console.log("lib already init3alized");
    lib.isInit3 = true;

    if(window.tweakables && tweakables.buttonBoard!==undefined){
      $('body').prepend($('canvas'));
    }

    if(window.tweakables && window.tweakables.showFPS !== undefined && window.$){
      if($("#frDiv").length == 0)$("body").append("<div id='frDiv'></div>");
      if(lib.tweaker==undefined)return console.log("lib.tweaker is not defined");
      lib.tweaker.events.push(e=>{
        if(e != "showFPS")return;
        if(tweakables.showFPS){
          $("#frDiv").css('display','block');
        }else{
          $("#frDiv").css('display','none');
        }
      });
      lib.addDrawEvent(function(){
        if(tweakables.showFPS)$("#frDiv").html('FPS: '+floor(frameRate()));
      });
    }
  };

  lib.isInit = false;
  lib.isInit2 = false;
  lib.isInit3 = false;

  window.addEventListener('DOMContentLoaded',lib.init1);
  window.addEventListener('load',lib.init3);

})();

Array.prototype.remove || (Array.prototype.remove = function(e){
  var index = this.indexOf(e);
  if (index > -1){
    this.splice(index, 1);
  }
  return this;
});
Object.defineProperty(Array.prototype,"remove",{enumerable: false});

Array.prototype.remove_fast || (Array.prototype.remove_fast = function(e){
  var index = this.indexOf(e);
  if(index == this.length-1){
    this.pop();
  }else if(index > -1){
    this[index] = this.pop();
  }
  return this;
});
Object.defineProperty(Array.prototype,"remove_fast",{enumerable: false});

Array.prototype.shuffle || (Array.prototype.shuffle = function(){
  var j, x, i;
  for (i = this.length; i; i--){
    j = Math.floor(/*Math.*/random() * i);
    x = this[i - 1];
    this[i - 1] = this[j];
    this[j] = x;
  }
  return this;
});
Object.defineProperty(Array.prototype,"shuffle",{enumerable: false});

Array.prototype.diff || (Array.prototype.diff = function(a){
  return this.filter(function(i){return a.indexOf(i) < 0;});
});
Object.defineProperty(Array.prototype,"diff",{enumerable: false});

Array.prototype.max || (Array.prototype.max = function(a){
  return getMaxOfArray(this);
});
Object.defineProperty(Array.prototype,"max",{enumerable: false});

Array.prototype.min || (Array.prototype.min = function(a){
  return getMinOfArray(this);
});
Object.defineProperty(Array.prototype,"min",{enumerable: false});

Array.prototype.sum || (Array.prototype.sum = function(a){
  return getSumOfArray(this);
});
Object.defineProperty(Array.prototype,"sum",{enumerable: false});

Array.prototype.flatten || (Array.prototype.flatten = function(){
  var arr = this;
  return arr.reduce(function(flat, toFlatten){
    return flat.concat(Array.isArray(toFlatten) ? toFlatten.flatten() : toFlatten);
  }, []);
});
Object.defineProperty(Array.prototype,"flatten",{enumerable: false});

Array.prototype.copy || (Array.prototype.copy = function(){
  return this.slice();
});
Object.defineProperty(Array.prototype,"copy",{enumerable: false});

Array.prototype.equals || (Array.prototype.equals = function(array){
  // if the other array is a falsy value, return
  if(!array)return false;

  // compare lengths - can save a lot of time
  if (this.length != array.length)return false;

  for(var i = 0, l=this.length; i < l; i++){
    // Check if we have nested arrays
    if(this[i] instanceof Array && array[i] instanceof Array){
      // recurse into the nested arrays
      if(!this[i].equals(array[i]))return false;
    }else if(this[i] != array[i]){
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
});
Object.defineProperty(Array.prototype,"equals",{enumerable: false});

Object.assignAll || (Object.assignAll = function(){
  var ks = Object.getOwnPropertyNames(b);
  for(var i of ks){
    a[i] = b[i];
  }
  return a;
});

String.prototype.format || (String.prototype.format = function(){
  var args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number){
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
    ;
  });
});

if(window.p5){
  p5.Vector.angleBetween || (p5.Vector.angleBetween = function(v1, v2){
    var angle = Math.acos(v1.dot(v2) / (v1.mag() * v2.mag()));
    return angle;
  });

  p5.Vector.prototype.distSq = function(v){
    return v.copy().sub(this).magSq();
  };

  p5.Vector.prototype.floor = function(){
    this.x = floor(this.x);
    this.y = floor(this.y);
    this.z = floor(this.z);
    return this;
  }

  p5.Vector.prototype.map = function(f){
    var r = this.copy();
    r.x = f(this.x);
    r.y = f(this.y);
    r.z = f(this.z);
    return r;
  }

  p5.Vector.prototype.messyEquals = function(v,precision){
    if(precision === undefined)precision = -8;
    var v1 = this.map(e => round10(e,-8));
    var v2 = v.map(e => round10(e,-8));
    return v1.equals(v2);
  }

  p5.Vector.convert = function(v){
    return createVector(v.x||v[0],v.y||v[1],v.z||v[2]);
  }

  Object.defineProperty(p5.Color.prototype, "red", {
    get: function(){
      return this._getRed();
    }, configurable: true, enumerable: false
  });
  Object.defineProperty(p5.Color.prototype, "blue", {
    get: function(){
      return this._getBlue();
    }, configurable: true, enumerable: false
  });
  Object.defineProperty(p5.Color.prototype, "green", {
    get: function(){
      return this._getGreen();
    }, configurable: true, enumerable: false
  });
  Object.defineProperty(p5.Color.prototype, "alpha", {
    get: function(){
      return this._getAlpha();
    }, configurable: true, enumerable: false
  });
  Object.defineProperty(p5.Color.prototype, "brightness", {
    get: function(){
      return this._getBrightness();
    }, configurable: true, enumerable: false
  });
  Object.defineProperty(p5.Color.prototype, "hue", {
    get: function(){
      return this._getHue();
    }, configurable: true, enumerable: false
  });
  Object.defineProperty(p5.Color.prototype, "lightness", {
    get: function(){
      return this._getLightness();
    }, configurable: true, enumerable: false
  });
  Object.defineProperty(p5.Color.prototype, "saturation", {
    get: function(){
      return this._getSaturation();
    }, configurable: true, enumerable: false
  });
  Object.defineProperty(p5.Color.prototype, "negative", {
    get: function(){
      //return color('rgba({0},{1},{2},{3})'.format(this.maxes.rgb[0]-this.red,this.maxes.rgb[1]-this.green,this.maxes.rgb[2]-this.blue,this.alpha));
      var c = color('#fff');
      c._array = this._array.map(e => 1-e);
      c._array[3] = this._array[3];
      c.levels = [round(c.red),round(c.green),round(c.blue),c.alpha];
      return c;
    }, configurable: true, enumerable: false
  });
}
