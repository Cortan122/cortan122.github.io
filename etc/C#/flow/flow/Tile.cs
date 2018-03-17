using System;
using System.Collections.Generic;

namespace flow
{
	public class Tile : Vector
	{
		public double Value { get { return _v;} set { _v = Math.Round(Math.Abs(value),3);} }
		double _v;
		static public Tile[,] grid;
		protected Tile( int x, int y,double v = 0.0):base(x,y)
		{
			this.Value = v;
		}
		public static Tile AddToGrid(int x = 0, int y = 0)
		{
			Tile v1 = new Tile(x, y);
			v1.addtogrid();
			return v1;
		}
		void addtogrid() { Tile.grid[x, y] = this; }
		public static Tile[,] MakeGrid(Vector max)
		{
			grid = new Tile[max.x, max.y];
			Vector min = new Vector(0, 0);
			Tile[,] vectors = new Tile[max.x - min.x, max.y - min.y];
			for (int x = min.x; x < max.x; x++)
			{
				for (int y = min.y; y < max.y; y++)
				{
					vectors[x - min.x, y - min.y] = AddToGrid(x, y);
				}
			}
			return vectors;
		}
		Tile[] GetNeighbors() 
		{
			List<Tile> tiles = new List<Tile>();
			for (int x = -1; x < 2; x++)
			{
				for (int y = -1; y < 2; y++)
				{
					Tile Try = null;
					try { Try = grid[this.x + x, this.y + y]; } catch { }
					if (Try != null)
					{
						if (true||Try == this) { tiles.Add(Try); }
					}
				}
			}
			return tiles.ToArray();
		}
		public void Update() 
		{
			Draw();
			if (Value >= 0) 
			{
				
				double v = Value; 
				double v2 = 0;
				Tile[] GN = GetNeighbors();
				foreach (var item in GN)
				{
					if (item.Value*2 < this.Value)
					{
						item.Value = this.Value / 2;
						this.Value = item.Value;
					}

				}
			}

		}
		void Draw() 
		{
			ConsoleColor CC = ConsoleColor.White;
			char Ch ;
			if (Value > Main.Instance.TrValue) { CC = ConsoleColor.DarkBlue; }
			if (Value == 0) { CC = ConsoleColor.DarkYellow; }
			Ch = Math.Round(Value).ToString()[0];
			FrameBuffer.Instance.SetChixel(this.x, this.y, Ch, CC);
		}

	}
}

