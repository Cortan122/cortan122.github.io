#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <ctype.h>
#include <stdexcept>
#include "main.hpp"

static int min(int a,int b){
  return a>b?b:a;
}

static int max(int a,int b){
  return a<b?b:a;
}

static int my_strcmp(const char *a, const char *b,const void *last_a=NULL,const void *last_b=NULL){
  while(*a == *b && *a != '\0' && *b != '\0' && a != last_a && a != last_b){
    a++, b++;
  }
  char ac = *a,bc = *b;
  if(a==last_a)ac = '\0';
  if(b==last_b)bc = '\0';
  // printf("cmp: %c-%c\n",ac,bc);
  return (ac > bc) - (ac < bc);
}

int modulo(int a, int b){
  if(b < 0)return modulo(-a, -b);
  const int result = a % b;
  return result >= 0 ? result : result + b;
}

struct string{
  const char *ptr;
  size_t len;
  string(){}
  string(const char* p): ptr{p} {
    len = strlen(ptr);
  }
  string(const char* p,size_t l): ptr{p},len{l} {}
  // inline int operator-(string& s){
  inline int cmp(const string& s) const{
    return my_strcmp(ptr,s.ptr,ptr+len,s.ptr+s.len);
  }
  inline bool operator==(string& s) const{ return cmp(s) == 0; }
  inline bool operator!=(string& s) const{ return cmp(s) != 0; }
  inline bool operator< (string& s) const{ return cmp(s) <  0; }
  inline bool operator> (string& s) const{ return cmp(s) >  0; }
  inline bool operator<=(string& s) const{ return cmp(s) <= 0; }
  inline bool operator>=(string& s) const{ return cmp(s) >= 0; }
  inline bool operator==(const char* s) const{ return cmp(s) == 0; }
  inline bool operator!=(const char* s) const{ return cmp(s) != 0; }
  inline bool operator< (const char* s) const{ return cmp(s) <  0; }
  inline bool operator> (const char* s) const{ return cmp(s) >  0; }
  inline bool operator<=(const char* s) const{ return cmp(s) <= 0; }
  inline bool operator>=(const char* s) const{ return cmp(s) >= 0; }
  inline const char operator[](int i) const{
    if(i<0)i = modulo(i,len);
    if(i>len)throw std::runtime_error("string index out of bounds");
    return ptr[i];
  }
  inline operator const char *() const{
    return ptr;
  }
  string& operator+=(int i){
    if(i>len)i = len;
    ptr += i;
    len -= i;
    return *this;
  }
  inline string& operator++(){
    return (*this) += 1;
  }
  string operator++(int){
    string tmp(*this); // copy
    operator++(); // pre-increment
    return tmp;   // return old value
  }
  inline string slice(int start=0) const{
    return slice(start,len);
  }
  string slice(int start,int end) const{
    if(start<0)start = modulo(start,len);
    if(end<0)end = modulo(end,len);
    return string(ptr+start, end-start);
  }
  inline const char* last() const{
    return ptr+len-1;
  }
  inline void print(const char* str="$") const{
    for(; *str != '\0'; str++){
      if(*str=='$')
        for(int i = 0; i < len; i++)putchar(ptr[i]);
      else
        putchar(*str);
    }
  }
};

static void printArgvHelp(int exitcode){
  fprintf(exitcode?stderr:stdout, "%s\n",
    "usage: ./vm [options] [file]\n\n"
    "  -c command \t Execute a command\n"
    "  --batch \t Exit immediately after executing command\n"
    "  --visual \t Open image window\n"
    "  --color \t Use \\x1b[ to add color\n"
    "  --help \t Print this help\n"
  );
  exit(exitcode);
}

bool parseArgv(int argc,char *argv[]){
  bool ret = false;
  if(argc > 1){
    bool hasSeenFilename = false;
    bool hasSeenInitcmd = false;
    for (int i = 1; i < argc; i++){
      string arg = argv[i];
      if(arg == "--batch"){
        ret = false;
      }else if(arg == "--help"){
        printArgvHelp(0);
      }else if(arg == "--color"){
        useColor = true;
      }else if(arg == "--visual" || arg == "--screen"){
        useScreen = true;
      }else if(arg == "-c" && !hasSeenInitcmd){
        hasSeenInitcmd = true;
        i++;
        if(i==argc){
          printArgvHelp(64);
        }
        currantCommand = argv[i];
      }else if(!hasSeenFilename){
        hasSeenFilename = true;
        filename = argv[i];
      }else{
        printArgvHelp(64);
      }
    }
  }
  return ret;
}

static bool printError(const char *location,const char *message=NULL){
  if(message)fprintf(stderr,"error: %s\n",message);
  fprintf(stderr,"%s\n",currantCommand);
  int pos = (int)(location-currantCommand);
  for(; pos > 0; pos--)fprintf(stderr," ");
  fprintf(stderr,"^\n");
  return keepRunning = false;
}

static int bracketLookup(const string& str){
  size_t level = 0;
  for(size_t i = 0; i < str.len; i++){
    char c = str[i];
    if(c=='(')level++;
    if(c==')')level--;
    if(level==0)return i;
  }
  return -1;
}

