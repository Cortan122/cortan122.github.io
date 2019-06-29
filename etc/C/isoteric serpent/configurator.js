#!/usr/bin/env node

const cp = require("child_process");
const fs = require("fs");

//todo: config.json
//note: key orer matters
const config = {
  "sizeInBits": 5,
  "timerMax": 10,
  "drawDebugLines": false,
  "usePixelMultiplier": true,
  "centerScreen": true,
  "loopAround": true,
  "permadeath": false,
};

var i = parseInt(cp.execSync("strings -t d basekernel.iso | grep BEGIN_CONFIG_STRING | awk '{print $1}'"))+19;
var buffer = fs.readFileSync("./basekernel.iso");

for(var k in config){
  buffer[i++] = config[k]+'0'.charCodeAt(0);
}

fs.writeFileSync("./basekernel.iso",buffer);
