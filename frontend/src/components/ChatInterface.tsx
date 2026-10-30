'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Stethoscope, MessageSquare, Quote, BookOpen, AlertCircle, FlaskConical, Mic, MicOff, Download } from 'lucide-react';
import { api } from '../lib/api';
import { SanitizedMedicalContent } from './SanitizedMedicalContent';

interface Citation {
  text: string;
  chunkIndex: number;
  sourceName: string;
  score?: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  createdAt?: string;
}

interface DocumentInfo {
  _id: string;
  filename: string;
  documentType?: string;
}

interface Chat {
  _id: string;
  title: string;
  document: DocumentInfo | string;
  messages?: Message[];
}

interface ChatInterfaceProps {
  chat: Chat | null;
  onRefreshChat: (chatId: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ chat, onRefreshChat }) => {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  
  const baseTranscriptRef = useRef<string>('');
  const finalRef = useRef<string>('');
  const interimRef = useRef<string>('');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages, isSubmitting]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        let final = '';
        let interim = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        finalRef.current = final;
        interimRef.current = interim;

        const separator = baseTranscriptRef.current && final ? ' ' : '';
        setQuestion(baseTranscriptRef.current + separator + final);
        setInterimTranscript(interim);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'no-speech') return;
        console.warn('Speech recognition warning:', event.error);
      };

      recognitionRef.current.onend = () => {
        let fullText = baseTranscriptRef.current;
        if (finalRef.current) fullText += (fullText ? ' ' : '') + finalRef.current.trim();
        if (interimRef.current) fullText += (fullText ? ' ' : '') + interimRef.current.trim();
        
        setQuestion(fullText);
        setInterimTranscript('');
      };
    }
  }, []);

  if (!chat) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-200 p-8 gap-3.5 text-center">
        <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
          <MessageSquare className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-800">No Active Query</h3>
          <p className="text-[10px] mt-1 text-gray-400 max-w-xs leading-normal">
            Select a reference book or report from the library to start a clinical query session.
          </p>
        </div>
      </div>
    );
  }

  const documentInfo = typeof chat.document === 'object' ? chat.document : null;
  const documentName = documentInfo?.filename || 'Medical Library';
  const isLabDoc = documentInfo?.documentType === 'lab_report';

  const submitQuestion = async (queryText: string) => {
    if (!queryText.trim() || isSubmitting) return;

    setQuestion('');
    setError(null);
    setIsSubmitting(true);

    try {
      if (!chat.messages) chat.messages = [];
      chat.messages.push({
        role: 'user',
        content: queryText,
        createdAt: new Date().toISOString(),
      });

      await api.post(`/chats/${chat._id}/question`, { question: queryText });
      onRefreshChat(chat._id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit query.');
      chat.messages?.pop();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuestion(question);
  };

  // Whisper Recording
  const [isWhisperProcessing, setIsWhisperProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      recognitionRef.current?.start();
    } catch (err) {
      console.error("Microphone access denied:", err);
      setError("Please allow microphone access to use voice dictation.");
      setIsListening(false);
    }
  };

  const stopRecordingAndTranscribe = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        resolve('');
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
          const response = await api.post('/speech/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          resolve(response.data.text);
        } catch (err) {
          console.error("Whisper error:", err);
          reject(err);
        }
      };

      mediaRecorderRef.current.stop();
      recognitionRef.current?.stop();
    });
  };

  const toggleListening = async () => {
    if (isListening) {
      setIsListening(false);
      setIsWhisperProcessing(true);
      
      try {
        const whisperText = await stopRecordingAndTranscribe();
        const separator = baseTranscriptRef.current && whisperText ? ' ' : '';
        const fullText = baseTranscriptRef.current + separator + whisperText.trim();
        
        setQuestion(fullText);
        setInterimTranscript('');
        
        if (fullText.trim()) {
          submitQuestion(fullText);
        }
      } catch (err) {
        let fullText = baseTranscriptRef.current;
        if (finalRef.current) fullText += (fullText ? ' ' : '') + finalRef.current.trim();
        if (interimRef.current) fullText += (fullText ? ' ' : '') + interimRef.current.trim();
        
        setQuestion(fullText);
        setInterimTranscript('');
        if (fullText.trim()) {
          submitQuestion(fullText);
        }
      } finally {
        setIsWhisperProcessing(false);
      }
    } else {
      baseTranscriptRef.current = question;
      finalRef.current = '';
      interimRef.current = '';
      setInterimTranscript('');
      setIsListening(true);
      await startRecording();
    }
  };

  const handleDownloadTranscript = () => {
    if (!chat.messages || chat.messages.length === 0) return;
    let text = `MEDSYNEXA CONSULTATION TRANSCRIPT\n`;
    text += `Topic: ${chat.title}\nSource Document: ${documentName}\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n\n`;
    text += `==========================================\n\n`;
    
    chat.messages.forEach(msg => {
      const role = msg.role === 'user' ? 'Doctor' : 'MedSynexa AI';
      text += `[${role}]:\n${msg.content}\n\n`;
    });
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transcript_${chat.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/80 overflow-hidden relative backdrop-blur-xl">

      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-white/10 bg-slate-900/90 flex items-center justify-between gap-3 shrink-0 no-print">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(13,148,136,0.2)]">
            {isLabDoc ? <FlaskConical className="h-4.5 w-4.5" /> : <Stethoscope className="h-4.5 w-4.5" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-extrabold text-white truncate" title={chat.title}>
              {chat.title}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
              <BookOpen className="h-3 w-3 text-teal-400" />
              <span className="truncate">{documentName}</span>
            </p>
          </div>
        </div>

        {chat.messages && chat.messages.length > 0 && (
          <button
            onClick={handleDownloadTranscript}
            className="px-3 py-1.5 text-xs font-bold rounded-xl text-teal-300 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 transition-all"
            title="Download Chat Transcript"
          >
            <Download className="h-3.5 w-3.5 inline mr-1.5" />
            <span className="hidden sm:inline">Download Chat</span>
          </button>
        )}
      </div>

      {/* ── Message Area ── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-slate-950/60">

        {(!chat.messages || chat.messages.length === 0) && !isSubmitting && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-10">
            <div className="h-14 w-14 rounded-3xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/40 shadow-[0_0_20px_rgba(13,148,136,0.3)]">
              <Stethoscope className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Reference Consultation Active</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed font-medium">
                Submit questions or dictate symptoms to search <span className="font-bold text-teal-300">{documentName}</span>.
              </p>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 max-w-md">
              {[
                "Summarize primary clinical findings",
                "Key treatment guidelines & dosage",
                "Abnormal values & risk flags",
              ].map((chip, cIdx) => (
                <button
                  key={cIdx}
                  onClick={() => submitQuestion(chip)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-teal-500/20 text-slate-300 hover:text-white border border-white/10 hover:border-teal-500/40 rounded-2xl text-xs font-semibold transition-all shadow-md"
                >
                  ⚡ {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {chat.messages?.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="h-8 w-8 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0 mr-2.5 mt-1 shadow-xs">
                  <Stethoscope className="h-4 w-4 text-teal-300" />
                </div>
              )}

              <div className="max-w-[85%] sm:max-w-[75%] space-y-2.5">
                <div
                  className={`rounded-3xl px-5 py-4 border backdrop-blur-xl ${
                    isUser
                      ? 'bg-teal-600/90 border-teal-500/50 text-white rounded-br-sm shadow-[0_0_20px_rgba(13,148,136,0.3)]'
                      : 'bg-slate-900/90 border-white/10 text-slate-100 rounded-bl-sm shadow-xl'
                  }`}
                >
                  <div className={`text-[10px] font-extrabold uppercase tracking-wider mb-2 ${isUser ? 'text-teal-200' : 'text-teal-400'}`}>
                    {isUser ? 'Doctor' : 'MedSynexa AI'}
                  </div>

                  {isUser ? (
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                  ) : (
                    <SanitizedMedicalContent content={msg.content} badgeLabel="RAG Source Verified" />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isSubmitting && (
          <div className="flex items-center gap-3 p-4 bg-slate-900/80 border border-white/10 rounded-2xl max-w-sm">
            <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
            <span className="text-xs text-slate-300 font-medium">Cross-referencing RAG index embeddings...</span>
          </div>
        )}
      </div>

      {/* ── Input Bar ── */}
      <div className="p-4 border-t border-white/10 bg-slate-900/90 shrink-0 no-print">
        {isListening && (
          <div className="mb-2 text-center bg-rose-950/60 border border-rose-500/30 text-rose-300 text-[10px] font-bold px-3 py-1 rounded-full animate-pulse">
            <span className="h-2 w-2 bg-rose-500 rounded-full inline-block mr-1.5" />
            Listening to voice dictation... Click mic to stop
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <button
            type="button"
            onClick={toggleListening}
            disabled={isWhisperProcessing}
            className={`p-3 rounded-2xl flex items-center justify-center shrink-0 transition-all border ${
              isListening 
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 animate-pulse' 
                : isWhisperProcessing
                ? 'bg-slate-800 text-teal-300 border-teal-500/40 cursor-wait'
                : 'bg-slate-950/80 text-slate-400 border-white/10 hover:text-white hover:bg-slate-800'
            }`}
            title="Voice Dictation"
          >
            {isWhisperProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isListening ? (
              <MicOff className="h-4.5 w-4.5" />
            ) : (
              <Mic className="h-4.5 w-4.5" />
            )}
          </button>

          <div className="flex-1 relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitQuestion(question);
                }
              }}
              disabled={isSubmitting || isWhisperProcessing}
              className="w-full px-4 py-2.5 text-xs text-white bg-slate-950/80 border border-white/15 focus:border-teal-400 rounded-2xl outline-none transition-all placeholder:text-slate-500 resize-none min-h-[42px] max-h-[100px]"
              placeholder={isWhisperProcessing ? "Transcribing audio..." : isListening ? "Listening..." : `Ask about ${documentName}…`}
              rows={1}
              required={!isListening && !isWhisperProcessing}
            />
            {isListening && interimTranscript && (
              <div className="absolute top-full left-0 mt-1 px-3 text-[10px] text-teal-300 italic truncate w-full">
                {interimTranscript}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isWhisperProcessing || (!question.trim() && !isListening)}
            className="btn-teal p-3 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(13,148,136,0.3)]"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={`${className} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
