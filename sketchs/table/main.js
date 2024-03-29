const MAX_PING_TIME = 5000;
const LOCAL_STORAGE = "table_sortedColumn";

function syncajax(remote_url) {
  return $.ajax({
    type: "GET",
    url: remote_url,
    async: false
  }).responseText;
}

function setup() {
  if(getQueryParameterByName('a')=="true"){
    var theTable = Table({colFormat:["link","text","text","ping"]});
    var r = {};
    var ip = syncajax("https://cortan122.000webhostapp.com/data/home/ip.txt");
    r[ip+':27001'] = {name:"my pc",note:"up to date"};
    r[ip+':31415'] = {name:"raspberry pi",note:"never used"};
    r["https://cortan122.github.io"] = {name:"github page",note:"reliable"};
    r["https://github.com/Cortan122/cortan122.github.io"] = {name:"github repository",note:""};
    r["https://cortan122.000webhostapp.com"] = {name:"database",note:"slow"};
    theTable.callback(r);
  }else if(getQueryParameterByName('anime')=="true"){
    Table({
      colFormat:["link","text","time","num"],
      filePath:"../../private/anime/list.php",
      defaultSortDirection:'-3',
    }).init();
  }else if(getQueryParameterByName('dz2022')=="true"){
    Table({
      colFormat:["num","text","text","text","img","text","text","text","num"],
      filePath:"../../private/anime/list/index_dz2022.php",
      defaultSortDirection:'-3',
    }).init();
  }else if(getQueryParameterByName('list')=="true"){
    Table({
      colFormat:["num","text","num","img","link mal","text","duration","bool","bool","bool"],
      filePath:"../../private/anime/list/index.php",
      hiddenCols:['title','id'],
      firstHeaderName:'index',
      // defaultSortDirection:'-3',
    }).init();
    $('head').append('<style>#myTable{margin-bottom: 300px;}</style>');
    $('body').css({'position':'relative'});
    var f = ()=>{
      if(totals[6]==undefined)return setTimeout(f,1);

      var rows = $('table#myTable tr').slice(1);
      for(var i = 0; i < rows.length; i++){
        var cells = rows.eq(i).children();
        var T = i => cells.eq(i).children("div").eq(0).text();
        if(T(7) == "true" && T(8) == "true")totals[6] += parseInt(T(6));
      }

      var b = $(`<b>${humanizeDuration(totals[6],{ units: ['h','m'] })}</b>`);
      b.css({'position':'absolute','top':$('#myTable').innerHeight(),'left':0,'margin-top':8});
      $('body').append(b);
    };
    setTimeout(f,1);
  }else{
    Table().init();
  }
}
window.addEventListener('load',setup);
