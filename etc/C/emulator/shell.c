#include <stdio.h>
#include <signal.h>
#include <stdlib.h>
#include <string.h>
#include "io.c"
#include "exec.c"

const bool dumpregistersinhexdump = true;
const int maxargvlength = 10;
const int maxcmdlength = 100;

bool doRegdump = false;

char * filename = "examples/out.crtb";
char * initcmd = "";

void intHandler(int dummy){
  keepRunning = 0;
}

void hexdump(int page){
  page = page&0xff;

  printf("  " BOXDRAWING_VERTICAL "00 01 02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f");
  if(dumpregistersinhexdump)printf("  ip:%04x",ip);
  printf("\n" BOXDRAWING_HORIZONTAL BOXDRAWING_HORIZONTAL BOXDRAWING_CROSS);
  for (int i = 0; i < 47; ++i)printf("%s",BOXDRAWING_HORIZONTAL);
  if(dumpregistersinhexdump)printf("  ax:%04x",ax);
  printf("\n");

  int i = page<<8;
  for (int j = 0; j < 16; ++j){
    printf("%02x" BOXDRAWING_VERTICAL,j<<4);
    for (int k = 0; k < 16; ++k){
      printf("%02x ", ram[i]);
      i++;
    }
    if(dumpregistersinhexdump){
      switch(j){
        case 3:
          printf(" fl:%02x",fl);
          break;
        case 1:
          printf("  b:%02x",b);
          break;
        case 2:
          printf("  c:%02x",c);
          break;
        case 0:
          printf(" sp:%04x",sp);
          break;
      }
    }
    printf("\n");
  }

  printf("%*s%02x\n",48,"page:",page);
}

void regdump(){
  if(doRegdump){
    printf("[ip]:%02x ip:%04x ax:%04x sp:%04x fl:%02x\n",ram[ip],ip,ax,sp,fl);
  }
}

struct cmdarglist{
  int count;
  char **vector;
};

struct cmdarglist getcmdargs(char *cmd, const char *delim){
  //might contain a memory leak (on win?)

  struct cmdarglist res;
  char **ap, *argv[maxargvlength], *inputstring=cmd;

  for (ap = argv; (*ap = strsep(&inputstring, delim)) != NULL;)
    if (**ap != '\0')
      if (++ap >= &argv[maxargvlength])
        break;

  res.count = ap-argv;
  res.vector = malloc(sizeof(argv));
  memcpy(res.vector, argv, sizeof(argv));
  return res;
}

void freecmdargs(struct cmdarglist l){
  int argc = l.count;
  char **argv = l.vector;
  //the strings in argv are just part of a bigger string (only on linux?)  
  /*for (int i = 0; i < argc; i++){
    free(argv[i]);
  }*/
  free(argv);
}

bool cmdhandler(char *cmd){
  bool res = false;
  struct cmdarglist temp = getcmdargs(cmd," ");
  char **argv = temp.vector;
  int argc = temp.count;
  if(argc==0){
    //do nothing
  }else if(strcmp(argv[0],"x")==0){
    if(argc==1){
      hexdump((ip>>8)&0xff);
    }else if(argc==2){
      hexdump(atoi(argv[1]));
    }else{
      printf("%s\n", "invalid command");
    }
  }else if(strcmp(argv[0],"r")==0){
    doRegdump = false;
    bool doCount = false;
    if(argc>1&&strcmp(argv[1],"-v")==0){
      if(argc>2)argv[1] = argv[2];
      argc--;
      doRegdump = true;
    }
    if(argc>1&&strcmp(argv[1],"-c")==0){
      if(argc>2)argv[1] = argv[2];
      argc--;
      doCount = true;
    }
    if(argc==1){
      runbin(-1);
    }else if(argc==2){
      runbin(atoi(argv[1]));
    }else{
      printf("%s", "invalid command");
    }
    if(doCount)printf("\n%d instructions executed",numExecutedInstructions);
    printf("\n");
  }else if(strcmp(argv[0],"q")==0){
    res = true;
  }else if(strcmp(argv[0],"cls")==0){
    ClearConsole();
  }else if(strcmp(argv[0],"ret")==0){
    SetCursorPosition(0,0);
  }else if(strcmp(argv[0],"f")==0){
    if(argc>2){
      printf("%s\n", "too many args");
      goto ret;
    }
    if(argc==2){
      filename = argv[1];
    }
    readFile(filename);
    ip = ax = fl = b = c = sp = 0; 
  }else{
    printf("%s:%s\n", "invalid command",cmd);
  }
  ret:
  freecmdargs(temp);
  return res;
}

bool cmdhandler1(char *cmd){
  bool res = false;
  int cmdlen = strlen(cmd);
  if(cmdlen==0)return res;
  if(cmd[cmdlen-1]=='\n'){
    cmd[cmdlen-1] = '\x00';
  }
  int iterations = 1;
  if(cmd[0] == '$'){
    char buf[10];
    int i;
    for (i = 0; i < 10; ++i){
      char t = cmd[i+1];
      buf[i] = t;
      if(t == ' ')break;
      if(t > '9' || t < '0'){
        printf("%s:\"%c\"\n", "invalid char in iteration number",t);
        return false;
      }
    }
    if(buf[i] != ' '){
      printf("%s\n", "too many iterations");
      return false;
    }
    buf[i] = '\x00';
    cmd += i+1;
    iterations = atoi(buf);
    //printf("%s*%s=%d\n", cmd,buf,iterations);
  }
  struct cmdarglist temp = getcmdargs(cmd,";");
  char **argv = temp.vector;
  int argc = temp.count;
  for (int j = 0; j < iterations; ++j){
    if(!keepRunning)return false;
    for (int i = 0; i < argc; ++i){
      char *copy = strdup(argv[i]);
      res = res||cmdhandler(copy);
      free(copy);
    }
  }
  freecmdargs(temp);
  return res;
}

int main(int argc,char *argv[]){
  bool doloop = true;
  if(argc < 2){
    //printf("%s\n", "argc < 2");
    //return -1;
  }else{
    bool hasSeenFilename = false;
    bool hasSeenInitcmd = false;
    for (int i = 1; i < argc; i++){
      if(strcmp(argv[i],"--noloop")==0){
        doloop = false;
      }else if(strcmp(argv[i],"-c")==0&&!hasSeenInitcmd){
        hasSeenInitcmd = true;
        i++;
        if(i==argc){
          printf("%s\n", "invalid argv");
          return -1;
        }
        initcmd = argv[i];
      }else if(!hasSeenFilename){
        hasSeenFilename = true;
        filename = argv[i];
      }else{
        printf("%s\n", "invalid argv");
        return -1;
      }
    }
  }

  readFile(filename);
  ip = ax = fl = b = c = sp = 0;
  if(cmdhandler1(initcmd))return 0;
  if(doloop){
    char buffer[maxcmdlength];
    do{
      printf(">");
      signal(SIGINT, SIG_DFL);
      unHideCursor();
      fgets(buffer, sizeof(buffer), stdin);
      HideCursor();
      signal(SIGINT, intHandler);
      keepRunning = true;
    }while(!cmdhandler1(buffer));
    unHideCursor();
  }

  return 0;
}
