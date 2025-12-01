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

  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    hasEnded: false
  });

  // Handle File Upload
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioSrc(url);
    }
  };

  // Función para iniciar grabación - MEJORADA para pantalla completa
  const startRecording = useCallback(async () => {
    if (isRecording) return;

    chunksRef.current = [];
    setRecordingStatus('recording');

    try {
      // Solicitar captura de pantalla completa con audio
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser', // Preferir pestaña del navegador
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        // @ts-ignore - preferCurrentTab es una API experimental
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
        systemAudio: 'include'
      });

      // Determinar el mejor codec disponible
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : 'video/mp4';

      const mediaRecorder = new MediaRecorder(screenStream, {
        mimeType,
        videoBitsPerSecond: 10000000, // 10 Mbps para alta calidad
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
        // Detener todos los tracks
        screenStream.getTracks().forEach(track => track.stop());
      };

      // Manejar cuando el usuario detiene la compartición
      screenStream.getVideoTracks()[0].onended = () => {
        if (isRecording) {
          stopRecording();
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Capturar cada 100ms para mayor fluidez
      setIsRecording(true);

    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      setRecordingStatus('idle');
      alert('Para grabar el video:\n\n1. Haz clic en "Grabar Video"\n2. Selecciona "Pestaña de Chrome"\n3. Elige esta pestaña\n4. IMPORTANTE: Activa "Compartir audio de la pestaña"\n5. Haz clic en "Compartir"');
    }
  }, [isRecording]);

  // Función para detener grabación
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      setRecordingStatus('processing');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Función para descargar video
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

  // Sync Logic
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

    // Find current lyric
    // We look for the last lyric that has a time <= current time
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
      // Before first lyric
      setCurrentLyric(null);
      setNextLyric(LYRICS[0]);
      setCurrentIndex(-1);
    }
  }, []);

  // Animation Loop for smoother updates than timeupdate event
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

      // Detener grabación si está activa
      if (isRecording) {
        stopRecording();
      }
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

  // Efecto para detener grabación cuando termina el audio
  useEffect(() => {
    if (playerState.hasEnded && isRecording) {
      stopRecording();
    }
  }, [playerState.hasEnded, isRecording, stopRecording]);

  return (
    <div className="relative w-full h-screen bg-slate-900 flex flex-col items-center justify-center font-sans overflow-hidden">

      {/* Header / Upload (Visible if no audio) */}
      {!audioSrc && (
        <div className="relative z-50 bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 text-center max-w-md mx-4 shadow-2xl">
          <div className="mb-6 text-yellow-400 text-6xl">🎄</div>
          <h1 className="text-3xl font-bold mb-2 text-white" style={{ fontFamily: "'Mountains of Christmas', cursive" }}>
            Navidades - Video Maker
          </h1>
          <p className="text-gray-300 mb-6 text-sm">
            Sube tu archivo .mp3 para generar el video musical automáticamente sincronizado con las imágenes.
          </p>

          <label className="block w-full cursor-pointer">
            <span className="sr-only">Elegir audio</span>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-400 file:cursor-pointer transition-all"
            />
          </label>

          {/* Botón alternativo más visible */}
          <div className="mt-4">
            <label className="inline-block px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full cursor-pointer transition-all transform hover:scale-105">
              📁 Seleccionar archivo MP3
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

      {/* Main Player Area */}
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

          {/* Indicador de grabación */}
          {isRecording && (
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-red-600 px-4 py-2 rounded-full shadow-lg shadow-red-500/50">
              <div className="w-3 h-3 bg-white rounded-full animate-ping" />
              <span className="text-white font-bold text-sm tracking-wide">● REC</span>
            </div>
          )}

          {/* Panel de grabación */}
          <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg flex items-center gap-2 ${isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30'
                  : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                }`}
            >
              {isRecording ? (
                <>
                  <span className="w-4 h-4 bg-white rounded-sm"></span>
                  Detener Grabación
                </>
              ) : (
                <>
                  <span className="w-4 h-4 bg-white rounded-full"></span>
                  Grabar Video HD
                </>
              )}
            </button>

            {!isRecording && recordingStatus === 'idle' && (
              <p className="text-white/70 text-xs max-w-48 bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                💡 Selecciona esta pestaña y activa "Compartir audio"
              </p>
            )}

            {recordingStatus === 'processing' && (
              <span className="px-4 py-2 bg-yellow-500/90 rounded-full text-black text-sm font-semibold animate-pulse">
                ⏳ Procesando...
              </span>
            )}

            {recordingStatus === 'done' && (
              <span className="px-4 py-2 bg-green-500 rounded-full text-white text-sm font-semibold shadow-lg shadow-green-500/30">
                ✓ Video guardado
              </span>
            )}
          </div>

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

      {/* Snowflake Overlay Effect (CSS Only) */}
      <div className="pointer-events-none fixed inset-0 z-40 opacity-30 mix-blend-screen">
        {/* We could add complex particle effects here, but keeping it simple for performance */}
      </div>
    </div>
  );
}

export default App;