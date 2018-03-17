using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;

namespace lines
{
	public class Main
	{
		public Main ()
		{
			_instance = this;
		}
		static public Main Instance
		{
			get { return _instance; }
		}

		static private Main _instance;

		public void run()
		{
			Console.CursorVisible = false;
			Console.BackgroundColor = ConsoleColor.Black;
			Console.ForegroundColor = ConsoleColor.White;

			i = 100;
			dotick = true;
			frameBuffer = new FrameBuffer (0, 0, Console.WindowWidth, Console.WindowHeight - 1);
			if (doring2)
			{
				if (ringScale > 1)
				{
					range1 = (int)(range * ringScale);
				}
				else { range1 = range; }
				offset = new Vector(range1 , range1);
			}else{
				range1 = range;
				offset = new Vector (range1 * 2 - 1, range1);
			}
			if (drawgrid == false ||doring2 == true)
			{
				grid = Vector.MakeGrid( - range1, range1 + 1);
			}
			else  
			{
				grid = Vector.MakeGrid(new Vector(-range1 * 2,  - range1), new Vector(range1 * 2, range1 + 1));
			}
			ring = new List<Vector>();
			ringN = new List<Vector>();
			ring2 = new List<Vector>();
			foreach (var item in grid) {
				if (range == item.CircleDistance(0, 0))
				{
					ring.Add(item);
					if (ringScale == 1)
					{
						ring2.Add(item);
					}
					//FrameBuffer.Instance.SetChixel (item.x + 10, item.y + 10, '.');
				}
				else if ((int)(range*ringScale) == item.CircleDistance(0, 0) && doring2) {
					ring2.Add(item);
				}
				else { ringN.Add(item); }
			}
			ring = ring.OrderBy (o => Math.Atan (o.y / (o.x + 0.1))).ToList ();
			ring2 = ring2.OrderBy(o => Math.Atan(o.y / (o.x + 0.1))).ToList();
			while (dotick) {
				Thread.Sleep (10);
				doTick ();
				Update_Keyboard ();

				//Update_Keyboard_1 ();
			
			}
		}
		public void doTick()
		{
			int sinI;
			if (FrameBuffer.Instance.reset > 1) { frameBuffer = new FrameBuffer(0, 0, Console.WindowWidth, Console.WindowHeight - 1); }
			if (drawgrid)
			{
				if (drawrings)
				{
					foreach (var item in ringN) { FrameBuffer.Instance.SetChixel(item.x + offset.x, item.y + offset.y, '¤', ConsoleColor.Black); }
				}
				else { foreach (var item in grid) { FrameBuffer.Instance.SetChixel(item.x + offset.x, item.y + offset.y, '¤', ConsoleColor.Black); }}
			}
			if (drawrings)
			{
				foreach (var item in ring) { FrameBuffer.Instance.SetChixel(item.x + offset.x, item.y + offset.y, '¤', ConsoleColor.Green); }
				if (ringScale != 1) { foreach (var item in ring2) { FrameBuffer.Instance.SetChixel(item.x + offset.x, item.y + offset.y, '¤', ConsoleColor.DarkGreen); } }
			}
			if (doring2 == false)
			{
				sinI = (int)(Math.Sin(i / (float)(range * rep)) * 2 * range);

				for (int q = 0; q < rep; q++)
				{
					Draw1(ring.ToArray(), i + q, new Vector(sinI, 0), offset);
				}
			}
			else {
				sinI = (int)(i/(0.5*rep) * (ringScale))+ring2.ToArray().GetLength(0)/2;
				sinI = (sinI % (ring2.ToArray().GetLength(0)-1));
				for (int Q = 0; Q < 2; Q++)
				{
					for (int q = 0; q < rep; q++)
					{
						try { Draw1(ring.ToArray(), i + q, ring2.ToArray()[sinI + Q], offset); } catch { }
					}
				}
			}
			int amount = FrameBuffer.Instance.DrawFrame ();
			Console.Beep (100,1);
			Console.SetCursorPosition(0, Console.WindowHeight-2);
			Console.WriteLine ("Hello World!"+sinI +"  "+amount+"    ");
			i += rep/2;

		}
		void Draw1 (Vector[] ring,int i,Vector vector1 = null,Vector offset = null,ConsoleColor cl = ConsoleColor.Yellow)
		{
			if (vector1 == null) 
			{
				vector1 = new Vector(0,0);
			}
			if (offset == null) 
			{
				offset = new Vector(0,0);
			}
			i = i % ring.GetLength(0);
			//vector.GeneratePath(vector1);
			Vector vector = ring[i];
			Vector.DrawPath(vector.GeneratePath(vector1),cl,offset);

		}
		void ShowSetings(int m = 0)
		{
			Console.CursorVisible = true;
			Console.BackgroundColor = ConsoleColor.White;
			Console.ForegroundColor = ConsoleColor.Black;
			int Try;
			double TryD;
			string s;
			dotick = false;
			do
			{
				Console.SetCursorPosition (0, Console.WindowHeight - 7);
				Console.WriteLine ("Setings?");
				s =  Console.ReadLine ();
				if(s == "" ){return;}
			}while(false == int.TryParse(s,out m));
			switch (m)
			{
			case 1:
				Console.SetCursorPosition (0, Console.WindowHeight - 4);
				Console.WriteLine ("rep");
				int.TryParse (Console.ReadLine (), out Try);
				if (Try > 1) {
					rep = Try;
					//run ();
				}else rep = 2;
				dotick = true;
				break;
			case 2:
				Console.SetCursorPosition (0, Console.WindowHeight - 4);
				Console.WriteLine ("range");
				int.TryParse(Console.ReadLine (),out Try);
					if (Try > 0)
					{
						range = Try;
						//run ();
					}
					else range = 10;
				break;
			case 3:
				Console.SetCursorPosition (0, Console.WindowHeight - 4);
				Console.WriteLine ("drawgrid");
				int.TryParse(Console.ReadLine (),out Try);
				if (Try == 1) {
					drawgrid = true;
					//run ();
				}else {drawgrid = false;}
				dotick = true;
				break;
			case 4:
				Console.SetCursorPosition(0, Console.WindowHeight - 4);
				Console.WriteLine("doring2");
				int.TryParse(Console.ReadLine(), out Try);
				if (Try == 1)
				{
					doring2 = true;
					//run ();
				}
				else { doring2 = false; }
				//dotick = true;
				break;
			case 5:
					Console.SetCursorPosition(0, Console.WindowHeight - 4);
					Console.WriteLine("ringScale");
					double.TryParse(Console.ReadLine(), out TryD);
					if (TryD > 0)
					{
						ringScale = TryD;
						//run ();
					}
					else ringScale = 1.0;
				break;
			case 6:
				Console.SetCursorPosition(0, Console.WindowHeight - 4);
				Console.WriteLine("drawrings");
				int.TryParse(Console.ReadLine(), out Try);
				if (Try == 1)
				{
					drawrings = true;
					//run ();
				}
				else { drawrings = false; }
				dotick = true;
				break;
			default:
				dotick = true;
				break;
			}
			//dotick = true;
			
		}
		#region prams
		FrameBuffer frameBuffer;
		bool dotick;
		int range = 20;
		int i;
		int rep = 2;
		public Vector offset { get; protected set; }
		Vector[,] grid;
		List<Vector> ring;
		List<Vector> ring2;
		List<Vector> ringN;
		bool doring2 = true;
		bool drawgrid = true;
		bool drawrings = true;
		double ringScale = 1.1;
		int range1;
		#endregion
		//Vector[,,] abc;


