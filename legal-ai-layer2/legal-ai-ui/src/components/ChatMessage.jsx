import { useState, useRef, useEffect } from "react";
import { Sparkles, Gavel, ExternalLink, Play, Pause, Send, User, Scale, AlertCircle } from "lucide-react";
import { handoffCase } from "../api/api";

export default function ChatMessage({ message, chatContext, userLocation }) {

  // ================= USER MESSAGE =================
  if (message.role === "user") {
    return (
      <div className="flex justify-end pb-4 group">
        <div className="flex items-start gap-4 max-w-[80%]">
          <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-br-sm shadow-sm break-words whitespace-pre-wrap leading-relaxed text-[15px]">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // ================= ASSISTANT =================
  if (message.role === "assistant" && message.data) {

    // 🚨 ================= ALERT SYSTEM =================
    if (message.data?.mode === "alert" || message.data?.is_legal === false) {
      return (
        <div className="flex justify-start pb-4 w-full group">
          <div className="w-full bg-white border border-gray-200 shadow-[0_4px_15px_rgba(0,0,0,0.02)] px-6 sm:px-8 py-6 rounded-2xl flex flex-col gap-4">
             <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                   <AlertCircle size={16} className="text-amber-500" />
                </div>
                <p className="font-bold text-[13px] uppercase text-gray-800 tracking-wider">Analysis Paused: Domain Restriction</p>
             </div>
             
             <div className="flex-1">
                <p className="text-[15px] font-medium text-gray-700 leading-relaxed mb-5">
                  I cannot process this request. {message.data.message ? message.data.message.replace('🚨', '').trim() : "This query or document appears to be unrelated to legal matters."}
                </p>
                
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
                   <p className="font-semibold text-sm text-blue-800 mb-3 flex items-center gap-2"><Sparkles size={14} className="text-blue-600"/> How I can assist you instead:</p>
                   <ul className="text-sm text-gray-600 space-y-2.5 ml-1">
                      <li className="flex items-start gap-2 leading-relaxed"><span className="text-blue-400 mt-0.5 shrink-0">•</span> <strong>Document Analysis:</strong> Upload legal files such as FIRs, NDAs, rent agreements, or official court notices for review.</li>
                      <li className="flex items-start gap-2 leading-relaxed"><span className="text-blue-400 mt-0.5 shrink-0">•</span> <strong>Legal Queries:</strong> Ask direct questions regarding Indian penal codes (IPC/BNS), labor laws, or corporate compliance.</li>
                      <li className="flex items-start gap-2 leading-relaxed"><span className="text-blue-400 mt-0.5 shrink-0">•</span> <strong>Case Drafting:</strong> Share the raw facts of a dispute to automatically generate a structured legal brief for verified advocates.</li>
                   </ul>
                </div>
             </div>
          </div>
        </div>
      );
    }

    // ✅ SAFE destructuring
    const explanation = message.data?.message || "";
    const audio_url = message.data?.audio_url;
    const lawyers = message.data?.lawyers || [];

    const [displayText, setDisplayText] = useState(explanation);
    const [currentLang, setCurrentLang] = useState("en");

    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const BACKEND_URL = "http://127.0.0.1:8000";

    const cleanText = displayText
      ? displayText.split("Recommended Lawyers:")[0]
      : "";

    // ================= 🔗 LINKIFY =================
    const linkify = (text) => {
      const urlRegex = /(https?:\/\/[^\s]+)/g;

      return text.split(urlRegex).map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 underline underline-offset-4 decoration-blue-500/30 hover:decoration-blue-400 transition-all font-semibold"
            >
              {part}
            </a>
          );
        }
        return part;
      });
    };

    // 🔊 AUDIO LOAD
    useEffect(() => {
      if (audio_url) {
        const audio = new Audio(`${BACKEND_URL}${audio_url}`);
        audioRef.current = audio;
      }
    }, [audio_url]);

    // 🌍 TRANSLATE
    const handleTranslate = async (lang) => {
      const langMap = {
        english: "en",
        hindi: "hi",
        telugu: "te",
      };

      const target = langMap[lang];
      if (currentLang === target) return;
      setCurrentLang(target);

      try {
        const res = await fetch(`${BACKEND_URL}/translate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: explanation,
            target_lang: target,
          }),
        });

        const data = await res.json();

        setDisplayText(data.translated_text);

        if (data.audio_url) {
          const audio = new Audio(`${BACKEND_URL}${data.audio_url}`);
          audioRef.current = audio;
          setIsPlaying(false);
        }

      } catch (err) {
        console.log("Translation error:", err);
      }
    };

    // ▶ PLAY / PAUSE
    const handlePlayPause = () => {
      if (!audioRef.current) return;

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    };

    return (
      <div className="flex justify-start pb-8 w-full group">
        
        {/* Intelligence Card */}
        <div className="w-full bg-white border border-gray-200 shadow-sm px-6 sm:px-8 py-6 rounded-2xl space-y-5 text-gray-800 font-sans">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3">
             <div className="flex items-center gap-2">
                <Scale size={18} className="text-blue-600" />
                <span className="text-[13px] font-bold text-gray-700 uppercase tracking-wide">
                  AI Legal Analysis
                </span>
             </div>
             
             {/* 🌍 LANGUAGE SELECTOR */}
             <div className="flex gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
               <button onClick={() => handleTranslate("hindi")} className={`text-xs font-bold px-3 py-1 rounded-md transition-colors ${currentLang==='hi' ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>HI</button>
               <button onClick={() => handleTranslate("english")} className={`text-xs font-bold px-3 py-1 rounded-md transition-colors ${currentLang==='en' ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>EN</button>
               <button onClick={() => handleTranslate("telugu")} className={`text-xs font-bold px-3 py-1 rounded-md transition-colors ${currentLang==='te' ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>TE</button>
             </div>
          </div>

          {/* MAIN TEXT */}
          <div className="text-[15px] leading-relaxed break-words whitespace-pre-wrap text-gray-900 font-medium">
            {cleanText ? linkify(cleanText) : ""}
          </div>

          {/* 👨‍⚖️ LAWYERS RECS */}
          {lawyers.length > 0 && (
            <div className="space-y-4 pt-5 border-t border-gray-100">
              <p className="font-bold text-gray-800 flex items-center gap-2">
                <Gavel size={16} className="text-blue-600" /> Recommended Advocates
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 mb-4">
                {lawyers.slice(0, 4).map((lawyer, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex flex-col justify-between hover:border-blue-400 transition-colors cursor-pointer" onClick={() => window.open(lawyer.url, '_blank')}>
                    <p className="font-semibold text-[13px] text-gray-900 mb-3 line-clamp-2">
                      {lawyer.title}
                    </p>
                    <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1 mt-auto">
                      View Profile <ExternalLink size={12} />
                    </span>
                  </div>
                ))}
              </div>
              
              {/* HANDOFF TO LAWYER ACTION */}
              <div className="flex justify-start pt-3 border-t border-gray-100 mt-3">
                <button
                  onClick={async () => {
                    alert("Sending case details securely to the lawyer network...");
                    try {
                      await handoffCase({ chat_context: chatContext, user_location: userLocation });
                      alert("✅ Case Brief successfully forwarded! A lawyer will review it on their dashboard.");
                    } catch (err) {
                      alert("⚠️ Failed to handoff case.");
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-black text-white font-medium text-sm transition-colors"
                >
                  <Send size={14} /> Send query to advocates
                </button>
              </div>
            </div>
          )}

          {/* 🔊 AUDIO */}
          {audio_url && (
            <div className="pt-4 flex justify-end">
               <button 
                 onClick={handlePlayPause} 
                 className={`flex items-center gap-2 px-6 py-2.5 rounded text-xs font-bold uppercase tracking-widest transition-colors ${isPlaying ? 'bg-brand-100 text-brand-900 border border-brand-300 shadow-inner' : 'bg-white dark:bg-slate-800 text-brand-900 dark:text-gray-200 border border-brand-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm'}`}
               >
                 {isPlaying ? <><Pause size={14} fill="currentColor" /> Pausing</> : <><Play size={14} fill="currentColor" /> Speak Overview</>}
               </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Fallback for errors
  if (message.role === "assistant" && message.type === "error") {
      return (
        <div className="flex justify-start pb-4 w-full">
          <div className="w-full bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 shadow-sm px-8 py-6 rounded text-red-900 dark:text-red-200 text-[15px] font-medium">
             {message.data?.message}
          </div>
        </div>
      );
  }

  return null;
}