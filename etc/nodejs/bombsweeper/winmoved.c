#include <stdio.h>
#include <Windows.h>

int main(int argc,char* argv[]){
  HWND hwnd;
  if(argc==2){
    hwnd = (HWND)atoi(argv[1]);
  }else{
    hwnd = GetForegroundWindow();
  }
  if(hwnd==NULL)printf("%s\n", "hwnd");
  RECT rect;
  RECT prev;
  int i = 0;
  while(1){
    if(!GetWindowRect(hwnd, &rect)){
      printf("%s\n", "fail");
      break;
    }
    if(i&&(rect.left!=prev.left||rect.top!=prev.top)){
      printf("[%d,%d]\n",rect.left-prev.left,rect.top-prev.top);
      fflush(stdout);
    }else{
      Sleep(100/*ms*/);
    }
    prev = rect;
    i = 1;
  }
  return 0;
}