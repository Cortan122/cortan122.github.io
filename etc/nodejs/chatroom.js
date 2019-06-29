const http = require('http');
const net = require('net');

//const hostname = '127.0.0.1';
//const port = 8080;

const connections = [];

function pushConnection(c){
  for(var i = 0; i <= connections.length; i++){
    var t = connections[i];
    if(t==undefined){
      connections[i] = c;
      return i;
    }
  }
}

function popConnection(i){
  var r = connections[i];
  delete connections[i];
  return r;
}

const server = net.createServer(c=>{
  var index = pushConnection(c);
  console.log(`client №${index} connected`);
  c.on('end', () => {
    console.log(`client №${index} disconnected`);
    popConnection(index);
  });
  c.write(`hello №${index}\n`);
  for(var con of connections){
    if(con==c)continue;
    c.pipe(con,{end:false});
    con.pipe(c,{end:false});
  }
});

server.listen(0,() => {
  console.log(`Listening on port ${server.address().port}`);
});
