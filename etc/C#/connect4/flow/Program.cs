using System;

namespace flow
{
	class MainClass
	{
		public static void Main(string[] args)
		{
			do
			{
				Main main = new Main();
				do
				{
					main.run();
				} while (true);//if false true restart
			} while (true);//if false program ends
			//Console.WriteLine("program ended");
			//Console.ReadLine();
		}
	}
}
