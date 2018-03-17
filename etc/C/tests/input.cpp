#include <stdio.h>
#include <stdlib.h>
#include <sys/time.h>
#include <sys/types.h>
#include <unistd.h>
#include <fcntl.h>
#include <termios.h>

int inputHandler(char * c){
  printf(":%d,%d,%d:\n",c[0],c[1],c[2]);
  if(c[0] == 'q')return 1;
  return 0;
}

void initInputHandler(){
  struct termios oldSettings, newSettings;

  tcgetattr( fileno( stdin ), &oldSettings );
  newSettings = oldSettings;
  newSettings.c_lflag &= (~ICANON & ~ECHO);
  tcsetattr( fileno( stdin ), TCSANOW, &newSettings );
  char * c = (char *)malloc(10);    

  while ( 1 ){
    fd_set set;
    struct timeval tv;

    tv.tv_sec = 10;
    tv.tv_usec = 0;

    FD_ZERO( &set );
    FD_SET( fileno( stdin ), &set );

    int res = select( fileno( stdin )+1, &set, NULL, NULL, &tv );

    if( res > 0 ){
      //printf( "Input available\n" );
      read( fileno( stdin ), c, 3 );
      if(inputHandler(c))break;
      //printf(":%d,%d,%d:\n",c[0],c[1],c[2]);
      //printf(":%c:\n",c);
    }else if( res < 0 ){
      perror( "select error" );
      break;
    }
  }

  tcsetattr( fileno( stdin ), TCSANOW, &oldSettings );
}

int main(){
  initInputHandler();
  return 0;
}