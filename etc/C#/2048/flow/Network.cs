using System;
using System.Runtime.Serialization.Formatters.Binary;
using System.IO;

namespace flow
{
	[Serializable]
	public class Network
	{
		public int score = 0;
		public Layer[] Layers = new Layer[3];
		public Network()
		{
			new Layer(this, 0, 18);
			new Layer(this, 1, 16);
			new Layer(this, 2, 01);
		}
		public Network(Network n)
		{
			this.Layers = n.Layers;
		}
		public static T DeepClone<T>(T obj)
		{
			using (var ms = new MemoryStream())
			{
				var formatter = new BinaryFormatter();
				formatter.Serialize(ms, obj);
				ms.Position = 0;

				return (T)formatter.Deserialize(ms);
			}
		}
		public int Update()
		{
			foreach (var item in Layers)
			{
				item.Update();
			}
			return (int)(Math.Abs( Layers[Layers.Length-1].Nodes[0].Value)*10f);
			//return -1;
		}
		public void Mutate()
		{
			this.score = 0;
			Layers[1].Mutate();
			Layers[2].Mutate();
		}
	}
}

