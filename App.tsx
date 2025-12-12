import { useState, useRef, useEffect, useCallback, type ChangeEvent } from 'react';
import { LYRICS } from './constants';
import { PlayerState, LyricLine } from './types';
import LyricDisplay from './components/LyricDisplay';
import Controls from './components/Controls';

function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Default audio source - assumes file exists at public/audio/villancico.mp3
  const [audioSrc] = useState<string | null>('/audio/villancico.mp3');
  const [currentLyric, setCurrentLyric] = useState<LyricLine | null>(null);
  const [nextLyric, setNextLyric] = useState<LyricLine | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'processing' | 'done'>('idle');

  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    hasEnded: false
  });

  const startRecordingAndPlay = useCallback(async () => {
    if (isRecording) return;

    chunksRef.current = [];
    setRecordingStatus('recording');

    try {
      // 1. Ask for screen permission first
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: false, // AUDIO DISABLED
        // @ts-ignore
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
        systemAudio: 'exclude'
      });

      const mimeType = 'video/webm;codecs=vp8'; // Video only
      const mediaRecorder = new MediaRecorder(screenStream, {
        mimeType,
        videoBitsPerSecond: 8000000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        downloadVideo(blob);

        setRecordingStatus('done');
        screenStream.getTracks().forEach(track => track.stop());
      };

      screenStream.getVideoTracks()[0].onended = () => {
        if (isRecording) {
          stopRecording();
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
      setIsRecording(true);

      // 2. Start Audio after recording is ready (with speedup)
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.playbackRate = 1.15; // SPEED UP
        await audioRef.current.play();
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
      }

    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingStatus('idle');
      alert('⚠️ Debes seleccionar la pestaña para que funcione.');
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      setRecordingStatus('processing');
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (audioRef.current) {
        audioRef.current.pause();
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      }
    }
  }, [isRecording]);

  const downloadVideo = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `villancico-navidad-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateSync = useCallback(() => {
    if (!audioRef.current) return;

    const time = audioRef.current.currentTime;
    setPlayerState(prev => ({
      ...prev,
      currentTime: time,
      duration: audioRef.current?.duration || 0,
      isPlaying: !audioRef.current?.paused,
      hasEnded: audioRef.current?.ended || false
    }));

    let activeIdx = -1;
    for (let i = LYRICS.length - 1; i >= 0; i--) {
      if (time >= LYRICS[i].time) {
        activeIdx = i;
        break;
      }
    }

    if (activeIdx !== -1) {
      setCurrentLyric(LYRICS[activeIdx]);
      setNextLyric(LYRICS[activeIdx + 1] || null);
      setCurrentIndex(activeIdx);
    } else {
      setCurrentLyric(null);
      setNextLyric(LYRICS[0]);
      setCurrentIndex(-1);
    }
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
      updateSync();
      animationFrameId = requestAnimationFrame(loop);
    };

    if (playerState.isPlaying) {
      loop();
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [playerState.isPlaying, updateSync]);


  const togglePlay = () => {
    // Manual play (without recording) for testing if needed
    if (audioRef.current) {
      if (playerState.isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPlayerState(prev => ({ ...prev, currentTime: time }));
      updateSync();
    }
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
      setPlayerState({
        isPlaying: false,
        currentTime: 0,
        duration: audioRef.current.duration,
        hasEnded: false
      });
      setCurrentLyric(null);
      setNextLyric(LYRICS[0]);
      setCurrentIndex(-1);
    }
  };

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
      updateSync();
    }
  };

  const handleForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10);
      updateSync();
    }
  };

  // Auto-stop recording when audio ends
  useEffect(() => {
    if (playerState.hasEnded && isRecording) {
      stopRecording();
    }
  }, [playerState.hasEnded, isRecording, stopRecording]);

  return (
    <div className="relative w-full h-screen bg-slate-900 flex flex-col items-center justify-center font-sans overflow-hidden">

      {/* Intro Screen - ONLY if not recording and not playing */}
      {(!isRecording && !playerState.isPlaying) && (
        <div className="relative z-50 bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 text-center max-w-md mx-4 shadow-2xl">
          <div className="mb-6 text-yellow-400 text-6xl">🎄</div>
          <h1 className="text-3xl font-bold mb-2 text-white" style={{ fontFamily: "'Mountains of Christmas', cursive" }}>
            Navidades - Karaoke Recorder
          </h1>
          <p className="text-gray-300 mb-6 text-sm">
            Pulsa el botón para iniciar la grabación automática.
          </p>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
            <p className="text-yellow-300 text-xs font-semibold text-left">
              Instrucciones:<br />
              1. Pulsa "Grabar Villancico"<br />
              2. Selecciona la pestaña "Pestaña de Chrome" -&gt; "Navidades"<br />
              3. Pulsa "Compartir"
            </p>
          </div>

          <button
            onClick={startRecordingAndPlay}
            className="w-full px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-red-600/50 transform hover:scale-105 transition-all text-lg flex items-center justify-center gap-2"
          >
            <span>⏺️</span> Grabar Villancico
          </button>
        </div>
      )}

      {audioSrc && (
        <>
          <div ref={displayRef} className="absolute inset-0">
            <LyricDisplay
              currentLyric={currentLyric}
              nextLyric={nextLyric}
              currentIndex={currentIndex}
            />
          </div>

          {isRecording && (
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              <span className="text-white text-xs font-bold bg-red-600/50 px-2 py-1 rounded">GRABANDO</span>
            </div>
          )}

          {recordingStatus === 'done' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-green-500 rounded-full text-white text-sm font-semibold shadow-lg shadow-green-500/30 animate-bounce">
              ✓ Video guardado!
            </div>
          )}


          {/* Controls removed as requested */}

          <audio
            ref={audioRef}
            src="/audio/Villancico.mp3"
            onError={(e) => console.error("Audio error:", e)}
            onEnded={() => setPlayerState(p => ({ ...p, isPlaying: false, hasEnded: true }))}
            onLoadedMetadata={() => {
              if (audioRef.current) {
                setPlayerState(p => ({ ...p, duration: audioRef.current?.duration || 0 }))
              }
            }}
          />
        </>
      )}

      <div className="pointer-events-none fixed inset-0 z-40 opacity-30 mix-blend-screen" />
    </div>
  );
}

export default App;