SOURCES = main.cpp mmap.cpp palettes.cpp
SCRIPT_WIN = build.bat

UNAME := $(shell uname)
ifeq ($(UNAME), Linux)
SCRIPT_WIN = 
endif

all: $(SCRIPT_WIN) $(SOURCES)
	$(MAKE) $(UNAME)

windows32:
	taskkill /im screen.exe || cd .
	$(SCRIPT_WIN)
	cp "B:/apache/www/etc/C/sfml/SFML-2.5.0/bin/*" "./out"

Linux:
	mkdir -p "./out"
	g++ main.cpp -o ./out/screen -lsfml-graphics -lsfml-window -lsfml-system -lrt -std=c++0x

clean:
	rm -rf "./out/"

.PHONY: clean all Linux windows32
