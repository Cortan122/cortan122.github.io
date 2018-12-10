SOURCES=main.cpp res.cpp cli.cpp
SOURCES_C=io.c winio.c linio.c
OBJECTS=$(SOURCES:.cpp=.o) io.o

all: vm.exe $(SOURCES) $(SOURCES_C) main.hpp

vm.exe: $(OBJECTS)
	g++ -o $@ $(OBJECTS) -ggdb

$(OBJECTS): main.hpp

.cpp.o:
	g++ -c $< -o $@

io.o: $(SOURCES_C) main.hpp
	gcc -c $< -o $@

res.cpp: makeEmulator.js Proxy.cpp
	node makeEmulator.js

clean:
	rm $(OBJECTS) vm.exe

.PHONY: clean all
