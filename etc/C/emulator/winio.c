#include <windows.h>
#include <stdio.h>

#define BOXDRAWING_VERTICAL "\xb3"
#define BOXDRAWING_HORIZONTAL "\xc4"
#define BOXDRAWING_CROSS "\xc5"

void SetCursorPosition(int x, int y){
  COORD coord;
  coord.X = x;
  coord.Y = y;
  SetConsoleCursorPosition(GetStdHandle(STD_OUTPUT_HANDLE), coord);
}

void ClearConsole(){
  system("cls");
}

void HideCursor(){
  HANDLE consoleHandle = GetStdHandle(STD_OUTPUT_HANDLE);
  CONSOLE_CURSOR_INFO info;
  GetConsoleCursorInfo(consoleHandle, &info);
  //info.dwSize = 100;
  info.bVisible = FALSE;
  SetConsoleCursorInfo(consoleHandle, &info);
}

void unHideCursor(){
  HANDLE consoleHandle = GetStdHandle(STD_OUTPUT_HANDLE);
  CONSOLE_CURSOR_INFO info;
  GetConsoleCursorInfo(consoleHandle, &info);
  //info.dwSize = 100;
  info.bVisible = TRUE;
  SetConsoleCursorInfo(consoleHandle, &info);
}

char *strsep(char **stringp, const char *delim) {
  if (*stringp == NULL) { return NULL; }
  char *token_start = *stringp;
  *stringp = strpbrk(token_start, delim);
  if (*stringp) {
    **stringp = '\0';
    (*stringp)++;
  }
  return token_start;
}
