eval drawMode=true;
eval scl = 4;

function init{
  do{
    PIXEL_Y++;
    do{ 
      PIXEL_X++;
      COLOR = PIXEL_X;
      # dis;
    }while(PIXEL_X != 0);
  }while(PIXEL_Y != 0);
};

init();

function fart{
  COLOR = PIXEL_X;
  # dis;
  PIXEL_X = MOUSE_X;
  PIXEL_Y = MOUSE_Y;
  COLOR = 255;
  # dis;
};

do{
  if(PIXEL_X != MOUSE_X){ 
    fart();
  };
  if(PIXEL_Y != MOUSE_Y){ 
    fart();
  };
}while(true);