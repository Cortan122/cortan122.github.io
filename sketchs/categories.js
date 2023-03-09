function setup() {
  noCanvas();
  if(localStorage['latest1'] != undefined){
    var l = select('#latest');
    l.html(localStorage['latest1']);
    l.elt.setAttribute('onclick',"goto(localStorage['latest1'])");
    l.elt.setAttribute('href',localStorage['latest1']);
  }
  getRequest();
}

function evalData(data){
  data = data.replace(/Toys/g,"Toys/Tools")

  var d = dos(JSON.parse(data));
  buildTree(d);
  print(d);
  if(isDropdownAnimated){
    $('.ExpandClosed').children().filter('.Container').slideDown(0).slideUp(0);
    $('.Node').css("display","block");
  }
}

function getRequest(){
  var xmlHttp = new XMLHttpRequest();
  var s = 'categories'+(window.location.href.includes("cortan122.github.io")?".txt":".php");
  xmlHttp.open("GET",s,false);
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState === 4) {
      //evalData(xmlHttp.responseText);
    }
  }
  xmlHttp.send();
  evalData(xmlHttp.responseText);
}

function goto(data){
  print('goto '+data);
  localStorage['latest1'] = data;
  //window.location = data;
}

function buildTree(data,root){
  if(root === undefined){
    root = select('#tree');
  }
  var list = data.c;
  if(data.p == ""){
    data.p = '.';
    //list = data.c;
  }//todo
  var ul = createElement('ul');
  root.child(ul);
  ul.addClass('Container');
  for(var i = 0;i < list.length;i++){
    var dat = list[i];
    var li = createElement('li');
    ul.child(li);
    var s = "Node ";
    if(i == list.length-1){s += "IsLast ";}
    if(data.p == '.'){s += "IsRoot ";}//todo
    if(dat.c.length == 0){s += "ExpandLeaf ";}else{s += 'ExpandClosed ';}
    li.addClass(s/*'Node IsRoot IsLast ExpandClosed'*/);
    li.child(createElement('div').addClass('Expand'));
    var div = createElement('div');
    div.addClass('Content');
    if(dat.c.length == 0){
      div.html("<a class=\"ContentL\" href="+dat.p+"/index.html onclick="+'goto("'+dat.p+'")'+">"+(dat.name||dat.p)+"</a>");
      //div.elt.setAttribute('onclick',"goto('"+dat.p+"')");
    }else{
      div.html(dat.name||dat.p);
    }
    li.child(div);
    if(dat.c.length > 0){
      buildTree(dat,li);
    }
  }
  return root;
}

function dos(data) {
  var r = {p:'',c:{}};
  for (var i in data) {
    var cats;
    if(data[i].categories){
      cats = data[i].categories
    }else if(data[i].categorys){
      cats = data[i].categorys
    }else if(data[i].category){
      cats = [data[i].category]
    }else{
      cats = ['undefined'];
    }
    for (var j = 0; j < cats.length; j++) {
      var cat;
      if(r.c[cats[j]] == undefined){
        r.c[cats[j]] = (cat = {p:cats[j],c:[]});
      }else{
        cat = r.c[cats[j]];
      }
      cat.c.push(Object.assign({p:i,c:[]},data[i]));
    }
  }
  r.c = Object.values(r.c);
  return r;
}
