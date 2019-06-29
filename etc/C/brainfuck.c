#include <stdio.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>

#define uint unsigned int

const uint chunkSize = 1024;

uint8_t intsize = 8;
uint64_t memsize = 30000;
uint8_t* mem;
int fd = 0;

void eval(char* string, uint length){
  for(int i = 0; i < length; i++){
    switch(string[i]){
      case '+':
      (*mem)++;break;
      case '-':
      (*mem)--;break;
      case '>':
      mem++;break;
      case '<':
      mem--;break;
      case '.':
      putchar(*mem);break;
      case ',':
      read(0,mem,1);break;
      case '[':
      if(i==0 && *mem == 0)return;
      else if(i!=0){
        uint stackLevel = 1;
        int i0 = i;
        while(stackLevel){
          i++;
          char ch = string[i];
          if(ch == '[')stackLevel++;
          if(ch == ']')stackLevel--;
        }
        eval(string+i0, i-i0+1);
      }
      break;
      case ']':
      i = -1;
      break;
    }
  }
}

void run(){
  void* originalMemoryPointer = mem = malloc(memsize);
  memset(mem, 0, memsize);
  uint stackLevel = 0;
  char* string = malloc(chunkSize);
  uint stringLength = chunkSize;
  uint stringIndex = 0;
  uint lastEvalIndex = 0;

  for(char ch = ' '; read(fd,&ch,1) == 1;){
    switch(ch){
      case '[':
      stackLevel++;
      goto case_plus;
      case ']':
      if(stackLevel==0){
        fprintf(stderr,"Unbalanced brackets\n");
        exit(1);
      }
      stackLevel--;
      case_plus:
      case '+':
      case '-':
      case '>':
      case '<':
      case '.':
      case ',':
      string[stringIndex] = ch;
      stringIndex++;
      if(stringIndex >= stringLength){
        stringLength += chunkSize;
        string = realloc(string,stringLength);
      }
      if(stackLevel==0){
        eval(string+lastEvalIndex, stringIndex-lastEvalIndex);
        lastEvalIndex = stringIndex;
      }
      break;
    }
  }
  if(stackLevel){
    fprintf(stderr,"Unbalanced brackets\n");
    exit(1);
  }
  free(originalMemoryPointer);
}

int main(int argc,char *argv[]){
  bool minusMinus = false;
  char* a = NULL;
  char* b = NULL;
  for(int i = 1; i < argc; i++){
    if(minusMinus){
      goto notAnOption;
    }else if(strcmp(argv[i], "--") == 0){
      minusMinus = true;
    }else if(strcmp(argv[i], "--help") == 0){
      fprintf(stdout, "%s\n",
        "usage: ./brainfuck [options] [input file] [output file]\n\n"
        "  --intsize=<n> \t Size of each cell in bits (8|16|32|64)\n"
        "  --memsize=<n> \t Size of memory in bytes\n"
        "  --help \t Print this help\n"
      );
      exit(0);
    }else if(strncmp(argv[i], "--intsize=", 10) == 0){
      sscanf(argv[i]+10, "%d", &intsize);
    }else if(strncmp(argv[i], "--memsize=", 10) == 0){
      sscanf(argv[i]+10, "%llu", &memsize);
    }else{
      notAnOption:
      if(a==NULL)a = argv[i];
      else if(b==NULL)b = argv[i];
      else{
        fprintf(stderr,"Unexpected argument: '%s'\n",argv[i]);
        exit(1);
      }
    }
  }
  if(a != NULL && strcmp(a, "-") != 0)fd = open(a, O_RDONLY);
  if(b != NULL && strcmp(b, "-") != 0)freopen(b, "w", stdout);

  run();
}
