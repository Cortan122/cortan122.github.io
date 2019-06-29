/*
Copyright (C) 2015-2019 The University of Notre Dame
This software is distributed under the GNU General Public License.
See the file LICENSE for details.
*/

#include "config.h"
#include "ioports.h"
#include "ascii.h"

extern void userspace_main();
extern void userspace_timer();
extern void userspace_keyboard(char code);

#define KEYMAP_SHIFT 1
#define KEYMAP_ALT   2
#define KEYMAP_CTRL  3
#define KEYMAP_CAPSLOCK 4
#define KEYMAP_NUMLOCK 5
#define KEYMAP_ALPHA 6
#define KEYMAP_NUMPAD 8

/* sent before certain keys such as up, down, left, or right. */
#define KEYCODE_EXTRA (uint8_t)0xE0
#define KEYCODE_UP    (uint8_t)0x48
#define KEYCODE_DOWN  (uint8_t)0x42
#define KEYCODE_LEFT  (uint8_t)0x4B
#define KEYCODE_RIGHT (uint8_t)0x4D
#define KEYCODE_DOWN2 (uint8_t)0x50

struct keymap {
  char normal;
  char shifted;
  char ctrled;
  char special;
};

static struct keymap keymap[] = {
  #include "keymap.us.pc.c"
};

#define HEX(n) ((n)>9?(n)+'W':(n)+'0')

#define PIC_ICW1 0x11
#define PIC_ICW4_MASTER 0x01
#define PIC_ICW4_SLAVE  0x05
#define PIC_ACK_SPECIFIC 0x60

static uint8_t pic_control[2] = { 0x20, 0xa0 };
static uint8_t pic_data[2] = { 0x21, 0xa1 };

static void pic_enable(uint8_t irq){
  uint8_t mask;
  if(irq < 8){
    mask = inb(pic_data[0]);
    mask = mask & ~(1 << irq);
    outb(mask, pic_data[0]);
  }else{
    irq -= 8;
    mask = inb(pic_data[1]);
    mask = mask & ~(1 << irq);
    outb(mask, pic_data[1]);
    pic_enable(2);
  }
}

static void pic_disable(uint8_t irq){
  uint8_t mask;
  if(irq < 8){
    mask = inb(pic_data[0]);
    mask = mask | (1 << irq);
    outb(mask, pic_data[0]);
  }else{
    irq -= 8;
    mask = inb(pic_data[1]);
    mask = mask | (1 << irq);
    outb(mask, pic_data[1]);
  }
}

static void pic_acknowledge(uint8_t irq){
  if(irq >= 8){
    outb(PIC_ACK_SPECIFIC + (irq - 8), pic_control[1]);
    outb(PIC_ACK_SPECIFIC + (2), pic_control[0]);
  }else{
    outb(PIC_ACK_SPECIFIC + irq, pic_control[0]);
  }
}

static void pic_init(int pic0base, int pic1base){
  outb(PIC_ICW1, pic_control[0]);
  outb(pic0base, pic_data[0]);
  outb(1 << 2, pic_data[0]);
  outb(PIC_ICW4_MASTER, pic_data[0]);
  outb(~(1 << 2), pic_data[0]);

  outb(PIC_ICW1, pic_control[1]);
  outb(pic1base, pic_data[1]);
  outb(2, pic_data[1]);
  outb(PIC_ICW4_SLAVE, pic_data[1]);
  outb(~0, pic_data[1]);

  for(int i = 32; i < 48; i++){
    pic_disable(i-32);
    pic_acknowledge(i-32);
  }
}

static int shift_mode = 0;
static int alt_mode = 0;
static int ctrl_mode = 0;
static int capslock_mode = 0;
static int numlock_mode = 0;

static uint8_t keyboard_map(uint8_t code){
  int direction;

  if(code & 0x80){
    direction = 0;
    code = code & 0x7f;
  }else{
    direction = 1;
  }

  struct keymap *k = &keymap[code];

  if(k->special == KEYMAP_SHIFT){
    shift_mode = direction;
  }else if(k->special == KEYMAP_ALT){
    alt_mode = direction;
  }else if(k->special == KEYMAP_CTRL){
    ctrl_mode = direction;
  }else if(k->special == KEYMAP_CAPSLOCK){
    if(direction == 0) capslock_mode = !capslock_mode;
  }else if(k->special == KEYMAP_NUMLOCK){
    if(direction == 0) numlock_mode = !numlock_mode;
  }else if(direction){
    if(ctrl_mode && alt_mode && k->normal == ASCII_DEL){
      reboot();
    }else if(capslock_mode){
      if(k->special==KEYMAP_ALPHA && !shift_mode){
        return k->shifted;
      }else{
        return k->normal;
      }
    }else if(numlock_mode){
      if(k->special==KEYMAP_NUMPAD && !shift_mode){
        return k->shifted;
      }else{
        return k->normal;
      }
    }else if(shift_mode){
      return k->shifted;
    }else if(ctrl_mode){
      return k->ctrled;
    }else{
      return k->normal;
    }
  }

  return KEY_INVALID;
}

