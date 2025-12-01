import { useState, useRef, useEffect, useCallback, type ChangeEvent } from 'react';
import { LYRICS } from './constants';
import { PlayerState, LyricLine } from './types';
import LyricDisplay from './components/LyricDisplay';
import Controls from './components/Controls';

function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [currentLyric, setCurrentLyric] = useState<LyricLine | null>(null);
  const [nextLyric, setNextLyric] = useState<LyricLine | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'processing' | 'done'>('idle');
  const [autoRecord, setAutoRecord] = useState(true);
  const [fastGenMode, setFastGenMode] = useState(false);

  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    hasEnded: false
  });

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioSrc(url);
    }
  };

  const startRecording = useCallback(async () => {
    if (isRecording) return;

    chunksRef.current = [];
    setRecordingStatus('recording');

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        // @ts-ignore
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
        systemAudio: 'include'
      });

      const mimeType = 'video/webm;codecs=vp8,opus';

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

        if (fastGenMode && audioRef.current) {
          audioRef.current.playbackRate = 1.0;
          audioRef.current.volume = 1.0;
          setFastGenMode(false);
        }
      };

      screenStream.getVideoTracks()[0].onended = () => {
        if (isRecording) {
          stopRecording();
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); // Chunks cada 250ms para mejor navegación
      setIsRecording(true);

    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      setRecordingStatus('idle');
      setFastGenMode(false);
      if (audioRef.current) {
        audioRef.current.playbackRate = 1.0;
        audioRef.current.volume = 1.0;
      }
      alert('⚠️ IMPORTANTE PARA GRABAR CON AUDIO:\n\n1. Selecciona "Pestaña de Chrome"\n2. Elige ESTA pestaña\n3. ✅ ACTIVA la casilla "Compartir audio de la pestaña"\n4. Haz clic en "Compartir"\n\n🔊 El audio SOLO se grabará si activas esa casilla!');
    }
  }, [isRecording, fastGenMode]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      setRecordingStatus('processing');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
    if (audioRef.current) {
      if (playerState.isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
        if (autoRecord && !isRecording && recordingStatus === 'idle' && !fastGenMode) {
          setTimeout(() => startRecording(), 500);
        }
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
      audioRef.current.playbackRate = 1.0;
      audioRef.current.volume = 1.0;
      setPlayerState({
        isPlaying: false,
        currentTime: 0,
        duration: audioRef.current.duration,
        hasEnded: false
      });
      setCurrentLyric(null);
      setNextLyric(LYRICS[0]);
      setCurrentIndex(-1);

      if (isRecording) {
        stopRecording();
      }

      setRecordingStatus('idle');
      setFastGenMode(false);
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

  useEffect(() => {
    if (playerState.hasEnded && isRecording) {
      stopRecording();
    }
  }, [playerState.hasEnded, isRecording, stopRecording]);

  return (
    <div className="relative w-full h-screen bg-slate-900 flex flex-col items-center justify-center font-sans overflow-hidden">

      {!audioSrc && (
        <div className="relative z-50 bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 text-center max-w-md mx-4 shadow-2xl">
          <div className="mb-6 text-yellow-400 text-6xl">🎄</div>
          <h1 className="text-3xl font-bold mb-2 text-white" style={{ fontFamily: "'Mountains of Christmas', cursive" }}>
            Navidades - Video Maker
          </h1>
          <p className="text-gray-300 mb-4 text-sm">
            Sube tu MP3 y presiona PLAY. La grabación inicia automáticamente.
          </p>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
            <p className="text-yellow-300 text-xs font-semibold">
              🔊 CRÍTICO: Activa "Compartir audio de la pestaña" cuando Chrome pregunte
            </p>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-xs font-semibold">
              ⚠️ NOTA: El video se puede reproducir pero no adelantar. Es una limitación de WebM. Para ver partes específicas, usa los controles DURANTE la grabación.
            </p>
          </div>

          <label className="block w-full cursor-pointer">
            <span className="sr-only">Elegir audio</span>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-400 file:cursor-pointer transition-all"
            />
          </label>

          <div className="mt-4">
            <label className="inline-block px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full cursor-pointer transition-all transform hover:scale-105">
              📁 Seleccionar MP3
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {audioSrc && (
        <>
          <div ref={displayRef} className="absolute inset-0">
            <LyricDisplay
              currentLyric={currentLyric}
              nextLyric={nextLyric}
              currentIndex={currentIndex}
              canvasRef={canvasRef}
            />
          </div>

          {isRecording && (
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
            </div>
          )}

          {recordingStatus === 'done' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-green-500 rounded-full text-white text-sm font-semibold shadow-lg shadow-green-500/30 animate-bounce">
              ✓ Video guardado!
            </div>
          )}

          <Controls
            playerState={playerState}
            onPlayPause={togglePlay}
            onSeek={handleSeek}
            onReset={handleReset}
            onRewind={handleRewind}
            onForward={handleForward}
            audioRef={audioRef}
          />

          <audio
            ref={audioRef}
            src={audioSrc}
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