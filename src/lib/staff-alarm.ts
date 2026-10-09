export function startStaffAlarm() {
  const audio = new AudioContext();
  void audio.resume();
  const gain = audio.createGain(); gain.gain.value = 0.13; gain.connect(audio.destination);
  const oscillator = audio.createOscillator(); oscillator.type = "triangle"; oscillator.connect(gain);
  oscillator.start();
  const cycle = () => {
    const now = audio.currentTime;
    oscillator.frequency.setValueAtTime(660, now);
    oscillator.frequency.linearRampToValueAtTime(1040, now + 0.4);
    oscillator.frequency.linearRampToValueAtTime(660, now + 0.8);
  };
  cycle(); const interval = setInterval(cycle, 900);
  return () => { clearInterval(interval); oscillator.stop(); void audio.close(); };
}