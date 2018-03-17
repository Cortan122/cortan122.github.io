#include <iostream>
using namespace std;

void inc(int size,int arr[]){
  for (int i = 0; i < size; i++){
    arr[i]++;
  }
}

void print_array_json(int size,int arr[]){
  cout<<"[";
  for (int i = 0; i < size; i++){
    cout<<arr[i];
    if(i != size-1)cout<<",";
  }
  cout<<"]\n";
}

int main() {
  int n;
  cin>>n;
  int arr[n];
  for (int i = 0; i < n; i++){
    arr[i] = i;
  }
  inc(n,arr);
  print_array_json(n,arr);
  //cout<<i;
  //cin.get();cin.get();
  return 0;
}