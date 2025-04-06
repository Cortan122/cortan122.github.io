#include <cstdio>
#pragma comment(linker, "/SUBSYSTEM:windows /ENTRY:mainCRTStartup")

#include <SFML/Graphics.hpp>
#include "palettes.cpp"
#include "mmap.cpp"

#define min(a,b) (a>b?b:a)
#define max(a,b) (a<b?b:a)

uint8_t pixels[256*256*4];

uint8_t SFKeyToChar(uint8_t keycode,bool shift){
  switch(keycode){
    case sf::Keyboard::Escape: return '\x1b';
    case sf::Keyboard::LControl: return '\0';
    case sf::Keyboard::LShift: return '\0';
    case sf::Keyboard::LAlt: return '\0';
    case sf::Keyboard::LSystem: return '\0';
    case sf::Keyboard::RControl: return '\0';
    case sf::Keyboard::RShift: return '\0';
    case sf::Keyboard::RAlt: return '\0';
    case sf::Keyboard::RSystem: return '\0';
    case sf::Keyboard::Menu: return '\0';
    case sf::Keyboard::LBracket: return shift?'{':'[';
    case sf::Keyboard::RBracket: return shift?'}':']';
    case sf::Keyboard::SemiColon: return shift?':':';';
    case sf::Keyboard::Comma: return shift?'<':',';
    case sf::Keyboard::Period: return shift?'>':'.';
    case sf::Keyboard::Quote: return shift?'"':'\'';
    case sf::Keyboard::Slash: return shift?'?':'/';
    case sf::Keyboard::BackSlash: return shift?'|':'\\';
    case sf::Keyboard::Tilde: return shift?'~':'`';
    case sf::Keyboard::Equal: return shift?'+':'=';
    case sf::Keyboard::Dash: return shift?'_':'-';
    case sf::Keyboard::Space: return ' ';
    case sf::Keyboard::Enter: return '\n';
    case sf::Keyboard::Backspace: return '\x08';
    case sf::Keyboard::Tab: return '\t';
    case sf::Keyboard::PageUp: return '\0';
    case sf::Keyboard::PageDown: return '\0';
    case sf::Keyboard::End: return '\0';
    case sf::Keyboard::Home: return '\0';
    case sf::Keyboard::Insert: return '\0';
    case sf::Keyboard::Delete: return '\x7f';
    case sf::Keyboard::Add: return '+';
    case sf::Keyboard::Subtract: return '-';
    case sf::Keyboard::Multiply: return '*';
    case sf::Keyboard::Divide: return '/';
    case sf::Keyboard::Left: return 'a'|0x80;
    case sf::Keyboard::Right: return 'd'|0x80;
    case sf::Keyboard::Up: return 'w'|0x80;
    case sf::Keyboard::Down: return 's'|0x80;
    case sf::Keyboard::Numpad0: return '0';
    case sf::Keyboard::Numpad1: return '1';
    case sf::Keyboard::Numpad2: return '2';
    case sf::Keyboard::Numpad3: return '3';
    case sf::Keyboard::Numpad4: return '4';
    case sf::Keyboard::Numpad5: return '5';
    case sf::Keyboard::Numpad6: return '6';
    case sf::Keyboard::Numpad7: return '7';
    case sf::Keyboard::Numpad8: return '8';
    case sf::Keyboard::Numpad9: return '9';
    case sf::Keyboard::F1: return '\0';
    case sf::Keyboard::F2: return '\0';
    case sf::Keyboard::F3: return '\0';
    case sf::Keyboard::F4: return '\0';
    case sf::Keyboard::F5: return '\0';
    case sf::Keyboard::F6: return '\0';
    case sf::Keyboard::F7: return '\0';
    case sf::Keyboard::F8: return '\0';
    case sf::Keyboard::F9: return '\0';
    case sf::Keyboard::F10: return '\0';
    case sf::Keyboard::F11: return '\0';
    case sf::Keyboard::F12: return '\0';
    case sf::Keyboard::F13: return '\0';
    case sf::Keyboard::F14: return '\0';
    case sf::Keyboard::F15: return '\0';
    case sf::Keyboard::Pause: return '\0';

    default:
      if(keycode<26){
        return keycode+(shift?'A':'a');
      }else if(keycode<36){
        if(shift)return ")!@#$%^&*("[keycode-26];
        return keycode+'0'-26;
      }
      return '\0';

  }
}

