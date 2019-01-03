#include <stdio.h>
#include <stdbool.h>
#include <stdint.h>
#include <sys/time.h>
#include <sys/mman.h>
#include <sys/file.h>
#include <unistd.h>

#define BOXDRAWING_VERTICAL "│"
#define BOXDRAWING_HORIZONTAL "─"
#define BOXDRAWING_CROSS "┼"

void SetCursorPosition(int x, int y){
  printf("\e[%d;%df",y+1,x+1);
}

void ClearConsole(){
  system("clear");
}

void HideCursor(){
  printf("\e[?25l");
}

void unHideCursor(){
  printf("\e[?25h"); 
}

bool EnableVTMode(){
  return true;
}

static int SetupSharedMemory_memFd;
static void* SetupSharedMemory_buffer;
static int SetupSharedMemory_size;
static const char const* SetupSharedMemory_memname = "example_memory";

uint8_t* SetupSharedMemory(int size){
  int memFd = shm_open(SetupSharedMemory_memname, O_CREAT | O_RDWR, S_IRWXU);
  if(memFd == -1){
    perror("Can't open file");
    return NULL;
  }

  int res = ftruncate(memFd, size);
  if(res == -1){
    perror("Can't truncate file");
    return NULL;
  }

  void *buffer = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_SHARED, memFd, 0);
  if(buffer == NULL){
    perror("Can't mmap");
    return NULL;
  }

  SetupSharedMemory_memFd = memFd;
  SetupSharedMemory_buffer = buffer;
  SetupSharedMemory_size = size;
  return buffer;
}

void FreeSharedMemory(){
  munmap(SetupSharedMemory_buffer,SetupSharedMemory_size);
  shm_unlink(SetupSharedMemory_memname);
}

int time_ms(){
  struct timeval stop;
  gettimeofday(&stop,NULL);
  return stop.tv_usec/1000+stop.tv_sec*1000;
}

void sleep_ms(int milliseconds){
  usleep(milliseconds * 1000);
}

void system_pause(){
  system("bash -c \"read -n1 -r -p \\\"Press any key to continue . . .\\\" key\" ");
}

void startScreen(){
  system("pgrep -x \"screen\" || \"./screen/out/screen\" &");
}
