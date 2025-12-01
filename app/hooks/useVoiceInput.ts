'use client';
import { useState, useCallback } from 'react';

export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback((onResult: (text: string) => void) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Seu navegador não suporta voz. Tente Chrome ou Safari.");
      return;
    }

    try {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setIsListening(false);
        onResult(text);
      };

      recognition.onerror = (event: any) => {
        console.error(event);
        setIsListening(false);
        alert("Não entendi. Verifique o microfone.");
      };

      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (e) {
      setIsListening(false);
      alert("Erro ao iniciar voz. Verifique se está em HTTPS/Localhost.");
    }
  }, []);

  return { isListening, startListening };
}