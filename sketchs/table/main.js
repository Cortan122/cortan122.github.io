const TABLE_ALIGN = "left";//"center"
const TABLE_STYLE = 1;
const FILE_PATH = "../categories.txt";
const FIRST_HEADER_NAME = "path";
const HIDDEN_COLS = ["category","categories",'jsfiles'];
const COL_FORMAT = ["link","text","time",".js num4"];
const ARROWS = "\u25BC\u25B2";

var totalLinesOfJavascript = 0;//temp

function setup() {
  //noCanvas();
  //noLoop();
  $.ajax(FILE_PATH).done(callback).fail(function() {
    alert( "error" );
  });
  $('head').append('<link rel="stylesheet" type="text/css" href="t{0}.css">'.format(TABLE_STYLE));
}
window.addEventListener('load',setup);
//function draw() {}

function callback(obj){
  var arr = makeTable(obj);
  var format = [];// = COL_FORMAT;
  if(typeof COL_FORMAT == "object"&&!Array.isArray(COL_FORMAT)){
    for (var prop in COL_FORMAT) {
      var i = arr[0].indexOf(prop);
      if(i == -1)throw "invalid COL_FORMAT";
      format[i] = COL_FORMAT[prop];
    }
  }else{
    format = COL_FORMAT;
  }
  displayTable(arr,format);

}

function makeTable(obj){
  if(typeof obj == "string")obj = JSON.parse( obj );
  var arr = [[]];
  arr[0][0] = FIRST_HEADER_NAME;
  var i = 0;
  for (var prop in obj) {
    arr[i+1] = [prop];
    Object.keys(obj[prop]).map(e => {
      if(HIDDEN_COLS.includes(e))return;
      if(!arr[0].includes(e))arr[0].push(e);
      arr[i+1][arr[0].indexOf(e)] = obj[prop][e];
    });
    i++;
  }
  return arr;
}

function displayTable(arr,format){
  console.log(arr);
  var table = $('<table id="myTable" align="'+TABLE_ALIGN+'"></table>');
  for (i = 0; i < arr.length; i++) {
    var row = $('<tr></tr>');
    table.append(row);
    for (j = 0; j < arr[0].length; j++) {
      var t;
      if(i == 0){
        t = $("<th></th>");
        let _j = j;
        t.click(() => sortTable(_j));
        t.html(arr[i][j]);
      }else{
        t = $("<td></td>");
        t.html( applyFormat(arr[i][j],format[j]) );
      } 
      row.append(t);
    }
  }
  $('body').append(table);
  table.find('th').eq(0).click().click();
}

var linkOffset = FILE_PATH.substr(0,FILE_PATH.lastIndexOf('/')+1);
const formatFunctionRom = {
  "link":a => "<a href="+linkOffset+a+">"+a+"</a>",
  "time":e => {
    var d = new Date(parseInt(e)*1000);//.toISOString()
    return d.toISOString().replace(/[TZ]/g,' ').substr(0,16);
  },
  "date":e => {
    var d = new Date(parseInt(e)*1000);//.toISOString()
    return d.toISOString().split('T')[0];
  },
  "num4":t => {
    totalLinesOfJavascript += t;//temp
    return ('0000'+t.toString()).substr(-4);
  }
};
function applyFormat(text,format){
  if(text == undefined)return "\u2063__UNDEFINED__";
  if(format[0] == '.'){
    var t = text[format.substr(1).split(' ')[0]];
    var func = formatFunctionRom[format.substr(1).split(' ')[1]];
    return func(t);
  }
  var func = formatFunctionRom[format];
  if(func == undefined)return text;
  return func(text);
}

function updateArrows(n,dir){
  var headers = $("#myTable").children('tr').eq(0).children('th');
  updateArrowsh1(headers.eq(n),dir);
  updateArrowsh2(headers.eq((n+1)%4));
  updateArrowsh2(headers.eq((n-1)%4));
  updateArrowsh2(headers.eq((n-2)%4));
}

function updateArrowsh2(jq){
  var str = jq.html();
  if(str.includes(ARROWS[0])||str.includes(ARROWS[1])){
    str = str.substr(0,str.length-2);
  }
  jq.html(str);
}

function updateArrowsh1(jq,dir){
  updateArrowsh2(jq);
  var str = jq.html();
  str = str+" "+ARROWS[+dir];
  jq.html(str);
}

//stolen from https://www.w3schools.com/howto/howto_js_sort_table.asp
function sortTable(n) {
  var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
  table = document.getElementById("myTable");
  switching = true;
  // Set the sorting direction to ascending:
  dir = "asc"; 
  /* Make a loop that will continue until
  no switching has been done: */
  while (switching) {
    // Start by saying: no switching is done:
    switching = false;
    rows = table.getElementsByTagName("TR");
    /* Loop through all table rows (except the
    first, which contains table headers): */
    for (i = 1; i < (rows.length - 1); i++) {
      // Start by saying there should be no switching:
      shouldSwitch = false;
      /* Get the two elements you want to compare,
      one from current row and one from the next: */
      x = rows[i].getElementsByTagName("TD")[n];
      y = rows[i + 1].getElementsByTagName("TD")[n];
      /* Check if the two rows should switch place,
      based on the direction, asc or desc: */
      if (dir == "asc") {
        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
          // If so, mark as a switch and break the loop:
          shouldSwitch= true;
          break;
        }
      } else if (dir == "desc") {
        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
          // If so, mark as a switch and break the loop:
          shouldSwitch= true;
          break;
        }
      }
    }
    if (shouldSwitch) {
      /* If a switch has been marked, make the switch
      and mark that a switch has been done: */
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      // Each time a switch is done, increase this count by 1:
      switchcount ++; 
    } else {
      /* If no switching has been done AND the direction is "asc",
      set the direction to "desc" and run the while loop again. */
      if (switchcount == 0 && dir == "asc") {
        dir = "desc";
        switching = true;
      }
    }
  }
  updateArrows(n,dir=="asc");
}

/*function pushCSS(css) {
  var //css = 'h1 { background: red; }',
    head = document.head || document.getElementsByTagName('head')[0],
    style = document.createElement('style');

  style.type = 'text/css';
  if (style.styleSheet){
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  head.appendChild(style);
}*/