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

#ifdef WIN32
#include <windows.h>
#elif _POSIX_C_SOURCE >= 199309L
#include <time.h>   // for nanosleep
#else
#include <unistd.h> // for usleep
#endif

// cross-platform sleep function
void sleep_ms(int milliseconds){
  #ifdef WIN32
    Sleep(milliseconds);
  #elif _POSIX_C_SOURCE >= 199309L
    struct timespec ts;
    ts.tv_sec = milliseconds / 1000;
    ts.tv_nsec = (milliseconds % 1000) * 1000000;
    nanosleep(&ts, NULL);
  #else
    usleep(milliseconds * 1000);
  #endif
}
