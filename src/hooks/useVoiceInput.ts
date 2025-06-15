
import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useVoiceInput = (onTranscriptionComplete: (text: string) => void) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording) {
        stopRecording();
        return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunks.current = [];
      
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          try {
            const { data, error } = await supabase.functions.invoke('voice-to-text', {
              body: { audio: base64Audio },
            });

            if (error) throw error;

            if (data.text) {
              onTranscriptionComplete(data.text);
            } else if(data.error) {
              throw new Error(data.error);
            }
          } catch (error: any) {
            toast({
              title: "Transcription Failed",
              description: error.message || "Could not transcribe audio.",
              variant: "destructive",
            });
          } finally {
            setIsTranscribing(false);
            stream.getTracks().forEach(track => track.stop());
          }
        };
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      toast({ title: "Recording...", description: "Speak now. Click the microphone again to stop." });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check your browser permissions.",
        variant: "destructive",
      });
    }
  }, [isRecording, stopRecording, onTranscriptionComplete, toast]);

  return { isRecording, isTranscribing, startRecording };
};

