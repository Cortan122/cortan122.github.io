#include <stdio.h>
#include <stdlib.h>
#include <Windows.h>
#include <strsafe.h>
#include <unistd.h>
#include <limits.h>

#define true 1
#define false 0
#define SELF_REMOVE_STRING  TEXT("cmd.exe /C ping 1.1.1.1 -n 1 -w 3000 > Nul & Del /f /q \"%s\"")

void DelMe(){
  TCHAR szModuleName[MAX_PATH];
  TCHAR szCmd[2 * MAX_PATH];
  STARTUPINFO si = { 0 };
  PROCESS_INFORMATION pi = { 0 };

  GetModuleFileName(NULL, szModuleName, MAX_PATH);

  //StringCbPrintf(szCmd, 2 * MAX_PATH, SELF_REMOVE_STRING, szModuleName);
  snprintf(szCmd, 2 * MAX_PATH, SELF_REMOVE_STRING, szModuleName);

  CreateProcess(NULL, szCmd, NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi);

  CloseHandle(pi.hThread);
  CloseHandle(pi.hProcess);
}

//<data>
{0}
//</data>

char* filenames[] = {
  {1}
};

char* files[] = {
  {4}
};

int sizes[] = {
  {5}
};

char* dirnames[] = {
  {10}
};

int numFiles = {3};
int numDirs = {11};
int consoleSize = -1;

int GetConsoleSize(){
  CONSOLE_SCREEN_BUFFER_INFO temp;
  GetConsoleScreenBufferInfo(GetStdHandle(STD_OUTPUT_HANDLE),&temp);
  // COORD r;
  // r.X = temp.dwSize.X;
  // r.Y = temp.srWindow.Bottom;
  return temp.dwSize.X;
}

void writeExtracted(char* filename,char* data,int size){
  FILE *fptr;
  fptr = fopen(filename, "wb");
  fwrite(data, sizeof(char), size, fptr);
  fclose(fptr);
}

void drawProgressBar(float value){
  int len = consoleSize-10;
  printf("[");
  for(int i = 0; i < len; i++){
    if(i<value*len){
      putchar('#');
    }else{
      putchar('-');
    }
  }
  printf("]%.2f%%\r",value*100);
}

void main(){
  //<init>
  {9}
  //</init>
  consoleSize = GetConsoleSize();
  char cwd[MAX_PATH];
  getcwd(cwd, sizeof(cwd));
  printf("Installing %s to %s%s\n",{7},cwd,{8});
  if({2}){
    printf("Do you whish to continue [y/n]");
    char c = getchar();
    if(c=='y'||c=='Y')goto leave;
    return;
  }
  leave:
  if(numDirs){
    printf("Creating directories:\n");
    for(int i = 0; i < numDirs; i++){
      mkdir(dirnames[i]);
      drawProgressBar(i/(float)numDirs);
    }
    drawProgressBar(1);
    putchar('\n');
  }
  printf("Creating files:\n");
  for(int i = 0; i < numFiles; i++){
    char* filename = filenames[i];
    char* data = files[i];
    int size = sizes[i];
    writeExtracted(filename,data,size);
    drawProgressBar(i/(float)numFiles);
  }
  drawProgressBar(1);
  if({13}){
    putchar('\n');
    system({12});
  }
  if({6}){
    DelMe();
  }
}
