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
  if(!GetWindowRect(hwnd, &rect))printf("%s\n", "fail");
  printf("{\n\twindowRect:{x:%d,y:%d,w:%d,h:%d},\n",rect.left,rect.top,rect.right-rect.left,rect.bottom-rect.top);
  if(!GetClientRect(hwnd, &rect))printf("%s\n", "fail2");
  printf("\tclientRect:{x:%d,y:%d,w:%d,h:%d}\n}\n",rect.left,rect.top,rect.right-rect.left,rect.bottom-rect.top);
  return 0;
}