static int expect_extra = 0;

static void keyboard_interrupt(uint8_t code){
  uint8_t c = KEY_INVALID;

  if(code == KEYCODE_EXTRA){
    expect_extra = 1;
    return;
  }else if(expect_extra){
    expect_extra = 0;
    switch(code){
      case KEYCODE_UP:
        c = KEY_UP;
        break;
      case KEYCODE_DOWN:
      case KEYCODE_DOWN2:
        c = KEY_DOWN;
        break;
      case KEYCODE_LEFT:
        c = KEY_LEFT;
        break;
      case KEYCODE_RIGHT:
        c = KEY_RIGHT;
        break;
      default:
        c = KEY_INVALID;
        break;
    }
  }else{
    c = keyboard_map(code);
  }

  if(c == KEY_INVALID)return;

  outb(HEX((c&0xf0)>>4),0x03F8);
  outb(HEX((c&0x0f)>>0),0x03F8);
  outb(' ',0x03F8);
  outb(c,0x03F8);
  outb('\r',0x03F8);
  outb('\n',0x03F8);
  userspace_keyboard(c);
}

static void start_playing_sound(uint frequency){
  //Set the PIT to the desired frequency
 	uint Div = 1193180 / frequency;
 	outb(0xb6, 0x43);
 	outb(Div, 0x42);
 	outb(Div>>8, 0x42);

  //And play the sound using the PC speaker
 	uint8_t tmp = inb(0x61);
  if(tmp != (tmp|3))outb(tmp|3, 0x61);
}

static void stop_playing_sound(){
  outb(inb(0x61)&0xfc, 0x61);
}

static uint reamaining_duration = 0;

void play_sound(uint frequency, uint duration){
  reamaining_duration = duration;
  start_playing_sound(frequency);
}

void plot_pixel(int x, int y, uint8_t r, uint8_t g, uint8_t b){
  if(x >= video_xres || y >= video_yres)return;
  uint8_t *v = video_buffer + (video_xres * y + x) * 3;
  v[2] = r;
  v[1] = g;
  v[0] = b;
}

static uint kernel_timer = 0;

void interrupt_handler(int i, int code){
  if(i==33){
    code = inb(0x60);
    keyboard_interrupt(code);
    goto ret;
  }
  if(i==32){
    if(reamaining_duration==0)stop_playing_sound();
    else reamaining_duration--;
    kernel_timer++;
    if(kernel_timer>=50){
      kernel_timer -= 50;
      userspace_timer();
    }
    goto ret;
  }
  outb(HEX((i&0xf0)>>4),0x03F8);
  outb(HEX((i&0x0f)>>0),0x03F8);
  outb(' ',0x03F8);
  outb(HEX((code&0xf0)>>4),0x03F8);
  outb(HEX((code&0x0f)>>0),0x03F8);
  outb('\r',0x03F8);
  outb('\n',0x03F8);
  ret:
  if(i>=32)pic_acknowledge(i-32);
}

void syscall_handler(){};

bool drawDebugLines;

int kernel_main(){
  loadConfig();

  for(int i = 0; i < MAX(video_xres,video_yres) && drawDebugLines; i++){
    plot_pixel(i,i,255,0,0);
    plot_pixel(0,i,255,0,0);
    plot_pixel(i,0,255,0,0);
    plot_pixel(video_xres-1,i,255,0,0);
    plot_pixel(i,video_yres-1,255,0,0);
    if(video_xres > video_yres){
      plot_pixel(video_yres-1,i,255,128,0);
    }else{
      plot_pixel(i,video_xres-1,255,128,0);
    }
  }

  //Set the IRQ0 to the desired frequency (1000 Hz)
  const uint16_t IRQ0_frequency = 1193;
 	outb(IRQ0_frequency&0xff, 0x40);
 	outb(IRQ0_frequency>>8, 0x40);

  // for(int i = 100; i < 1000; i++){
  //   start_playing_sound(i);
  //   for(int j = 0; j < 10000; j++)iowait();
  // }
  // stop_playing_sound();

  userspace_main();

  // play_sound(200, 49);

  pic_init(32,40);
  asm("sti");
  pic_enable(32-32);
  pic_enable(33-32);
  while(1)asm("hlt");

  return 0;
}
