using System;
using System.Drawing;
using System.Linq;
using System.Threading;
using System.Windows.Forms;
using System.Text;
using System.Collections.Generic;

namespace Snake {
  public partial class Form1 : Form {
    private System.ComponentModel.IContainer components = null;

    protected override void Dispose(bool disposing) {
      if (disposing && (components != null)) {
        components.Dispose();
      }
      base.Dispose(disposing);
    }

    private void InitializeComponent() {
      this.SuspendLayout();
      this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
      this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
      this.ClientSize = new System.Drawing.Size(600, 450);
      this.Name = "Form1";
      this.Text = "Snake";
      this.Load += new System.EventHandler(this.Form1_Load);
      this.ResumeLayout(false);
    }

    static public Form1 Init() {
      Application.EnableVisualStyles();
      Application.SetCompatibleTextRenderingDefault(false);
      Form1 t = new Form1();
      var tr = new Thread(() => Application.Run(t));
      tr.Start();
      return t;
    }

    public Form1(int x=-1,int y = -1) {
      if (x == -1) {
        x = (int)Math.Ceiling(WindowMover.WM.ScreenWidth);
      }
      if (y == -1) {
        y = (int)Math.Ceiling(WindowMover.WM.ScreenHeight);
      }
      InitializeComponent();
      g = Graphics.FromImage(bitmap = new Bitmap(x, y));
    }

    private void Form1_Load(object sender, EventArgs e) {
      this.DoubleBuffered = true;
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
      Color.DarkGray, Color.Blue, Color.LimeGreen, Color.Cyan,
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
    public int bufferWidth {
      get {
        if (drawFont == null) InitFont();
        return (int)Math.Ceiling(/*bitmap.Width*/ClientRectangle.Width / drawFont.Size);
      } set {
        throw new NotImplementedException();
      }
    }
    public int bufferHeight {
      get {
        if (drawFont == null) InitFont();
        return (int)Math.Ceiling(ClientRectangle.Height / drawFont.Size);
      }
      set {
        throw new NotImplementedException();
      }
    }

    private void InitFont() {
      drawFont = new Font("Courier New", 10);
      float t = drawFont.Height / drawFont.Size;
      g.ResetTransform();
      g.ScaleTransform(t, 1);
    }

    private IEnumerable<string> Split(string str, int chunkSize) {
      return Enumerable.Range(0, str.Length / chunkSize)
          .Select(i => str.Substring(i * chunkSize, chunkSize));
    }

    private void Draw() {
      if (cursorPos == null || nextStr == null) {
        return;
      }

      if (drawFont == null) InitFont();

      //this.Text = r.Next(0, 100).ToString("00");
      var sf = g.MeasureString(nextStr, drawFont);
      //Console.WriteLine(cursorPos);
      var s = drawFont.Size;
      var h = drawFont.Height-1f;
      g.FillRectangle(bgBrush, cursorPos.X * s, cursorPos.Y * h, sf.Width, sf.Height);
      g.DrawString(nextStr, drawFont, fgBrush, cursorPos.X * s, cursorPos.Y * h);

      this.Refresh();
      this.Update();
    }

    private void Draw(object sender, PaintEventArgs e) {
      //Console.WriteLine("redraw");
      //this.Draw();

      e.Graphics.DrawImage(bitmap, 0, 0);

      drawSignalEvent.Set();
    }

    public void Clear() {
      fgBrush = new SolidBrush(Color.White);
      bgBrush = new SolidBrush(Color.Black);
      g.Clear(bgBrush.Color);
      cursorPos = new Point(0, 0);
      drawSignalEvent.Reset();
      this.Refresh();
      this.Update();
      drawSignalEvent.WaitOne();
    }

    public void Write(string s) {
      if (s.Contains('\n')) {
        var arr = s.Split('\n');
        foreach (string l in arr) {
          WriteLine(l);
        }
        return;
      }
      if(s.Length > bufferWidth) {
        Write(String.Join("\n",Split(s, bufferWidth)));
        return;
      }
      if(s.Length > 1) {
        var arr = Split(s,1);
        foreach (string l in arr) {
          Write(l);
        }
        return;
      }
      nextStr = s;
      Draw();
      cursorPos.X += s.Length;
    }

    public void SetCursorPos(int x, int y) {
      cursorPos.X = x;
      cursorPos.Y = y;
    }

    public void WriteLine(string s) {
      Write(s);
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
    public string Title { get { return form.Text; } set { form.Text = value; } }
    public ConsoleColor ForegroundColor { get { return form.fgColor; } set { form.fgColor = value; } }
    public ConsoleColor BackgroundColor { get { return form.bgColor; } set { form.bgColor = value; } }
    public int BufferWidth { get { return form.bufferWidth; } set { form.bufferWidth = value; } }
    public int BufferHeight { get { return form.bufferHeight; } set { form.bufferHeight = value; } }

    //does nothing
    public bool CursorVisible { get; set; }
    public Encoding OutputEncoding { get; set; }

    public void Clear() {
      form.Clear();
    }

    public void Write(string s) {
      form.Write(s);
    }

    public void Write(char s) {
      Write(s.ToString());
    }

    public void Write(char? s) {
      if (s.HasValue) Write(s.Value);
    }

    public void SetCursorPosition(int x, int y) {
      form.SetCursorPos(x, y);
    }

    public void WriteLine(string s) {
      form.WriteLine(s);
    }

    public void Read() {
      form.Read();
    }

    public KeyEventArgs ReadKey(bool t = true) {
      //bool t does nothing
      return form.ReadKey();
    }

    public static Keys Convert(ConsoleKeyInfo t) {
      return (Keys)Enum.Parse(typeof(Keys), t.Key.ToString());
    }

    public static Keys Convert(KeyEventArgs t) {
      return t.KeyCode;
    }
  }
}

