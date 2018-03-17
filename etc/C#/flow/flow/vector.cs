using System;
using System.Collections.Generic;

namespace flow
{
	public class Vector
	{
		public int x;
		public int y;
		public int z;

		/*//static public Vector[,,] grid;
		public static Vector AddToGrid(int x = 0, int y = 0, int z = 0) 
		{
			Vector v1 = new Vector(x, y, z);
			v1.addtogrid();
			return v1;			  
		}
		*/
		public Vector (int x = 0,int y = 0)
		{
			this.x = x;
			this.y = y;
			//this.z = Math.Abs(z);
			//this.addtogrid();
		}
		//void addtogrid() {Vector.grid[x, y, z] = this; }
		public Vector Add(Vector vo)
		{
			return Add(vo.x,vo.y);
		}
		public Vector Add(int x,int y)
		{
			Vector vn = this;
			vn.x = vn.x + x;
			vn.y = vn.y + y;
			return vn; 
		}
		public int CircleDistance(Vector v1,Vector v2 = null)
		{
			if (v2 == null) 
			{
				v2 = this;
			}
			return CircleDistance (v1.x,v1.y,v2.x,v2.y);

		}
		public int CircleDistance(int x,int y,Vector v2 = null)
		{
			if (v2 == null) 
			{
				v2 = this;
			}
			return CircleDistance (x,y,v2.x,v2.y);

		}
		static public int CircleDistance(int x0, int y0, int x1, int y1)
		{
			int x = x0 - x1;
			int y = y0 - y1;

			return (int)Math.Sqrt(x * x + y * y);
		}
		public static Vector[,] MakeGrid (int min = -10,int max = +10)
		{
			Vector[,] vectors = new Vector[max-min, max-min];
			for (int x = min; x < max; x++ ){
				for (int y = min; y < max; y++) {
					vectors [x-min, y-min] = new Vector (x,y);
				}
			}
			return vectors;
		}
		public static Vector[,] MakeGrid(Vector min, Vector max )
		{
			Vector[,] vectors = new Vector[max.x - min.x, max.y - min.y];
			for (int x = min.x; x < max.x; x++)
			{
				for (int y = min.y; y < max.y; y++)
				{
					vectors[x - min.x, y - min.y] = new Vector(x, y);
				}
			}
			return vectors;
		}
		public Vector[] GeneratePath(Vector v1,Vector v2 = null)
		{
			if (v2 == null) 
			{
				v2 = this;
			}
			return GeneratePath (v1.x,v1.y,v2.x,v2.y);

		}
		public static Vector[] GeneratePath(int x0, int y0, int x1, int y1)
		{
			// https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm

			int xDir = x1 > x0 ? 1 : -1;
			int yDir = y1 > y0 ? 1 : -1;

			double deltaX = x1 - x0;
			double deltaY = y1 - y0;

			int y = y0;

			List<Vector> tiles = new List<Vector>();

			if (deltaX == 0)
			{
				if (y == y1)
					return tiles.ToArray();

				y += yDir;

				// Just draw vertical line
				while (y != y1 + yDir)
				{
					tiles.Add(new Vector(x0, y));

					y += yDir;
				}
				return tiles.ToArray();
			}

			double error = -1.0;
			double deltaerr = Math.Abs(deltaY / deltaX);

			for (int x = x0 + xDir; (xDir > 0) ? (x <= x1) : (x >= x1); x += xDir)
			{
				//FrameBuffer.Instance.SetChixel(x, y, '-', ConsoleColor.Yellow);

				error = error + deltaerr;
				if (error <= -0.5)
				{
					tiles.Add(new Vector(x, y));
				}
				else
				{
					while (error > -0.5)
					{
						y += yDir;
						//FrameBuffer.Instance.SetChixel(x, y, '|', ConsoleColor.Yellow);
						tiles.Add(new Vector(x, y));
						error = error - 1.0;
					}
				}
			}

			// Add the final tile
			//tiles.Add(Game.Instance.Map.CurrentFloor.GetVector(x1, y1));

			return tiles.ToArray();
		}
		static public void DrawPath(Vector[] tiles, ConsoleColor fg_color,Vector offset = null )
		{
			if (offset == null) 
			{
				offset = new Vector(0,0);
			}
			if (tiles.Length == 0)
			{
				return;
			}

			for (int i = 0; i < tiles.Length - 1; i++)
			{

				char c = '-';
				if (i == 0 && tiles.Length > 0)
				{
					c = GetCharForBeam(tiles[i], tiles[i+1]);
				}
				else
				{
					c = GetCharForBeam(tiles[i - 1], tiles[i]);
				}

				FrameBuffer.Instance.SetChixel(tiles[i].x + offset.x, tiles[i].y + offset.y, c, fg_color);
			}

		}

		static char GetCharForBeam(Vector prev, Vector curr)
		{

			if (curr.x > prev.x)
			{
				// Moving to the right
				if (curr.y > prev.y)
				{
					// And down
					return '\\';
				}
				else if (curr.y < prev.y)
				{
					// And Up
					return '/';
				}
			}
			else if (curr.x < prev.x)
			{
				// Moving to the left
				if (curr.y > prev.y)
				{
					// And down
					return '/';
				}
				else if (curr.y < prev.y)
				{
					// And Up
					return '\\';
				}
			}

			if (prev.x == curr.x)
			{
				return '|';
			}

			return '-';
		}

	}
}

