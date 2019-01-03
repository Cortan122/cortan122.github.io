#include <stdio.h>
#include <signal.h>
#include <stdlib.h>
#include <string.h>
#include "main.hpp"

const char * filename = "./examples/out.crtb";
char currantCommand_initial[] = "0(cls)";
char * currantCommand = &currantCommand_initial[0];

volatile bool keepRunning = true;
unsigned int numExecutedInstructions = 0;
bool doRegdump = false;
bool useColor = false;
bool useScreen = false;

void intHandler(int dummy){
  keepRunning = 0;
}

void hexdump(int page){
  int ramSize = getRamSize();
  int numPages = ramSize>>8;
  int ip = getInstructionPointer();
  if(ramSize&0xff)numPages++;
  page = modulo(page,numPages);

  printf("  " BOXDRAWING_VERTICAL "00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f");
  dumpOneRegister(-2);
  printf("\n" BOXDRAWING_HORIZONTAL BOXDRAWING_HORIZONTAL BOXDRAWING_CROSS);
  for(int i = 0; i < 47; i++)printf("%s", BOXDRAWING_HORIZONTAL);
  dumpOneRegister(-1);
  printf("\n");

  int i = page<<8;
  for(int j = 0; j < 16; j++){
    printf("%02x" BOXDRAWING_VERTICAL, j<<4);
    for(int k = 0; k < 16; k++){
      if(i>ramSize){
        printf("   ");
      }else{
        if(i==ip && useColor)printf("\x1b[32m");
        printf("%02x ", ram[i]);
        if(i==ip && useColor)printf("\x1b[0m");
      }
      i++;
    }
    dumpOneRegister(j);
    printf("\n");
  }

  printf("%*s%02x\n",48,"page:",page);
}

void regdump(bool force=false){
  if(!doRegdump && !force)return;
  int i = -3;
  while(!dumpOneRegister(i++,true));
  printf("\n");
}

bool runbin(int limit){
  numExecutedInstructions = 0;
  while(true){
    if(!keepRunning)return false;
    if(limit == 0)return false;
    if(limit > 0)limit--;
    regdump();
    numExecutedInstructions++;
    if(exec())return true;
  }
  return false;
}

int main(int argc,char *argv[]){
  bool isBatch = parseArgv(argc,argv);
  if(useColor){
    useColor = EnableVTMode();
    if(!useColor){
      printf("warning: unable to use color\n");
    }else{
      printf("\x1b[0m");
    }
  }
  if(useScreen){
    uint8_t* t = SetupSharedMemory(getRamSize());
    if(t != NULL){
      ram = t;
      memset(ram,0,getRamSize());//todo:fixme
      startScreen();
    }else{
      printf("warning: unable to use screen\n");
      useScreen = false;
    }
  }
  readFile(filename);
  registerReset();
  if(runCommand(currantCommand))return 0;
  if(isBatch)return 0;

  bool temp = true;
  size_t zero = 0;
  while(temp){
    //printf("\x1b[38;2;166;226;44m>\x1b[0m");
    printf(">");
    signal(SIGINT, SIG_DFL);
    unHideCursor();
    currantCommand = NULL;
    getline(&currantCommand,&zero,stdin);
    zero = 0;
    HideCursor();
    signal(SIGINT, intHandler);
    keepRunning = true;
    temp = !runCommand(currantCommand);
    free(currantCommand);
  }
  unHideCursor();
  if(useScreen)FreeSharedMemory();
  return 0;
}
