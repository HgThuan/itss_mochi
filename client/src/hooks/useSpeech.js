import { useState, useCallback, useRef } from 'react';

/**
 * useSpeech — Web Speech API (SpeechSynthesis) hook
 * 
 * Hỗ trợ: ja-JP, en-US, en-GB, vi-VN
 * Không cần API key, miễn phí, hoạt động offline.
 */

const LANG_MAP = {
  ja: 'ja-JP',
  en: 'en-US',
  vi: 'vi-VN',
};

export const useSpeech = () => {
  const [currentlySpeaking, setCurrentlySpeaking] = useState(null);
  const utteranceRef = useRef(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback((text, deckLang = 'ja') => {
    if (!isSupported || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const lang = LANG_MAP[deckLang] || 'ja-JP';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85;   // slightly slower for language learning
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to find a native voice for the language
    const voices = window.speechSynthesis.getVoices();
    const nativeVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0]) && !v.localService === false)
      || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (nativeVoice) utterance.voice = nativeVoice;

    utterance.onstart  = () => setCurrentlySpeaking(text);
    utterance.onend    = () => setCurrentlySpeaking(null);
    utterance.onerror  = () => setCurrentlySpeaking(null);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (isSupported) window.speechSynthesis.cancel();
    setCurrentlySpeaking(null);
  }, [isSupported]);

  const isSpeaking = currentlySpeaking !== null;

  return { speak, stop, isSpeaking, currentlySpeaking, isSupported };
};
