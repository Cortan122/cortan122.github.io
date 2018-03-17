eval loadString('0 3e0 1 3e1',16,0x3d0);
eval drawMode1 = false;
eval clockDelay = -100;
var ballPixels array(4) as %0x3d0;
var graphicIndex as %0x3fe;
var color as %0x3ff;
var input as %0x3fd;
var pos = 50;var t;var t1;var t2;var inc;var velX = 1;var velY = 0x20;var p1;var p2 = 0x1f;
var vel = velX + velY;

function graw{
  inc = 0;
  //color = 255;
  do{
    t = ballPixels[inc];
    graphicIndex = pos + t;
    # dis;
    inc++;
  }while(inc <= 3);
};

function grawP{
  t1 = 0;
  //color = 255;
  graphicIndex = t;
  do{
    # dis;
    graphicIndex += 0x20;
    t1++;
  }while(t1 <= 9);
};

function physicsUpdate{
  color = 0;
  graw();
  //pos += velY;
  //pos += velX;
  pos += vel;
  color = 255;
  graw();
};

function collision{
  t++;
  t2 = t + pos;
  if(t2 <= 0x120){

  }else{
    pos = 50;
  };
};

function isValidX{
  t = pos & 0x1f;
  t1 = 0;
  if(t != 0){t1 += 2;}else{
    t = p1 ^ MAX_VALUE;
    collision();
  };
  if(t != 0x1f){t1 += 1;}else{
    t = p2 ^ MAX_VALUE;
    collision();
  };
  if(t1 != 3){
    velX ^= MAX_VALUE;
    velX++;
    vel = velX + velY;
    physicsUpdate();
  };
};

function isValidY{
  t = pos & 0x3e0;
  t1 = 0;
  if(t != 0){t1 += 1;};
  if(t != 0x3e0){t1 += 1;};
  if(t1 != 2){
    velY ^= MAX_VALUE;
    velY++;
    vel = velX + velY;
    physicsUpdate();
  };
};

function update{
  physicsUpdate();
  isValidY();
  isValidX();
};

function updateP1{
  t = p1;
  color = 0;
  grawP();
  p1 += t2;
  t = p1;
  color = 255;
  grawP();
};

function updateP2{
  t = p2;
  color = 0;
  grawP();
  p2 += t2;
  t = p2;
  color = 255;
  grawP();
};

function keyboardUpdate{
  if(input != 0x1d){
    if(input != 0x21){
      if(input != 0x3f9){
        if(input != 0x3f7){return;}else{
          t2 = 0x3e0;
          updateP2();//p2--;
        };
      }else{
        t2 = 0x20;
        updateP2();//p2++;
      };
    }else{
      t2 = 0x3e0;
      updateP1();//p1--;
    };
  }else{
    t2 = 0x20;
    updateP1();//p1++;
  };
};

//do{update();}while(true);

do{
  if(inc >= 10){
    update();
    inc = 0;
  };
  inc++;
  if(input <= MAX_VALUE){
    keyboardUpdate();
    input = 0;
  };
}while(true);
