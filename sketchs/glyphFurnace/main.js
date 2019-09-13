const sliders = {};
const tw = {};

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
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, arcSweep, 0, end.x, end.y,
  ].join(" ")+'\n';
}

function slider(min, max, value, name){
  var res = $(`<input type="range" min="${min}" max="${max}" class="slider">`);
  sliders[name] = res;

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

function setup(){
  $('<table id="sliders">').appendTo('body');

  slider(0, 1, .3, "sweep");
  slider(100, 500, 130, "pixels");
  slider(0, 50, 10, "gap");
  slider(0, 50, 10, "rdelta");
  slider(0, 20, 7, "stroke");
  slider(2, 10, 3, "symmetry")[0].step = 1;

  draw();
}

function draw(){
  $('#svg').remove();
  var size = tw.pixels;
  var svg = $(`<svg width="${size}" height="${size}" id="svg">`).prependTo('body');

  var res = '';
  var step = 360/tw.symmetry;
  var r = size/2-tw.gap;
  var d = tw.rdelta*tw.stroke/5;
  for(var i = 0; i < tw.symmetry; i++){
    res += describeArc(size/2, size/2, r, i*step, (i+tw.sweep)*step);
    var start = polarToCartesian(size/2, size/2, r-d, i*step);
    res += ["L", start.x, start.y].join(' ')+'\n';
    res += describeArc(size/2, size/2, r-d, i*step, (i+1)*step);
  }

  svg.html(`
  <rect width="100%" height="100%" fill="#ccc"/>
  <path
  d="${res}"
  stroke="black" fill="transparent" stroke-width="${tw.stroke}" fill-rule="evenodd"
  />
  `);

  // stroke="#00FF7F"
}

window.addEventListener('load',()=>setup());
