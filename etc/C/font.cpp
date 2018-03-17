#include <iostream>
#include <windows.h>
#include <cstdio>
#include <cstdint>
#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>
#include <array>
#include <stdexcept>
#include <stdio.h>
#include <sstream>
#include <vector>
using namespace std;

string exec(char* cmd) {
  FILE* pipe = _popen(cmd, "r");
  if (!pipe) return "ERROR";
  char buffer[128];
  std::string result = "";
  while(!feof(pipe)) {
    if(fgets(buffer, 128, pipe) != NULL)
      result += buffer;
  }
  _pclose(pipe);
  return result;
}

void gotoxy(int x, int y){
  COORD coord;
  coord.X = x;
  coord.Y = y;
  SetConsoleCursorPosition(GetStdHandle(STD_OUTPUT_HANDLE), coord);
}

const string sourceFont = "3E 51 49 45 3E 00 42 7F 40 00 42 61 51 49 46 21 41 45 4B 31 18 14 12 7F 10 27 45 45 45 39 3C 4A 49 49 30 01 71 09 05 03 36 49 49 49 36 06 49 49 29 1E 7E 11 11 11 7E 7F 49 49 49 36 3E 41 41 41 22 7F 41 41 22 1C 7F 49 49 49 41 7F 09 09 01 01 3E 41 41 51 32 7F 08 08 08 7F 00 41 7F 41 00 20 40 41 3F 01 7F 08 14 22 41 7F 40 40 40 40 7F 02 04 02 7F 7F 04 08 10 7F 3E 41 41 41 3E 7F 09 09 09 06 3E 41 51 21 5E 7F 09 19 29 46 46 49 49 49 31 01 01 7F 01 01 3F 40 40 40 3F 1F 20 40 20 1F 7F 20 18 20 7F 63 14 08 14 63 03 04 78 04 03 61 51 49 45 43 00 00 7F 41 41 02 04 08 10 20 41 41 7F 00 00 04 02 01 02 04 40 40 40 40 40 00 00 5F 00 00 00 07 00 07 00 14 7F 14 7F 14 24 2A 7F 2A 12 23 13 08 64 62 36 49 55 22 50 00 05 03 00 00 00 1C 22 41 00 00 41 22 1C 00 08 2A 1C 2A 08 08 08 3E 08 08 00 50 30 00 00 08 08 08 08 08 00 60 60 00 00 20 10 08 04 02 00 36 36 00 00 00 56 36 00 00 00 08 14 22 41 14 14 14 14 14 41 22 14 08 00 02 01 51 09 06 32 49 79 41 3E 20 54 54 54 78 7F 48 44 44 38 38 44 44 44 20 38 44 44 48 7F 38 54 54 54 18 08 7E 09 01 02 08 14 54 54 3C 7F 08 04 04 78 00 44 7D 40 00 20 40 44 3D 00 00 7F 10 28 44 00 41 7F 40 00 7C 04 18 04 78 7C 08 04 04 78 38 44 44 44 38 7C 14 14 14 08 08 14 14 18 7C 7C 08 04 04 08 48 54 54 54 20 04 3F 44 40 20 3C 40 40 20 7C 1C 20 40 20 1C 3C 40 30 40 3C 44 28 10 28 44 0C 50 50 50 3C 44 64 54 4C 44 00 01 02 04 00 00 08 36 41 00 00 00 7F 00 00 00 41 36 08 00 08 08 2A 1C 08 08 1C 2A 08 08 00 00 00 00 00";

vector<string> split(string str){
  vector<string> array;
  stringstream ss(str);
  string temp;
  while (ss >> temp)
    array.push_back(temp);
  return array;
}

vector< array<uint8_t, 5> > parseFont(vector<string> arr){
  vector< array<uint8_t, 5> > r;
  int i = 0;
  while(i<arr.size()){
    array<uint8_t, 5> t;// = new int[5];
    for (int j = 0; j < 5; j++){
      t[j] = stoul(arr[i], nullptr, 16);
      i++;
    }
    r.push_back(t);
  }
  return r;
}

COORD GetConsoleSize(){
  CONSOLE_SCREEN_BUFFER_INFO temp;
  GetConsoleScreenBufferInfo(GetStdHandle(STD_OUTPUT_HANDLE),&temp);
  return temp.dwSize;
}

void drawCharLine(uint8_t line,int x,int y){
  int t = 1;
  for (int i = 0; i < 8; i++){
    gotoxy(x,y+i);
    int k;
    if(line&t)
      k = 0xf0;
    else if(((y&0b1000)>>3)^((x/5)&0b1))
      k = 0x70;
    else
      k = 0x80;;
    SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), k);
    /*if(line&t)*/cout << " ";//"\x00B2";
    t <<= 1;
  }
}

int main() {
  /*int i = 0;
  while(i<0x100){
    //cin >> i;
    gotoxy(i&0xf,(i&0xf0)>>4);
    cout << "\x00CE";
    i++;
  }
  cout << "122";*/
  int period = GetConsoleSize().X-1;
  vector< array<uint8_t, 5> > t = parseFont(split(sourceFont));
  int s = t.size();
  for (int i = 0; i < s; i++){
    for (int j = 0; j < 5; j++){
      //cout << unsigned(t[i][j]) << " ";
      drawCharLine(t[i][j],j+(i%(period/5) )*5,(i/(period/5) )*8 );
    }
    cout << "\n";
  }

  /*int arr[1];
  int offset = 100;
  int offset2 = 2000;
  for (int i = 0; i < offset+offset2; i++){
    drawCharLine(arr[i-offset2],i%period,(i/period)*8);
  }*/

  cin.get();cin.get();
  return 0;
}