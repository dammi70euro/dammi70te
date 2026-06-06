type AnalyserBinding = {
  ctx: AudioContext;
  source: MediaStreamAudioSourceNode;
  analyser: AnalyserNode;
};

const bindings = new WeakMap<HTMLAudioElement, AnalyserBinding>();

function captureStream(audio: HTMLAudioElement): MediaStream | null {
  const el = audio as HTMLAudioElement & {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
  };
  if (el.captureStream) return el.captureStream();
  if (el.mozCaptureStream) return el.mozCaptureStream();
  return null;
}

export async function bindPlaybackAnalyser(audio: HTMLAudioElement): Promise<AnalyserNode | null> {
  const stream = captureStream(audio);
  if (!stream || stream.getAudioTracks().length === 0) return null;

  const prev = bindings.get(audio);
  if (prev) prev.source.disconnect();

  const ctx = prev?.ctx ?? new AudioContext();
  if (ctx.state === 'suspended') await ctx.resume();

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.8;
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;

  const source = ctx.createMediaStreamSource(stream);
  source.connect(analyser);

  bindings.set(audio, { ctx, source, analyser });
  return analyser;
}

export function clearPlaybackAnalyser(audio: HTMLAudioElement): void {
  const binding = bindings.get(audio);
  if (!binding) return;
  binding.source.disconnect();
  bindings.delete(audio);
}
