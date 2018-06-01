using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Threading;
using System.Windows.Forms;
using System.IO;
using System.Reflection;
using System.Text.RegularExpressions;

namespace passwd_kraken {
  public partial class Form1 : Form {

    object execLock = new object();
    readonly Assembly assembly;
    bool canDoPython;
    bool canDoNodejs;
    const string dirpath = "./.data";

    public Form1() {
      InitializeComponent();
      assembly = Assembly.GetExecutingAssembly();
      //Init();
    }

    void setCursor(Cursor c) {
      this.Cursor = c;
      setCursor(this.Controls, c);
    }

    void setCursor(Control.ControlCollection theControls, Cursor c) {
      foreach (Control control in theControls) {
        if (control.HasChildren) {
          setCursor(control.Controls,c);
        } else {
          control.Cursor = c;
        }
      }
    }

    Stream GetResource(string name) {
      const string location = "passwd_kraken.Resources.";
      var t = assembly.GetManifestResourceStream(location + name);
      if (t == null) {
        throw new ArgumentOutOfRangeException("ManifestResource " + location + name + " dose not exist");
      }
      return t;
    }

    void LoadResource(string name,string path) {
      StreamWriter outstr = File.CreateText(path);
      StreamReader instr = new StreamReader(GetResource(name));
      outstr.Write(instr.ReadToEnd());
      outstr.Dispose();
      instr.Dispose();
    }

    void LoadResource(string name, bool force = false) {
      string path = dirpath + "/" + name;
      if (!File.Exists(path) || force) {
        LoadResource(name, path);
      }
    }

    void InitAsync(bool force = false) {
      Thread t = new Thread(() => { Init(force); });
      t.Start();
    }

    void Initpy(bool force = false) {
      LoadResource("auto.py", force);
      LoadResource("solve.bat", force);
    }

    void Initjs(bool force = false) {
      const string examplepath = dirpath + "/examples";
      if (!Directory.Exists(examplepath)) {
        Directory.CreateDirectory(examplepath);
      }
      LoadResource("passwder.js", force);
      LoadResource("make.bat", force);
      LoadResource("source.c", force);
    }

    void Init(bool force=false) {
      const string respath = dirpath + "/test_results.txt";
      const string testpath = dirpath + "/check.bat";
      if (!Directory.Exists(dirpath)) {
        DirectoryInfo di = Directory.CreateDirectory(dirpath);
        di.Attributes = FileAttributes.Directory | FileAttributes.Hidden;
      }
      if (!File.Exists(respath) || force) {
        LoadResource("check.bat", testpath);
        ExecResource("check.bat");
        StreamWriter r = File.CreateText(respath);
        r.Write(textBox1.Text);
        r.Dispose();
      }
      string str = File.ReadAllText(respath);
      if (str == "" || str == "\r\n") {
        File.Delete(respath);
        throw new Exception("why?");
      }
      Regex re = new Regex(@"[a-z A-Z\r0-9]");
      string striped = re.Replace(str, "").Replace("\n\n","\n");
      bool[] arr = striped.Split('\n').Select(e=>e=="+").ToArray();
      canDoNodejs = arr[0] && arr[1] && arr[2];
      canDoPython = arr[3] && arr[4] && arr[5];

      if (canDoNodejs || force) Initjs();
      if (canDoPython || force) Initpy();
      if (canDoPython || canDoNodejs || force) {
        LoadResource("options.json", force);
      }
    }

    void WriteLine(string line) {
      textBox1.AppendText(line + "\r\n");
      Console.WriteLine(line);
    }

    void Clear() {
      textBox1.Clear();
      setCursor(Cursors.WaitCursor);
      //textBox1.UseWaitCursor = true;
    }

    void unClear() {
      setCursor(Cursors.Arrow);
      //textBox1.UseWaitCursor = false;
    }

    void ExecAsync(string cmd) {
      Thread t = new Thread(() => { Exec(cmd); });
      t.Start();
    }

    void ExecResource(string name) {
      Exec("\".\\.data\\" + name + "\"");
    }

    void ExecResourceAsync(string name) {
      ExecAsync("\".\\.data\\" + name + "\"");
    }

    void Exec(string cmd) {
      WriteLine("cmd " + "/c " + cmd);
      //return;
      lock (execLock) {
        Clear();
        ProcessStartInfo startInfo = new ProcessStartInfo("cmd", "/c " + cmd) {
          WindowStyle = ProcessWindowStyle.Hidden,
          UseShellExecute = false,
          RedirectStandardOutput = true,
          CreateNoWindow = true
        };

        Process process = Process.Start(startInfo);
        process.OutputDataReceived += (sender, e) => WriteLine(e.Data);
        process.ErrorDataReceived += (sender, e) => WriteLine(e.Data);
        //process.Exited += (sender, e) => process.Dispose();
        process.BeginOutputReadLine();
        process.WaitForExit();
        process.Dispose();
        //We may not have received all the events yet!
        //Thread.Sleep(5000);
        unClear();
      }
    }

    void button1_Click(object sender, EventArgs e) {
      if (canDoPython) {
        ExecResourceAsync("solve.bat");
      } else {
        Clear();
        WriteLine("you need to install some more things");
      }
    }

    void button3_Click(object sender, EventArgs e) {
      InitAsync(true);
    }

    void Form1_Load(object sender, EventArgs e) {
      InitAsync();
    }

    void button2_Click(object sender, EventArgs e) {
      if (canDoNodejs) {
        ExecResourceAsync("make.bat");
      } else {
        Clear();
        WriteLine("you need to install some more things");
      }
    }
  }
}
