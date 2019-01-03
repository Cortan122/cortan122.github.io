{2}#define ENDIANNESS_IS_BIG 
{3}#define Proxy_IS_SINGLETON 

class Proxy{
  // private:
  public:
  uint{0}_t pos;
  uint8_t len;
  inline Proxy(uint8_t _len,uint{0}_t _pos){
    pos = _pos;
    len = _len;
  }
  ~Proxy(){}
  inline void operator=(uint{1}_t x){
    #ifdef ENDIANNESS_IS_BIG
      for(int i = len-1; i >= 0; i--){
    #else 
      for(int i = 0; i < len; i++){
    #endif
      ram[pos+i] = x&0xff;
      x >>= 8;
    }
    #ifndef Proxy_IS_SINGLETON
    delete this;
    #endif
  }
  inline void operator=(Proxy& x){
    *this = (uint{1}_t)x;
    #ifndef Proxy_IS_SINGLETON
    delete this;
    #endif
  }
  inline operator uint{1}_t() const{
    uint{1}_t r = 0;
    #ifdef ENDIANNESS_IS_BIG
      for(int i = 0; i < len; i++){
    #else 
      for(int i = len-1; i >= 0; i--){
    #endif
      r <<= 8;
      r |= ram[pos+i];
    }
    #ifndef Proxy_IS_SINGLETON
    delete this;
    #endif
    return r;
  }
};

#ifdef Proxy_IS_SINGLETON

static Proxy instance(0,0);

static inline Proxy& createProxy(uint8_t len,uint16_t pos){
  instance.len = len;
  instance.pos = pos;
  return instance;
}

static inline Proxy& createProxy_inc(uint8_t len,uint16_t* pos){
  instance.pos = *pos;
  instance.len = len;
  *pos += len;
  return instance;
}

#else

static inline Proxy& createProxy(uint8_t len,uint{0}_t pos){
  return *(new Proxy(len,pos));
}

static inline Proxy& createProxy_inc(uint8_t len,uint{0}_t* pos){
  *pos += len;
  return *(new Proxy(len,*pos-len));
}

#endif

