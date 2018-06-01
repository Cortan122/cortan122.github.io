#include <stdio.h>
#include <Windows.h>
#include <time.h>
#include <stdlib.h>

int (*printprt)(char *,int) = printf;

void foo1(){
  int i = 0xaabbccdd;
  if(printprt("0x%08x\n", i)==0){
    i++;
  }
}

void foo2(){
  int i = 0x11223344;
  if(printprt("0x%08x\n", i)==0){
    i++;
  }
}

void mixer(){
  srand(time(NULL));
  int r = rand();

  int diff = (&foo2 - &foo1);
  long unsigned int t;
  long unsigned int * tp = &t;
  if(VirtualProtect(&foo1, diff, PAGE_EXECUTE_READWRITE, tp)){
    memcpy(&foo1, (const void*)&foo2, diff);
    /*for (int i = 0; i < diff; i++){
      r = rand();
      if(r&1)memcpy(&foo1+i, (const void*)&foo2+i, 1);
    }*/
  }else{
    printf("%s\n", "something went horribly wrong (mixer)");
  }
  printf("%s\n", "mixer done");
}

int main(){
  /*char * a = NULL;
  char b = *a;*/
  mixer();
  printf("%s\n", "mixer returned");
  foo1();
  printf("%s\n", "main done");
  return 0;
}