int modulo(int a, int b){
  if(b < 0)return modulo(-a, -b);
  const int result = a % b;
  return result >= 0 ? result : result + b;
}

void makePixels(uint8_t* buffer, int paletteIndex, int offset=0){
  int num = sizeof(palettes)/sizeof(*palettes);
  paletteIndex = modulo(paletteIndex,num);
  uint32_t* palette = palettes[paletteIndex];
  for(int i = 0; i < sizeof(pixels); i += 4){
    *((uint32_t*)(pixels+i)) = palette[buffer[ offset&0xffff ]];
    pixels[i+3] = 0xff;
    offset++;
  }
}

int getZoomFactor(sf::RenderWindow& window, int zoomLevel){
  sf::Vector2u s = window.getSize();
  int t = (min(s.x,s.y)/256);
  t += max(zoomLevel,0);
  return t;
}

void zoom(sf::RenderWindow& window, int zoomLevel, int x, int y){
  sf::View a = window.getView();
  sf::Vector2u s = window.getSize();
  a.setSize((sf::Vector2f)s);
  a.setCenter( (float)(256/2+x),(float)(256/2+y) );
  a.zoom(1/(float)getZoomFactor(window,zoomLevel));
  window.setView(a);
}

void zoom(sf::RenderWindow& window, int zoomLevel, float x, float y){
  zoom(window,zoomLevel,(int)x,(int)y);
}

int main(){
  srand((int)time(NULL));
  uint8_t* buffer = GetMappedMemoryPointer();
  printf("buffer = %p\n", buffer);

  sf::RenderWindow window(sf::VideoMode(256, 256), "SFML works!");
  window.setFramerateLimit(60);

  sf::Texture texture;
  sf::Sprite sprite;
  sprite.setScale(1,1);
  texture.create(256,256);
  texture.setSmooth(false);

  int zoomLevel = 0;
  float xoffset = 0;
  float yoffset = 0;
  sf::Vector2i oldPos;
  while(window.isOpen()){
    sf::Event event;
    while(window.pollEvent(event)){
      if(event.type == sf::Event::Closed){
        window.close();
      }else if(event.type == sf::Event::Resized){
        zoom(window,zoomLevel,xoffset,yoffset);
      }else if(event.type == sf::Event::MouseWheelMoved){
        zoomLevel += event.mouseWheel.delta>0?1:-1;
        zoomLevel = max(zoomLevel,0);
        zoom(window,zoomLevel,xoffset,yoffset);
      }else if(event.type == sf::Event::KeyPressed){
        char t = SFKeyToChar(event.key.code,event.key.shift);
        buffer[0xff] = t;
      }else if(event.type == sf::Event::MouseMoved){
        if(sf::Mouse::isButtonPressed(sf::Mouse::Button::Left)){
          xoffset += (oldPos.x-event.mouseMove.x)/(float)getZoomFactor(window,zoomLevel);
          yoffset += (oldPos.y-event.mouseMove.y)/(float)getZoomFactor(window,zoomLevel);
          zoom(window,zoomLevel,xoffset,yoffset);
        }
        oldPos = sf::Vector2i(event.mouseMove.x, event.mouseMove.y);
      }else if(event.type == sf::Event::MouseButtonPressed){
        if(event.mouseButton.button == sf::Mouse::Button::Right){
          buffer[0xe0]++;
        }else if(event.mouseButton.button == sf::Mouse::Button::Middle){
          xoffset = yoffset = 0;
          zoomLevel = 0;
        }
        zoom(window,zoomLevel,xoffset,yoffset);
      }
    }

    buffer[0xfe] = rand();
    buffer[0xfd]++;

    makePixels(buffer,buffer[0xe0],buffer[0xe1]<<8);
    texture.update(pixels);
    sprite.setTexture(texture);

    window.clear();
    window.draw(sprite);
    window.display();
  }

  FreeMappedMemory();

  return 0;
}
