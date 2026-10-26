let context: AudioContext | null = null;
export function chime(kind: 'tap' | 'hit' | 'win' | 'ascend', enabled: boolean) {
  if (!enabled) return;
  try {
    context ||= new AudioContext(); void context.resume();
    const notes = kind === 'ascend' ? [293.66, 369.99, 440, 587.33] : kind === 'win' ? [329.63, 440, 587.33] : kind === 'hit' ? [146.83] : [440];
    notes.forEach((frequency, i) => {
      const osc = context!.createOscillator(), gain = context!.createGain(); const at = context!.currentTime + i * 0.1;
      osc.type = 'sine'; osc.frequency.value = frequency; gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(0.045, at + 0.008); gain.gain.exponentialRampToValueAtTime(0.001, at + 0.6);
      osc.connect(gain); gain.connect(context!.destination); osc.start(at); osc.stop(at + 0.65);
    });
  } catch { /* Sound is optional; gameplay remains available. */ }
}
