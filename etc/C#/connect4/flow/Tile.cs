using System;
using System.Collections.Generic;

namespace flow
{
	public class Tile : Vector
	{
		public int Value { get { return _v;} set { _v = value;} }
		int _v;
		static public Tile[,] grid;
		protected Tile( int x, int y,int v = 0):base(x,y)
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
		public bool Move(Vector dir)
		{
			if (this.Value == 0) { return false; }
			Tile Target = null;
			try { Target = grid[this.x + dir.x, this.y + dir.y]; } catch { return false; }
			//if (Target.Value != this.Value && Target.Value != 0) { Target.Move(dir); }
			if (Target.Value == 0) { Target.Value = this.Value; this.Value = 0; Target.Move(dir); return true;}	
			//if (Target.Value == this.Value) {Target.Value += this.Value;Main.Instance.game.score += Target.Value; this.Value = 0;Target.Move(dir); return true; }

			return false;
		}
		public void Draw() 
		{
			ConsoleColor CC = ConsoleColor.White;
			char Ch = '!';
			if (Value == 0) { CC = ConsoleColor.Gray; Ch = '.';}
			if (Value  > 0) { CC = ConsoleColor.Red; Ch = '¤'; }
			if (Value  < 0) { CC = ConsoleColor.Yellow; Ch = '¤'; }
			//Ch = this.Value.ToString()[0];
			FrameBuffer.Instance.SetChixel(this.x, this.y, Ch, CC);
		}

	}
}
