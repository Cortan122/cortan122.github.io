using System;

namespace Snake {
  class Vector2 {
    public int x;
    public int y;
    public Vector2(int x, int y) {
      this.x = x;
      this.y = y;
    }
    public static Vector2 operator -(Vector2 a, Vector2 b) {
      Vector2 r = new Vector2(0, 0);
      r.x = a.x - b.x;
      r.y = a.y - b.y;
      return r;
    }
    public static Vector2 operator +(Vector2 a, Vector2 b) {
      Vector2 r = new Vector2(0, 0);
      r.x = a.x + b.x;
      r.y = a.y + b.y;
      return r;
    }
    public void Set(Vector2 a) {
      this.y = a.y;
      this.x = a.x;
    }
    public bool Equals(Vector2 a) {
      if (object.ReferenceEquals(a, null)) return false;
      return this.x == a.x && this.y == a.y;
    }
    public static bool Equals(Vector2 a, Vector2 b) {
      if (object.ReferenceEquals(a, null)) {
        return object.ReferenceEquals(b, null);
      }
      return a.Equals(b);
    }
    static public Vector2 Copy(Vector2 a) {
      return new Vector2(a.x, a.y);
    }
    public Vector2 Copy() {
      return Vector2.Copy(this);
    }
    public static bool operator ==(Vector2 a, Vector2 b) {
      if (object.ReferenceEquals(a, null)) {
        return object.ReferenceEquals(b, null);
      }
      return a.Equals(b);
    }
    public static bool operator !=(Vector2 a, Vector2 b) {
      if (object.ReferenceEquals(a, null)) {
        return !object.ReferenceEquals(b, null);
      }
      return !a.Equals(b);
    }
    private static Random random;
    public static Vector2 Random(Vector2 s) {
      if (random == null) random = new System.Random();
      Vector2 r = new Vector2(0, 0);
      r.x = random.Next(0, s.x);
      r.y = random.Next(0, s.y);
      return r;
    }
  }
}
