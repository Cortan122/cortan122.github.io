#include <windows.h>
#include <stdio.h>

/* typedef struct ivec2 {
  int x;
  int y;
} ivec2;

ivec2 sttysize(){
  CONSOLE_SCREEN_BUFFER_INFO csbi;

  GetConsoleScreenBufferInfo(GetStdHandle(STD_OUTPUT_HANDLE), &csbi);
  int columns = csbi.srWindow.Right - csbi.srWindow.Left + 1;
  int rows = csbi.srWindow.Bottom - csbi.srWindow.Top + 1;
  // csbi.dwCursorPosition.X;

  // printf("columns: %d\n", columns);
  // printf("rows: %d\n", rows);
  return (ivec2){ columns, rows };
} */

void ShowConsoleCursor(int/* bool */ showFlag){
  HANDLE out = GetStdHandle(STD_OUTPUT_HANDLE);

  CONSOLE_CURSOR_INFO cursorInfo;
  GetConsoleCursorInfo(out, &cursorInfo);
  cursorInfo.bVisible = showFlag; // set the cursor visibility
  SetConsoleCursorInfo(out, &cursorInfo);
}

int ceilIntDiv(int x, int y){
  return (x + y - 1) / y;
}

int main(){
  printf("122\n122");

  //Get a console handle
  HWND myconsole = GetConsoleWindow();
  //Get a handle to device context
  HDC mydc = GetDC(myconsole);

  RECT rcCli;
  GetClientRect(myconsole, &rcCli);
  int windowWidth = rcCli.right-rcCli.left;
  int windowHeight = rcCli.bottom-rcCli.top;

  HANDLE outputHandle = GetStdHandle(STD_OUTPUT_HANDLE);
  CONSOLE_SCREEN_BUFFER_INFO csbi;
  GetConsoleScreenBufferInfo(outputHandle, &csbi);
  int columns = csbi.srWindow.Right - csbi.srWindow.Left + 1;
  int rows = csbi.srWindow.Bottom - csbi.srWindow.Top + 1;
  int cursorX = csbi.dwCursorPosition.X;
  int cursorY = csbi.dwCursorPosition.Y;

  int fontW = windowWidth/columns;
  int fontH = windowHeight/rows;

  ShowConsoleCursor(0);

  //Choose any color
  COLORREF white = RGB(255, 255, 255);
  COLORREF black = RGB(0, 0, 0);

  for(int i = 0; i < 256; i++){
    for(int j = 0; j < 256; j++){
      SetPixel(mydc, i+fontW*cursorX, j+fontH*cursorY, (i-128)*(i-128)+(j-128)*(j-128) < 128*128?white:black);
    }
  }

  SetConsoleCursorPosition(outputHandle, (COORD){ cursorX, cursorY+ceilIntDiv(256,fontH) });
  ShowConsoleCursor(1);

  ReleaseDC(myconsole, mydc);
  getchar();
  return 0;
}
