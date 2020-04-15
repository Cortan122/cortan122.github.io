#include <windows.h>
#include <stdio.h>
#include <stdbool.h>

int main(int argc, char *argv[]){
  HKL l = GetKeyboardLayout(0);
  HKL en = LoadKeyboardLayout("00000409", 1);
  HKL ru = LoadKeyboardLayout("00000419", 1);

  printf("en=%d; ru=%d; l=%d\n", en,ru,l);

  ActivateKeyboardLayout(ru, KLF_SETFORPROCESS|KLF_REORDER);

  l = GetKeyboardLayout(0);
  printf("en=%d; ru=%d; l=%d\n", en,ru,l);

  // SendMessage(GetActiveWindow(), WM_INPUTLANGCHANGEREQUEST, 3, ru);
  // SendMessage(GetActiveWindow(), WM_INPUTLANGCHANGE, 65001, ru);

  return 0;
}
