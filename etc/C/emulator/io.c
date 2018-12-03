#include <stdint.h>
#include <stdlib.h>
extern uint8_t ram[65536];
#ifdef linux
#include "linio.c"
#endif

#if defined(_WIN32) || defined(WIN32)
#include "winio.c"
#endif

void readFile(char * name){
  FILE* fd;
  fd = fopen(name, "r");
  if(fd==NULL){
    printf("file %s does not exist\n",name);
    exit(1);
    return;
  }
  fread(ram, 1, 65536, fd);
  fclose(fd);
}
