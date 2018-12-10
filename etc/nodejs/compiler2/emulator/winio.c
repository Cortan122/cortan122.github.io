#include <windows.h>
#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>

#define BOXDRAWING_VERTICAL "\xb3"
#define BOXDRAWING_HORIZONTAL "\xc4"
#define BOXDRAWING_CROSS "\xc5"

#ifndef ENABLE_VIRTUAL_TERMINAL_PROCESSING
#define ENABLE_VIRTUAL_TERMINAL_PROCESSING 0x0004
#endif

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

bool EnableVTMode(){
  // Set output mode to handle virtual terminal sequences
  HANDLE hOut = GetStdHandle(STD_OUTPUT_HANDLE);
  if (hOut == INVALID_HANDLE_VALUE){
    return false;
  }

  DWORD dwMode = 0;
  if(!GetConsoleMode(hOut, &dwMode)){
    return false;
  }

  dwMode |= ENABLE_VIRTUAL_TERMINAL_PROCESSING;
  if(!SetConsoleMode(hOut, dwMode)){
    return false;
  }
  return true;
}

static HANDLE SetupSharedMemory_hMapFile;
static uint8_t* SetupSharedMemory_buffer;

uint8_t* SetupSharedMemory(int size){
  // const int size = 0x10000;

  HANDLE hMapFile = CreateFileMapping(
    INVALID_HANDLE_VALUE,
    NULL,  
    PAGE_READWRITE,
    0,
    size,
    TEXT("Local\\MyFileMappingObject")
  );
  if(hMapFile == NULL)printf("ho hMapFile (%d)\n",GetLastError());

  uint8_t* buffer = (uint8_t*)MapViewOfFile(
    hMapFile,   // handle to map object
    FILE_MAP_ALL_ACCESS, // read/write permission
    0,
    0,
    size
  );
  if(buffer == NULL)printf("ho buffer (%d)\n",GetLastError());

  SetupSharedMemory_buffer = buffer;
  SetupSharedMemory_hMapFile = hMapFile;
  return buffer;
}

void FreeSharedMemory(){
  UnmapViewOfFile(SetupSharedMemory_buffer);
  CloseHandle(SetupSharedMemory_hMapFile);
}
