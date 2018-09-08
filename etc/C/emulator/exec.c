#include <stdio.h>
#include <stdint.h>

#if !defined(true)
typedef uint8_t bool;
#define true 1
#define false 0
#endif

uint8_t ram[65536];
//char * filename = "examples/out.crtb";
uint16_t ip = 0;
uint16_t ax;
uint8_t fl;
uint8_t b;
uint8_t c;
uint16_t sp;

const uint8_t reglengths[] = {2,2,1,1,1,1,1,2};
const bool decemalprint = false;

static volatile bool keepRunning = true;

unsigned int numExecutedInstructions = 0;

void regdump();

void setreg(int num,uint16_t val){
  switch(num){
    case 0:
      ip = val;
      break;
    case 1:
      ax = val;
      break;
    case 2:
      ax &= 0x00ff;
      ax |= val<<8;
      break;
    case 3:
      ax &= 0xff00;
      ax |= val;
      break;
    case 4:
      fl = val;
      break;
    case 5:
      b = val;
      break;
    case 6:
      c = val;
      break;
    case 7:
      sp = val;
      break;
  }
}

uint16_t getreg(int num){
  switch(num){
    case 0:
      return ip;
    case 1:
      return ax;
    case 2:
      return (ax&0xff00)>>8;
    case 3:
      return (ax&0x00ff);
    case 4:
      return fl;
    case 5:
      return b;
    case 6:
      return c;
    case 7:
      return sp;
  }
  return printf("%s\n","WTF");
}

void writetoram(uint16_t data,int len,uint16_t addr){
  if(len == 1){
    ram[addr] = data;
  }else if(len == 2){
    ram[addr] = (data&0xff00)>>8;
    addr++;
    ram[addr] = data&0xff;
  }else{
    printf("%s\n", "oh noh");
  }
}

uint16_t readfromram(int len,uint16_t* addr){
  if(addr != &ip)(*addr)--;

  if(len == 1){
    (*addr)++;
    return ram[*addr];
  }else if(len == 2){
    int r = 0;
    (*addr)++;
    r |= ram[*addr]<<8;
    (*addr)++;
    r |= ram[*addr];
    return r;
  }else{
    return printf("%s\n", "oh noh");
  }
}

uint16_t readfromram1(int plen,int len,uint16_t* addr){
  uint16_t t = readfromram(plen,addr);
  return readfromram(len,&t);
}

uint16_t getreg1(int num){
  switch(num){
    case 1:
      return readfromram(1,&ip);
    case 2:
      return readfromram1(2,1,&ip);
    case 3:
      return readfromram1(1,1,&ip);
    default:
      return getreg(num);
  }
}

void updateflags(){
  fl &= 0b10011001;
  if(getreg(1)==0)fl |= 0b00100000;
  if(getreg(3)==0)fl |= 0b00000010;
  if(getreg(1)&0x8000)fl |= 0b01000000;
  if(getreg(3)&0x80)fl |= 0b00000100;
}

void updatecarryflags(uint16_t a16,uint16_t b16){
  uint32_t a32 = a16;
  uint32_t b32 = b16;
  bool as16 = (a32&0x8000)!=0;
  bool bs16 = (b32&0x8000)!=0;
  bool ss16 = ((a32+b32)&0x8000)!=0;
  bool as8 = (a32&0x80)!=0;
  bool bs8 = (b32&0x80)!=0;
  bool ss8 = ((a32+b32)&0x80)!=0;
  fl &= 0b01100110;
  if(a32+b32>UINT16_MAX){
    fl |= 0b00010000;
  }
  if((a32&0xff)+(b32&0xff)>UINT8_MAX){
    fl |= 0b00000001;
  }
  if(as16==bs16&&ss16!=as16){
    fl |= 0b10000000;
  }
  if(as8==bs8&&ss8!=as8){
    fl |= 0b00001000;
  }
}

int parseNegative(uint8_t val){
  if(val>=0x80){
    return val-0x100;
  }else{
    return val;
  }
}

void pushtostack(uint16_t val,int len){
  sp -= len;
  writetoram(val,len,sp);
}

uint16_t popfromstack(int len){
  uint16_t r = readfromram(len,&sp);
  sp += 1;
  return r;
}