		//Console.
		public void Update_Keyboard ()
		{
			if (Console.KeyAvailable) {
				// Read one key
				ConsoleKeyInfo cki = Console.ReadKey ();
				if (cki.Key == ConsoleKey.RightArrow || cki.Key == ConsoleKey.NumPad6)
				{
					this.offset = this.offset.Add(1, 0);
					FrameBuffer.Instance.Clear();
				}
				else if (cki.Key == ConsoleKey.LeftArrow || cki.Key == ConsoleKey.NumPad4)
				{
					this.offset = this.offset.Add(-1, 0);
					FrameBuffer.Instance.Clear();
				}
				else if (cki.Key == ConsoleKey.UpArrow || cki.Key == ConsoleKey.NumPad8)
				{
					this.offset = this.offset.Add(0, -1);
					FrameBuffer.Instance.Clear();
				}
				else if (cki.Key == ConsoleKey.DownArrow || cki.Key == ConsoleKey.NumPad2)
				{
					this.offset = this.offset.Add(0, 1);
					FrameBuffer.Instance.Clear();
				}
				else if (cki.Key == ConsoleKey.NumPad7 || cki.Key == ConsoleKey.Home)
				{
					this.offset = this.offset.Add(-1, -1);
					FrameBuffer.Instance.Clear();
				}
				else if (cki.Key == ConsoleKey.NumPad9 || cki.Key == ConsoleKey.PageUp)
				{
					this.offset = this.offset.Add(1, -1);
					FrameBuffer.Instance.Clear();
				}
				else if (cki.Key == ConsoleKey.NumPad3 || cki.Key == ConsoleKey.PageDown)
				{
					this.offset = this.offset.Add(1, 1);
					FrameBuffer.Instance.Clear();
				}
				else if (cki.Key == ConsoleKey.NumPad1 || cki.Key == ConsoleKey.End)
				{
					this.offset = this.offset.Add(-1, 1);
					FrameBuffer.Instance.Clear();
				}
				else if (cki.Key == ConsoleKey.Spacebar || cki.Key == ConsoleKey.Enter)
				{
					this.ShowSetings();
				}
				else if (cki.Key == ConsoleKey.Escape )
				{
					dotick = false;
				}
			}
			
		}


	}
}

