import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon, SparklesIcon, MapPinIcon, MicrophoneIcon, StopIcon } from "@heroicons/react/24/outline";

const ChatWidget = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };
  const [messages, setMessages] = useState([
    { role: "bot", type: "text", content: "Hi! I'm Smart Street AI. Looking for a vendor or have a question?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", type: "text", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/chat", { message: userMessage.content });
      
      const botMessage = {
        role: "bot",
        type: response.data.type,
        content: response.data.content,
        results: response.data.results
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "bot", type: "text", content: "Sorry, I encountered an error." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed
        bottom-[220px] right-4
        sm:bottom-[220px] sm:right-6
        z-[100] flex flex-col items-end pointer-events-none
        w-[calc(100%-2rem)] sm:w-auto"
    >
      
      {/* Chat Window */}
      <div 
        className={`
          pointer-events-auto
          mb-4
          w-full sm:w-[380px]
          ${isInputFocused ? "max-h-[45vh]" : "max-h-[50vh]"} sm:max-h-[80vh]
          bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-sm
          border border-white/20 dark:border-slate-700
          rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] sm:shadow-2xl z-[100] flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out origin-bottom will-change-transform transform-gpu
          ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-8 pointer-events-none"}
        `}
      >
        {/* Header */}
        <div className="py-1.5 px-3 sm:p-4 bg-gradient-to-r from-teal-600 to-cyan-600 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-1.5">
            <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <h3 className="font-bold text-xs sm:text-base tracking-brand">Smart Street AI</h3>
          </div>
          {/* 44×44px minimum touch target for accessibility */}
          <button 
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-11 h-11 -mr-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close chat"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#0B1120]">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div 
                className={`
                  max-w-[85%] rounded-2xl px-3 py-2 text-[13px] sm:text-sm shadow-sm
                  ${msg.role === "user" 
                    ? "bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-br-none" 
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none"}
                `}
              >
                {msg.type === "text" ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div>
                     <p className="mb-2 font-semibold text-xs opacity-75">Found {msg.results.length} results:</p>
                     <div className="space-y-2">
                       {msg.results.slice(0, 5).map((item, i) => (
                         <div key={i} className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs">{item.business_name || item.space_name || "Unknown"}</h3>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">{item.category || "Vendor"}</span>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => {
                                        if (item.lat && item.lng) {
                                          setIsOpen(false);
                                          navigate("/public", { state: { focusVendor: item } });
                                        }
                                      }}
                                      disabled={!item.lat || !item.lng}
                                      className={`p-1 rounded-full transition-colors ${
                                        item.lat && item.lng 
                                          ? "hover:bg-slate-200 dark:hover:bg-slate-700 text-cyan-600 dark:text-cyan-400" 
                                          : "opacity-30 cursor-not-allowed text-slate-400 dark:text-slate-600"
                                      }`}
                                      title={item.lat && item.lng ? "View on Map" : "No location available"}
                                    >
                                      <MapPinIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                            </div>
                         </div>
                       ))}
                       {msg.results.length > 5 && (
                           <p className="text-[10px] text-center text-slate-400 italic">And {msg.results.length - 5} more...</p>
                       )}
                     </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
               <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-200 dark:border-slate-700">
                 <div className="flex space-x-1.5">
                   <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                   <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                   <div className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                 </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-2 sm:p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder={isListening ? "Listening..." : "Ask anything..."}
              className={`flex-1 pl-3 pr-16 py-2 sm:pl-4 sm:pr-20 sm:py-3 rounded-xl bg-slate-100 dark:bg-slate-900/50 border-none focus:ring-2 focus:ring-cyan-500 text-[13px] sm:text-sm dark:text-white transition-all ${isListening ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20" : ""}`}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-1.5 rounded-lg transition-colors ${isListening ? "bg-red-500 text-white animate-pulse" : "text-slate-400 hover:text-cyan-600 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
                title="Voice Input"
              >
                {isListening ? <StopIcon className="w-4 h-4" /> : <MicrophoneIcon className="w-4 h-4" />}
              </button>
              <button 
                type="submit" 
                disabled={loading || !input.trim()}
                className="p-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                title="Send"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          pointer-events-auto
          w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110
          ${isOpen 
            ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rotate-90" 
            : "bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:shadow-cyan-500/30 animate-pulse-slow"}
        `}
      >
        {isOpen ? <XMarkIcon className="w-6 h-6" /> : <ChatBubbleLeftRightIcon className="w-7 h-7" />}
      </button>

    </div>
  );
};

export default ChatWidget;
