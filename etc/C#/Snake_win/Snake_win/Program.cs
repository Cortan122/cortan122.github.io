using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Snake_win {
  static class Program {
    /// <summary>
    /// The main entry point for the application.
    /// </summary>
    [STAThread]
    static void Main() {
      Form1 f = Form1.Init();
      Control.CheckForIllegalCrossThreadCalls = false;
      f.Clear();
      Console.WriteLine("10");
      f.Write("122\n124\n125-00000000000000000000000000000000000000000000");
      f.Read();
      f.SetCursorPos(0,0);
      f.Write("123");
    }
  }
}
