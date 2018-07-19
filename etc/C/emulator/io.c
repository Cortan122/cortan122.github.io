#include <stdint.h>
#include <stdlib.h>
extern uint8_t ram[65536];
#ifdef linux
#include "linio.c"
#endif

#if defined(_WIN32) || defined(WIN32)
#include "winio.c"
#endif
