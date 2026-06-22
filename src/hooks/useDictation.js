import { useState, useCallback, useEffect } from 'react';

export const useDictation = (onComplete, selectedVoiceURI) => {
  const [isDictating, setIsDictating] = useState(false);
  const [speechProgress, setSpeechProgress] = useState(0);

  const startDictation = useCallback((textToSpeak) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.9; 

    // Apply the user's selected voice
    const voices = window.speechSynthesis.getVoices();
    const voiceToUse = voices.find(v => v.voiceURI === selectedVoiceURI);
    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const progress = (event.charIndex / textToSpeak.length) * 100;
        setSpeechProgress(progress);
      }
    };

    utterance.onstart = () => {
      setIsDictating(true);
      setSpeechProgress(0);
    };

    utterance.onend = () => {
      setIsDictating(false);
      setSpeechProgress(100);
      if (onComplete) onComplete(); 
    };

    window.speechSynthesis.speak(utterance);
  }, [onComplete, selectedVoiceURI]);

  const stopDictation = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsDictating(false);
    setSpeechProgress(0);
  }, []);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  return { isDictating, speechProgress, startDictation, stopDictation };
};