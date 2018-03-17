using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Diagnostics;
namespace flow
{
	public class Main
	{
		//int i1;
		int spase = 8;
		public int Spec, Gen;
		public Stopwatch s;
		FrameBuffer frameBuffer;
		public Random r;
		public Game game;
		public Network[] nets;
		public Main()
		{
			_instance = this;
		}
		static public Main Instance
		{
			get { return _instance; }
		}

		static Main _instance;

		public void run()
		{
			s = new Stopwatch();
			s.Start();
			r = new Random();
			nets = new Network[spase];
			Console.CursorVisible = false;
			Console.BackgroundColor = ConsoleColor.Black;
			Console.ForegroundColor = ConsoleColor.White;
			frameBuffer = new FrameBuffer(0, 0, Console.WindowWidth, Console.WindowHeight - 1);
			bool bol = true;
			do
			{
				for (int i = 0; i < spase; i++)
				{
					if (bol) { nets[i] = new Network(); } else if(i == 0){ i = spase/2; }
					Spec = i;
					game = new Game();
					nets[i].score = game.run(nets[i]);
					//Console.ReadLine();

				}
				nets = nets.OrderByDescending(o => o.score).ToArray();
				for (int i = 0; i < nets.Length / 2; i++)
				{
					Network n = Network.DeepClone(nets[i]);
					n.Mutate();
					nets[i+(nets.Length / 2)] = n;
				}
				//Console.ReadLine();
				bol = false;
				Gen++;
			} while (true);
		}
	}
	public class Game{
		public int run(Network net)
		{
			Main.Instance.s.Restart();
		    r = new Random(122);
			Tile.MakeGrid(new Vector(4, 4));
			SpawnTile();
			UpdateBestValue();
			//net = new Network();
			this.net = net;
			while (failedMoves < 20)
			{
				//Console.ReadLine();
				Thread.Sleep(1);
				doTick();
				Draw();
				int amount = FrameBuffer.Instance.DrawFrame();
				int FPS = (int)(1000 * i1 / (0.001 + Main.Instance.s.ElapsedMilliseconds));
				Console.ForegroundColor = ConsoleColor.Green;
				//Console.SetCursorPosition(0, Console.WindowHeight - 3);
				//Console.WriteLine(amount + "    " + FPS + "    " + score + "    " + failedMoves + "     ");
				Console.SetCursorPosition(20, 0);
				Console.WriteLine("FPS:" + FPS + "    ");
				Console.SetCursorPosition(20, 2);
				Console.WriteLine("score:" + score + "    ");
				Console.SetCursorPosition(20, 4);
				Console.WriteLine("failedMoves:" + failedMoves + "    ");
				Console.SetCursorPosition(20, 6);
				Console.WriteLine("amount:" + amount + "    ");
				Console.SetCursorPosition(20, 8);
				Console.WriteLine("Species:" + Main.Instance.Spec + "    ");
				Console.SetCursorPosition(20, 10);
				Console.WriteLine("Gen:" + Main.Instance.Gen + "    ");
				i1++;
				int i = 0;
				foreach (var item in net.Layers[1].Nodes)
				{
					Console.SetCursorPosition(10, i);
					Console.WriteLine(Math.Round(item.Value, 2) + "    ");
					i++;
				}
				i = 0;
				foreach (var item in Main.Instance.nets)
				{
					if (item != null)
					{ 
					Console.SetCursorPosition(40, i);
					Console.WriteLine(item.score + "    ");
					i++;
					}
				}
			}
			return score;
		}
		int dir;
		void doTick()
		{
			//dir = Update_Keyboard();
			//dir = Main.Instance.r.Next(5);
			dir = net.Update();
			if (dir < 0) { return; }
			Tile[,] grid = Tile.grid;
			List<bool> Moves = new List<bool>();
			int y = (int)Math.Cos(Math.PI * dir * 0.5);
			int x = (int)Math.Sin(Math.PI * dir * 0.5);
			foreach (var item in grid)
			{
				if (item != null)
				{
					Moves.Add(item.Move(new Vector(x,y)));
				}
			}
			if (Moves.Contains(true)) { SpawnTile(); UpdateBestValue();failedMoves = 0; } else { failedMoves++; }

		}
		void UpdateBestValue()
		{
			foreach (var item in Tile.grid)
			{
				if (item != null && item.Value > BestValue)
				{
					BestValue = item.Value;
				}
			}
		}
		void Draw() 
		{ 
			foreach (var item in Tile.grid)
			{
				if (item != null)
				{
					item.Draw();
				}
			}
		}
		void SpawnTile() 
		{
			Tile Try;
			int i = 0;
			do
			{
				List<Tile> Tiles = new List<Tile>();
				foreach (var item in Tile.grid)
				{
					if (item.Value == 0) { Tiles.Add(item);}
				}
				Try = Tiles[ r.Next(Tiles.Count)];
				i++;
				//if (i > 1000) { return; } //FIXME
			} while (Try.Value != 0);
			Try.Value = r.Next(1,3);
			value += Try.Value;
			Try.Draw();
		}
		static int Update_Keyboard()
		{
			if (Console.KeyAvailable)
			{
				// Read one key
				ConsoleKeyInfo cki = Console.ReadKey();
				if (cki.Key == ConsoleKey.RightArrow || cki.Key == ConsoleKey.NumPad6)
				{
					return 1;
				}
				else if (cki.Key == ConsoleKey.LeftArrow || cki.Key == ConsoleKey.NumPad4)
				{
					return 3;
				}
				else if (cki.Key == ConsoleKey.UpArrow || cki.Key == ConsoleKey.NumPad8)
				{
					return 2;
				}
				else if (cki.Key == ConsoleKey.DownArrow || cki.Key == ConsoleKey.NumPad2)
				{
					return 0;
				}
			}
			return -1;
		}

		//public List<double> TValue = new List<double>();
		//public double TrValue;
		//public double TtValue;
		Random r;
		int i1;
		public int score;
		public int value;
		public int BestValue;
		public int failedMoves;
		Network net;
	}
}
/*
void doTick()
{
	TtValue = 0;
	//TrValue = Math.Round( TValue/(50*50*0.4),5);
	TValue = new List<double>();
	if (FrameBuffer.Instance.reset > 1) { frameBuffer = new FrameBuffer(0, 0, Console.WindowWidth, Console.WindowHeight - 1); }
	Tile[,] grid = Tile.grid;
	foreach (var item in grid)
	{
		if (item != null)
		{
			item.Update();
			TValue.Add(item.Value);
			TtValue += item.Value;
		}
	}
	if (Console.KeyAvailable)
	{
		// Read one key
		ConsoleKeyInfo cki = Console.ReadKey(true);
		if (cki.Key == ConsoleKey.Spacebar || cki.Key == ConsoleKey.Enter)
		{
			Random r = new Random();
			int x = r.Next(grid.GetUpperBound(0) + 1);
			int y = r.Next(grid.GetUpperBound(1) + 1);
			Tile.grid[x, y].Value += r.Next(90) / (double)10;
			//TrValue = Math.Round(TValue.Average(), 5);
		}
	}
	TrValue = Math.Round(TValue.Average(), 5);
}
*/

/*
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

*/