static int indexOf(const string& str,const char match){
  for(size_t i = 0; i < str.len; i++){
    if(str[i]==match)return i;
  }
  return -1;
}

static string nextArg(string& str){
  int index = indexOf(str,' ');
  string ret = index==-1?str.slice():str.slice(0,index);
  str += index==-1?str.len:index+1;
  return ret;
}

static int parseInt(const string& str){
  //todo:$
  int ret;
  sscanf(str,"%i",&ret);
  return ret;
}

static bool runOneCommand(string str){
  if(str[0]==' ')str++;
  string arg1 = nextArg(str);
  if(arg1 == "cls" || arg1 == "clear"){
    string arg2 = nextArg(str);
    if(arg2 == "-r"){
      SetCursorPosition(0,0);
    }else if(arg2 == ""){
      ClearConsole();
    }else{
      arg2.print("error: unexpected argument '$'\n");
      return printError(arg2);
    }
  }else if(arg1 == "pause"){
    system_pause();
  }else if(arg1 == "sleep"){
    string arg2 = nextArg(str);
    if(arg2 == ""){
      return printError(arg2,"argument expected");
    }else{
      sleep_ms(parseInt(arg2));
    }
  }else if(arg1 == "q" || arg1 == "quit"){
    return true;
  }else if(arg1 == "x" || arg1 == "hexdump"){
    string arg2 = nextArg(str);
    if(arg2 == ""){
      hexdump();
    }else{
      hexdump(parseInt(arg2));
    }
  }else if(arg1 == "f" || arg1 == "file"){
    string arg2 = nextArg(str);
    if(arg2 != ""){
      filename = arg2;
    }
    memset(ram,0,getRamSize());//todo:fixme
    readFile(filename);
    registerReset();
  }else if(arg1 == "r" || arg1 == "run"){
    doRegdump = false;
    bool doCount = false;
    bool doTime = false;
    bool doNewline = true;
    bool doQuit = false;
    int iterations = -1;
    for(string arg = nextArg(str); arg != ""; arg = nextArg(str)){
      if(arg[0] == '-'){
        for(size_t i = 1; i < arg.len; i++){
          if(arg[i]=='v'){
            doRegdump = true;
          }else if(arg[i]=='c'){
            doCount = true;
          }else if(arg[i]=='q'){
            doQuit = true;
          }else if(arg[i]=='n'){
            doNewline = false;
          }else if(arg[i]=='t'){
            doTime = true;
          }else{
            printf("error: unexpected option '%c'\n",arg[i]);
            return printError(arg.ptr+i);
          }
        }
      }else if(iterations==-1){
        iterations = parseInt(arg);
      }else{
        arg.print("error: unexpected argument '$'\n");
        return printError(arg);
      }
    }
    int time = time_ms();
    bool res = runbin(iterations);
    time -= time_ms();
    if(doCount)printf("\n%d instructions executed",numExecutedInstructions);
    if(doTime)printf(
      "\nrun took %d ms (%.4f instructions per millisecond)",
      -time,
      -(numExecutedInstructions/(float)time)
    );
    if(doNewline)printf("\n");
    if(doQuit&&res)return true;
  }else{
    arg1.print("error: unknown command '$'\n");
    printError(arg1);
    return false;
  }
  string lastarg = nextArg(str);
  if(lastarg == "")return false;
  lastarg.print("error: unexpected argument '$'\n");
  printError(lastarg);
  return false;
}

static bool runCommand(string str){
  int pointerIncrement;
  char first = str[0];
  if(first >= '0' && first <= '9'){
    int numIterations = 0;
    sscanf(str,"%i %n",&numIterations,&pointerIncrement);
    str += pointerIncrement;
    first = str[0];
    if(first != '(')return printError(str,"'(' expected");
    int tlen = bracketLookup(str);
    if(tlen==-1)return printError(str.ptr+str.len,"')' expected");
    str++;
    for(size_t i = 0; i < numIterations; i++){
      if(runCommand( str.slice(0,tlen-1) )){
        //return true; //this results in 'q' being interpreted as 'exit(0)' 
        break; //this results in 'q' being interpreted as 'break'
      }
      if(!keepRunning)return false;
    }
    str += tlen;
    if(str[0]==' ')str++;
    if(str.len==0)return false;
    first = str[0];
    if(first != ';')return printError(str,"';' expected");
    str++;
    if(runCommand(str))return true;
    return false;
  }
  int index = indexOf(str,';');
  if(index==-1)return runOneCommand(str);
  if(runCommand( str.slice(0,index) ))return true;
  if(!keepRunning)return false;
  if(runCommand( str.slice(index+1) ))return true;
  return false;
}

static bool runCommand(const char *str,size_t len){
  return runCommand(string(str,len));
}

bool runCommand(char *str){
  while(isspace(*str))str++;
  int len = strlen(str);
  if(len==0)return false;
  size_t ires = 0;
  for(size_t i = 0; i < len; i++){
    str[ires] = tolower(str[i]);
    if(isspace(str[i])){
      if(isspace(str[ires-1])){
        ires--;
      }else{
        str[ires] = ' ';
      }
    }
    ires++;
  }
  len = ires;
  if(len!=0 && isspace(str[len-1]))len--;
  return runCommand(str,len);
}

// cls;f;r -t
