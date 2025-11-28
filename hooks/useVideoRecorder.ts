import { useRef, useState, useCallback, useEffect } from 'react';

interface UseVideoRecorderOptions {
  onRecordingComplete?: (blob: Blob) => void;
}

export function useVideoRecorder(options: UseVideoRecorderOptions = {}) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  const startRecording = useCallback((canvas: HTMLCanvasElement, audioElement: HTMLAudioElement) => {
    if (isRecording) return;

    canvasRef.current = canvas;
    chunksRef.current = [];

    try {
      // Capturar stream del canvas a 30fps
      const canvasStream = canvas.captureStream(30);
      
      // Capturar audio del elemento de audio
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(audioElement);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      source.connect(audioContext.destination); // También reproducir el audio
      
      // Combinar video y audio
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...destination.stream.getAudioTracks()
      ]);
      
      streamRef.current = combinedStream;

      // Configurar MediaRecorder con la mejor calidad disponible
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps para alta calidad
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        options.onRecordingComplete?.(blob);
        
        // Auto-descargar el video
        downloadVideo(blob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Capturar cada 100ms
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [isRecording, options]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Limpiar streams
      streamRef.current?.getTracks().forEach(track => track.stop());
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

  return {
    isRecording,
    recordedBlob,
    startRecording,
    stopRecording,
    downloadVideo: () => recordedBlob && downloadVideo(recordedBlob),
  };
}
