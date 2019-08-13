function Table({
  hiddenCols = ["category","categories",'jsfiles'],
  colFormat = ["link","text","time",".js num4"],
  filePath = "../categories.php",
  defaultSortDirection = "1",
  firstHeaderName = "path",
}={}){

  var boolArray = {};
  window.boolArray = boolArray;
  var totals = {};
  window.totals = totals;

  const TABLE_ALIGN = "left";//"center"
  const TABLE_STYLE = 1;
  const ARROWS = "\u25E4\u25E3";//"\u25BC\u25B2";
  const LOCAL_STORAGE = "table_sortedColumn";

  if(localStorage[LOCAL_STORAGE]==undefined){
    localStorage[LOCAL_STORAGE] = defaultSortDirection;
  }
  $('head').append('<link rel="stylesheet" type="text/css" href="t{0}.css">'.format(TABLE_STYLE));

  function callback(obj){
    var arr = makeTable(obj);
    var format = [];// = COL_FORMAT;
    if(typeof colFormat == "object"&&!Array.isArray(colFormat)){
      for(var prop in colFormat){
        var i = arr[0].indexOf(prop);
        if(i == -1)throw "invalid COL_FORMAT";
        format[i] = colFormat[prop];
      }
    }else{
      format = colFormat;
    }
    displayTable(arr,format);
  }

  function makeTable(obj){
    if(typeof obj == "string")obj = JSON.parse( obj );
    var arr = [[]];
    arr[0][0] = firstHeaderName;
    var i = 0;
    for(var prop in obj){
      arr[i+1] = [prop];
      Object.keys(obj[prop]).map(e => {
        if(hiddenCols.includes(e))return;
        if(!arr[0].includes(e))arr[0].push(e);
        arr[i+1][arr[0].indexOf(e)] = obj[prop][e];
      });
      i++;
    }
    return arr;
  }

  function displayTable(arr,format){
    var table = $('<table id="myTable" align="'+TABLE_ALIGN+'"></table>');
    for(let i = 0; i < arr.length; i++){
      var row = $('<tr></tr>');
      table.append(row);
      for(let j = 0; j < arr[i].length; j++){
        if(i == 0){
          var t = $("<th></th>");
          let _j = j;
          t.click(() => sortTable(_j));
          t.html(arr[i][j]);
        }else{
          var t = $("<td></td>");
          t.html( applyFormat(arr[i][j],format[j],t) );
        }
        row.append(t);
      }
      if(format.length>arr[i].length){
        for(let j = arr[i].length; j < format.length; j++){
          if(i == 0){
            var t = $("<th></th>");
            let _j = j;
            t.click(() => sortTable(_j));
            t.html(format[j]);
          }else{
            var t = $("<td></td>");
            t.html( applyFormat(arr[i][j%arr[i].length],format[j],t) );
          }
          row.append(t);
        }
      }
    }
    $('body').append(table);

    var stval = parseInt(localStorage[LOCAL_STORAGE]);
    var colIndex = Math.abs(stval)-1;
    sortTable(colIndex,stval<0?"desc":"asc");
  }

  function intFormat(int,len,char='0'){
    if(typeof int != 'number'){
      int = parseInt(int);
    }
    return (char.repeat(len)+int.toString()).substr(-len);
  }

  function incrementTotal(a,cell){
    setTimeout(()=>{
      var i = cell.index();
      if(totals[i]==undefined)totals[i] = (typeof a == "number")?0:'';
      totals[i] += a;
    },1);
  }

  let linkOffset = filePath.substr(0,filePath.lastIndexOf('/')+1);
  const formatFunctionRom = {
    "link":(a,cell,args) => "<a href="+(a.startsWith("http")?"":linkOffset)+a+">"+(args?args.join(' '):a)+"</a>",
    "img": a => `<img class="poster" src="${a}"><img class="poster zoom" src="${a}">`,
    "bool": (a,cell) => {
      incrementTotal(+!!a,cell);
      var t = $(`<input type="checkbox">`);
      t.prop("checked",!!a);
      var str = 'undefined';
      setTimeout(()=>{
        cell.append(`<div style="display: none;">${a}</div>`);
        cell.append(t);
        var i = cell.index();
        str = `${cell.parent().children().eq(0).html()}.${cell.parent().siblings().eq(0).children().eq(i).html()}`;
        str = str.replace(/ /g,'');
        boolArray[str] = !!a;
      },1);
      t.change(()=>{
        boolArray[str] = !boolArray[str];//todo: may not sync
      });
    },
    "time":(e,cell) => {
      incrementTotal(parseInt(e),cell);
      var d = new Date(parseInt(e)*1000);//.toISOString()
      return d.toISOString().replace(/[TZ]/g,' ').substr(0,16);
    },
    "date":(e,cell) => {
      incrementTotal(parseInt(e),cell);
      var d = new Date(parseInt(e)*1000);//.toISOString()
      return d.toISOString().split('T')[0];
    },
    "num4":(t,cell) => {
      incrementTotal(parseInt(t),cell);
      return intFormat(t,4);
    },
    "num":(t,cell) => {
      incrementTotal(parseInt(t),cell);
      return intFormat(t,99," ");
    },
    "duration":(t,cell) => {
      incrementTotal(parseInt(t),cell);
      if(typeof humanizeDuration !== "undefined"){
        return `<div style="display: none;">${intFormat(t,99," ")}</div>${humanizeDuration(t)}`;
      }else{
        return intFormat(t,99," ");
      }
    },
    "ping":(t,cell) => {
      setTimeout(()=>{ping(cell.parent().children().eq(0).children().attr('href')).then(function(delta){
        if(delta<1000){
          cell.html(intFormat(delta,3)+'ms');
        }else{
          cell.html("\u2063"+(delta/1000)+'s');
        }
        cell.removeClass('ping_checking').addClass("ping_ok");
      }).catch(function(error){
        cell.html('timeout');
        cell.removeClass('ping_checking').addClass("ping_error");
      });}, 10);
      cell.addClass('ping_checking ping');
      return 'checking';
    },
  };
  function applyFormat(text,format,cell){
    if(text == undefined)return "\u2063__UNDEFINED__";
    if(format[0] == '.'){
      var t = text[format.substr(1).split(' ')[0]];
      var func = formatFunctionRom[format.substr(1).split(' ')[1]];
      return func(t);
    }
    var args = format.split(' ');
    if(args.length > 1){
      var func = formatFunctionRom[args[0]];
      if(func == undefined)return text;
      return func(text,cell,args.slice(1));
    }
    var func = formatFunctionRom[format];
    if(func == undefined)return text;
    return func(text,cell);
  }

  function updateArrows(n,dir){
    localStorage[LOCAL_STORAGE] = ((n+1)*(dir?1:-1)).toString();

    var headers = $("#myTable").children('tr').eq(0).children('th');
    var l = headers.length;
    for(var i = 1; i < l; i++){
      updateArrows2(headers.eq((n+i)%l));
    }
    updateArrows1(headers.eq(n),dir);
  }

  function updateArrows2(jq){
    var str = jq.html();
    if(str.includes(ARROWS[0])||str.includes(ARROWS[1])){
      str = str.substr(0,str.length-2);
    }
    jq.html(str);
  }

  function updateArrows1(jq,dir){
    updateArrows2(jq);
    var str = jq.html();
    str = str+" "+ARROWS[+dir];
    jq.html(str);
  }

  var sortMemory = -1;
  function sortTable(n,dir_force=''){
    // console.log(`sortTable(${n})`);

    var table = $("#myTable");
    var rows = Array.from(table.find('tr')).slice(1);
    var m = rows.map((e,i)=>{
      return {e,i,s:e.getElementsByTagName("td")[n].innerHTML.toLowerCase()};
    });
    var dir = sortMemory != n;
    m = m.sort((a,b)=>a.s<b.s?-1:1);
    if(dir_force)dir = dir_force=='asc';
    if(!dir)m = m.reverse();
    m.map(e=>table.append(e.e));
    updateArrows(n,dir);
    sortMemory = dir?n:-1;
  }

  function init(){
    sendRequest(filePath,callback);
  }

  return {callback,init};
}
