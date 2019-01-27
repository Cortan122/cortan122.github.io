typedef unsigned int16 int;//int8 is not working
typedef unsigned int8 char;
typedef unsigned int8 bool;

void main();

void __entry_jDIkYCpYQn8lObUaBiIuN0avakX2Kx96kbLl7AM7CGOcuFQVLq(int ax){
  asm{
    .extern not_equal_to_ax add_to_ax sub_to_ax and_to_ax negate_ax or_to_ax print puts xor_to_ax mult_to_ax div_to_ax mod_to_ax equal_to_ax write_to_ax;
    start:;
    mov ax, 1;
    call _umain; //this is assuming that "main" gets mangled to "_umain"
    test ax;
    jz start_end;
    push ax;
  }
  ax = "Exited with code";
  asm{
    call puts;
    pop ax;
    call print;
    start_end:ret;
    .global start;
  }
}
