//#define useFConsole 

using System;
using System.IO;
using System.Reflection;
using Newtonsoft.Json.Linq;
using System.Windows.Forms;

namespace Snake {
  static class Util {
    public const byte defaultColor = 7;//15
    public static Game game;
    public static bool isDebug;
    public static string directory;
    static string fullFileName;
    static string defaultJson;
    const string optionFileName = "options.json";
    public static Options Options;
    public static Assembly assembly;
    public static bool hasOptionFile = true;
    public static bool useFConsole = false;
#if useFConsole
    public static FConsole Console;
#endif
    public static void Main(string[] argv) {
      //Console.WriteLine(Convert.ToBase64String(CryptoManager.GetHash("τнιs_ραssωοяδ_ιs_μηοβταιηαβℓε‽")));
      //Console.ReadLine();
      //#if DEBUG
      //    isDebug = true;
      //#else
      //    isDebug = false;
      //#endif
#if useFConsole
      useFConsole = true;
      Console = new FConsole();
#endif
      assembly = Assembly.GetExecutingAssembly();
      directory = Path.GetDirectoryName(assembly.Location);
      Console.OutputEncoding = System.Text.Encoding.UTF8;
      Console.Title = "Snake";
      InitOptions(argv);

      SetColor(defaultColor);
      Console.CursorVisible = false;
      game = new Game(Options);
      Highscore += 0;

      WarningPause();
      game.StartInputManager();
    }
    public static void Event_options() {
      if (isDebug) return;
      if (hasOptionFile) {
        bool useNotepad = (bool)Options.Get("openConfigInNotepad");
        string m = "Waiting for notepad" + (useNotepad ? "" : "(or something)") + " to exit...";
        game.DrawMessage(m);
        if (useNotepad) {
          Exec("notepad " + fullFileName);
        } else {
          Exec(fullFileName);
        }
        UpdateOptions();
        ClearKeyBuffer();
        game.UpdateOptions(Options);
        WarningPause();
        game.Redraw();
      } else {
        CreateConfigFile();
        game.Redraw();
      }
    }
    private static string[] helpRom = null;
    private static int helpRomIndex = 0;
    public static void Event_help() {
      if (helpRom == null) {
        helpRom = new StreamReader(GetResource("help.txt")).ReadToEnd().Replace("\r", "").Split('\n');
      }
      game.DrawMessage(helpRom[helpRomIndex]);
      helpRomIndex = (helpRomIndex + 1) % helpRom.Length;
    }
    private static void UpdateOptions() {
      string json = "{}";
      if (hasOptionFile) {
        json = File.ReadAllText(fullFileName);
      }
      Options = new Options(json, defaultJson);
    }
    private static void InitOptions(string[] argv) {
      defaultJson = new StreamReader(GetResource("default.json")).ReadToEnd();

      if (!isDebug) {
        fullFileName = directory + "\\" + optionFileName;
        if (argv.Length != 0) {
          fullFileName = argv[0];
        }
        if (!File.Exists(fullFileName)) {
          hasOptionFile = false;
        }
      } else {
        hasOptionFile = false;
      }

      UpdateOptions();
    }
    static public void CreateConfigFile() {
      Console.SetCursorPosition(0, 0);
      Console.Clear();
      Console.WriteLine("I am going to create a config file at " + fullFileName);
      Console.WriteLine("Press any key to continue...");
      Console.WriteLine("If you do not whish to continue press Esc");
      Console.WriteLine("If you whish to open the file press O");
      Keys a = FConsole.Convert( Console.ReadKey() );
      if (a == Keys.Escape) {
        Console.Clear();
        return;
      }
      File.WriteAllText(fullFileName, defaultJson);
      Console.Clear();
      hasOptionFile = true;
      if (a == Keys.O) {
        Event_options();
      }
    }
    public static Stream GetResource(string name) {
      const string location = "Snake.Resources.";
      var t = assembly.GetManifestResourceStream(location + name);
      if (t == null) {
        throw new ArgumentOutOfRangeException("ManifestResource " + location + name + " dose not exist");
      }
      return t;
    }
    private static void PrintColorWarning(string name) {
      PrintJsonWarning(name + "Color");
    }
    public static void PrintJsonWarning(string name) {
      PrintWarning(name + " is set to an invalid value");
    }
    public static void SetColor(byte color) {
      int c1 = color & 0xf;
      int c2 = (color & 0xf0) >> 4;
      Console.ForegroundColor = (ConsoleColor)c1;
      Console.BackgroundColor = (ConsoleColor)c2;
    }
    private static byte ParseColorString(string str, string name) {
      int color;
      try {
        color = (int)Enum.Parse(typeof(ConsoleColor), str);
        color |= defaultColor & 0xf0;
      } catch (ArgumentException e) {
        color = -1;
        PrintColorWarning(name);
      }
      if (color == -1) return defaultColor;
      return (byte)color;
    }
    public static byte GetColor(string name) {
      JToken token = Options.Get(name + "Color");
      int color = -1;
      if (token.Type == JTokenType.String) {
        string str = (string)token;
        if (str.Contains(",")) {
          string[] arr = str.Split(',');
          if (arr.Length != 2) {
            color = -1;
            PrintColorWarning(name);
          }
          color = (ParseColorString(arr[0], name) << 4) & 0xf0;
          color |= ParseColorString(arr[1], name) & 0x0f;
        } else {
          color = ParseColorString(str, name);
        }
      } else if (token.Type == JTokenType.Integer) {
        color = (int)token;
        if ((color < 0 || color > 255) && color != -1) {
          color = -1;
          PrintColorWarning(name);
        }
      }
      if (color == -1) return defaultColor;
      return (byte)color;
    }
    public static void MoveCursor(int x, int y) {
      MoveCursor(new Vector2(x, y));
    }
    public static void MoveCursor(Vector2 p) {
      Vector2 offset = game.offset;
      try {
        Console.SetCursorPosition(p.x + offset.x, p.y + offset.y);
      } catch (ArgumentOutOfRangeException e) {
        Console.SetCursorPosition(0,20);
      }
    }
    public static Vector2 FixPos(Vector2 a) {
      Vector2 size = game.size;
      Vector2 old = a.Copy();
      a.x = a.x - size.x * (int)Math.Floor((double)a.x / size.x);
      a.y = a.y - size.y * (int)Math.Floor((double)a.y / size.y);
      if (old != a) {
        if (game.Event_portal()) {
          a.Set(old);
          return null;
        }
      }
      return a;
    }
    private static Vector2[] dirrom = new Vector2[] { new Vector2(0, 1), new Vector2(-1, 0), new Vector2(0, -1), new Vector2(1, 0) };
    public static Vector2 DirToVector(int dir) {
      return dirrom[dir];
    }
    public static void Exec(string cmd) {
      System.Diagnostics.Process process = new System.Diagnostics.Process();
      System.Diagnostics.ProcessStartInfo startInfo = new System.Diagnostics.ProcessStartInfo();
      startInfo.WindowStyle = System.Diagnostics.ProcessWindowStyle.Hidden;
      startInfo.FileName = "cmd.exe";
      startInfo.Arguments = "/C " + cmd;
      process.StartInfo = startInfo;
      process.Start();
      process.WaitForExit();
    }
    public static void ClearKeyBuffer() {
      while (Console.KeyAvailable) Console.ReadKey(true);
    }
    private static int? _highscore = null;
    public static int Highscore {
      get {
        if (_highscore.HasValue) {
          return (int)_highscore;
        } else {
          return CryptoManager.ReadHighscore();// Properties.Settings.Default.Highscore;
        }
      }
      set {
        _highscore = value;
        CryptoManager.WriteHighscore(value);
        //Properties.Settings.Default.Highscore = value;
        //Properties.Settings.Default.Save();
      }
    }
    private const bool requireCheatingPassword = false;// = "ωαs_τнατ_ƒμη?";
    public static bool CanCheat(Options o) {
      JToken t = o.Get("cheatMode");
      //bool requireCheatingPassword = cheatingPassword != null;
      //if (isDebug) return true;
      if (t.Type == JTokenType.Boolean) {
        if ((bool)t == false) return false;
        if (requireCheatingPassword) {
          PrintWarning("cheatMode requires a password");
          return false;
        } else {
          return true;
        }
      }
      if (t.Type == JTokenType.String) {
        if (!requireCheatingPassword) return true;
        return CryptoManager.CheckPassword((string)t);
      }
      return false;
    }
    private static bool isWarning = false;
    public static void PrintWarning(string str) {
      if (!isWarning) Console.Clear();
      isWarning = true;
      Console.WriteLine("Warning: " + str);
    }
    private static void WarningPause() {
      if (isWarning == true) {
        Console.WriteLine("Press any key to continue...");
        Console.ReadKey();
        Console.Clear();
      }
      isWarning = false;
    }
  }
}
