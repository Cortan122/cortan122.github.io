#include <stdint.h>

// main.cpp
extern const char * filename;
extern char * currantCommand;
extern volatile bool keepRunning;
extern unsigned int numExecutedInstructions;
extern bool doRegdump;
extern bool useColor;
extern bool useScreen;

void hexdump(int page=0);
void runbin(int limit=-1);

// cli.cpp
bool runCommand(char *str);
bool parseArgv(int argc,char *argv[]);
int modulo(int a, int b);

// res.cpp
extern uint8_t* ram;

bool exec();
void registerReset();
bool dumpOneRegister(int num,bool force=false);
uint64_t getInstructionPointer();
uint64_t getRamSize();

// io.c
extern "C"{
  int readFile(const char * name);
  void SetCursorPosition(int x, int y);
  void ClearConsole();
  void HideCursor();
  void unHideCursor();
  bool EnableVTMode();
  uint8_t* SetupSharedMemory(int size);
  void FreeSharedMemory();
  void sleep_ms(int milliseconds);

  #if defined(_WIN32) || defined(WIN32)
    #define BOXDRAWING_VERTICAL "\xb3"
    #define BOXDRAWING_HORIZONTAL "\xc4"
    #define BOXDRAWING_CROSS "\xc5"
  #endif

  #ifdef linux
    #define BOXDRAWING_VERTICAL "│"
    #define BOXDRAWING_HORIZONTAL "─"
    #define BOXDRAWING_CROSS "┼"
  #endif
}
