module.exports = {
  "table":{
    "type":"google",
    "id":"1Ut0JgrpUGeNORy9cD7uFgrVIL1P9T2DV86Cc1pzRxa8",
    "range":"v3!C3:R18",
    "arr": ['mov ip ##','mov ax ##','mov ah #','mov al #','mov fl #','mov b #','mov c #','mov sp ##','mov ip ip','mov ax ip','mov ah ip','mov al ip','mov fl ip','mov b ip','mov c ip','mov sp ip','mov ip [##]','mov ax [##]','mov ah [##]','mov al [##]','mov fl [##]','mov b [##]','mov c [##]','mov sp [##]','mov ip ax','mov ax ax','mov ah ax','mov al ax','mov fl ax','mov b ax','mov c ax','mov sp ax','mov ip [#]','mov ax [#]','mov ah [#]','mov al [#]','mov fl [#]','mov b [#]','mov c [#]','mov sp [#]','mov ip ah','mov ax ah','mov ah ah','mov al ah','mov fl ah','mov b ah','mov c ah','mov sp ah','mov [##] ip','mov [##] ax','mov [##] ah','mov [##] al','mov [##] fl','mov [##] b','mov [##] c','mov [##] sp','mov ip al','mov ax al','mov ah al','mov al al','mov fl al','mov b al','mov c al','mov sp al','mov [#] ip','mov [#] ax','mov [#] ah','mov [#] al','mov [#] fl','mov [#] b','mov [#] c','mov [#] sp','mov ip fl','mov ax fl','mov ah fl','mov al fl','mov fl fl','mov b fl','mov c fl','mov sp fl','jc ##','jnc ##','jz ##','jnz ##','js ##','jns ##','jo ##','jno ##','mov ip b','mov ax b','mov ah b','mov al b','mov fl b','mov b b','mov c b','mov sp b','jc ip+#','jnc ip+#','jz ip+#','jnz ip+#','js ip+#','jns ip+#','jo ip+#','jno ip+#','mov ip c','mov ax c','mov ah c','mov al c','mov fl c','mov b c','mov c c','mov sp c','jmp ip+#','jmp ip+##','call ip+#','call ip+##','','','','','mov ip sp','mov ax sp','mov ah sp','mov al sp','mov fl sp','mov b sp','mov c sp','mov sp sp','add ax ip','add ax #','add ax [##]','add ax [#]','add ax fl','add ax b','add ax c','add ax sp','mov ip [ax]','mov ax [ax]','mov ah [ax]','mov al [ax]','mov fl [ax]','mov b [ax]','mov c [ax]','mov sp [ax]','and ax ip','and ax #','and ax [##]','and ax [#]','and ax fl','and ax b','and ax c','and ax sp','mov [ax] ip','mov [ax] ax','mov [ax] ah','mov [ax] al','mov [ax] fl','mov [ax] b','mov [ax] c','mov [ax] sp','or ax ip','or ax #','or ax [##]','or ax [#]','or ax fl','or ax b','or ax c','or ax sp','mov ip [sp+#]','mov ax [sp+#]','mov ah [sp+#]','mov al [sp+#]','mov fl [sp+#]','mov b [sp+#]','mov c [sp+#]','mov sp [sp+#]','xor ax ip','xor ax #','xor ax [##]','xor ax [#]','xor ax fl','xor ax b','xor ax c','xor ax sp','mov [sp+#] ip','mov [sp+#] ax','mov [sp+#] ah','mov [sp+#] al','mov [sp+#] fl','mov [sp+#] b','mov [sp+#] c','mov [sp+#] sp','bsh ax ip','bsh ax #','bsh ax [##]','bsh ax [#]','bsh ax fl','bsh ax b','bsh ax c','bsh ax sp','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','nop','call ##','call ax','ret','mov al [ax]','push ax','pop ax','test al','test ax','push [#]','pop [#]','enter #','leave','','print al','hlt'],
  },
  "additionalTableEntries":[
    ["mov ip *","jmp *"],
  ],
  "endianness":"big",
  "instructionPointer":"ip",
  "startOfExecution":0,
  "registers":[
    ["ip","pc",2],
    ["ax","ex","eax",2],
    ["sp",2],
    ["ah",1],
    ["al",1],
    ["b","bl","bx",1],
    ["c","cl","cx",1],
    ["fl","flags",1],
  ],
  //note:the parts of a compound register need to be of size 1 and declared after it
  "compoundRegisters":{
    "ax":["ah","al"], 
  },
  "additionalEmulatorCode":[
    `static inline void updateFlags(){
      reg_fl &= 0b10011001;
      if(reg_ax==0)reg_fl |= 0b00100000;
      if(reg_al==0)reg_fl |= 0b00000010;
      if(reg_ax&0x8000)reg_fl |= 0b01000000;
      if(reg_al&0x80)reg_fl |= 0b00000100;
    }`,
    `static inline void updateCarryFlags(uint16_t a16,uint16_t b16){
      uint32_t a32 = a16;
      uint32_t b32 = b16;
      bool as16 = (a32&0x8000)!=0;
      bool bs16 = (b32&0x8000)!=0;
      bool ss16 = ((a32+b32)&0x8000)!=0;
      bool as8 = (a32&0x80)!=0;
      bool bs8 = (b32&0x80)!=0;
      bool ss8 = ((a32+b32)&0x80)!=0;
      reg_fl &= 0b01100110;
      if(a32+b32>UINT16_MAX){
        reg_fl |= 0b00010000;
      }
      if((a32&0xff)+(b32&0xff)>UINT8_MAX){
        reg_fl |= 0b00000001;
      }
      if(as16==bs16&&ss16!=as16){
        reg_fl |= 0b10000000;
      }
      if(as8==bs8&&ss8!=as8){
        reg_fl |= 0b00001000;
      }
    }`,
    `static inline void ins_branch(uint16_t b,uint8_t tl){
      bool neg = tl&1;
      uint8_t bit = tl>>1;
      if(neg^((reg_fl&(1<<bit))!=0))reg_ip = b;
    }`,
    `static inline void ins_push(uint8_t len,uint16_t val){
      reg_sp -= len;
      createProxy(len,reg_sp) = val;
    }`,
    `static inline uint16_t ins_pop(uint8_t len){
      reg_sp += len;
      return createProxy(len,reg_sp-len);
    }`,
    `static inline void ins_call(uint16_t b){
      ins_push(2,reg_ip);
      reg_ip = b;
    }`,
    `static inline void ins_enter(uint16_t b){
      reg_sp -= b;
      ins_push(2,reg_sp+b);
    }`,
    `static inline uint16_t ins_bitShift(uint16_t a,uint8_t b){
      if(b>=0x80){
        return a >> (0x100-b);
      }else{
        return a << b;
      }
    }`,
    `static inline uint16_t ins_add(uint16_t a,uint16_t b){
      updateCarryFlags(a,b);
      return a+b;
    }`,
  ],
  "instructions":[
    ["mov",(a,b)=>`${a} = ${b};`],
    ["jmp",(b)=>`reg_ip = ${b};`],
    ["jc",(b)=>`ins_branch(${b},0);`],
    ["jnc",(b)=>`ins_branch(${b},1);`],
    ["jz",(b)=>`ins_branch(${b},2);`],
    ["jnz",(b)=>`ins_branch(${b},3);`],
    ["js",(b)=>`ins_branch(${b},4);`],
    ["jns",(b)=>`ins_branch(${b},5);`],
    ["jo",(b)=>`ins_branch(${b},6);`],
    ["jno",(b)=>`ins_branch(${b},7);`],
    ["add",(a,b)=>`${a} = ins_add(${a},${b});`],
    ["and",(a,b)=>`${a} &= ${b};`],
    ["or",(a,b)=>`${a} |= ${b};`],
    ["xor",(a,b)=>`${a} ^= ${b};`],
    ["bsh",(a,b)=>`${a} = ins_bitShift(${a},${b});`],
    ["nop",()=>''],
    ["call",(b)=>`ins_call(${b});`],
    ["ret",()=>`reg_ip = ins_pop(2);`],
    ["pop",(a)=>`${a} = ins_pop(2);`],
    ["pop [#]",(a)=>`${a} = ins_pop(1);`],
    ["push",(b)=>`ins_push(2,${b});`],
    ["push [#]",(b)=>`ins_push(1,${b});`],
    ["enter",(b)=>`ins_enter(${b});`],
    ["leave",()=>`reg_sp = ins_pop(2);reg_ip = ins_pop(2);`],
    ["test",(b)=>"updateFlags();"+(b=='reg_ax'?'reg_fl = ((reg_fl>>4)&0x0f)|((reg_fl<<4)&0xf0);':'')],
    ["print",(b)=>`printf(\"%c\",(int)${b});`],
    ["hlt",()=>'return true;'],
  ],
};
