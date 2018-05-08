using System;
using System.Threading;

namespace Snake {
  class Game {
    #region Options
    char head;
    char empty;
    char body;
    char apple;
    byte headColor;
    byte emptyColor;
    byte bodyColor;
    byte appleColor;
    byte boxColor;
    string borders;
    string arrows;
    bool isReversible;
    bool lizardTail;
    bool canCheat;
    bool showMenu;
    bool delayedBeep;
    bool deadlyWalls;
    bool directionalBody;
    int gameOverDelay;
    int initialScore;
    #endregion
    #region Variables
    Snake snake;
    int prev_dir;
    int next_dir;
    int score;
    int menuSize;
    bool isCheating;
    public Vector2 offset { get; private set; }
    public Vector2 size { get; private set; }
    Vector2 apple_pos;
    bool[,] map;
    InputManager inputManager;
    SoundManager soundManager;
    #endregion
    public Game(Options o) : this(new Vector2((int)o.Get("width"), (int)o.Get("height")), new Vector2((int)o.Get("offsetX"), (int)o.Get("offsetY"))) {
      UpdateOptions(o);
    }
    public Game(Vector2 size = null, Vector2 offset = null) {
      Util.game = this;
      if (size == null) size = new Vector2(20, 10);
      if (offset == null) offset = new Vector2(1, 1);
      this.size = size;
      this.offset = offset;

      int t = size.x + offset.x + 15;
      if (t > Console.WindowWidth) {
        Console.BufferWidth = t;
        Console.WindowWidth = Math.Min(Console.LargestWindowWidth, t);
      }
      t = size.y + offset.y + 3;
      if (t > Console.WindowHeight) {
        Console.BufferHeight = t;
        Console.WindowHeight = Math.Min(Console.LargestWindowHeight, t);
      } else {
        Console.BufferHeight = Console.WindowHeight;
      }

      this.inputManager = new InputManager(this);
      this.soundManager = new SoundManager();
    }
    void Init() {
      soundManager.RestartMusic();
      snake = new Snake(Vector2.Random(size), initialScore + 2);
      map = new bool[size.x, size.y];
      map[snake.pos.x, snake.pos.y] = true;
      score = initialScore;
      next_dir = prev_dir = -1;
      isCheating = false;
      InitDraw();
    }
    void UpdateApple() {
      if (score + 1 >= size.x * size.y) {
        Victory();
        return;
      }
      do {
        apple_pos = Vector2.Random(size);
      } while (map[apple_pos.x, apple_pos.y]);
      DrawApple();
    }
    void DrawApple() {
      Util.SetColor(appleColor);
      Util.MoveCursor(apple_pos);
      Console.Write(apple);
    }
    void UndrawApple() {
      Util.SetColor(emptyColor);
      Util.MoveCursor(apple_pos);
      Console.Write(empty);
    }
    void DrawScore() {
      Util.SetColor(boxColor);
      Util.MoveCursor(size.x + 11, 0);
      Console.Write(score.ToString("000"));
    }
    void InitDraw() {
      Util.SetColor(boxColor);
      Util.MoveCursor(-1, -1);
      Console.Write(borders[5] + new String(borders[1], size.x) + borders[2]);
      Util.MoveCursor(0, 0);
      for (int i = 0; i < size.y; i++) {
        Util.MoveCursor(-1, i);
        Console.Write(borders[0]);
        for (int j = 0; j < size.x; j++) {
          Util.SetColor(emptyColor);
          Console.Write(empty);
        }
        Util.SetColor(boxColor);
        Console.Write(borders[0]);
      }
      MoveCursor(-1, size.y);
      Console.Write(borders[3] + new String(borders[1], size.x) + borders[4]);

      Util.SetColor(headColor);
      Util.MoveCursor(snake.pos);
      Console.Write(head);

      UpdateApple();
      DrawMenu();
      DrawScore();
    }
    void DrawMenu() {
      const string controls = "Controls:\n[H]elp\n[M]ute";
      const string cheats = "\n\nCheats:\n[R]estart\n[F]eed";
      string menu = controls;
      if (!Util.isDebug) menu += "\n[O]ptions";
      if (canCheat) menu += cheats;

      Util.SetColor(boxColor);
      MoveCursor(size.x + 5, 0);
      Console.Write("Score:   " + borders[0]);
      MoveCursor(size.x, -1);
      Console.Write(borders[6] + new String(borders[1], 13) + borders[2]);
      MoveCursor(size.x, 1);
      char t = showMenu ? borders[8] : borders[4];
      char t1 = borders[7];
      if (size.y == 1) {
        t1 = showMenu ? borders[10] : borders[9];
      }
      Console.Write(t1 + new String(borders[1], 13) + t);

      if (!showMenu) {
        menuSize = 1;
        return;
      }
      string[] arr = menu.Split('\n');
      int i;
      for (i = 0; i < arr.Length; i++) {
        string line = arr[i];
        MoveCursor(size.x + 1, 2 + i);
        Console.Write(line.PadRight(13, ' ') + borders[0]);
        char? temp = null;
        if (2 + i == size.y) {
          temp = borders[8];
        } else if (2 + i > size.y) {
          temp = borders[0];
        }
        if (temp != null) {
          MoveCursor(size.x, 2 + i);
          Console.Write(temp);
        }
      }
      MoveCursor(size.x, 2 + i);
      t = borders[7];
      if (2 + i == size.y) {
        t = borders[9];
      } else if (2 + i > size.y) {
        t = borders[3];
      }

      menuSize = 2 + i;
      Console.Write(t + new String(borders[1], 13) + borders[4]);
    }
    public void UpdateOptions(Options o) {
      head = ((string)o.Get("headChar"))[0];
      empty = ((string)o.Get("emptyChar"))[0];
      body = ((string)o.Get("bodyChar"))[0];
      apple = ((string)o.Get("appleChar"))[0];
      borders = (string)o.Get("boxDrawingCharList");
      arrows = (string)o.Get("arrowCharList");
      headColor = Util.GetColor("head");
      emptyColor = Util.GetColor("empty");
      bodyColor = Util.GetColor("body");
      appleColor = Util.GetColor("apple");
      boxColor = Util.GetColor("box");
      isReversible = (bool)o.Get("isReversible");
      lizardTail = (bool)o.Get("endlessMode");
      canCheat = (bool)o.Get("cheatMode");
      showMenu = (bool)o.Get("showMenu");
      deadlyWalls = (bool)o.Get("deadlyWalls");
      delayedBeep = (bool)o.Get("sfx_DelayedBeep");
      directionalBody = (bool)o.Get("directionalBody");
      gameOverDelay = (int)o.Get("gameOverDelay");
      initialScore = (int)o.Get("initialScore");
    }
    public void StartInputManager() {
      Init();
      inputManager.Start();
    }
    public void Redraw() {
      Console.Clear();
      InitDraw();
    }
    public void Event(int dir = -1) {
      if (dir == -1) {
        if (next_dir == -1) return;
        if (delayedBeep) {
          if (next_dir != prev_dir) soundManager.Beep();
        }
        MoveSnake(next_dir);
      } else {
        Event_set(dir);
        Event(-1);
      }
    }
    public void Event_set(int dir) {
      int t = Math.Abs(dir) % 4;
      if ((t + 2) % 4 == prev_dir && !isReversible && score > 1) return;
      if (t == next_dir) return;
      if (!delayedBeep) soundManager.Beep();
      next_dir = t;
    }
    public void Event_cheat() {
      if (canCheat) isCheating = true;
    }
    public void Event_mute() {
      this.soundManager.Mute();
    }
    public void Event_restart() {
      if (canCheat) GameOver();
    }
    public bool Event_portal() {
      if (deadlyWalls) {
        //GameOver();
        return true;
      }
      soundManager.Portal();
      return false;
    }
    public void DrawMessage(string str) {
      Util.SetColor(boxColor);
      MoveCursor(0, Math.Max(size.y, menuSize) + 1);
      Console.Write(str.PadRight(Console.BufferWidth, ' '));
    }
    void RemoveSnakeTail(Vector2 p) {
      if (p != null) {
        MoveCursor(p);
        Util.SetColor(emptyColor);
        Console.Write(empty);
        map[p.x, p.y] = false;
      }
    }
    void TailChopEvent(Vector2 p) {
      RemoveSnakeTail(p);
      score--;
      DrawScore();
      Thread.Sleep(100);
    }
    void MoveSnake(int dir) {
      next_dir = prev_dir = dir;
      MoveCursor(snake.pos);
      Util.SetColor(bodyColor);
      Console.Write(directionalBody ? arrows[dir] : body);
      bool t1 = snake.pos.Equals(apple_pos);
      bool t = t1 || isCheating;
      isCheating = false;
      Vector2[] r = snake.Move(dir, t);
      RemoveSnakeTail(r[1]);
      if (UpdateHeadPos(r[0])) return;
      if (t) {
        score++;
        if (t1) {
          UpdateApple();
          soundManager.Chomp();
        }
        DrawScore();
      }
    }
    bool UpdateHeadPos(Vector2 head_pos) {
      if (head_pos != null) {
        MoveCursor(head_pos);
        Util.SetColor(headColor);
        Console.Write(head);
        if (map[head_pos.x, head_pos.y]) {
          if (!lizardTail) {
            GameOver();
            return true;
          } else {
            snake.ChopTail(head_pos, TailChopEvent);
            MoveCursor(head_pos);
            Util.SetColor(headColor);
            Console.Write(head);
          }
        }
        map[head_pos.x, head_pos.y] = true;
      }
      return false;
    }
    void GameOver() {
      soundManager.Gameover();
      Util.SetColor(boxColor);
      MoveCursor(size.x + 1, 0);
      Console.Write("Game Over:");
      if (gameOverDelay > 0) {
        Thread.Sleep(gameOverDelay);
        Util.ClearKeyBuffer();
      }
      DrawMessage("Press any key to restart...");
      Console.ReadKey(true);
      DrawMessage("");
      MoveCursor(size.x + 1, 0);
      Console.Write("         :");
      Init();
    }
    int VictoryHelper(int a, int b) {
      if ((a / b) % 2 == 0) return a % b;
      return b - (a % b);
    }
    void Victory() {
      apple_pos = new Vector2(-1, -1);
      DrawMessage("Congratulations: You win!");
      soundManager.Victory();
      MoveCursor(size.x + 1, 0);
      Console.Write("  Victory:");

      int x = 0, y = 0;
      Vector2 ws = WindowMover.WM.GetWindowSize();
      Vector2 ss = WindowMover.WM.GetScreenSize() - ws;
      while (true) {
        WindowMover.WM.Move(VictoryHelper(x, ss.x), VictoryHelper(y, ss.y));
        Thread.Sleep(1);

        x++;
        y++;
      }
    }
    void MoveCursor(int x, int y) {
      MoveCursor(new Vector2(x, y));
    }
    void MoveCursor(Vector2 p) {
      Console.SetCursorPosition(p.x + offset.x, p.y + offset.y);
    }
  }
}
