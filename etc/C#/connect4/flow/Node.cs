using System;
namespace flow
{
	[Serializable]
	public class Node
	{
		Network network;
		float[] weights;
		float totalWeight;
		int index;
		public float Value { get; set; }
		Node(float[] weights,int index)
		{
			this.weights = weights;
			this.index = index;
		}
		public Node(Network network,bool weighted = true,int index = 1)
		{
			this.network = network;
			this.index = index;
			if (weighted == false) { return; }
			weights = new float[network.Layers[index - 1].Nodes.Length];
			for (int i = 0; i < network.Layers[index - 1].Nodes.Length; i++)
			{
				float q = (float)((Main.Instance.r.Next(1000)-500)/100.0);
				weights[i] = q;
				totalWeight += q;
			}
		}
		public void Update()
		{
			float f = 0;
			for (int i = 0; i < weights.Length; i++)
			{
				f += network.Layers[index - 1].Nodes[i].Value * weights[i];
			}
			Value = f / totalWeight;
		}
		public void Mutate()
		{
			for (int i = 0; i < weights.Length; i++)
			{
				weights[i] += (float)((Main.Instance.r.Next(100) - 50) / 1000.0);
			}
			
		}
	}
}

