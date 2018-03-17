using System;
using System.IO;
using System.Linq;

namespace experiment
{
	class MainClass
	{
		public static void Main(string[] args)
		{
			Console.WriteLine("Hello World!");
			FileStream file1 = new FileStream("C:\\костя\\R\\C\\experiment\\text.txt", FileMode.Open); //создаем файловый поток
			StreamReader reader = new StreamReader(file1); // создаем «потоковый читатель» и связываем его с файловым потоком 
			string s1 = reader.ReadToEnd();
			reader.Close();
			Console.WriteLine(s1);

			string i = Console.ReadLine();
			string s2 = Average(s1, i,false);

			Console.WriteLine();
			Console.WriteLine(s2);

			string s3 = Average(s2, i,true);

			Console.WriteLine();
			Console.WriteLine(s3);

			Console.ReadLine();
		}
		static public string Average(string s1,string s2,bool Reverse = false)
		{
			if (s1.Length > s2.Length)
			{
				string s3 = "";
				for (int i = 0; i < s1.Length; i++)
				{
					s3 += s2[i%s2.Length];
				}
				s2 = s3;
			}
			if (s1.Length != s2.Length) throw new Exception();
			int[] ia1 = s1.Select(n => Convert.ToInt32(n)).ToArray();
			int[] ia2 = s2.Select(n => Convert.ToInt32(n)).ToArray();
			for (int i = 0; i < ia2.Length; i++)
			{
				ia1[i] = ia1[i] ^ ia2[i];
				/*
				if (Reverse) { ia1[i] = ia1[i] - ia2[i]; }
				else { ia1[i] = ia1[i] + ia2[i]; }
				*/
			}
			string s = new string(Array.ConvertAll(ia1, x => (char)(x)));
			return s;
		}

	}
}
