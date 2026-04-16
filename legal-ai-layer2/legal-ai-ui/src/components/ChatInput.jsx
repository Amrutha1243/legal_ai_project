import { useRef, useState } from "react";
import { Paperclip, Mic, Send, FileText, X } from "lucide-react";

export default function ChatInput({
  onSend,
  disabled,
  setSelectedFile,
  selectedFile,
}) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const fileRef = useRef();

  const BACKEND_URL = "http://127.0.0.1:8000";

  const handleSend = () => {
    onSend(text);
    setText("");
  };

  const handleFileClick = () => {
    fileRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
    e.target.value = null;
  };

  const handleVoiceInput = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

        const formData = new FormData();
        formData.append("file", audioBlob, "voice.webm");

        const res = await fetch(`${BACKEND_URL}/speech-chat`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        setText((prev) => prev + (prev ? " " : "") + data.text);

        setRecording(false);
      };

      mediaRecorder.start();
      setRecording(true);

      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach((track) => track.stop());
      }, 4000);

    } catch (err) {
      console.error("Mic error:", err);
      setRecording(false);
    }
  };

  return (
    <div className="relative w-full transition-all duration-300">
      
      {/* File Upload Preview Island */}
      {selectedFile && (
        <div className="absolute -top-20 left-0 right-0 mx-auto w-11/12 sm:w-8/12 bg-white/70 dark:bg-[#0A0F1C]/80 backdrop-blur-2xl border border-white/50 dark:border-white/10 p-3 rounded-[2rem] flex items-center gap-4 animate-slide-up shadow-xl">
          <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[1.2rem] text-white shadow-inner">
            <FileText size={22} />
          </div>
          <div className="flex-1 min-w-0">
             <p className="text-[14px] font-bold text-gray-800 dark:text-gray-100 truncate">
               {selectedFile.name}
             </p>
             <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-1">Stored for Analysis</p>
          </div>
          <button 
             onClick={() => setSelectedFile(null)}
             className="w-10 h-10 flex items-center justify-center text-gray-500 bg-white/50 dark:bg-white/5 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all rounded-[1rem]"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Search-style Input Pill */}
      <div className="w-full bg-white border border-gray-300 shadow-sm rounded-full p-1.5 flex items-center gap-1 transition-all duration-300 focus-within:border-blue-400 focus-within:shadow-[0_4px_20px_rgb(59,130,246,0.15)] relative">
        
        {/* Hidden File Input */}
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          ref={fileRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={handleFileClick}
          disabled={disabled}
          title="Upload Document"
          className="p-3 text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-full transition-all ml-1 shrink-0"
        >
          <Paperclip size={20} />
        </button>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
             if (e.key === 'Enter') {
                 e.preventDefault();
                 if (text.trim() || selectedFile) handleSend();
             }
          }}
          placeholder="Ask a legal question or attach documents..."
          disabled={disabled}
          className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 outline-none px-2 py-2 text-[15px] font-medium"
        />

        <div className="flex items-center pr-1 shrink-0">
          <button
            onClick={handleVoiceInput}
            disabled={disabled || recording}
            title="Voice Input"
            className={`p-3 mr-1 rounded-full transition-all ${
              recording 
                ? "bg-red-50 text-red-500 animate-pulse border border-red-200" 
                : "text-gray-500 hover:text-blue-600 hover:bg-gray-50"
            }`}
          >
            <Mic size={20} />
          </button>

          <button
            onClick={handleSend}
            disabled={disabled || (!text.trim() && !selectedFile)}
            className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${
              (!text.trim() && !selectedFile) || disabled
               ? "bg-gray-100 text-gray-300"
               : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-md"
            }`}
          >
            <Send size={18} className={(!text.trim() && !selectedFile) || disabled ? "" : "ml-1"} />
          </button>
        </div>
      </div>
    </div>
  );
}