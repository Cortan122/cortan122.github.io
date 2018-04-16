/*
  Linux (POSIX) implementation of _kbhit().
  Morgan McGuire, morgan@cs.brown.edu
*/
#include <stdio.h>
#include <sys/ioctl.h>
#include <sys/select.h>
#include <termios.h>
#include <stropts.h>

int _kbhit() {
  static const int STDIN = 0;
  static bool initialized = false;

  if (!initialized) {
    // Use termios to turn off line buffering
    termios term;
    tcgetattr(STDIN, &term);
    term.c_lflag &= ~ICANON;
    tcsetattr(STDIN, TCSANOW, &term);
    setbuf(stdin, NULL);
    initialized = true;
  }

  int bytesWaiting;
  ioctl(STDIN, FIONREAD, &bytesWaiting);
  return bytesWaiting;
}

#include <unistd.h>

const int time = 1000;

int main(int argc, char** argv) {
  while(1){
    while(!_kbhit()){
      usleep(time);
    }
    printf("%c\n",getchar());
    fflush(stdout);
  }
  return 0;
} 