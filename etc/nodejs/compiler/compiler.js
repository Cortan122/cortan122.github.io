const printer = require('./printer.js');
const tokenParser = require('./token.js');
const util = require('util');

function printError(str,pointer){
  printer.print(str,pointer);
}

function main(code){
  var tokenTree = tokenParser.main(code);
  //console.log(JSON.stringify(tokenTree,null,2));
  //console.log(tokenTree);
  console.log(util.inspect(tokenTree,{depth:null}));
}

tokenParser.printError = printError;
printer.doPrintLinePos = true;
printer.init(main,["examples/test.crtc"]);