bool exec(){
  uint8_t t = ram[ip];
  uint8_t tl = t&0x0f;
  uint8_t th = (t&0xf0)>>4;

  switch(t){
    case 0x70:;
      uint8_t addr_x70 = readfromram(1,&ip);
      ip++;
      ip += parseNegative(addr_x70);
      break;
    case 0x71:;
      uint16_t addr_x71 = readfromram(2,&ip);
      ip++;
      ip += addr_x71;
      break;
    case 0x72:;
      uint8_t addr_x72 = readfromram(1,&ip);
      ip++;
      pushtostack(ip,2);
      ip += parseNegative(addr_x72);
      break;
    case 0x73:;
      uint16_t addr_x73 = readfromram(2,&ip);
      ip++;
      pushtostack(ip,2);
      ip += addr_x73;
      break;
    case 0xf0:
      ip++;
      break;
    case 0xf1:;
      uint16_t addr_xf1 = readfromram(2,&ip);
      ip++;
      pushtostack(ip,2);
      ip = addr_xf1;
      break;
    case 0xf2:
      ip++;
      pushtostack(ip,2);
      ip = ax;
      break;
    case 0xf3:
      ip = popfromstack(2);
      break;
    case 0xf4:
      printf("%s\n","obfuscated");
      setreg(3,readfromram(1,&ax));
      ip++;
      break;
    case 0xf5:
      pushtostack(ax,2);
      ip++;
      break;
    case 0xf6:
      ax = popfromstack(2);
      ip++;
      break;
    case 0xf7:
      updateflags();
      ip++;
      break;
    case 0xf8:
      updateflags();
      fl = ((fl>>4)&0x0f)|((fl<<4)&0xf0);
      ip++;
      break;
    case 0xf9:
      pushtostack(readfromram1(1,1,&ip),1);
      ip++;
      break;
    case 0xfa:
      writetoram(popfromstack(1),1,readfromram(1,&ip));
      ip++;
      break;
    case 0xfb:;
      uint16_t oldsp = sp;
      sp -= readfromram(1,&ip);
      pushtostack(oldsp,2);
      ip++;
      break;
    case 0xfc:
      sp = popfromstack(2);
      ip = popfromstack(2);
      break;
    case 0xfe:
      if(decemalprint){
        printf("%d ",ax);
      }else{
        printf("%c",ax);
      }
      ip++;
      break;
    case 0xff:
      //ip = ax = fl = b = c = sp = 0;
      return true;
    default:
      goto logic;
  }
  return false;
  logic:

  if(th < 3 && tl < 8){
    int val = -1;

    switch(th){
      case 0:
        val = readfromram(reglengths[tl],&ip);
        break;
      case 1:
        val = readfromram1(2,reglengths[tl],&ip);
        break;
      case 2:
        val = readfromram1(1,reglengths[tl],&ip);
        break;
    }

    if(val == -1){
      printf("%s\n", "oh no");
    }
    
    ip++;
    setreg(tl,val);
  }else if(th < 8 && tl > 7){
    ip++;
    setreg(tl&0b0111,getreg(th));
  }else if(th > 7 && th < 0xd && tl < 8){
    int val = getreg1(tl);
    switch(th){
      case 0x8:
        updatecarryflags(ax,val);
        ax += val;
        break;
      case 0x9:
        ax &= val;
        break;
      case 0xa:
        ax |= val;
        break;
      case 0xb:
        ax ^= val;
        break;
      case 0xc:
        if(val>0x80){
          ax >>= (0x100-val);
        }else{
          ax <<= val;
        }
        break;
    }
    ip++;
  }else if(th == 5 && tl < 8){
    bool isneg = tl&1;
    int bitnum = tl>>1;
    uint16_t addr = readfromram(2,&ip);
    if(isneg^((fl&(1<<bitnum))!=0)){
      setreg(0,addr);
    }else{
      ip++;
    }
  }else if(th == 6 && tl < 8){
    bool isneg = tl&1;
    int bitnum = tl>>1;
    uint8_t addr = readfromram(1,&ip);
    ip++;
    if(isneg^((fl&(1<<bitnum))!=0)){
      ip += parseNegative(addr);
    }
  }else if(th == 8 && tl > 7){
    ip++;
    int t = tl&0b0111;
    uint16_t acccopy = ax;
    setreg(t,readfromram(reglengths[t],&acccopy));
  }else if(th == 9 && tl > 7){
    ip++;
    int t = tl&0b0111;
    //setreg(t,readfromram(reglengths[t],&ax));
    writetoram(getreg(t),reglengths[t],ax);
  }else if(th < 5 && tl < 8){
    int addr;
    switch(th){
      case 3:
        addr = readfromram(2,&ip);
        break;
      case 4:
        addr = readfromram(1,&ip);
        break;
      default:
        printf("%s\n", "oh no");
        break;
    }

    ip++;
    writetoram(getreg(tl),reglengths[tl],addr);
  }else if(th == 0xa && tl > 7){
    uint8_t addr = readfromram(1,&ip);
    ip++;
    int t = tl&0b0111;
    uint16_t acccopy = sp+parseNegative(addr);
    setreg(t,readfromram(reglengths[t],&acccopy));
  }else if(th == 0xb && tl > 7){
    uint8_t addr = readfromram(1,&ip);
    ip++;
    int t = tl&0b0111;
    writetoram(getreg(t),reglengths[t],sp+parseNegative(addr));
  }else{
    ip++;
    printf("%s:%02x\n","invalid instruction?",t);
  }
  return false;
}

void runbin(int limit){
  numExecutedInstructions = 0;
  while(true){
    if(!keepRunning)return;
    if(limit == 0)return;
    if(limit > 0)limit--;
    regdump();
    numExecutedInstructions++;
    if(exec())return;
  }
}
