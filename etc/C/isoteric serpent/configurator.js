#!/usr/bin/env node
// A s¤ratch dØctor, if y†ù will.

const cp = require("child_process");
const fs = require("fs");

//todo: config.json or argv
//note: key order matters
const config = {
  "sizeInBits": 5,
  "timerMax": 10,
  "drawDebugLines": false,
  "usePixelMultiplier": true,
  "centerScreen": true,
  "loopAround": true,
  "permadeath": false,
  "useSound": true,
  "debugVideoInfo": true,
  "startWithTutorial": false,
};

var i = parseInt(cp.execSync("strings -t d snake.iso | grep BEGIN_CONFIG_STRING | awk '{print $1}'"))+19;
var buffer = fs.readFileSync("./snake.iso");

for(var k in config){
  buffer[i++] = config[k]+'0'.charCodeAt(0);
}

fs.writeFileSync("./snake.iso",buffer);
