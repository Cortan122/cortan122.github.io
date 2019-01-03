SOURCES = main.cpp res.cpp cli.cpp
SOURCES_C = io.c winio.c linio.c
OBJECTS = $(SOURCES:.cpp=.o) io.o
FLAGS = -ggdb
CFLAGS = 

SYSTAG := $(shell cat systag.txt)
UNAME := $(shell uname | tee systag.txt)
ifeq ($(UNAME), Linux)
TARGET = vm
FLAGS += -lrt
CFLAGS += -std=gnu++11
SCREEN = screen/out/screen
else
TARGET = vm.exe
SCREEN = screen/out/screen.exe
endif

ifneq ($(UNAME),$(SYSTAG))
PLACEHOLDER := $(shell $(MAKE) cleanobj)
endif

all: $(TARGET) $(SCREEN) $(SOURCES) $(SOURCES_C) main.hpp

$(TARGET): $(OBJECTS)
	g++ -o $@ $(OBJECTS) $(FLAGS)

$(OBJECTS): main.hpp

$(SCREEN): screen/main.cpp screen/mmap.cpp screen/palettes.cpp
	cd screen && $(MAKE) all

.cpp.o:
	g++ -c $< -o $@ $(CFLAGS)

io.o: $(SOURCES_C) main.hpp
	gcc -c $< -o $@

res.cpp: makeEmulator.js Proxy.cpp
	node makeEmulator.js

cleanobj:
	rm -f $(OBJECTS)

clean: cleanobj
	rm -f $(TARGET) systag.txt
	cd screen && $(MAKE) clean

.PHONY: clean all cleanobj
