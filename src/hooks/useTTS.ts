import React, { useState, useEffect, useRef, useCallback } from 'react';
import useStore from '@store/store';
import { getTextToSpeech } from '@api/api';

const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio());
  const mediaSourceRef = useRef(new MediaSource());
  const sourceBufferRef = useRef(null);
  const apiKey = useStore((state) => state.apiKey);

  const controller = new AbortController();
  const signal = controller.signal;

  useEffect(() => {
    audioRef.current.src = URL.createObjectURL(mediaSourceRef.current);
    audioRef.current.onended = () => setIsPlaying(false);

    // Media Source initialization
    mediaSourceRef.current.onsourceopen = () => {
      sourceBufferRef.current = mediaSourceRef.current.addSourceBuffer('audio/mpeg');
      sourceBufferRef.current.mode = 'sequence'; // Optional: Enforces sequential append of segments
    };

    // Cleaning up on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        setIsPlaying(false);
      }
    };
  }, []);

  

  const convertChatMessageToSpeech = useCallback(async (text) => {
    // Cleanup before setting up a new MediaSource
    const cleanUp = () => {
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    if (audioRef.current.src) {
      cleanUp()
    }

    if(isPlaying) {
      controller.abort();
      setIsPlaying(false);
      cleanUp()
      console.log('stopping playback')
      return;
    };

    console.log('starting playback')

    setIsPlaying(true);

    // Setup a new MediaSource and URL
    mediaSourceRef.current = new MediaSource();
    audioRef.current.src = URL.createObjectURL(mediaSourceRef.current);
  
    mediaSourceRef.current.addEventListener('sourceopen', async () => {
      sourceBufferRef.current = mediaSourceRef.current.addSourceBuffer('audio/mpeg');
  
      try {
        const response = await getTextToSpeech(text, apiKey, signal);
        const reader = response.body.getReader();
  
        let startedPlaying = false;
  
        const appendNextChunk = async () => {
          const { done, value } = await reader.read();
          if (done) {
            mediaSourceRef.current.endOfStream();
            setIsPlaying(false);
            return;
          }
          sourceBufferRef.current?.appendBuffer(value);
        };
  
        sourceBufferRef.current?.addEventListener('updateend', () => {
          if (!startedPlaying) {
            audioRef.current.play().catch(console.error);
            startedPlaying = true;
          }
          appendNextChunk().catch(console.error);
        });
  
        // Start the process
        appendNextChunk().catch(console.error);
      } catch (error) {
        console.error('Error converting text to speech:', error);
        setIsPlaying(false);
      }
    }, { once: true }); // use { once: true } to ensure the event listener is removed after it's invoked
  }, [apiKey, isPlaying]);
  

  return { convertChatMessageToSpeech, isPlaying, audioElement: audioRef.current };
};

export default useTTS;
