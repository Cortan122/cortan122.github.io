using System;
namespace flow
{
	[Serializable]
	public class Layer
	{
		Network network;
		int index;
		//public static Layer[] Layers;
		public Node[] Nodes;
		public Layer(Network network,int index,int max = 16)
		{
			bool B = true;
			if (index == 0) { B = false; }
			Nodes = new Node[max];
			this.network = network;
			this.index = index;
			for (int i = 0; i < max; i++)
			{
				Nodes[i] = new Node(network,B,index);
			}
			network.Layers[index] = this;
		}
		public void Update()
		{
			if (this.index == 0)
			{
				int i = 0;
				foreach (var item in Tile.grid)
				{
					Nodes[i].Value = item.Value/Main.Instance.game.BestValue;
					i++;
				}
				Nodes[Nodes.Length-1].Value = (float)Main.Instance.game.failedMoves ;
				Nodes[Nodes.Length-2].Value = 5f;
				return;
			}
			foreach (var item in Nodes)
			{
				item.Update();
			}
		}
		public void Mutate()
		{ 
			foreach (var item in Nodes)
			{
				if (item != null)
				{
					item.Mutate();
				}
			}
		}
	}
}

