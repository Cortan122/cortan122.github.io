KERNEL_CCFLAGS=-Wall -c -ffreestanding -fno-pie -g -std=gnu99
KERNEL_OBJECTS=kernelcore.o main.o snake.o config.o
HEADERS=ascii.h ioports.h kernelcore.h memorylayout.h types.h config.h
OBJCOPY=objcopy
CC=gcc -m32
LD=ld -melf_i386
ISOGEN=mkisofs

all: basekernel.iso configurator.js
	node configurator.js

basekernel.img: bootblock kernel
	cat bootblock kernel /dev/zero | head -c 1474560 > basekernel.img

kernel: kernel.elf
	${OBJCOPY} -O binary $< $@

bootblock: bootblock.elf
	${OBJCOPY} -O binary $< $@

kernel.elf: ${KERNEL_OBJECTS}
	${LD} ${KERNEL_LDFLAGS} -Ttext 0x10000 ${KERNEL_OBJECTS} -o $@

bootblock.elf: bootblock.o
	${LD} ${KERNEL_LDFLAGS} -Ttext 0 $< -o $@

%.o: %.c ${HEADERS}
	${CC} ${KERNEL_CCFLAGS} $< -o $@

%.o: %.S
	${CC} ${KERNEL_CCFLAGS} $< -o $@

image: basekernel.img
	rm -rf image
	mkdir image image/boot
	cp basekernel.img image/boot

basekernel.iso: image
	${ISOGEN} -input-charset utf-8 -iso-level 2 -J -R -o $@ -b boot/basekernel.img image

clean:
	rm -rf basekernel.img *.o *.elf kernel bootblock image basekernel.img basekernel.iso

run: all
	qemu-system-i386 -cdrom basekernel.iso -soundhw pcspk

.PHONY: all run clean
