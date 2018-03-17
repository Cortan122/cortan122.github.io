using System;
using System.Collections.Generic;
using System.Linq;

namespace lines
{
	class MainClass
	{
		public static void Main (string[] args)
		{
			do {
				Main main = new Main ();
				do {
				main.run ();
				}while(true);//if false true restart
			} while(true);//fi false program ends
			Console.WriteLine ("program ended");
			Console.ReadLine ();
		}
			/*
			FrameBuffer frameBuffer = new FrameBuffer (0,0,Console.WindowWidth,Console.WindowHeight-1);
			//double k = 1;
			int range = 20;
			int i = 100;
			int rep = 20;
			Vector offset = new Vector(range*2-1, range);
			Vector[,] grid = Vector.Grid(-1-range,range+1);
			List<Vector> ring = new List<Vector>();
			foreach (var item in grid) {
				if (range == item.CircleDistance (0, 0)) {
					ring.Add (item);
					frameBuffer.SetChixel (item.x+10, item.y+10, '.');
				}
			}
			ring = ring.OrderBy(o=>Math.Atan(o.y/(o.x+0.1))).ToList();
			do{
				if(frameBuffer.reset > 1){frameBuffer = new FrameBuffer (0,0,Console.WindowWidth,Console.WindowHeight-1);}
				for (int x = 0; x < Console.WindowWidth; x++) {
					for (int y = 0; y < Console.WindowHeight; y++) {
						//frameBuffer.SetChixel (x, y, '.');
						//Console.Write (x+y+"\t");
					}
				}
				foreach (var item in ring) {frameBuffer.SetChixel (item.x+offset.x, item.y+offset.y, '¤',ConsoleColor.Green);}
				//k = double.Parse(Duble);
				int sinI  = (int)(Math.Sin(i/(float)(range*rep))*2*range);
				for (int q = 0; q < rep; q++) {
					Draw1 (ring.ToArray(),i+q,new Vector(sinI,0),offset);
				}
				//Console.Beep (100,10000);	
				//Console.ReadLine ();
				frameBuffer.DrawFrame ();
				Console.Beep (100,1);
				Console.SetCursorPosition(0, Console.WindowHeight-2);
				Console.WriteLine ("Hello World!"+sinI+"  ");
				//Duble = Console.ReadLine ();
				i += rep/2;
			}while(true);
			//Console.ReadLine ();*/




	}
}
