var menu;
var category;
var mapObject;
var table;

function setup() {
  // body...
  menu = createSelect();
  menu.position(10,10);
  menu.changed(selectEvent);
  //menu.option();
  category = localStorage["tetris_diff"];
  getData();
}

function getData(){
  //if(myip != undefined){pushHighscore(myip);}
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET",'../scoreboard.json',true);
  xmlHttp.setRequestHeader('Expires',' Tue, 03 Jul 2001 06:00:00 GMT');
  xmlHttp.setRequestHeader('Last-Modified','{now} GMT');
  xmlHttp.setRequestHeader('Cache-Control','max-age=0, no-cache, must-revalidate, proxy-revalidate');
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState === 4) {
      init(xmlHttp.responseText);
    }
  }
  xmlHttp.send();
}

function init(data){
  mapObject = JSON.parse(data);
  var arr = [];
  for(var i in mapObject){
    menu.option(i);
    arr.push(i);
    var a = [];
    for(var j in mapObject[i]){
      var t = mapObject[i][j];
      if(Array.isArray(t)){
        for(var k in t){
          if(k == 0 || a[a.length-1].f != t[k].f || a[a.length-1].v != t[k].v)a.push(t[k]);
        }
      }else{
        a.push(t);
      }
    }
    mapObject[i] = a;
  }
  if(!arr.includes(category))throw 'nothing to see here';
  menu.elt.value = category;
  updateTable();
}

/*function draw() {
  // body...
}*/

function updateTable(){
  // body...
  if(table)table.remove();
  table = createElement('table');
  var headers = [];
  for(var i in mapObject[category]){
    var row = createElement('tr');
    for(var j in mapObject[category][i]){
      if(!headers.includes(j))headers.push(j);
      var t = createElement('td');
      t.html(mapObject[category][i][j]);
      row.child(t);
    }
    table.child(row);
  }
  var tr = createElement('tr');
  for(var i in headers){
    var t = createElement('th');
    t.html(headers[i]);
    tr.child(t);  
  }
  table.elt.insertBefore(tr.elt, table.elt.firstChild);
}

function selectEvent(){
  // body...
  category = menu.value();
  updateTable();
}