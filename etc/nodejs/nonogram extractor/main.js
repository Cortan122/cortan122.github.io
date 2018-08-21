const cp = require('child_process');
const parseData = require('./obf.js');
const fs = require('fs');

const index = [];
//[9382,894,776,1927,1852,15391,13918,6550,10411,10604,17226,13452,80,2951,6263,16966,2974,16949,7692,516,11140,15774,5701,19200,9803];
//[163,4816,788,1756,1757,14545,15119,4133,13235,10022,6265,5754,9383,4749,844,10004,7714,1766,2188,810,11150,9354,15788,11717,13236];
//[619,2344,32,4355,2999,6556,6277,10243,6267,4954,10040,7472,7473,11130,2549,251,636,8753,2891,14250,16338,651,5859,16622,7479];
//[15007,8339,2944,5633,1751,7485,15368,6266,526,11112,15136,16953,5,7305,774,7339,2856,7480,7486,5752,13904,482,480,659,16836];
//[6510,2881,1919,6507,2153,1862,8335,1765,5004,148,645,21,728,1762,6542,15076,578,837,1925,15485,11152,830,29,17571,561];
var datas = [];

function main(index){
  const url = "https://www.nonograms.org/nonograms/i/"+index;
  cp.exec(`curl "${url}"`,(error, stdout, stderr)=>{
    if(error){
      console.error(`exec error: ${error}`);
      return;
    }
    //console.log(`stdout: ${stdout}`);
    //console.log(`stderr: \n${stderr}`);
    var lines = stdout.split('\n');
    var codeline = lines[126];
    var nameline = lines[5];
    var code = codeline.substring(6,codeline.length-1);
    var name = nameline.match(/«([^«»]*)»/)[1];
    //console.log(code);
    console.log(`parsing image № ${index} «${name}»`);
    var data = parseData(JSON.parse(code));
    data.name = name;
    datas.push([index,data]);
  });
}

function pushToDatabase(datas){
  const path = "./data.json";
  if(!fs.existsSync(path))fs.writeFileSync(path,'');
  var str = fs.readFileSync(path).toString();
  if(str=='')str = '{}';
  var j = JSON.parse(str);
  for(var [i,d] of datas){
    j[i] = d;
  }
  fs.writeFileSync(path,JSON.stringify(j));
}

if(index instanceof Array){
  for(var i of index){
    main(i);
  }
}else{
  main(index);
}

process.on('exit',()=>pushToDatabase(datas));
