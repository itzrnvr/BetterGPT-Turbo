import { useCallback, useEffect, useRef, useState } from 'react';

// Hook to manage the Media Source Extensions for streaming content
const useMSE = () => {
  const audioElementRef = useRef<HTMLAudioElement>(new Audio());
  const mediaSourceRef = useRef(new MediaSource());
  const [isMediaSourceOpen, setMediaSourceOpen] = useState(false);
  const [sourceBuffer, setSourceBuffer] = useState<SourceBuffer | null>(null);

  // Handle setup when Media Source is open
  const onMediaSourceOpen = useCallback(() => {
    setMediaSourceOpen(true);

    // Assume your audio MIME type is 'audio/mpeg' for MPEG audio.
    // This MIME type may need to change based on the audio format and codecs used.
    const mimeCodec = 'audio/mpeg';
    if (MediaSource.isTypeSupported(mimeCodec)) {
      const mediaSource = mediaSourceRef.current;
      const newSourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
      setSourceBuffer(newSourceBuffer);
    } else {
      console.error('Unsupported MIME type or codec');
    }
  }, []);

  // Handle closing of the Media Source
  const onMediaSourceEnded = useCallback(() => {
    setMediaSourceOpen(false);
  }, []);

  // Attach and clean up the MediaSource event listeners
  useEffect(() => {
    const mediaSource = mediaSourceRef.current;
    mediaSource.addEventListener('sourceopen', onMediaSourceOpen);
    mediaSource.addEventListener('sourceended', onMediaSourceEnded);

    // Set the src of the audio element to the Media Source Object
    audioElementRef.current.src = URL.createObjectURL(mediaSource);

    return () => {
      mediaSource.removeEventListener('sourceopen', onMediaSourceOpen);
      mediaSource.removeEventListener('sourceended', onMediaSourceEnded);
      URL.revokeObjectURL(audioElementRef.current.src);
    };
  }, [onMediaSourceOpen, onMediaSourceEnded]);

  // Add clean up for the SourceBuffer when necessary
  useEffect(() => {
    if (mediaSourceRef.current && !isMediaSourceOpen && sourceBuffer) {
      // If the SourceBuffer is updating (e.g., during appending a new chunk), 
      // we should wait until it finishes before cleanup.
      const updateEndListener = () => {
        mediaSourceRef.current.endOfStream();
        sourceBuffer.removeEventListener('updateend', updateEndListener);
        setSourceBuffer(null); // Clear the source buffer when Media Source is not open
      };
      if (!sourceBuffer.updating) {
        setSourceBuffer(null);
      } else {
        sourceBuffer.addEventListener('updateend', updateEndListener);
      }
    }
  }, [isMediaSourceOpen, sourceBuffer]);

  return { mediaSource: mediaSourceRef.current, sourceBuffer, audioElementRef };
};

export default useMSE;
