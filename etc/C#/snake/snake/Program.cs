using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Diagnostics;
using System.Threading;

class Vector2{
  public int x;
  public int y;
  public Vector2(int x,int y){
    this.x = x;
    this.y = y;
  }
  public static Vector2 operator+(Vector2 a,Vector2 b){
    Vector2 r = new Vector2(0,0);
    r.x = a.x+b.x;
    r.y = a.y+b.y;
    return r;
  }
  public bool Equals (Vector2 a){
    return this.x == a.x && this.y == a.y;
  }
  public static bool Equals(Vector2 a, Vector2 b){
    return a.Equals(b);
  }
  private static Random random;
  public static Vector2 Random(Vector2 s){
    if (random == null) random = new System.Random();
    Vector2 r = new Vector2(0, 0);
    r.x = random.Next(0,s.x);
    r.y = random.Next(0,s.y);
    return r;
  }
}

class Game{
  //const implies static 
  const char head = 'X';
  const char empty = '.';
  const char body = '*';
  const char apple = '0';
  const string borders = "\u2502\u2500\u2510\u2514\u2518\u250c\u252C\u251C";
  Snake snake;
  int prev_dir;
  int score;
  public Vector2 offset { get; private set; }
  public Vector2 size { get; private set; }
  Vector2 apple_pos;
  bool[,] map;
  InputManager inputManager;
  public Game(Vector2 size=null,Vector2 offset=null){
    Util.game = this;
    if(size==null)size = new Vector2(20,10);
    if(offset==null)offset = new Vector2(1,1);
    this.size = size;
    this.offset = offset;
    this.inputManager = new InputManager(this);
    Init();
    
    this.inputManager.Start();
  }
  void Init(){
    snake = new Snake(Vector2.Random(size));
    map = new bool[size.x, size.y];
    map[snake.pos.x, snake.pos.y] = true;
    score = 0;
    prev_dir = 0;//just in case
    InitDraw();
  }
  void UpdateApple(){
    apple_pos = Vector2.Random(size);
    while(map[apple_pos.x, apple_pos.y]){
      apple_pos = Vector2.Random(size);//slow
    }
    DrawApple();
  }
  void DrawApple(){
    Util.MoveCursor(apple_pos);
    Console.Write(apple);
  }
  void DrawScore(){
    Util.MoveCursor(size.x + 11, 0);
    Console.Write(score.ToString("000"));
  }
  void InitDraw(){
    Util.MoveCursor(-1, -1);
    Console.Write(borders[5]+new String(borders[1],size.x)+borders[2]);
    Util.MoveCursor(0, 0);
    for (int i = 0; i < size.y; i++){
      Util.MoveCursor(-1,i);
      Console.Write(borders[0]);
      for (int j = 0; j < size.x; j++){
        Console.Write(empty);
      }
      Console.Write(borders[0]);
    }
    Console.Write("\n"+borders[3] + new String(borders[1], size.x) + borders[4]);

    Util.MoveCursor(snake.pos);
    Console.Write(head);
    UpdateApple();
    Util.MoveCursor(size.x + 5, 0);
    Console.Write("Score:   "+ borders[0]);
    Util.MoveCursor(size.x, -1);
    Console.Write(borders[6]+new String(borders[1], 13)+borders[2]);
    Util.MoveCursor(size.x, 1);
    Console.Write(borders[7] + new String(borders[1], 13) + borders[4]);
    DrawScore();
  }
  public void Event(int dir=-1){
    if(dir==-1){
      MoveSnake(prev_dir);
    }else{
      MoveSnake(dir%4);
    }
  }
  public void Event_set(int dir){
    prev_dir = Math.Abs(dir)%4;
  }
  void MoveSnake(int dir){
    prev_dir = dir;
    MoveCursor(snake.pos);
    Console.Write(body);
    bool t = snake.pos.Equals(apple_pos);
    Vector2[] r = snake.Move(dir, t);
    if (r[1] != null){
      MoveCursor(r[1]);
      Console.Write(empty);
      map[r[1].x, r[1].y] = false;
    }
    if (r[0] != null){
      MoveCursor(r[0]);
      Console.Write(head);
      if(map[r[0].x, r[0].y]){
        GameOver();
        return;
      }
      map[r[0].x, r[0].y] = true;
    }
    if (t){
      UpdateApple();
      score++;
      DrawScore();
    }
  }
  void GameOver(){
    MoveCursor(size.x + 1, 0);
    Console.Write("Game Over:");
    Console.ReadKey(true);
    MoveCursor(size.x + 1, 0);
    Console.Write("          ");
    Init();
  }
  void MoveCursor(int x, int y){
    MoveCursor(new Vector2(x,y));
  }
  void MoveCursor(Vector2 p){
    Console.SetCursorPosition(p.x + offset.x, p.y + offset.y);
  }
}

