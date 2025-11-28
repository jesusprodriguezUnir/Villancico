import { type FC } from 'react';
import { LyricLine } from '../types';

interface LyricDisplayProps {
  currentLyric: LyricLine | null;
  nextLyric: LyricLine | null;
}

const LyricDisplay: FC<LyricDisplayProps> = ({ currentLyric, nextLyric }) => {
  if (!currentLyric) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
        <div className="text-center animate-pulse">
          <h2 className="text-4xl font-['Mountains_of_Christmas'] text-yellow-400 mb-4">
            Esperando música...
          </h2>
          <p className="text-gray-300">Sube el archivo de audio para comenzar</p>
        </div>
      </div>
    );
  }

  // Use a dynamic image generator based on the visual description for better relevance
  // Pollinations.ai provides good dynamic generation based on prompts, great for specific requests like "Loteria"
  const bgImage = `https://image.pollinations.ai/prompt/${encodeURIComponent(currentLyric.visualDescription)}?width=1920&height=1080&nologo=true&seed=${currentLyric.time}`;

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Background Layer */}
      <div key={currentLyric.time} className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
        <img 
          src={bgImage} 
          alt={currentLyric.visualDescription}
          className="w-full h-full object-cover ken-burns opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
      </div>

      {/* Text Layer */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-20">
        <div className="max-w-4xl w-full text-center">
          
          {/* Section Indicator */}
          <span className="inline-block px-3 py-1 mb-6 text-sm font-semibold tracking-wider text-yellow-300 uppercase border border-yellow-300 rounded-full bg-black/30 backdrop-blur-sm">
            {currentLyric.section}
          </span>

          {/* Main Lyric */}
          <h1 
            key={currentLyric.text}
            className="mb-8 text-5xl md:text-7xl font-bold font-['Quicksand'] text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] animate-[fadeInUp_0.5s_ease-out]"
            style={{ textShadow: '0 0 20px rgba(255,215,0,0.3), 3px 3px 0 #000' }}
          >
            {currentLyric.text}
          </h1>

          {/* Next Line Preview */}
          {nextLyric && (
            <p className="text-xl md:text-2xl text-gray-300 font-['Mountains_of_Christmas'] animate-pulse opacity-80 mt-12">
              ... {nextLyric.text} ...
            </p>
          )}
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/80 to-transparent z-10" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/80 to-transparent z-10" />
    </div>
  );
};

export default LyricDisplay;