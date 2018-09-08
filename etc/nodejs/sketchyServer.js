const http = require('http');
const fs = require('fs');
const url = require('url');
const util = require('util');
var mime;
try{
  mime = require('mime-types');
}catch(e){}

const location = '../..';

function h(s,res){
  if(s[0]=='/')s = location+s;
  if(s[s.length-1]=='/')s = s.substr(0,s.length-1);
  fs.readFile(s,(err, data) => {
    if(err){
      if(err.code=='EISDIR')return h(s+'/index.html',res);
      res.writeHead(404);
      res.end('404 error :\n'+util.inspect(err));
      return;
    }
    if(mime)res.setHeader("Content-Type", mime.lookup(s));
    res.writeHead(200);
    res.end(data);
  });
}

var server = http.createServer(function(req, res){
  var p = url.parse(req.url).pathname;
  var port = req.connection.remotePort;
  console.log(`port ${port} reqested ${p}`);
  h(p,res);
});
server.listen(8080,()=>{
  console.log(`Listening on port ${server.address().port}`);
});

process.stdin.on('data',()=>process.exit());
