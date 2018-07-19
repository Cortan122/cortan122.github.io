var printer = require('./printer.js');

function printError(str){
  printer.print(str,pointer);
}

function main(code){
  pointer = 0;
  var lines = code.split("\n");
  for (var i = 0; i < lines.length; i++) {
    printError(lines[i]);
    pointer += lines[i].length+1;
  }
}

var pointer = 0;

printer.doPrintLineString = false;
printer.init(main,["examples/test.crtc"]);

