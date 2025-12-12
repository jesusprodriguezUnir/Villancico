import { type FC, useState, useEffect, useRef, type RefObject } from 'react';
import { LyricLine } from '../types';

interface LyricDisplayProps {
  currentLyric: LyricLine | null;
  nextLyric: LyricLine | null;
  currentIndex: number;
}

// Tipos de transiciones disponibles - más variedad para mejor calidad visual
type TransitionType =
  | 'fade'
  | 'slideLeft'
  | 'slideRight'
  | 'slideUp'
  | 'slideDown'
  | 'zoom'
  | 'zoomRotate'
  | 'blur'
  | 'crossfade'
  | 'flip'
  | 'rotate'
  | 'wipeLeft'
  | 'wipeRight'
  | 'scaleRotate'
  | 'glitch';

const TRANSITIONS: TransitionType[] = [
  'fade',
  'slideLeft',
  'slideRight',
  'slideUp',
  'slideDown',
  'zoom',
  'zoomRotate',
  'blur',
  'crossfade',
  'flip',
  'rotate',
  'wipeLeft',
  'wipeRight',
  'scaleRotate',
  'glitch'
];

const LyricDisplay: FC<LyricDisplayProps> = ({ currentLyric, nextLyric, currentIndex, canvasRef }) => {
  const [previousLyric, setPreviousLyric] = useState<LyricLine | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentTransition, setCurrentTransition] = useState<TransitionType>('fade');
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Manejar transiciones cuando cambia la letra
  useEffect(() => {
    if (currentLyric && currentLyric !== previousLyric) {
      setIsTransitioning(true);
      setImageLoaded(false);

      // Seleccionar transición aleatoria o basada en sección
      const transitionIndex = currentIndex % TRANSITIONS.length;
      setCurrentTransition(TRANSITIONS[transitionIndex]);

      // Guardar la letra anterior para crossfade
      const timer = setTimeout(() => {
        setPreviousLyric(currentLyric);
        setIsTransitioning(false);
      }, 1000); // Duración de la transición

      return () => clearTimeout(timer);
    }
  }, [currentLyric, currentIndex]);

  if (!currentLyric) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 z-10">
        <div className="text-center">
          {/* Animación de carga navideña */}
          <div className="relative mb-8">
            <div className="text-8xl animate-bounce">🎄</div>
            <div className="absolute -top-2 -right-2 text-4xl animate-ping">⭐</div>
          </div>
          <h2 className="text-4xl font-['Mountains_of_Christmas'] text-yellow-400 mb-4 animate-pulse">
            Preparando la magia navideña...
          </h2>

          {/* Copos de nieve animados */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="snowflake absolute text-white opacity-60"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  fontSize: `${Math.random() * 20 + 10}px`,
                }}
              >
                ❄
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Mapa de imágenes locales
  const IMAGE_MAP: Record<string, string> = {
    'navidad': '/images/navidad.png',
    'turrones': '/images/sweets.png',
    'vacaciones': '/images/vacation.png',
    'colegio': '/images/school.png',
    'luces': '/images/lights.png',
    'arbol': '/images/tree.png',
    'carta': '/images/letter.png',
    'regalos': '/images/gifts.png',
    'belen': '/images/nativity.png',
    'cena': '/images/dinner.png',
    'relax': '/images/relax.png',
    'feliz': '/images/happy.png',
    'loteria': '/images/lottery.png',
    'pandereta': '/images/tambourine.png',
    'baile': '/images/dance.png',
    'familia': '/images/family.png',
    'villancicos': '/images/choir.png',
    'final': '/images/finale.png'
  };

  const getImageSrc = (lyric: LyricLine | null) => {
    if (!lyric) return null;
    return IMAGE_MAP[lyric.imageKey] || '/images/navidad.png'; // Fallback
  };

  const bgImage = getImageSrc(currentLyric);
  const prevBgImage = getImageSrc(previousLyric);

  // Clases de transición según el tipo - versión mejorada con más efectos
  const getTransitionClasses = (isNew: boolean) => {
    const base = 'absolute inset-0 transition-all ease-in-out';
    const duration = 'duration-1000';
    const durationFast = 'duration-700';
    const durationSlow = 'duration-1500';

    if (!isNew) {
      // Imagen saliente
      switch (currentTransition) {
        case 'slideLeft':
          return `${base} ${duration} ${isTransitioning ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`;
        case 'slideRight':
          return `${base} ${duration} ${isTransitioning ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`;
        case 'slideUp':
          return `${base} ${duration} ${isTransitioning ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`;
        case 'slideDown':
          return `${base} ${duration} ${isTransitioning ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`;
        case 'zoom':
          return `${base} ${durationSlow} ${isTransitioning ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`;
        case 'zoomRotate':
          return `${base} ${durationSlow} ${isTransitioning ? 'scale-150 rotate-12 opacity-0' : 'scale-100 rotate-0 opacity-100'}`;
        case 'blur':
          return `${base} ${duration} ${isTransitioning ? 'blur-xl opacity-0 scale-110' : 'blur-0 opacity-100 scale-100'}`;
        case 'flip':
          return `${base} ${duration} ${isTransitioning ? 'rotateY-90 opacity-0' : 'rotateY-0 opacity-100'}`;
        case 'rotate':
          return `${base} ${durationSlow} ${isTransitioning ? 'rotate-180 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`;
        case 'wipeLeft':
          return `${base} ${durationFast} ${isTransitioning ? 'clip-path-left opacity-0' : 'clip-path-full opacity-100'}`;
        case 'wipeRight':
          return `${base} ${durationFast} ${isTransitioning ? 'clip-path-right opacity-0' : 'clip-path-full opacity-100'}`;
        case 'scaleRotate':
          return `${base} ${durationSlow} ${isTransitioning ? 'scale-0 -rotate-45 opacity-0' : 'scale-100 rotate-0 opacity-100'}`;
        case 'glitch':
          return `${base} ${durationFast} ${isTransitioning ? 'translate-x-2 skew-x-12 opacity-0 hue-rotate-90' : 'translate-x-0 skew-x-0 opacity-100 hue-rotate-0'}`;
        default:
          return `${base} ${durationSlow} ${isTransitioning ? 'opacity-0' : 'opacity-100'}`;
      }
    } else {
      // Imagen entrante
      switch (currentTransition) {
        case 'slideLeft':
          return `${base} ${duration} ${isTransitioning ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`;
        case 'slideRight':
          return `${base} ${duration} ${isTransitioning ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`;
        case 'slideUp':
          return `${base} ${duration} ${isTransitioning ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`;
        case 'slideDown':
          return `${base} ${duration} ${isTransitioning ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`;
        case 'zoom':
          return `${base} ${durationSlow} ${isTransitioning ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`;
        case 'zoomRotate':
          return `${base} ${durationSlow} ${isTransitioning ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-12 opacity-0'}`;
        case 'blur':
          return `${base} ${duration} ${isTransitioning ? 'blur-0 opacity-100 scale-100' : 'blur-xl opacity-0 scale-90'}`;
        case 'flip':
          return `${base} ${duration} ${isTransitioning ? 'rotateY-0 opacity-100' : '-rotateY-90 opacity-0'}`;
        case 'rotate':
          return `${base} ${durationSlow} ${isTransitioning ? 'rotate-0 scale-100 opacity-100' : '-rotate-180 scale-0 opacity-0'}`;
        case 'wipeLeft':
          return `${base} ${durationFast} ${isTransitioning ? 'clip-path-full opacity-100' : 'clip-path-right opacity-0'}`;
        case 'wipeRight':
          return `${base} ${durationFast} ${isTransitioning ? 'clip-path-full opacity-100' : 'clip-path-left opacity-0'}`;
        case 'scaleRotate':
          return `${base} ${durationSlow} ${isTransitioning ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-45 opacity-0'}`;
        case 'glitch':
          return `${base} ${durationFast} ${isTransitioning ? 'translate-x-0 skew-x-0 opacity-100 hue-rotate-0' : '-translate-x-2 -skew-x-12 opacity-0 -hue-rotate-90'}`;
        default:
          return `${base} ${durationSlow} ${isTransitioning ? 'opacity-100' : 'opacity-0'}`;
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-black">
      {/* Canvas oculto para grabación - REMOVED FOR KARAOKE MODE */}

      {/* Imagen anterior (para crossfade) */}
      {prevBgImage && isTransitioning && (
        <div className={getTransitionClasses(false)}>
          <img
            src={prevBgImage}
            alt="Previous"
            className="w-full h-full object-cover opacity-60"
          />
        </div>
      )}

      {/* Imagen actual con transición */}
      <div
        key={currentLyric.time}
        className={`absolute inset-0 transition-all duration-1000 ease-out ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
      >
        <img
          src={bgImage}
          alt={currentLyric.visualDescription}
          className="w-full h-full object-cover ken-burns"
          crossOrigin="anonymous"
          onLoad={() => setImageLoaded(true)}
        />
        {/* Overlay con gradiente mejorado */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/50" />

        {/* Efectos de brillo navideño */}
        <div className="absolute inset-0 bg-gradient-radial from-yellow-500/10 via-transparent to-transparent opacity-50" />
      </div>

      {/* Partículas de nieve continuas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="snowflake absolute text-white"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              fontSize: `${Math.random() * 15 + 8}px`,
              opacity: Math.random() * 0.5 + 0.3,
            }}
          >
            ❄
          </div>
        ))}
      </div>

      {/* Capa de texto */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-20">
        <div className="max-w-5xl w-full text-center">

          {/* Indicador de sección con estilo mejorado */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-yellow-400" />
            <span className="inline-block px-4 py-1.5 text-sm font-semibold tracking-widest text-yellow-300 uppercase border border-yellow-400/50 rounded-full bg-black/40 backdrop-blur-md shadow-lg shadow-yellow-500/20">
              ✨ {currentLyric.section} ✨
            </span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-yellow-400" />
          </div>

          {/* Letra principal con animación mejorada */}
          <h1
            key={currentLyric.text}
            className="mb-8 text-5xl md:text-7xl lg:text-8xl font-bold font-['Quicksand'] text-white leading-tight animate-[fadeInScale_0.6s_ease-out]"
            style={{
              textShadow: '0 0 40px rgba(255,215,0,0.4), 0 0 80px rgba(255,215,0,0.2), 4px 4px 0 #000, -2px -2px 0 #000',
            }}
          >
            {currentLyric.text}
          </h1>

          {/* Vista previa de la siguiente línea */}
          {nextLyric && (
            <div className="mt-12 animate-[fadeIn_1s_ease-out]">
              <p className="text-xl md:text-2xl lg:text-3xl text-gray-200/80 font-['Mountains_of_Christmas'] italic">
                <span className="text-yellow-400/60">♪</span> {nextLyric.text} <span className="text-yellow-400/60">♪</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bordes decorativos con efecto de viñeta */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        <div className="absolute top-0 left-0 w-40 h-full bg-gradient-to-r from-black/50 to-transparent" />
        <div className="absolute top-0 right-0 w-40 h-full bg-gradient-to-l from-black/50 to-transparent" />
      </div>

      {/* Marco decorativo navideño */}
      <div className="absolute inset-4 border border-yellow-500/20 rounded-lg pointer-events-none z-10" />
      <div className="absolute inset-8 border border-white/10 rounded-lg pointer-events-none z-10" />
    </div>
  );
};

export default LyricDisplay;