class InputManager{
  enum Mode { Multithreaded,Delay,Timer,Multithreaded_sim };
  Game game;
  const Mode mode = Mode.Timer;
  const int delay = 250;
  static bool threadMarker = false;
  public InputManager(Game g){
    this.game = g;
  }
  public void Start(){
    if(mode==Mode.Multithreaded){
      threadMarker = true;
      Thread th = new Thread(Init);
      th.Start();
      while(true){
        threadMarker = false;
        game.Event(-1);
        threadMarker = true;
        Thread.Sleep(delay);
      }
    }else{ 
      Init();
    }
  }
  void Init(){
    if(delay <= 0){
      if(mode!=Mode.Timer)throw new Exception("delay must be more then 0");
      while(true){
        int t = KeyboardUpdate();
        if(t!=-1)game.Event(t);
      }
    }

    DateTime time = DateTime.Now;

    while(true){
      int t = KeyboardUpdate();

      if(mode==Mode.Delay){
        game.Event(t);
        System.Threading.Thread.Sleep(delay);
      }else if(mode==Mode.Multithreaded){
        if(t!=-1&&threadMarker)game.Event_set(t);
      }else if(mode==Mode.Timer){
        if(t==-1){
          double delta = -time.Subtract(DateTime.Now).TotalMilliseconds;
          if(delta > delay) {
            time = DateTime.Now;
            game.Event(t);
          }
        }else{
          time = DateTime.Now;
          game.Event(t);
        }
      }else if(mode==Mode.Multithreaded_sim){
        if(t==-1){
          double delta = -time.Subtract(DateTime.Now).TotalMilliseconds;
          if(delta > delay) {
            time = DateTime.Now;
            game.Event(t);
          }
        }else{
          game.Event_set(t);
        }
      }
    }
  }
  int KeyboardUpdate(){
    if(Console.KeyAvailable){
      // Read one key
      ConsoleKeyInfo cki = Console.ReadKey(true);
      if(cki.Key == ConsoleKey.W || cki.Key == ConsoleKey.UpArrow || cki.Key == ConsoleKey.NumPad8){
        return 2;
      }else if (cki.Key == ConsoleKey.S || cki.Key == ConsoleKey.DownArrow || cki.Key == ConsoleKey.NumPad2) {
        return 0;
      }else if (cki.Key == ConsoleKey.A || cki.Key == ConsoleKey.LeftArrow || cki.Key == ConsoleKey.NumPad4) {
        return 1;
      }else if (cki.Key == ConsoleKey.D || cki.Key == ConsoleKey.RightArrow || cki.Key == ConsoleKey.NumPad6) {
        return 3;
      }
    }
    return -1;
  }
}

static class Util{
  public static Game game;
  public static void Main(){
    Console.CursorVisible = false;
    game = new Game();
  }
  public static void MoveCursor(int x, int y){
    MoveCursor(new Vector2(x,y));
  }
  public static void MoveCursor(Vector2 p){
    Vector2 offset = game.offset;
    Console.SetCursorPosition(p.x + offset.x, p.y + offset.y);
  }
  public static Vector2 FixPos(Vector2 a){
    Vector2 size = game.size;
    a.x = a.x - size.x * (int)Math.Floor((double)a.x / size.x);
    a.y = a.y - size.y * (int)Math.Floor((double)a.y / size.y);
    return a;
  }
  private static Vector2[] dirrom = new Vector2[]{new Vector2(0,1),new Vector2(-1,0),new Vector2(0,-1),new Vector2(1,0)};
  public static Vector2 DirToVector(int dir){
    return dirrom[dir];
  } 
}

class Snake{
  public Vector2 pos { get; private set; }
  private Queue<Vector2> body;
  public Snake(int x,int y){
    pos = new Vector2(x,y);
    body = new Queue<Vector2>();
    body.Enqueue(pos);
  }
  public Snake(Vector2 x){
    pos = x;
    body = new Queue<Vector2>();
    body.Enqueue(pos);
  }
  public Vector2[] Move(int dir,bool isFed=false){
    return Move(Util.DirToVector(dir),isFed);
  }
  public Vector2[] Move(Vector2 dir,bool isFed=false){
    pos = pos + dir;
    Util.FixPos(pos);
    body.Enqueue(pos);
    if(!isFed)return new Vector2[] { pos,body.Dequeue() };
    return new Vector2[] { pos, null };
  }
}