using System;
using Newtonsoft.Json.Linq;

namespace Snake {
  class Options {
    JObject obj;
    JObject defaultObj;
    public Options(string json, string defaultJson) {
      obj = JObject.Parse(json);
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
    /*public int Get_int(string name) {
      return (int)Get(name);
    }
    public string Get_string(string name) {
      return (string)Get(name);
    }*/
  }
}
