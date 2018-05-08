using System;
using System.Collections.Generic;

namespace Snake {
  class Snake {
    public Vector2 pos { get; private set; }
    public int desiredLength;
    private Queue<Vector2> body;
    public Snake(int x, int y, int desiredLength = 0) {
      pos = new Vector2(x, y);
      body = new Queue<Vector2>();
      body.Enqueue(pos);
      this.desiredLength = desiredLength;
    }
    public Snake(Vector2 x, int desiredLength = 0) {
      pos = x;
      body = new Queue<Vector2>();
      body.Enqueue(pos);
      this.desiredLength = desiredLength;
    }
    public Vector2[] Move(int dir, bool isFed = false) {
      return Move(Util.DirToVector(dir), isFed);
    }
    public Vector2[] Move(Vector2 dir, bool isFed = false) {
      pos += dir;
      if (Util.FixPos(pos) == null) pos -= dir;
      body.Enqueue(pos);
      if (!isFed && body.Count >= desiredLength) return new Vector2[] { pos, body.Dequeue() };
      return new Vector2[] { pos, null };
    }
    public void ChopTail(Vector2 pos, Action<Vector2> func) {
      Vector2 t;
      do {
        t = body.Dequeue();
        func(t);
      } while (t != pos);
    }
  }
}
