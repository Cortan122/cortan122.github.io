#include <stdio.h>
#include "io.c"
#include "exec.c"

void regdump(){}

char * filename = "examples/out.crtb";

int main(int argc,char *argv[]){
  if(argc==2){
    filename = argv[1];
  }else if(argc>2){
    printf("%s\n", "usage: ./run [filename]");
    return 1;
  }
  readFile(filename);
  runbin(-1);
  printf("\n");
  return 0;
}
