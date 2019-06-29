#include "config.h"

static char configString[] = "BEGIN_CONFIG_STRING5?0000000000000000000000";

void loadConfig(){
  int i = 19;
  sizeInBits = configString[i++]-'0';
  timerMax = configString[i++]-'0';
  drawDebugLines = configString[i++]-'0';
  usePixelMultiplier = configString[i++]-'0';
  centerScreen = configString[i++]-'0';
  loopAround = configString[i++]-'0';
  permadeath = configString[i++]-'0';
}
