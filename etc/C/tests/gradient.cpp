#include <iostream>
//#include <windows.h>
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
#include <algorithm>
#include <sys/ioctl.h>
#include <stdio.h>
using namespace std;

//<helpers>
  int replaceAll(string& str, const string& from, const string& to) {
    if(from.empty())
      return 0;
    size_t start_pos = 0;
    int count = 0;
    while((start_pos = str.find(from, start_pos)) != string::npos) {
      str.replace(start_pos, from.length(), to);
      start_pos += to.length(); // In case 'to' contains 'from', like replacing 'x' with 'yx'
      count++;
      if(count > 1000)throw "2231234567";
    }
    return count;
  }

  vector<string> split(string str, string separator){
    if(separator != " ")replaceAll(str,separator," ");
    vector<string> array;
    stringstream ss(str);
    string temp;
    while (ss >> temp)
      array.push_back(temp);
    return array;
  }

  vector<string> split(string str){
    return split(str," ");
  }

  double mod(double a, double b){
    return a - b * floor(a/b);
  }
//</helpers>

//<structs>
  struct colorHSV{
    unsigned int H;
    double S;
    double V;
    colorHSV(unsigned int _H, double _S, double _V){
      H = _H;
      S = _S;
      V = _V;
    }
    colorHSV(){} 
  };

  struct colorRGB{
    uint8_t R; 
    uint8_t G;
    uint8_t B;
    colorRGB(uint8_t _R, uint8_t _G, uint8_t _B){
      R = _R;
      G = _G;
      B = _B;
    }
    colorRGB(array<uint8_t,3> a){
      R = a[0];
      G = a[1];
      B = a[2];
    }
    colorRGB(){}  
  };

  struct chixel{
    string ch;
    uint8_t color;
    colorRGB rgb;
  };

  struct COORD{
    int X;
    int Y;
    COORD(int _X, int _Y){
      X = _X;
      Y = _Y;
    }
    COORD(array<int,2> a){
      X = a[0];
      Y = a[1];
    }
    COORD(){}  
  }; 
//</structs>

//<IO>
  /*void gotoxy(int x, int y){
    COORD coord;
    coord.X = x;
    coord.Y = y;
    SetConsoleCursorPosition(GetStdHandle(STD_OUTPUT_HANDLE), coord);
  }*/

  void gotoxy(int x,int y){
    printf("%c[%d;%df",0x1B,y,x);
  }

  uint8_t parseColor(uint8_t c){
    uint8_t r = 0;
    r = (c&0b1000)?90:30;
    c =  c&0b0111;
    r += c;
    return r;
  }

  void setColor(uint8_t c){
    uint8_t f = parseColor(c&0xf);
    uint8_t b = parseColor((c&0xf0)>>4)+10;
    printf("%c[%d;%dm",0x1B,unsigned(f),unsigned(b) );
  }

  /*COORD GetConsoleSize(){
    CONSOLE_SCREEN_BUFFER_INFO temp;
    GetConsoleScreenBufferInfo(GetStdHandle(STD_OUTPUT_HANDLE),&temp);
    COORD r;
    r.X = temp.dwSize.X;
    r.Y = temp.srWindow.Bottom;
    return r;
  }*/

  COORD GetConsoleSize(){
    struct winsize size;
    ioctl(/*STDOUT_FILENO*/0,TIOCGWINSZ,&size);
    return COORD(size.ws_col,size.ws_row);
  }
//</IO>

//<struct funcs>
  colorRGB HSVtoRGB(colorHSV color){
    colorRGB r;
    unsigned int h = color.H;
    double s = color.S;
    double v = color.V;
    double c = v*s;
    double x = c*(1-abs( (mod(h/60.0,2.0)-1) ));
    double m = v-c;
    double rom[18] = {c,x,0,x,c,0,0,c,x,0,x,c,x,0,c,c,0,x};
    int i = (h/60)*3;
    r.R = floor((rom[i]+m)*255);
    r.G = floor((rom[i+1]+m)*255);
    r.B = floor((rom[i+2]+m)*255);
    return r;
  }

  colorRGB HEXtoRGB(string str){
    colorRGB r;
    if(str.length() == 3){
      r.R = stoul(string(1,str[0]), nullptr, 16)*16;
      r.G = stoul(string(1,str[1]), nullptr, 16)*16;
      r.B = stoul(string(1,str[2]), nullptr, 16)*16;
    }else{}
    return r;
  }

  colorRGB colorHelper(double x, double y, string str){
    array<uint8_t,3> arr;
    for (int i = 0; i < 3; i++){
      if(str[i] == 'x')
        arr[i] = x*255;
      else if(str[i] == 'y')
        arr[i] = y*255;
      else if(str[i] == '0')
        arr[i] = 0*255;
      else if(str[i] == '1')
        arr[i] = 1*255;
    }
    return colorRGB(arr);
  }

  bool mixMode = true;
  colorRGB mix(colorRGB a, colorRGB b){
    colorRGB r;
    if(mixMode){
      r.R = sqrt((a.R*a.R+b.R*b.R)/2);
      r.G = sqrt((a.G*a.G+b.G*b.G)/2);
      r.B = sqrt((a.B*a.B+b.B*b.B)/2);
    }else{
      r.R = (a.R+b.R)/2;
      r.G = (a.G+b.G)/2;
      r.B = (a.B+b.B)/2;
    }
    return r;
  }

  char distMode = '1';
  int dist(colorRGB a, colorRGB b){
    int dR = abs(a.R-b.R);
    int dG = abs(a.G-b.G);
    int dB = abs(a.B-b.B);
    if(distMode == '1')return dR+dG+dB;
    if(distMode == '2')return max(max(dR,dG),dB);
    //if(distMode == '3')return min(min(dR,dG),dB);
    if(true||distMode == '0')return dR*dR+dG*dG+dB*dB;
  } 

  chixel approxRGB(colorRGB c, array<chixel,376> chixels){
    int mi;
    int min = 255*3*255;
    for (int i = 0; i < 376; i++){
      int t = dist(c,chixels[i].rgb);
      if(t < min){
        min = t;
        mi = i;
      }
    }
    return chixels[mi];
  }

  COORD operator-(COORD a, int b){
    COORD r;
    r.X = a.X-b;
    r.Y = a.Y-b;
    return r;
  }
