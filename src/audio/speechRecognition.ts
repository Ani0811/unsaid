// Web Speech API wrapper for browser in-app voice input

export interface SpeechRecognitionHook {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: (onResult: (text: string) => void) => void;
  stopListening: () => void;
  toggleListening: (onResult: (text: string) => void) => void;
}

// Global interface for SpeechRecognition in browsers
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export class InAppSpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private onResultCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((err: string) => void) | null = null;
  private onStatusChangeCallback: ((listening: boolean) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechClass) {
        this.recognition = new SpeechClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.isListening = true;
          this.onStatusChangeCallback?.(true);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.onStatusChangeCallback?.(false);
        };

        this.recognition.onerror = (event: any) => {
          console.warn('In-app speech recognition error:', event.error);
          this.isListening = false;
          this.onStatusChangeCallback?.(false);
          this.onErrorCallback?.(event.error || 'Speech recognition error');
        };

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            const text = result[0].transcript;
            if (result.isFinal) {
              finalTranscript += text;
            } else {
              interimTranscript += text;
            }
          }

          const delivered = (finalTranscript || interimTranscript).trim();
          if (delivered && this.onResultCallback) {
            this.onResultCallback(delivered);
          }
        };
      }
    }
  }

  public get supported(): boolean {
    return !!this.recognition;
  }

  public get listening(): boolean {
    return this.isListening;
  }

  public setCallbacks(
    onResult: (text: string) => void,
    onStatusChange?: (listening: boolean) => void,
    onError?: (err: string) => void
  ) {
    this.onResultCallback = onResult;
    this.onStatusChangeCallback = onStatusChange || null;
    this.onErrorCallback = onError || null;
  }

  public start() {
    if (!this.recognition || this.isListening) return;
    try {
      this.recognition.start();
    } catch (err) {
      console.warn('Could not start speech recognition:', err);
    }
  }

  public stop() {
    if (!this.recognition || !this.isListening) return;
    try {
      this.recognition.stop();
    } catch (err) {
      console.warn('Could not stop speech recognition:', err);
    }
  }
}
