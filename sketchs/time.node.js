var fs = require('fs');
 
fs.readFile('dir.txt', 'utf8', function(err, contents) {
  if(err)throw err;
  var arr = contents.split('\n');
  arr = arr.filter(e => e.includes("<DIR>"));
  var arrT = arr.map(e => {
    var t = e.substr(0,17).split('  ');
    t[0] = t[0].split('.').reverse().join('-');
    return new Date(t.join('T')+":00").getTime()/1000;
  } );
  var arrN = arr.map(e => e.substr(36).replace("\r",''));

  for (var i = 0; i < arrN.length; i++) {
    let t = i;
    fs.readFile(arrN[t]+'/data.json', 'utf8', function(err, contents) {
      if(err)return;
      var j = JSON.parse(contents);
      if(arrT[t]!=1539451560){
        j.time = arrT[t];
      }
      var arr = {};
      if(fs.existsSync(arrN[t]+'/index.html')){
        var index = fs.readFileSync(arrN[t]+'/index.html', 'utf8');
        arr.html = index.match(/\n/g).length+1;
        var rex = /<script[^<>]+src="([^<>]*)"[^<>]*><\/script>/g;
        var temp = index.match(rex);
        if(temp){
          var jsfiles = temp.map(e => e.replace(rex,'$1'));
          j.jsfiles = jsfiles = jsfiles.filter(e => !e.match(/(jquery)|(libraries)|(http)|(https)|(lib\/)/));
          var r = 0;
          for (var i = 0; i < jsfiles.length; i++) {
            try{
              var text = fs.readFileSync(arrN[t]+'/'+jsfiles[i], 'utf8');
              r += text.match(/\n/g).length+1;
            }catch(e){}
          }
          arr.js = r;
        }
      }
      j.lines = arr;
      fs.writeFile(arrN[t]+'/data.json', JSON.stringify(j,undefined,2), function(err) {if(err)throw err;});
    });
  }

  fs.unlink('dir.txt', (err) => {
    if (err) throw err;
  });
});
 