//</struct funcs>

array<chixel,376> initColorList(){
  array<chixel,376> chixels;
  const char* rom1[16] = {"000","008","080","088","800","808","880","ccc","888","00f","0f0","0ff","f00","f0f","ff0","fff"};
  colorRGB rom[16];
  for (int i = 0; i < 16; i++){
    chixels[i].rgb = rom[i] = HEXtoRGB(rom1[i]);
    chixels[i].color = (i<<4)|i;
    chixels[i].ch = '0';
  }
  int ii = 16;
  for (int i = 0; i < 16; i++){
    for (int j = 0; j < 16; j++){
      if(i >= j)continue;
      colorRGB temp = mix(rom[i],rom[j]);
      uint8_t color = (i<<4)+j;
      chixels[ii+2].color = chixels[ii+1].color = chixels[ii].color = color;
      chixels[ii].rgb = mix(temp,rom[i]);
      chixels[ii].ch = "\u2591";
      chixels[ii+1].rgb = temp;
      chixels[ii+1].ch = "\u2592";
      chixels[ii+2].rgb = mix(temp,rom[j]);
      chixels[ii+2].ch = "\u2593";
      ii += 3;
    }
  }
  //if(ii != 376)throw "invalid number of chixels";
  return chixels;
}

void drawChixel(chixel c){
  setColor(c.color);
  cout << c.ch;
}

void drawChixel(chixel c, int x, int y){
  gotoxy(x,y);
  drawChixel(c);
}

char easytolower(char in){
  if(in<='Z' && in>='A')
    return in-('Z'-'z');
  return in;
}

void drawHelper(vector<string> seeds){
  string seed1 = seeds[0];
  string seed2 = (seeds.size()>1)?seeds[1]:"111";

  distMode = seed2[0];
  mixMode = (seed2[1] == '1');
  array<chixel,376> chixels = initColorList();
  COORD period = (seed2[2] == '1')?GetConsoleSize()-1:COORD(64,32);

  if(seed1 == "all"||seed1 == "chixels"){
    for (int i = 0; i < 376; i++)
      drawChixel(chixels[i],i%period.X,i/period.X+1);
    return;
  }

  for (int x = 0; x < period.X; x++){
    for (int y = 0; y < period.Y; y++){
      if(seed1 == "hsv"||seed1 == "hsb")
        drawChixel(approxRGB(HSVtoRGB( colorHSV((int)(x/(double)period.X*360),1.0,y/(double)period.Y) ),chixels),x,y+1);
      else
        drawChixel(approxRGB(colorHelper(x/(double)period.X,y/(double)period.Y,seed1),chixels),x,y+1);
    }
  }
}

void toLowerCase(string& seed){
  transform(seed.begin(), seed.end(), seed.begin(), easytolower);
}

bool loop(){
  //throw "windows does not differentiate between exceptions";
  string seed;
  setColor(0x0f);
  system("clear");
  cout << "seed:";
  cin >> seed;
  toLowerCase(seed);
  if(seed == "exit"){
    setColor(0x0f);
    system("clear");
    return false;
  }
  drawHelper(split(seed,","));
  cin.get();cin.get();
  return true;
}

int main() {
  /*CONSOLE_FONT_INFOEX cfi;
  GetCurrentConsoleFontEx(GetStdHandle(STD_OUTPUT_HANDLE), FALSE, &cfi);
  cout << "cfi.cbSize " << cfi.cbSize << "\n";
  cout << "cfi.nFont " << cfi.nFont << "\n";
  cout << "cfi.dwFontSize.X " << cfi.dwFontSize.X << "\n";// Width of each character in the font
  cout << "cfi.dwFontSize.Y " << cfi.dwFontSize.Y << "\n";// Height
  cout << "cfi.FontFamily " << cfi.FontFamily << "\n";
  cout << "cfi.FontWeight " << cfi.FontWeight << "\n";
  cout << "cfi.FaceName " << cfi.FaceName << "\n";
  //std::wcscpy(cfi.FaceName, L"Consolas"); // Choose your font
  cin.get();*/

  /*for (int i = 0; i < 255; i++){
    setColor(i);
    cout<<i;
    printf("%c[0m",0x1B);
    cout<<" ";
  }
  cin.get();cin.get();*/


  while(loop());

  return 0;
}

//colors:
//{"000","008","080","088","800","808","880","ccc","888","00f","0f0","0ff","f00","f0f","ff0","fff"}
