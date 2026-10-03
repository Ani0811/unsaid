export type SoundscapeType = 'off' | 'rain' | 'hearth' | 'drone';

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private currentType: SoundscapeType = 'off';
  private masterGain: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private volume: number = 0.35;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentType(): SoundscapeType {
    return this.currentType;
  }

  public stop() {
    if (!this.ctx) return;
    this.activeNodes.forEach((node) => {
      if (typeof node === 'number') {
        window.clearInterval(node);
      } else {
        try {
          if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
            (node as AudioScheduledSourceNode).stop();
          }
          node.disconnect();
        } catch {
          // ignore cleanup issues
        }
      }
    });
    this.activeNodes = [];
    this.currentType = 'off';
  }

  public play(type: SoundscapeType) {
    if (type === this.currentType && type !== 'off') return;
    this.stop();

    if (type === 'off') {
      this.currentType = 'off';
      return;
    }

    this.initContext();
    if (!this.ctx) return;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
    this.currentType = type;

    if (type === 'rain') {
      this.startRain();
    } else if (type === 'hearth') {
      this.startHearth();
    } else if (type === 'drone') {
      this.startDrone();
    }
  }

  private createNoiseBuffer(): AudioBuffer {
    const bufferSize = this.ctx!.sampleRate * 2;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink / brown filtered noise
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    return buffer;
  }

  private startRain() {
    if (!this.ctx || !this.masterGain) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.masterGain);
    noise.start();

    this.activeNodes.push(noise, filter);
  }

  private startHearth() {
    if (!this.ctx || !this.masterGain) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.masterGain);
    noise.start();
    this.activeNodes.push(noise, filter);

    // Crackle impulses
    const crackleInterval = window.setInterval(() => {
      if (!this.ctx || !this.masterGain || this.currentType !== 'hearth') return;
      if (Math.random() > 0.4) {
        const osc = this.ctx.createOscillator();
        const crackGain = this.ctx.createGain();
        osc.frequency.setValueAtTime(100 + Math.random() * 800, this.ctx.currentTime);
        crackGain.gain.setValueAtTime(0.08 * Math.random(), this.ctx.currentTime);
        crackGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);
        osc.connect(crackGain);
        crackGain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
      }
    }, 180);

    this.activeNodes.push(crackleInterval);
  }

  private startDrone() {
    if (!this.ctx || !this.masterGain) return;
    const baseFreqs = [110, 164.81, 220]; // A2 chord
    baseFreqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx!.currentTime);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      this.activeNodes.push(osc, gain);
    });
  }
}

export const ambientSound = new AmbientSoundEngine();
