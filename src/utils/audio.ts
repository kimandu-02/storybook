/**
 * Audio synthesis helper using Web Audio API for sound effects
 * and Web Speech API for natural English text-to-speech.
 */

// Web Audio Context singleton
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const soundEffects = {
  // Gentle pop when clicking words or selecting choices
  playPop: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio fallback silent
    }
  },

  // Soft page flip sound
  playPageFlip: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      const gain = ctx.createGain();
      gain.gain.value = 0.08;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {
      // Audio fallback silent
    }
  },

  // Cheerful chime on correct answer or check
  playSuccessChime: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const startTime = ctx.currentTime + idx * 0.09;
        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch {
      // Audio fallback silent
    }
  },

  // Gentle soft boop for incorrect / retry (encouraging, not jarring)
  playTryAgainBoop: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [440, 392]; // A4, G4
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const startTime = ctx.currentTime + idx * 0.12;
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
    } catch {
      // Audio fallback silent
    }
  },

  // Sparkling fanfare for Detective Badge
  playFanfare: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const melody = [
        { freq: 523.25, time: 0.0, dur: 0.15 },
        { freq: 659.25, time: 0.15, dur: 0.15 },
        { freq: 783.99, time: 0.3, dur: 0.15 },
        { freq: 1046.5, time: 0.45, dur: 0.4 },
        { freq: 880.0, time: 0.7, dur: 0.15 },
        { freq: 1046.5, time: 0.88, dur: 0.55 },
      ];
      melody.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const startTime = ctx.currentTime + time;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + dur);
      });
    } catch {
      // Audio fallback silent
    }
  },
};

// Text-to-speech engine with sequence support and anti-GC protection
class TTSEngine {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activeUtterances: SpeechSynthesisUtterance[] = [];
  private isSpeaking = false;
  private currentSequenceId = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Warm up voices
        window.speechSynthesis.getVoices();
      };
    }
  }

  private getBestVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Karen') ||
            v.name.includes('Jenny') ||
            v.name.includes('Daniel') ||
            v.name.includes('Ava'))
      ) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null
    );
  }

  public stop() {
    this.currentSequenceId += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.activeUtterances = [];
    }
  }

  public speakText(
    text: string,
    options: {
      rate?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    } = {}
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      options.onEnd?.();
      return;
    }

    this.stop();

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = 1.05;

    const voice = this.getBestVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.activeUtterances = [];
      options.onEnd?.();
    };

    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
      if (e.error === 'canceled' || e.error === 'interrupted') {
        return;
      }
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.activeUtterances = [];
      options.onError?.();
    };

    this.currentUtterance = utterance;
    this.activeUtterances = [utterance];
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Sequentially speaks an array of sentences, notifying the caller of the active index
   * so the UI can highlight the sentence in yellow in real-time.
   */
  public speakSentenceSequence(
    sentences: string[],
    callbacks: {
      onSentenceChange: (index: number) => void;
      onComplete: () => void;
      onError?: () => void;
    }
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || sentences.length === 0) {
      callbacks.onComplete();
      return;
    }

    this.stop();

    const sequenceId = ++this.currentSequenceId;
    this.isSpeaking = true;

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const voice = this.getBestVoice();

    const playIndex = (index: number) => {
      if (this.currentSequenceId !== sequenceId) return;

      if (index >= sentences.length) {
        this.isSpeaking = false;
        this.activeUtterances = [];
        callbacks.onComplete();
        return;
      }

      callbacks.onSentenceChange(index);

      const utterance = new SpeechSynthesisUtterance(sentences[index]);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        if (this.currentSequenceId !== sequenceId) return;
        // Natural pleasant pause between sentences before next sentence
        setTimeout(() => {
          if (this.currentSequenceId === sequenceId) {
            playIndex(index + 1);
          }
        }, 280);
      };

      utterance.onerror = (e) => {
        if (this.currentSequenceId !== sequenceId) return;
        // Ignore canceled errors if caused by stop()
        if (e.error === 'canceled' || e.error === 'interrupted') return;
        this.isSpeaking = false;
        this.activeUtterances = [];
        callbacks.onError ? callbacks.onError() : callbacks.onComplete();
      };

      this.currentUtterance = utterance;
      this.activeUtterances = [utterance];
      window.speechSynthesis.speak(utterance);
    };

    playIndex(0);
  }

  public getSpeakingState() {
    return this.isSpeaking;
  }
}

export const ttsEngine = new TTSEngine();

/**
 * Creates a valid, playable 16-bit PCM WAV audio Blob on the client without external dependencies.
 * Used for sandboxed environments where microphone access is blocked or unavailable,
 * so learners can experience recorded audio playback and test functionality smoothly.
 */
export function createSimulatedAudioBlob(durationSeconds = 2.5): Blob {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * Math.max(1, durationSeconds));
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF header
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + numSamples * 2, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt subchunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // data subchunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, numSamples * 2, true);

  // Synthesize a cheerful student voice pitch/tone (harmony + envelope)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Pitches: 330Hz (E4), 440Hz (A4), 554Hz (C#5) with a gentle vibrato
    const vibrato = Math.sin(t * 12) * 5;
    const freq1 = 392 + vibrato; // G4
    const freq2 = 523.25; // C5
    // Envelope: smooth attack & decay
    const attack = Math.min(1, t * 15);
    const decay = Math.max(0, 1 - (t / durationSeconds));
    const envelope = attack * Math.pow(decay, 0.7);
    const sample = (Math.sin(2 * Math.PI * freq1 * t) * 0.4 + Math.sin(2 * Math.PI * freq2 * t) * 0.25) * envelope;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 30000)));
    view.setInt16(44 + i * 2, intSample, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
