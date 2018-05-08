using System;
using System.Threading;

namespace Snake {
  class InputManager {
    enum Mode { Multithreaded, Delay, Timer, Multithreaded_sim };
    Game game;
    Mode mode = Mode.Timer;
    int delay = 250;
    static bool threadMarker = false;
    public InputManager(Game g) {
      this.game = g;
      mode = (Mode)Enum.Parse(typeof(Mode), (string)Util.Options.Get("inputMode"));
      delay = (int)Util.Options.Get("millisecondsPerTick");
    }
    public void Start() {
      if (mode == Mode.Multithreaded && delay > 0) {
        threadMarker = true;
        Thread th = new Thread(Init);
        th.Start();
        while (true) {
          threadMarker = false;
          game.Event(-1);
          threadMarker = true;
          Thread.Sleep(delay);
        }
      } else {
        Init();
      }
    }
    void Init() {
      if (delay <= 0) {
        //if(mode!=Mode.Timer)throw new Exception("delay must be more then 0");
        while (true) {
          int t = KeyboardUpdate();
          if (t != -1) game.Event(t);
        }
      }

      DateTime time = DateTime.Now;

      while (true) {
        int t = KeyboardUpdate();

        if (mode == Mode.Delay) {
          game.Event(t);
          System.Threading.Thread.Sleep(delay);
        } else if (mode == Mode.Multithreaded) {
          if (t != -1 && threadMarker) game.Event_set(t);
        } else if (mode == Mode.Timer) {
          if (t == -1) {
            double delta = -time.Subtract(DateTime.Now).TotalMilliseconds;
            if (delta > delay) {
              time = DateTime.Now;
              game.Event(t);
            }
          } else {
            time = DateTime.Now;
            game.Event(t);
          }
        } else if (mode == Mode.Multithreaded_sim) {
          if (t == -1) {
            double delta = -time.Subtract(DateTime.Now).TotalMilliseconds;
            if (delta > delay) {
              time = DateTime.Now;
              game.Event(t);
            }
          } else {
            game.Event_set(t);
          }
        }
      }
    }
    int KeyboardUpdate() {
      if (Console.KeyAvailable) {
        game.DrawMessage("");
        Console.SetCursorPosition(0, 0);
        // Read one key
        ConsoleKeyInfo cki = Console.ReadKey(true);
        if (cki.Key == ConsoleKey.W || cki.Key == ConsoleKey.UpArrow || cki.Key == ConsoleKey.NumPad8) {
          return 2;
        } else if (cki.Key == ConsoleKey.S || cki.Key == ConsoleKey.DownArrow || cki.Key == ConsoleKey.NumPad2) {
          return 0;
        } else if (cki.Key == ConsoleKey.A || cki.Key == ConsoleKey.LeftArrow || cki.Key == ConsoleKey.NumPad4) {
          return 1;
        } else if (cki.Key == ConsoleKey.D || cki.Key == ConsoleKey.RightArrow || cki.Key == ConsoleKey.NumPad6) {
          return 3;
        } else if (cki.Key == ConsoleKey.F || cki.Key == ConsoleKey.Add) {
          game.Event_cheat();
          return -1;
        } else if (cki.Key == ConsoleKey.M) {
          game.Event_mute();
          return -1;
        } else if (cki.Key == ConsoleKey.R) {
          game.Event_restart();
          return -1;
        } else if (cki.Key == ConsoleKey.O) {
          Util.Event_options();
          return -1;
        } else if (cki.Key == ConsoleKey.H) {
          Util.Event_help();
          return -1;
        }
      }
      return -1;
    }
  }
}
