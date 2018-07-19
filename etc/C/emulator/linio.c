#include <stdio.h>

#define BOXDRAWING_VERTICAL "│"
#define BOXDRAWING_HORIZONTAL "─"
#define BOXDRAWING_CROSS "┼"

void SetCursorPosition(int x, int y){
  printf("\e[%d;%df",y+1,x+1);
}

void ClearConsole(){
  system("clear");
}

void HideCursor(){
  printf("\e[?25l");
}

void unHideCursor(){
  printf("\e[?25h"); 
}

void readFile(char * name){
  FILE* fd;

  fd = fopen(name, "r");
  fread(ram, 1, 65536, fd);
  fclose(fd);
}
