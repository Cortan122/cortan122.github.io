const tw = {};

const rom = {
  "wheel": {
    setup() {
      slider(0, 1, .3, "sweep");
      slider(100, 500, 130, "pixels");
      slider(0, 50, 10, "gap");
      slider(0, 50, 10, "rdelta");
      slider(0, 20, 7, "stroke");
      slider(2, 10, 3, "symmetry")[0].step = 1;
    },
    draw() {
      var res = '';
      var size = tw.pixels;
      var step = 360/tw.symmetry;
      var r = size/2-tw.gap;
      var d = tw.rdelta*tw.stroke/5;
      for(var i = 0; i < tw.symmetry; i++){
        res += describeArc(size/2, size/2, r, i*step, (i+tw.sweep)*step);
        var start = polarToCartesian(size/2, size/2, r-d, i*step);
        res += ["L", start.x, start.y].join(' ')+'\n';
        res += describeArc(size/2, size/2, r-d, i*step, (i+1)*step);
      }

      return svgBackgroud("#ccc") + svgPath(res, tw.stroke);
    }
  },
  "lore": {
    setup(){
      slider(100, 500, 380, "pixels");
      slider(0, 1.5, 1, "scale")[0].step = 0.01;
      slider(0, 20, 9, "stroke");
      slider(1, 6, 2, "symmetry")[0].step = 1;
      slider(0, 360, 225, "angle");
      slider(0, 360, 128, "progress");
    },
    draw() {
      var path1 = "";
      var size = tw.pixels;
      var start_angle = tw.angle - 360;

      var deltaA = 7;
      var r0 = 15/380*size*tw.scale;
      var r1 = 210/380*size*tw.scale;
      var r2 = 175/380*size*tw.scale;
      var r3 = 135/380*size*tw.scale;
      path1 += describeArc(size/2, size/2, r1, 0, 360);
      path1 += describeArc(size/2, size/2, r2, 0, 360);

      var path2 = "";
      var knobs = [172, 150, 130, 111, -7, -30, -47, -64];
      for(var knob of knobs){
        path1 += radialLine(size/2, size/2, r3, knob, 10);
        if((knob - start_angle + 360)%360 <= tw.progress){
          path2 += radialLine(size/2, size/2, r3, knob, 10);
        }
      }

      for(var i = 0; i < tw.symmetry; i++){
        var knob = start_angle + i*360/tw.symmetry;
        var next_knob = start_angle + (i+1)*360/tw.symmetry;
        path1 += describeArc(size/2, size/2, r3, knob+deltaA, next_knob-deltaA);
        if(knob - start_angle + deltaA <= tw.progress){
          var end = Math.min(next_knob-deltaA, start_angle+tw.progress);
          path2 += describeArc(size/2, size/2, r3, knob+deltaA, end);
        }

        var center = polarToCartesian(size/2, size/2, r3, knob);
        var circle = describeArc(center.x, center.y, r0, 0, 360);
        path1 += circle;
        if(knob - start_angle <= tw.progress){
          path2 += circle;
        }
      }

      return svgBackgroud("#706C50") + svgPath(path1, tw.stroke, "#BDBAAD", 'round') + svgPath(path2, tw.stroke, "#fff", 'round');
    }
  },
  "karma": {
    setup() {
      slider(100, 500, 130, "pixels");
      slider(0, 50, 10, "gap");
      slider(0, 20, 10, "stroke");
      slider(0, 100, 51, "progress");
      slider(0, 360, 0, "angle");
      slider(1, 10, 4, "symmetry")[0].step = 1;
    },
    draw() {
      var number = Math.round(tw.progress * (2**tw.symmetry-1) / 100).toString(2).padStart(tw.symmetry, "0");

      var path = '';
      var size = tw.pixels;
      var r0 = size/2 - tw.gap;
      var r1 = r0 / (1 + 1/Math.sin(Math.PI / tw.symmetry));
      for(var i = 0; i < tw.symmetry; i++){
        var angle = i*360/tw.symmetry + tw.angle + (tw.symmetry == 4 ? 45 : 0);
        if(number[i] == "0"){
          var center = polarToCartesian(size/2, size/2, r0-r1, angle);
          path += describeArc(center.x, center.y, r1, 0, 360);
        }else{
          var start = polarToCartesian(size/2, size/2, r0, angle);
          if(tw.symmetry % 2 == 1){
            var char1 = number[(i + (tw.symmetry+1)/2) % tw.symmetry] == "1";
            var char2 = number[(i + (tw.symmetry-1)/2) % tw.symmetry] == "1";
            var delta = r1 / Math.tan(Math.PI / tw.symmetry);
            if(char1 && char2)delta = tw.stroke / 2;
          }else{
            var delta = r0 - 2*r1;
          }
          var end = polarToCartesian(size/2, size/2, -delta, angle);
          path += ["M", end.x, end.y, "L", start.x, start.y].join(' ')+'\n';
        }
      }

      path += describeArc(size/2, size/2, r0, 0, 360);

      return svgBackgroud("#000") + svgPath(path, tw.stroke, "#fff");
    }
  },
};

