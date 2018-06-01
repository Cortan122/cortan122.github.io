import r2pipe
import os.path
import base64
import json
import re

# <const>
al = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
exepath = "./examples/{0}";
jsonpath = "./options.json";
# </const>

def decode_base64(data):
  data = data.encode("ascii")

  missing_padding = len(data) % 4
  if missing_padding != 0:
    data += b'='* (4 - missing_padding) 
  return base64.decodebytes(data).decode("utf-8")

def initr2(file):
  # file = os.path.basename(file).split('.')[0];
  r2 = r2pipe.open(exepath.format(file))
  r2.cmd('aa')
  return r2

def extractplaintext(r2):
  r2.cmd('s sym._checkPasswd')
  jo = r2.cmdj("pdfj")["ops"];
  strname = "";

  for i in range(0,len(jo)):
    t = jo[i]["disasm"];
    if "str." not in t:
      continue 
    ind = t.index("str.");
    strname = t[ind:];

  if strname == "":
    print("extractplaintext failed");
    return

  r2.cmd('s '+strname);
  hexarr = r2.cmdj("p8j");
  b64 = "";
  for b in hexarr:
    if b == 0x00:
      break
    b64 += chr(b)

  return b64

def extractsbox(r2):
  r2.cmd('s sym._decode')
  jo = r2.cmdj("pdfj")["ops"];
  strname = "";

  for i in range(0,len(jo)):
    t = jo[i]["disasm"];
    if "movzx eax, byte [eax + 0x" not in t:
      continue 
    ind = t.index("0x");
    strname = t[ind:-1];

  if strname == "":
    print("extractsbox failed");
    return

  r2.cmd('s '+strname);
  hexarr = r2.cmdj("p8j 256");
  
  return hexarr

def proextractinit(arr,jo,r2):
  if jo["doSbox"]:
    sbox = extractsbox(r2);
    arr = map(lambda x:sbox[x],arr);

  if jo["doFlipsInit"]:
    def hlp(num):
      if num&0b01000000:
        r = 0;
        r|=(num&0b000001)<<5;
        r|=(num&0b100000)>>5;
        r|=(num&0b000010)<<3;
        r|=(num&0b010000)>>3;
        r|=(num&0b000100)<<1;
        r|=(num&0b001000)>>1;
        r|=num&0b11000000;
        num = r;
      return num;

    arr = map(hlp,arr);

  if jo["doHopsInit"]:
    def hlp(num):
      if num&0b10000000:
        r = 0;
        r|=(num&0b000111)<<3;
        r|=(num&0b111000)>>3;
        r|=num&0b11000000;
        num = r;
      return num;

    arr = map(hlp,arr);

  res = map(lambda x:al[x&0b00111111],arr);
  b64 = "".join(res);
  return b64

def extractinit(r2):
  r2.cmd('s sym._init')
  # jo = r2.cmdj("pdfj")["ops"];
  jo = r2.cmdj("pdj 1010");
  r = [];

  for i in range(0,len(jo)):
    t = jo[i]["opcode"];
    if "pop" in t or "ret" in t:
      break
    if "byte" not in t:
      continue
    arr = t.split(' ')
    val = int(arr[3],16);
    ind = int(arr[2][3:-2],16);
    r.append([ind,val]);

  r.sort(key=lambda x:x[0]);
  r = list(map(lambda x:x[1],r));
  if 0x00 in r:
    nullindex = r.index(0x00);
    r = r[0:nullindex];

  return r

def mono(jo):
  awailableOptions = ["file","doHidePassword","doShuffleInit","doSaltInit","doFlipsInit","doHopsInit","doLiveStrcmp","doStrip","doSbox","doCaller","doShuffleCaller","doMaze","doShuffleMazeInit","doShuffleMaze","doMazeOffset","doMazeVolatile","doShuffleMazeVolatile","doMixer"];
  rjo = {};

  for name in awailableOptions:
    if name in jo:
      rjo[name] = jo[name];
    else:
      rjo[name] = False;

  main(rjo);
  return

def getoptions():
  f = open(jsonpath);
  string = f.read();
  string = re.sub(r"\/\/.*$","",string,flags=re.M);
  # print(string)
  jo = json.loads(string);
  if "mode" not in jo:
    print(jsonpath,"does not contain mode");
    return
  if not (jo["mode"] == "poly" or jo["mode"] == "mono"):
    print(jsonpath,"contains invalid mode");
    return
  if jo["mode"] == "mono":
    jo["file"] = "../passwder.exe";
    mono(jo);
    return
  if jo["mode"] == "poly":
    for name in jo:
      if name == "mode":continue;
      rjo = jo[name];
      rjo["file"] = name;
      mono(rjo);
    return
  print("getoptions failed");

def main(jo):
  if jo["doStrip"]:
    print("i cant doStrip");
    return

  r2 = initr2(jo["file"]);
  b64 = "";
  if jo["doHidePassword"] == False:
    b64 = extractplaintext(r2);
  else:
    t = extractinit(r2);
    b64 = proextractinit(t,jo,r2);

  if b64 == "":
    print("main failed");
    return

  print(jo["file"],":",decode_base64(b64));
  # print(jo["file"],":",b64);
  r2.quit();

getoptions();
