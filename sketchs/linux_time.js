#!/usr/bin/env node

const fs = require('fs');

var dir = fs.readdirSync('.');
for (var file of dir) {
  var stats = fs.lstatSync(file);
  if (!stats.isDirectory()) continue;

  var dataFilePath = `${file}/data.json`;
  if (!fs.existsSync(dataFilePath)) continue;

  var json = fs.readFileSync(dataFilePath, 'utf8');
  var obj = JSON.parse(json);
  var birthtime = Math.floor(stats.birthtimeMs/1000);

  if (birthtime > 1600_000_000) {
    obj.time = birthtime;
    console.log(`time change ${obj.time} -> ${birthtime}`);
  }

  var htmlFilePath = `${file}/index.html`;
  var lines = {};
  if (fs.existsSync(htmlFilePath)) {
    var index = fs.readFileSync(htmlFilePath, 'utf8');
    lines.html = index.match(/\n/g).length + 1;
    var script_regex = /<script[^<>]+src="([^<>]*)"[^<>]*><\/script>/g;
    var match = index.match(script_regex);
    if (match) {
      var js_files = match.map(e => e.replace(script_regex, '$1'));
      js_files = js_files.filter(e => !e.match(/(jquery)|(libraries)|(http)|(https)|(lib\/)|(library_)/));
      obj.jsfiles = js_files;

      var sum = 0;
      for (var js_file of js_files) {
        var filename = `${file}/${js_file}`;
        if (filename.includes(".min.js")) continue;
        var text = fs.readFileSync(filename, 'utf8');
        console.log(js_file);
        sum += text.match(/\n/g).length + 1;
      }
      lines.js = sum;
    }
  }

  obj.lines = lines;
  var prettyJson = JSON.stringify(obj, undefined, 2);
  fs.writeFileSync(dataFilePath, prettyJson);
}
