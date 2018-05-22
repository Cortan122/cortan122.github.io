using System;
using System.IO;
using Newtonsoft.Json.Linq;
using NAudio.Wave;

namespace Snake {
  class SoundManager {
    enum SoundEffect { music, chomp, gameover, beep0, beep1, beep2, beep3, portal, victory };
    static SoundEffect[] SoundEffects = (SoundEffect[])Enum.GetValues(typeof(SoundEffect));
    static int numSfx = SoundEffects.Length;
    static SoundEffect[] beeps = new SoundEffect[] { SoundEffect.beep0, SoundEffect.beep1, SoundEffect.beep2, SoundEffect.beep3 };
    WaveOutEvent[] waveOuts = new WaveOutEvent[numSfx];
    Mp3FileReader[] mp3Readers = new Mp3FileReader[numSfx];
    bool isMuted = false;
    bool PauseMusicOnGameover;
    const string digits = "0123456789";
    int lastBeep = beeps.Length - 1;
    float volume;
    public SoundManager() {
      PauseMusicOnGameover = Util.Options.Get("sfx_PauseMusicOnGameover",true);
      volume = Util.Options.Get("sfx_MasterVolume",1f);
      if (volume < 0.0 || volume > 1.0) {
        Util.PrintWarning("sfx_MasterVolume must be between 0.0 and 1.0");
        volume = 1.0f;
      }
      if (volume == 0.0) return;
      foreach (var e in SoundEffects) {
        InitChanel(e);
      }
      /*if (waveOuts[(int)SoundEffect.music] != null) {
        waveOuts[(int)SoundEffect.music].PlaybackStopped += MusicPlaybackStopped;
        waveOuts[(int)SoundEffect.music].Play();
      }*/
    }
    private void InitChanel(SoundEffect e) {
      int index = (int)e;
      string name = e.ToString();

      char end = name[name.Length - 1];
      JToken option = null;
      string optionName;
      if (digits.IndexOf(end) == -1) {
        optionName = "sfx_" + name + "FileName";
      } else {
        string t = name.Substring(0, name.Length - 1);
        optionName = "sfx_" + t + "FileName";
      }
      option = Util.Options.Get(optionName);

      Stream s = null;
      if (option.Type == JTokenType.Integer) {
        if ((int)option == 0) return;
        if ((int)option == -1) {
          s = Util.GetResource(name + ".mp3");
        } else {
          s = Util.GetResource(name + ".mp3");
          Util.PrintJsonWarning(optionName);
        }
      } else if (option.Type == JTokenType.String) {
        s = new FileStream(Util.directory + "//" + (string)option, FileMode.Open);
      } else {
        s = Util.GetResource(name + ".mp3");
      }
      mp3Readers[index] = new Mp3FileReader(s);
      waveOuts[index] = new WaveOutEvent();
      waveOuts[index].Init(mp3Readers[index]);
      waveOuts[index].Volume = volume;
    }
    private void MusicPlaybackStopped(object sender, StoppedEventArgs e) {
      mp3Readers[(int)SoundEffect.music].CurrentTime = TimeSpan.FromSeconds(0);
      waveOuts[(int)SoundEffect.music].Play();
      //throw new NotImplementedException();
    }
    private void Play(int index) {
      if (mp3Readers[index] == null) return;
      mp3Readers[index].CurrentTime = TimeSpan.FromSeconds(0);
      waveOuts[index].Play();
    }
    private void Play(SoundEffect e) {
      Play((int)e);
    }
    public void Play(string name) {
      Play((SoundEffect)Enum.Parse(typeof(SoundEffect), name.ToLower()));
    }
    public void Chomp() {
      Play(SoundEffect.chomp);
    }
    public void Mute() {
      if (isMuted) {
        waveOuts[0].Volume = (float)Util.Options.Get("sfx_MasterVolume");
        isMuted = false;
      } else {
        waveOuts[0].Volume = 0f;
        isMuted = true;
      }
    }
    public void Gameover() {
      if (PauseMusicOnGameover) {
        int t = (int)SoundEffect.music;
        mp3Readers[t].CurrentTime = TimeSpan.FromSeconds(0);
        waveOuts[t].Pause();
      }
      Play(SoundEffect.gameover);
    }
    public void RestartMusic() {
      if (PauseMusicOnGameover) {
        Play(SoundEffect.music);
      }
    }
    public void Beep() {
      lastBeep = (lastBeep + 1) % beeps.Length;
      Play(beeps[lastBeep]);
    }
    public void Portal() {
      Play(SoundEffect.portal);
    }
    public void Victory() {
      Play(SoundEffect.victory);
    }
  }
}
