{2}#define ENDIANNESS_IS_BIG 

class Proxy{
  private:
  uint{0}_t pos;
  uint8_t len;
  public:
  Proxy(uint8_t _len,uint{0}_t _pos){
    pos = _pos;
    len = _len;
  }
  ~Proxy(){}
  void operator=(uint{1}_t x){
    #ifdef ENDIANNESS_IS_BIG
      for(int i = len-1; i >= 0; i--){
    #else 
      for(int i = 0; i < len; i++){
    #endif
      ram[pos+i] = x&0xff;
      x >>= 8;
    }
    delete this;
  }
  void operator=(Proxy& x){
    *this = (uint{1}_t)x;
    delete this;
  }
  operator uint{1}_t() const{
    uint{1}_t r = 0;
    #ifdef ENDIANNESS_IS_BIG
      for(int i = 0; i < len; i++){
    #else 
      for(int i = len-1; i >= 0; i--){
    #endif
      r <<= 8;
      r |= ram[pos+i];
    }
    delete this;
    return r;
  }
};

static inline Proxy& createProxy(uint8_t len,uint{0}_t pos){
  return *(new Proxy(len,pos));
}

static inline Proxy& createProxy_inc(uint8_t len,uint{0}_t* pos){
  *pos += len;
  return *(new Proxy(len,*pos-len));
}

