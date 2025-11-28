import { useState, useRef, useEffect, useCallback, type ChangeEvent } from 'react';
import { LYRICS } from './constants';
import { PlayerState, LyricLine } from './types';
import LyricDisplay from './components/LyricDisplay';
import Controls from './components/Controls';

function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [currentLyric, setCurrentLyric] = useState<LyricLine | null>(null);
  const [nextLyric, setNextLyric] = useState<LyricLine | null>(null);
  
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
    } else {
      // Before first lyric
      setCurrentLyric(null);
      setNextLyric(LYRICS[0]);
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
    }
  };

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col items-center justify-center font-sans overflow-hidden">
      
      {/* Header / Upload (Visible if no audio) */}
      {!audioSrc && (
        <div className="z-50 bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 text-center max-w-md mx-4 shadow-2xl">
          <div className="mb-6 text-yellow-400 text-6xl">🎄</div>
          <h1 className="text-3xl font-bold mb-2 text-white font-['Mountains_of_Christmas']">
            Navidades - Video Maker
          </h1>
          <p className="text-gray-300 mb-6 text-sm">
            Sube tu archivo .mp3 para generar el video musical automáticamente sincronizado con las imágenes que pediste.
          </p>
          
          <label className="block w-full cursor-pointer">
            <span className="sr-only">Elegir audio</span>
            <input 
              type="file" 
              accept="audio/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2.5 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-yellow-500 file:text-black
                hover:file:bg-yellow-400
                file:cursor-pointer transition-all"
            />
          </label>
        </div>
      )}

      {/* Main Player Area */}
      {audioSrc && (
        <>
          <LyricDisplay currentLyric={currentLyric} nextLyric={nextLyric} />
          
          <Controls 
            playerState={playerState}
            onPlayPause={togglePlay}
            onSeek={handleSeek}
            onReset={handleReset}
            audioRef={audioRef}
          />
          
          <audio 
            ref={audioRef} 
            src={audioSrc} 
            onEnded={() => setPlayerState(p => ({ ...p, isPlaying: false, hasEnded: true }))}
            onLoadedMetadata={() => {
               if(audioRef.current) {
                 setPlayerState(p => ({...p, duration: audioRef.current?.duration || 0}))
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