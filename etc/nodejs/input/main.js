const exec = require('child_process').exec;

function exit(){
  console.log('\rdone');
  process.exit(0);
}

process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
  const chunk = process.stdin.read();
  if (chunk !== null) {
    if(chunk[0] == "q")exit();
    process.stdout.write('data: '+chunk.charCodeAt(0).toString(16)+'\n');
  }
});

process.stdin.on('end', () => {
  process.stdout.write('end');
});

//./input | nodejs main.js