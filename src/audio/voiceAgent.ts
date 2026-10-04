// Calm Voice Agent: Text-to-Speech synthesis for Unsaid reflections
// Uses standard local offline Web Speech API (speechSynthesis) with calm pacing and tone

export interface VoiceAgentState {
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string | null;
  activeId: string | null;
}

class VoiceAgentManager {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<(state: VoiceAgentState) => void> = new Set();
  private state: VoiceAgentState = {
    isSpeaking: false,
    isPaused: false,
    currentText: null,
    activeId: null
  };

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isSupported(): boolean {
    return !!this.synth;
  }

  public subscribe(listener: (state: VoiceAgentState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private updateState(partial: Partial<VoiceAgentState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((cb) => cb(this.state));
  }

  public speak(id: string, text: string) {
    if (!this.synth) return;

    // If already speaking this ID, toggle stop
    if (this.state.activeId === id && this.state.isSpeaking) {
      this.stop();
      return;
    }

    this.stop();

    // Clean markdown/bullet points for spoken audio
    const cleanText = text
      .replace(/[#*_`~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^\s*[-*•]\s+/gm, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Choose calm voice if available
    const voices = this.synth.getVoices();
    const calmVoice = voices.find(v => 
      (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Jenny') || v.name.includes('Aria') || v.name.includes('Samantha') || v.lang.startsWith('en')) &&
      !v.name.includes('Compact')
    ) || voices[0];

    if (calmVoice) {
      utterance.voice = calmVoice;
    }

    // Soothing, calm cadence
    utterance.rate = 0.9;
    utterance.pitch = 0.95;

    utterance.onstart = () => {
      this.updateState({
        isSpeaking: true,
        isPaused: false,
        currentText: text,
        activeId: id
      });
    };

    utterance.onend = () => {
      this.updateState({
        isSpeaking: false,
        isPaused: false,
        currentText: null,
        activeId: null
      });
      this.currentUtterance = null;
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      this.updateState({
        isSpeaking: false,
        isPaused: false,
        currentText: null,
        activeId: null
      });
      this.currentUtterance = null;
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public stop() {
    if (!this.synth) return;
    this.synth.cancel();
    this.updateState({
      isSpeaking: false,
      isPaused: false,
      currentText: null,
      activeId: null
    });
    this.currentUtterance = null;
  }

  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }
}

export const voiceAgent = new VoiceAgentManager();
