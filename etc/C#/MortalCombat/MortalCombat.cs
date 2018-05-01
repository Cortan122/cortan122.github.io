// Decompiled with JetBrains decompiler
// Type: MortalCombat.Program
// Assembly: MortalCombat, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null
// MVID: 748B789D-36A3-4E4D-9E2F-0E03E7807A26
// Assembly location: C:\Users\Константин\Desktop\MortalCombat.exe

using System;
using System.Threading;

namespace MortalCombat
{
  internal class Program
  {
    private static void Main(string[] args)
    {
      Program.firstStage();
      Thread.Sleep(400);
      Program.firstStage();
      Thread.Sleep(400);
      Program.mainStage();
      Program.mainStage();
      Program.mainMainStage();
      Program.mainMainStage();
      Program.firstStage();
      Thread.Sleep(400);
      Program.firstStage();
      Thread.Sleep(400);

      Console.ReadLine();
    }

    private static void mainMainStage()
    {
      Program.miniMainMainStage(350, 10);
      Program.miniMainMainStage(310, 10);
      Program.miniMainMainStage(290, 60);
      Beep(275, 250);
      Thread.Sleep(20);
      Beep(275, 250);
      Thread.Sleep(20);
      Beep(300, 240);
      Thread.Sleep(20);
      Beep(305, 250);
      Thread.Sleep(20);
      Beep(280, 270);
      Thread.Sleep(20);
      Beep(290, 250);
      Thread.Sleep(20);
      Beep(265, 250);
      Thread.Sleep(20);
      Beep(280, 250);
      Thread.Sleep(40);
    }

    private static void miniMainMainStage(int c, int add)
    {
      Beep(c, 250);
      Thread.Sleep(20);
      Beep(c, 250);
      Thread.Sleep(20);
      Beep(c + 30, 240);
      Thread.Sleep(20);
      Beep(c, 250);
      Thread.Sleep(20);
      Beep(c + 40 + add, 270);
      Thread.Sleep(20);
      Beep(c + 30 + add / 2, 250);
      Thread.Sleep(20);
      Beep(c - 10 + add / 4, 250);
      Thread.Sleep(20);
      Beep(c + add / 4, 250);
      Thread.Sleep(20);
    }

    private static void firstStage()
    {
      Beep(400, 350);
      Thread.Sleep(120);
      Beep(405, 240);
      Thread.Sleep(120);
      Beep(395, 240);
      Thread.Sleep(150);
      Beep(400, 250);
      Thread.Sleep(50);
      Beep(370, 230);
      Thread.Sleep(50);
      Beep(410, 240);
      Thread.Sleep(50);
      Beep(400, 350);
      Thread.Sleep(120);
      Beep(405, 240);
      Thread.Sleep(120);
      Beep(395, 240);
      Thread.Sleep(150);
      Beep(410, 300);
      Thread.Sleep(50);
      Beep(350, 200);
      Thread.Sleep(50);
      Beep(400, 240);
      Thread.Sleep(50);
      Beep(400, 350);
      Thread.Sleep(120);
      Beep(405, 240);
      Thread.Sleep(120);
      Beep(395, 240);
      Thread.Sleep(150);
      Beep(410, 300);
      Thread.Sleep(50);
      Beep(390, 240);
      Thread.Sleep(50);
      Beep(400, 240);
      Thread.Sleep(50);
      Beep(400, 300);
      Thread.Sleep(120);
      Beep(405, 240);
      Thread.Sleep(150);
      Beep(400, 300);
      Beep(410, 120);
      Beep(400, 300);
      Beep(390, 200);
      Beep(400, 300);
    }

    private static void mainStage()
    {
      Program.miniMainStage();
      Program.miniMainStage();
      Program.miniMainStage();
      Beep(400, 160);
      Thread.Sleep(40);
      Beep(400, 190);
      Thread.Sleep(40);
      Beep(400, 160);
      Thread.Sleep(30);
      Beep(430, 250);
      Thread.Sleep(40);
      Beep(370, 150);
      Thread.Sleep(20);
      Beep(370, 200);
      Thread.Sleep(40);
      Beep(350, 170);
      Thread.Sleep(20);
      Beep(360, 250);
      Thread.Sleep(40);
      Beep(390, 250);
      Thread.Sleep(300);
    }

    private static void miniMainStage()
    {
      Beep(400, 160);
      Thread.Sleep(40);
      Beep(400, 190);
      Thread.Sleep(40);
      Beep(400, 160);
      Thread.Sleep(30);
      Beep(430, 250);
      Thread.Sleep(40);
      Beep(400, 150);
      Thread.Sleep(20);
      Beep(400, 200);
      Thread.Sleep(40);
      Beep(400, 170);
      Thread.Sleep(20);
      Beep(400, 250);
      Thread.Sleep(40);
      Beep(360, 260);
      Thread.Sleep(40);
      Beep(390, 260);
      Thread.Sleep(70);
    }

    private const char lineChar = '\u2588';
    private const bool lineMode = false;

    private static void Beep(int frequency,int duration){
      Console.Beep(frequency,duration);
      if(lineMode){
        Console.WriteLine(frequency+" "+duration);
      }else{ 
        //Console.SetCursorPosition(0,0);
        frequency -= 200;
        frequency = /*Math.Floor*/(frequency/10);
        //Console.Clear();
        Console.WriteLine(new String(lineChar, frequency)+ new String(' ', 10));
      }
    }
  }
}
