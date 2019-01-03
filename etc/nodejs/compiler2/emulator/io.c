#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
extern uint8_t* ram;

#ifdef linux
#include "linio.c"
#endif

#if defined(_WIN32) || defined(WIN32)
#include "winio.c"
#endif

int readFile(const char * name){
  FILE* fd;
  fd = fopen(name, "r");
  if(fd==NULL){
    printf("file %s does not exist\n",name);
    // exit(1);
    return 1;
  }
  fread(ram, 1, 65536, fd);
  fclose(fd);
  return 0;
}
