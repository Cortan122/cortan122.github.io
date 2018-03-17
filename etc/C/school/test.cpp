#include <iostream>
#include <math.h>
using namespace std;

int main() {
  int min,max,b=true;
  while(true){
    int t;
    cin>>t;
    if(t == 0)break; 
    if(max<t||b)max = t;
    if(min>t||b)min = t;
    b = false;
  }
  cout<<min<<" "<<max;
  cin.get();cin.get();
  return 0;
}