#include <stdio.h>
#include <stdbool.h>
#include <stdint.h>

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

bool EnableVTMode(){
  return true;
}

uint8_t* SetupSharedMemory(int size){
  return NULL;
}

void FreeSharedMemory(){}
