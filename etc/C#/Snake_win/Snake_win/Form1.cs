using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Snake_win {
  public partial class Form1 : Form {
    static public Form1 Init() {
      Application.EnableVisualStyles();
      Application.SetCompatibleTextRenderingDefault(false);
      Form1 t = new Form1();
      var tr = new Thread(() => Application.Run(t));
      tr.Start();
      return t;
    }

    public Form1() {
      InitializeComponent();
      g = Graphics.FromImage(bitmap = new Bitmap(500, 500));
    }

    private void Form1_Load(object sender, EventArgs e) {
      //this.DoubleBuffered = true;
      //g = Graphics.FromImage(bitmap = new Bitmap(500,500));
      this.Paint += Draw;
      this.KeyDown += KeyPressed;
    }

    ManualResetEvent drawSignalEvent = new ManualResetEvent(false);
    ManualResetEvent keySignalEvent = new ManualResetEvent(false);
    Random r = new Random();
    readonly static Color[] colorRom = new Color[]{
      Color.Black , Color.DarkBlue , Color.DarkGreen, Color.DarkCyan,
      Color.DarkRed, Color.DarkMagenta,/*Color.DarkYellow*/Color.SandyBrown, Color.Gray,
      Color.DarkGray, Color.Blue, Color.Green, Color.Cyan,
      Color.Red, Color.Magenta, Color.Yellow, Color.White
    };


    private void KeyPressed(object sender, KeyEventArgs e) {
      keySignalEvent.Set();
      lastKey = e;
      keyAvailable = true;
    }

    KeyEventArgs lastKey;
    Graphics g;
    Bitmap bitmap;
    Point cursorPos;
    Font drawFont;
    SolidBrush fgBrush = new SolidBrush(Color.White);
    SolidBrush bgBrush = new SolidBrush(Color.Black);
    string nextStr = null;
    bool keyAvailable = false;
    public bool KeyAvailable { get { return keyAvailable; } }
    public ConsoleColor fgColor {
      get {
        return (ConsoleColor)Array.IndexOf(colorRom, fgBrush.Color);
      }
      set {
        fgBrush.Dispose();
        fgBrush = new SolidBrush(colorRom[(int)value]);
      }
    }
    public ConsoleColor bgColor {
      get {
        return (ConsoleColor)Array.IndexOf(colorRom, bgBrush.Color);
      }
      set {
        bgBrush.Dispose();
        bgBrush = new SolidBrush(colorRom[(int)value]);
      }
    }

    private void InitFont() {
      drawFont = new Font("Consolas", 10);
      float t = drawFont.Height / drawFont.Size;
      g.ResetTransform();
      g.ScaleTransform(t, 1);
    }

    private void Draw() {
      if (cursorPos == null || nextStr == null) {
        return;
      }

      if (drawFont == null) InitFont();

      this.Text = r.Next(0, 100).ToString("00");
      var sf = g.MeasureString(nextStr, drawFont);
      Console.WriteLine(cursorPos);
      g.FillRectangle(bgBrush, cursorPos.X * drawFont.Size, cursorPos.Y * drawFont.Height, sf.Width,sf.Height);
      g.DrawString(nextStr, drawFont, fgBrush, cursorPos.X * drawFont.Size, cursorPos.Y * drawFont.Height);

      this.Refresh();
      this.Update();
    }

    private void Draw(object sender, PaintEventArgs e) {
      Console.WriteLine("redraw");
      //this.Draw();

      e.Graphics.DrawImage(bitmap,0,0);

      drawSignalEvent.Set();
    }

    public void Clear() {
      fgBrush = new SolidBrush(Color.White);
      bgBrush = new SolidBrush(Color.Black);
      g.Clear(bgBrush.Color);
      cursorPos = new Point(0, 0);
      this.Refresh();
      this.Update();
      drawSignalEvent.Reset();
      drawSignalEvent.WaitOne();
    }

    public void Write(string s) {
      if (s.Contains('\n')) {
        var arr = s.Split('\n');
        foreach(string l in arr) {
          WriteLine(l);
        }
        return;
      }
      nextStr = s;
      Draw();
    }

    public void SetCursorPos(int x,int y) {
      cursorPos.X = x;
      cursorPos.Y = y; 
    }

    public void WriteLine(string s) {
      nextStr = s;
      Draw();
      cursorPos.X = 0;
      cursorPos.Y++;
    }

    public void Read() {
      keySignalEvent.Reset();
      keySignalEvent.WaitOne();
      keyAvailable = false;
    }

    public KeyEventArgs ReadKey() {
      if (!keyAvailable) {
        keySignalEvent.Reset();
        keySignalEvent.WaitOne();
      }
      keyAvailable = false;
      return lastKey;
    }
  }

  public class FConsole {
    public FConsole() {
      form = Form1.Init();
      Control.CheckForIllegalCrossThreadCalls = false;
      form.Clear();
    }

    public Form1 form;

    public bool KeyAvailable { get { return form.KeyAvailable; } }

    public void Clear() {
      form.Clear();
    }

    public void Write(string s) {
      form.Write(s);
    }

    public void SetCursorPos(int x, int y) {
      form.SetCursorPos(x,y);
    }

    public void WriteLine(string s) {
      form.WriteLine(s);
    }

    public void Read() {
      form.Read();
    }

    public KeyEventArgs ReadKey() {
      return form.ReadKey();
    }
  }
}
