using System;

namespace WindowMover {
  using System.Runtime.InteropServices;
  using System.Diagnostics;
  using System.Windows;
  using Snake;

  static class WM {
    public static double ScreenWidth = SystemParameters.VirtualScreenWidth;
    public static double ScreenHeight = SystemParameters.VirtualScreenHeight;

    [DllImport("user32.dll", EntryPoint = "SetWindowPos")]
    public static extern IntPtr SetWindowPos(IntPtr hWnd, int hWndInsertAfter, int x, int Y, int cx, int cy, int wFlags);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    static extern bool GetWindowRect(HandleRef hWnd, out RECT lpRect);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
      public int Left;        // x position of upper-left corner
      public int Top;         // y position of upper-left corner
      public int Right;       // x position of lower-right corner
      public int Bottom;      // y position of lower-right corner
    }

    static IntPtr handle = IntPtr.Zero;

    public static void Move(int x = 0, int y = 0) {
      //const short SWP_NOMOVE = 0X2;
      const short SWP_NOSIZE = 1;
      const short SWP_NOZORDER = 0X4;
      const int SWP_SHOWWINDOW = 0x0040;

      if (handle == IntPtr.Zero) handle = Process.GetCurrentProcess().MainWindowHandle;
      SetWindowPos(handle, 0, x, y, 0, 0, SWP_NOZORDER | SWP_NOSIZE | SWP_SHOWWINDOW);
    }

    public static Vector2 GetWindowSize() {
      RECT rct;
      if (handle == IntPtr.Zero) handle = Process.GetCurrentProcess().MainWindowHandle;
      GetWindowRect(new HandleRef(new object(), handle), out rct);

      return new Vector2(rct.Right - rct.Left + 1, rct.Bottom - rct.Top + 1);
    }

    public static Vector2 GetScreenSize() {
      return new Vector2((int)ScreenWidth, (int)ScreenHeight);
    }
  }
}