function polarToCartesian(centerX, centerY, radius, angleInDegrees){
  var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians)),
  };
}

function describeArc(x, y, radius, startAngle, endAngle){
  var start = polarToCartesian(x, y, radius, endAngle);
  var end = polarToCartesian(x, y, radius, startAngle);

  var arcSweep = (endAngle - startAngle)%360 <= 180 ? "0" : "1";
  if(endAngle != startAngle && (endAngle - startAngle)%360 == 0){
    return describeArc(x, y, radius, 0, 180) + describeArc(x, y, radius, 180, 0);
  }

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, arcSweep, 0, end.x, end.y,
  ].join(" ")+'\n';
}

function radialLine(x, y, radius, angle, deltaR){
  var start = polarToCartesian(x, y, radius, angle);
  var end = polarToCartesian(x, y, radius+deltaR, angle);

  return [
    "M", start.x, start.y,
    "L", end.x, end.y,
  ].join(" ")+'\n';
}

function svgBackgroud(color){
  return `<rect width="100%" height="100%" fill="${color}"/>`;
}

function svgPath(path, width, color="black", linecap="butt"){
  return `<path d="${path}" stroke="${color}" fill="transparent" stroke-width="${width}" fill-rule="evenodd" stroke-linecap="${linecap}"/>`
}

function slider(min, max, value, name){
  var res = $(`<input draggable="false" type="range" min="${min}" max="${max}" class="slider">`);

  var tr = $('<tr>').appendTo('#sliders');
  $(`<td class="name">${name}</td>`).appendTo(tr);
  $('<td>').append(res).appendTo(tr);
  var text = $(`<td class="text">${value}</td>`).appendTo(tr);

  res[0].id = "slider_"+name;
  res[0].title = name;
  res[0].step = Math.min(1, (max-min)/100);
  res[0].value = value;

  var prevValue = tw[name] = value;
  var update = ()=>{
    if(prevValue==res.val())return;
    text.html(tw[name] = prevValue = +res.val());
    draw();
  };

  res.on('change', update).on('mousemove', update);
  return res;
}

function dropdown(options, value, name){
  var res = $(`<select class="dropdown">`);
  for(var e of options){
    var opt = $('<option>');
    opt[0].value = e;
    opt.text(e);
    opt.appendTo(res);
  }

  var text = $('<span class="dropdown-text">').text(name);
  $('<div>').append(text).append(res).appendTo('#settings');
  res.val(value);

  var prevValue = tw[name] = value;
  var update = ()=>{
    if(prevValue == res.val())return;
    tw[name] = prevValue = res.val();
    setup();
  };

  res.on('change', update).on('mousemove', update);
  return res;
}

function setup(){
  if($('#settings').is(':empty')){
    dropdown(Object.keys(rom), "wheel", "preset");
  }

  $("#sliders").empty();
  rom[tw.preset].setup();

  draw();
}

function draw(){
  $('#svg').remove();
  var size = tw.pixels;
  var svg = $(`<svg width="${size}" height="${size}" id="svg">`).prependTo('#svgbox');

  svg.html(rom[tw.preset].draw());
}

window.addEventListener('load',()=>setup());
