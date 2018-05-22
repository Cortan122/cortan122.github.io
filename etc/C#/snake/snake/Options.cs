using System;
using Newtonsoft.Json.Linq;

namespace Snake {
  class Options {
    JObject obj;
    JObject defaultObj;
    public Options(string json, string defaultJson) {
      try {
        obj = JObject.Parse(json);
      } catch (Newtonsoft.Json.JsonReaderException e) {
        obj = JObject.Parse("{}");
        Util.PrintWarning("json parse error on line " + e.LineNumber);
      }
      defaultObj = JObject.Parse(defaultJson);
    }
    public JToken Get(string name) {
      JToken token = obj[name];
      if (token == null) {
        token = defaultObj[name];
        if (token == null) {
          throw new ArgumentOutOfRangeException("invalid json token name");
        }
        return token;
      }
      return token;
    }
    public int Get(string name,int _default) {
      JToken t = Get(name);
      if (t.Type != JTokenType.Integer) {
        Util.PrintWarning(name+" must be an integer");
        return _default;
      }
      return (int)t;
    }
    public string Get(string name, string _default) {
      JToken t = Get(name);
      if (t.Type != JTokenType.String) {
        Util.PrintWarning(name + " must be a string");
        return _default;
      }
      return (string)t;
    }
    public bool Get(string name, bool _default) {
      JToken t = Get(name);
      if (t.Type != JTokenType.Boolean) {
        Util.PrintWarning(name + " must be a boolean");
        return _default;
      }
      return (bool)t;
    }
    public float Get(string name, float _default) {
      JToken t = Get(name);
      if (t.Type != JTokenType.Float && t.Type != JTokenType.Integer) {
        Util.PrintWarning(name + " must be a boolean");
        return _default;
      }
      return (float)t;
    }
  }
}
