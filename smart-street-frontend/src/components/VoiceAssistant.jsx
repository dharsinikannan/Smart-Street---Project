import React, { useState, useEffect } from "react";
import { MicrophoneIcon, SpeakerWaveIcon, XMarkIcon } from "@heroicons/react/24/solid";

export default function VoiceAssistant({ onCommand, isListening, setIsListening, status }) {
  const [transcript, setTranscript] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [supported, setSupported] = useState(true);
  const [isBrave, setIsBrave] = useState(false);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSupported(false);
    }

    // Check for Brave browser
    if (navigator.brave && navigator.brave.isBrave) {
      navigator.brave.isBrave().then(isBrave => {
        if (isBrave) setIsBrave(true);
      });
    }
  }, []);

  useEffect(() => {
    if (!supported || !isListening) return;

    if (isBrave) {
      setTranscript("Brave browser is not compatible. Please use Chrome.");
      const timer = setTimeout(() => setIsListening(false), 3000);
      return () => clearTimeout(timer);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // Track if we should ignore onend (e.g., error handling taking over)
    let ignoreEnd = false;

    recognition.onstart = () => {
      setTranscript("Listening...");
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          setTranscript(event.results[i][0].transcript);
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        onCommand(finalTranscript); // Callback with final text
        ignoreEnd = true; // We handled it
        setIsListening(false);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech error", event.error);

      // Ignore 'aborted' as it happens on cleanup
      if (event.error === "aborted") return;

      ignoreEnd = true; // Let the timeout handle closing

      let message = "Error occurred";
      switch (event.error) {
        case "network":
          message = "Network error. Check connection.";
          break;
        case "not-allowed":
        case "service-not-allowed":
          message = "Microphone access denied.";
          break;
        case "no-speech":
          message = "No speech detected. Try again.";
          break;
        default:
          message = "Error: " + event.error;
      }

      setTranscript(message);

      // Keep error visible for 3s before closing
      setTimeout(() => {
        setIsListening(false);
      }, 3000);
    };

    recognition.onend = () => {
      // Only close if we haven't already handled strict closing (via error or result)
      if (isListening && !ignoreEnd) {
        setIsListening(false);
      }
    };

    recognition.start();

    return () => {
      recognition.abort();
    };
  }, [isListening, supported, onCommand]);

  if (!supported) return null;

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsListening(true)}
        className={`fixed z-[30] w-14 h-14 flex items-center justify-center rounded-full shadow-xl transition-all hover:scale-110 active:scale-95
          bottom-[160px] right-4 md:bottom-[100px]
        ${isListening
            ? "bg-red-500 text-white animate-pulse"
            : "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
        title="AI Assistant"
      >
        {isListening ? <SpeakerWaveIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
      </button>

      {/* Overlay / Transcript Display */}
      {(isListening || status) && (
        <div className="fixed bottom-[220px] right-4 md:bottom-[160px] z-[30] w-[calc(100vw-2rem)] md:w-80 pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-indigo-100 dark:border-indigo-900 p-4 transition-all animate-in slide-in-from-bottom-5 flex flex-col max-h-[60vh]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              {isListening ? (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              )}
              {isListening ? "Listening..." : "Smart Assistant"}
            </span>
            <button onClick={() => { setIsListening(false); if (onCommand) onCommand(null); /* clear status if needed logic */ }} className="text-slate-400 hover:text-slate-600">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium italic overflow-y-auto max-h-32 mb-2 p-1">
            "{transcript}"
          </p>
          <p className="text-[10px] text-slate-400 mt-2 mb-3">
            Try: "Book near Central Park tomorrow 6pm to 8pm"
          </p>

          {/* Status Feedback */}
          {status && (
            <div className="mb-3 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">{status}</span>
              </div>
            </div>
          )}

          {/* Fallback Text Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualInput.trim()) {
                onCommand(manualInput);
                setIsListening(false);
                setManualInput("");
              }
            }}
            className="mt-2"
          >
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Or type command here..."
              className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              autoFocus
            />
          </form>
        </div>
      )}
    </>
  );
}
