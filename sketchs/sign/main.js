function fixTextSize(elem) {
  var width = $('#tester').width();
  var height =  window.innerHeight;
  var innerdiv = $('div.inner');

  function getFontSizeFromWidth(){
    var widthtester = $(`<span class="tester">${elem.html()}</span>`).appendTo('body');
    var widthtest = widthtester.width();
    widthtester.remove();
    var fontSize = Math.round(Math.min(width/(widthtest/1000), 1000));
    return fontSize;
  }

  function getFontSizeFromHeight(){
    var heighttester = $(`<span class="tester">${elem.html()}</span>`).appendTo('body');
    var heighttest = heighttester.height();
    heighttester.remove();
    var fontSize = Math.round(Math.min(height/(heighttest/1000), 1000));
    return fontSize;
  }

  var fontSize = Math.min(getFontSizeFromHeight(), getFontSizeFromWidth());
  var i = 0;
  do {
    fontSize--;
    elem.css('font-size', fontSize.toString() + 'px');
    if(fontSize==0)break;
    i++;
  } while(elem.width() >= width || innerdiv.height() >= height);

  console.log(i)
}

function main(){
  var prev = "";
  var lasttime = Date.now();
  var f = bool => {
    var t = $('#tb').val();
    var cursorpos = $('#tb').prop("selectionStart");
    var sign = JSON.stringify({t, cursorpos, innerHeight, innerWidth});
    if(prev == sign && !bool)return;
    prev = sign;

    t = t.slice(0, cursorpos) + '<span id="c">\u200b</span>' + t.slice(cursorpos);
    $('#sign').html(t);
    fixTextSize($('#sign'));

    var t = $('#c')[0].getBoundingClientRect();
    $('#cursor').css({left:t.x, top:t.y, height: t.height});
    lasttime = Date.now();
  };

  if(window.location.search != ""){
    $('#tb').val(decodeURI(window.location.search.slice(1)));
  }

  $('#tb').on('change', f).on('keyup', f);
  f();
  $('body').on('click', () => $('#tb').focus());
  $(window).on('resize', f);

  var loop = ()=>{
    f();
    $('#cursor').css({display: (Date.now() - lasttime < 100)?'block':'none'});
    window.requestAnimationFrame(loop);
  };
  window.requestAnimationFrame(loop);
}

$(main);
