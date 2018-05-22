#include <stdio.h>
#include <string.h>
#include <stdint.h>
#include <math.h>

typedef uint8_t bool;
typedef void (*func_t)(void);
#define true 1
#define false 0
{1}

{2}

uint8_t data[1000];
#if doLiveStrcmp==0
char base64[1000];
#endif
bool strcmp_static = true;
char* arg1;

void caller(int i);

void init(){
  {0}
}

char* base64rom = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

char tobase64_static;
uint8_t flipbits_static = 0;
void tobase64(){
  if(flipbits_static>64){
    printf("%s\n","something went horribly wrong");
  }
  tobase64_static = base64rom[flipbits_static];
}

void flipbits(){
  uint8_t t = flipbits_static;
  uint8_t r = 0;
  r|=(t&0b000001)<<5;
  r|=(t&0b100000)>>5;
  r|=(t&0b000010)<<3;
  r|=(t&0b010000)>>3;
  r|=(t&0b000100)<<1;
  r|=(t&0b001000)>>1;
  r|=t&0b11000000;
  flipbits_static = r;
}

void hopbits(){
  uint8_t t = flipbits_static;
  uint8_t r = 0;
  r|=(t&0b000111)<<3;
  r|=(t&0b111000)>>3;
  r|=t&0b11000000;
  flipbits_static = r;
}

void decode(){
  int i = 0;
  do{
    uint8_t t = data[i];
    #if doSbox==1
    t = sbox[t];
    #endif
    #if doFlipsInit==1
    if(t&0b01000000){
      flipbits_static = t;
      flipbits();//@
      t = flipbits_static;
    }
    #endif
    #if doHopsInit==1
    if(t&0b10000000){
      flipbits_static = t;
      hopbits();//@
      t = flipbits_static;
    }
    #endif
    flipbits_static = t&0b00111111;
    tobase64();//@
    char b64 = tobase64_static;
    #if doLiveStrcmp==0
    base64[i] = b64;
    #else
    strcmp_static = strcmp_static&&(b64==arg1[i]);
    #endif
    i++;
  }while(data[i] != 0x00);
  #if doLiveStrcmp==0
  base64[i] = 0x00;
  #endif
}

void printHappyMessage(){
  printf("%s\n","yay");
  printf("%s\n",arg1);
  printf("%s\n","you can get the real password if you decode this (this is base64)");
}

void printSadMessage(){
  //printf("%s\n",base64);
  printf("%s\n","better luck next time");
}

void printAngryMessage(){
  printf("%s\n","you need to provide a guess as argv (google it)");
}

void checkPasswdLength(){
  strcmp_static = strcmp_static&&(strlen(arg1)==strlen(data));
}

void checkPasswd(){
  #if doHidePassword==0
  strcmp_static = strcmp(arg1,password_base64)==0;
  #else
  init();//@
  decode();//@
  #if doLiveStrcmp==0
  strcmp_static = strcmp(arg1,base64)==0;
  #else
  checkPasswdLength();//@
  #endif
  #endif
}

int main(int argc,char* argv[]){
  if(argc<2){
    printAngryMessage();//@
    return -1;
  }
  arg1 = argv[1];
  checkPasswd();//@
  if(strcmp_static){
    printHappyMessage();//@
    return 0;
  }else{
    printSadMessage();//@
    return 1;
  }
}

int mod(int a, int b){
  return a - b * (int)floor(a/(float)b);
}

void * mazeRom[callerRomLength];
bool mazeRom_isDef = false;
volatile bool allwaysFalse = false; 
int maze(int i){
  if(!mazeRom_isDef){
    mazeRom_isDef = true;
    {4}
  }
  int j = mod(2*i,callerRomLength);
  maze_start:
  i = mod(i-1,callerRomLength);
  j = mod(j-1,callerRomLength);
  if(allwaysFalse==0)goto *mazeRom[j];
  {5}
}

func_t callerRom[callerRomLength];
bool callerRom_isDef = false;
void caller(int i){
  if(!callerRom_isDef){
    callerRom_isDef = true;
    {3}
  }
  #if doMaze==1
  i = maze(i);
  #endif
  callerRom[i]();
  return;
}
