import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { analyzePdf, sendChatMessage } from "../api/api";
import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import { Plus, MessageSquare, LogOut, MicOff, Scale, Sparkles, Moon, Sun, Trash2, X, History, Bell, Briefcase, Menu, Info, BookOpen, ChevronRight } from "lucide-react";

export default function Chat() {
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("legal_chats");
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      {
        id: Date.now(),
        title: "Initial Case Brief",
        messages: [],
        context: [],
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem("legal_chats", JSON.stringify(chats));
  }, [chats]);

  const [theme, setTheme] = useState("dark"); // Default to dark mode

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_name");
    navigate("/login");
  };

  const [userName, setUserName] = useState("User");

  useEffect(() => {
    setUserName(localStorage.getItem("user_name") || "User");
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, []);

  const [activeChatId, setActiveChatId] = useState(() => {
    const chatWithHistory = chats.find(c => c.messages.length > 0);
    return chatWithHistory ? chatWithHistory.id : chats[0].id;
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("english");

  // 🎤 Voice states
  const [listening, setListening] = useState(false);
  const [liveMode, setLiveModeState] = useState(false);
  const liveModeRef = useRef(false);
  const isBusyRef = useRef(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, loading]);

  const [lawyerResponses, setLawyerResponses] = useState([]);
  const [allLawyerResponses, setAllLawyerResponses] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    const fetchHandoffs = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/user/handoffs/guest");
        const data = await res.json();
        if (data.status === "success") {
          const responded = data.handoffs.filter(h => h.status === "responded");
          setLawyerResponses(responded);
          const allRespondedOrRead = data.handoffs.filter(h => h.status === "responded" || h.status === "read");
          setAllLawyerResponses(allRespondedOrRead);
        }
      } catch (err) { }
    };
    fetchHandoffs();
    const interval = setInterval(fetchHandoffs, 10000);
    return () => clearInterval(interval);
  }, []);

  const markNotificationRead = async (id) => {
    try {
      await fetch(`http://127.0.0.1:8000/user/handoffs/${id}/read`, { method: "POST" });
      setLawyerResponses(prev => prev.filter(r => r._id !== id));
      setAllLawyerResponses(prev => prev.map(r => r._id === id ? { ...r, status: "read" } : r));
    } catch(err) {}
  };

  const setLiveMode = (val) => {
    liveModeRef.current = val;
    setLiveModeState(val);
    if (val) {
      setTimeout(() => startListening(), 200);
    } else {
      isBusyRef.current = false;
    }
  };

  const userLocation = "hyderabad";
  const activeChat = chats.find((c) => c.id === activeChatId);

  // 🆕 Create chat
  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Case Brief",
      messages: [],
      context: [],
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  // 🗑️ Delete chat
  const deleteChat = (e, chatId) => {
    e.stopPropagation();
    let updatedChats = chats.filter((c) => c.id !== chatId);
    if (updatedChats.length === 0) {
      const newChat = {
        id: Date.now(),
        title: "New Case Brief",
        messages: [],
        context: [],
      };
      updatedChats = [newChat];
      setActiveChatId(newChat.id);
    } else if (activeChatId === chatId) {
      setActiveChatId(updatedChats[0].id);
    }
    setChats(updatedChats);
  };

  // 🎤 Voice input
  const startListening = async () => {
    if (!liveModeRef.current || isBusyRef.current) return;
    isBusyRef.current = true;
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

        try {
          const res = await fetch("http://127.0.0.1:8000/speech-chat", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          setListening(false);

          if (data.text && data.text.trim()) {
            sendMessage(data.text, data.lang);
          } else {
            isBusyRef.current = false;
            if (liveModeRef.current) setTimeout(startListening, 500);
          }
        } catch (fetchErr) {
          console.error("Speech API error:", fetchErr);
          setListening(false);
          isBusyRef.current = false;
          if (liveModeRef.current) setTimeout(startListening, 2000);
        }
      };

      mediaRecorder.start();
      setListening(true);

      setTimeout(() => {
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
        stream.getTracks().forEach((track) => track.stop());
      }, 4000);
    } catch (err) {
      console.error("Mic error:", err);
      setListening(false);
      setLiveMode(false);
      isBusyRef.current = false;
    }
  };

  const stopListening = () => {
    setListening(false);
  };

  // 💬 SEND MESSAGE
  const sendMessage = async (text, langOverride = null) => {
    if (loading) {
      if (liveModeRef.current) {
        isBusyRef.current = false;
        setTimeout(startListening, 1000);
      }
      return;
    }
    if (!text?.trim() && !selectedFile) {
      if (liveModeRef.current) {
        isBusyRef.current = false;
        setTimeout(startListening, 500);
      }
      return;
    }

    setLoading(true);
    isBusyRef.current = true;

    let updatedContext = [...activeChat.context];
    let userMessage = null;
    let fileToUpload = selectedFile; 

    let contentToShow = text?.trim() || "";
    if (fileToUpload) {
      contentToShow = contentToShow 
        ? `📄 ${fileToUpload.name}\n\n${contentToShow}`
        : `📄 Uploaded Document: ${fileToUpload.name}`;
    }

    userMessage = {
      id: Date.now(),
      role: "user",
      content: contentToShow,
    };

    updatedContext.push({
      role: "user",
      content: contentToShow,
    });

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            title: chat.messages.length === 0 && text ? text.slice(0, 25) + "..." : chat.title,
            messages: [...chat.messages, userMessage],
            context: updatedContext,
          };
        }
        return chat;
      })
    );

    setSelectedFile(null); 

    try {
      let res;

      if (fileToUpload) {
        res = await analyzePdf({
          pdf: fileToUpload,
          user_location: userLocation,
          conversation_context: updatedContext,
        });
      } else {
        res = await sendChatMessage({
          user_query: text,
          user_location: userLocation,
          conversation_context: updatedContext,
          selected_language: langOverride || currentLanguage,
        });
      }

      if (res.audio_url && liveModeRef.current) {
        const BACKEND_URL = "http://127.0.0.1:8000";
        const fullUrl = `${BACKEND_URL}${res.audio_url}`;
        const audio = new Audio(fullUrl);
        audio.onended = () => {
          isBusyRef.current = false;
          if (liveModeRef.current) setTimeout(startListening, 500);
        };
        audio.play().catch((err) => {
          console.error("Audio block error", err);
          isBusyRef.current = false;
          if (liveModeRef.current) setTimeout(startListening, 500);
        });
      } else {
        isBusyRef.current = false;
        if (liveModeRef.current) setTimeout(startListening, 500);
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        type: "legal",
        data: {
          ...res,               
          lawyers: res.lawyers || [], 
        },
      };

      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === activeChatId) {
            const finalContext = [...chat.context];
            if (res.extracted_document_text) {
               finalContext.push({
                  role: "user",
                  content: `[EXTRACTED DOCUMENT TEXT]:\n\n${res.extracted_document_text.substring(0, 3500)}`
               });
            }
            finalContext.push({
               role: "assistant",
               content: res.message || "",
            });

            return {
              ...chat,
              messages: [...chat.messages, assistantMessage],
              context: finalContext,
            };
          }
          return chat;
        })
      );
    } catch (err) {
      console.error(err);
      isBusyRef.current = false;
      if (liveModeRef.current) setTimeout(startListening, 2000);
      
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        type: "error",
        data: { message: "⚠️ Sorry, an error occurred while analyzing the document or processing your request. Please try again." }
      };
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === activeChatId) {
            return { ...chat, messages: [...chat.messages, errorMessage] };
          }
          return chat;
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 flex flex-col bg-white font-sans overflow-hidden text-gray-800`}>
      
      {/* 🚀 MINIMALIST TOP NAVBAR */}
      <header className="h-16 border-b border-gray-200 bg-white dark:bg-white flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
         <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors mr-1">
               <Menu size={24} />
            </button>
            <Scale size={24} className="text-blue-600" />
            <span className="text-xl font-bold font-serif text-gray-900 tracking-tight">Legal AI Agent</span>
         </div>
         
         <div className="flex items-center gap-2 sm:gap-4">
            <button
               onClick={() => setShowInfoModal(true)}
               className="text-sm font-semibold text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors hidden md:flex items-center gap-2"
            >
               <Info size={18} /> How it works
            </button>
            <button
               onClick={() => setShowHistoryModal(true)}
               className="text-gray-500 hover:text-gray-900 transition-colors p-2 relative"
            >
               <History size={20} />
               {allLawyerResponses.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
            
            <button onClick={createNewChat} className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-full transition-colors">
               + New Query
            </button>
            
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-800 transition-colors ml-4">
               <LogOut size={20} />
            </button>
         </div>
      </header>

      {/* 💬 MAIN CHAT WORKSPACE (Centered) */}
      <div className="flex-1 w-full bg-transparent flex justify-center relative overflow-hidden min-h-0">
         {lawyerResponses.length > 0 && (
            <div className="w-full bg-blue-50 border-b border-blue-100 p-3 text-center text-sm text-blue-800 flex justify-center items-center gap-3">
               <span className="font-semibold"><Bell size={16} className="inline mr-1" /> Legal Network Update:</span> You have {lawyerResponses.length} new response(s) from a verified advocate. 
               <button onClick={() => {
                 lawyerResponses.forEach(r => markNotificationRead(r._id));
                 setShowHistoryModal(true);
               }} className="ml-2 font-bold underline">View</button>
            </div>
         )}

         {/* Container strictly limited to 4xl for readability */}
         <div className="flex-1 w-full max-w-4xl overflow-y-auto px-4 sm:px-6 py-8 custom-scrollbar scroll-smooth flex flex-col relative min-h-0">

            {activeChat?.messages.length === 0 ? (
               <div className="flex flex-col items-center justify-center text-center mt-12 sm:mt-24 pt-5 animate-fade-in-up w-full px-4">
                 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] uppercase tracking-widest mb-6 border border-blue-200 shadow-sm">
                    <Sparkles size={14}/> Layer-2 Legal Intelligence Engine
                 </div>
                 <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 font-serif mb-5 leading-tight tracking-tight">Verifiable Legal Counsel, <br/><span className="text-blue-600">Tailored to Indian Law.</span></h2>
                 <p className="text-gray-600 text-[15px] max-w-xl mb-12 text-center leading-relaxed font-medium">
                   Upload your contracts, FIRs, or legal notices. Our intelligent layer analyzes against BNS, IPC, and real-time Supreme Court rulings. 
                 </p>
                 
                 {/* Minimal horizontal suggestion pills instead of big bulky vertical cards */}
                 <div className="flex flex-wrap justify-center gap-3 w-full max-w-3xl mb-10">
                    <button 
                       className="bg-white border border-gray-200 px-5 py-3 rounded-full flex items-center gap-2 shadow-sm hover:shadow hover:border-blue-400 font-medium text-[13px] text-gray-700 transition" 
                       onClick={() => sendMessage('Analyze my tenant eviction notice under the Rent Control Act.')}>
                       <BookOpen size={16} className="text-blue-600" /> Tenant & Property
                    </button>
                    <button 
                       className="bg-white border border-gray-200 px-5 py-3 rounded-full flex items-center gap-2 shadow-sm hover:shadow hover:border-blue-400 font-medium text-[13px] text-gray-700 transition" 
                       onClick={() => sendMessage('Draft an NDA and outline GST compliance for my software startup.')}>
                       <Briefcase size={16} className="text-blue-600" /> Corporate Compliance
                    </button>
                    <button 
                       className="bg-white border border-gray-200 px-5 py-3 rounded-full flex items-center gap-2 shadow-sm hover:shadow hover:border-blue-400 font-medium text-[13px] text-gray-700 transition" 
                       onClick={() => sendMessage('What is the exact process for filing a consumer litigation against defective products?')}>
                       <Scale size={16} className="text-blue-600" /> Consumer Rights
                    </button>
                 </div>
               </div>
            ) : (
               <div className="max-w-3xl mx-auto space-y-6 pb-40 w-full px-2 lg:px-0">
                 {activeChat?.messages.map((m) => (
                   <ChatMessage
                     key={m.id}
                     message={m}
                     listening={listening}
                     setLanguage={setCurrentLanguage}
                     sendMessage={sendMessage}
                     chatContext={activeChat.context}
                     userLocation={userLocation}
                   />
                 ))}
                 
                 {loading && (
                   <div className="flex justify-start">
                     <div className="bg-white border border-gray-100 shadow-sm px-5 py-4 rounded-2xl flex items-center gap-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                     </div>
                   </div>
                 )}
                 <div ref={messagesEndRef} className="h-1" />
               </div>
            )}
         </div>

         {/* Centered Input Dock at Bottom */}
         <div className="absolute bottom-0 left-0 right-0 py-6 px-4 flex justify-center z-20 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
            <div className="w-full max-w-3xl bg-white shadow-lg rounded-2xl border border-gray-200">
              <ChatInput
                onSend={sendMessage}
                disabled={loading}
                setSelectedFile={setSelectedFile}
                selectedFile={selectedFile}
              />
             </div>
          </div>
       </div>

      {/* Modern Overlay Modal for Lawyer Responses */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 transition-opacity" onClick={() => setShowHistoryModal(false)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-lg shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800 relative z-10 animate-fade-in-up">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h2 className="text-lg font-bold font-serif text-gray-900">
                Responses from Lawyers
              </h2>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="p-2 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto hide-scrollbar flex-1 space-y-4">
              {allLawyerResponses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                   <Briefcase size={48} className="mb-4 text-gray-300" />
                   <p className="font-medium text-lg text-gray-600">No responses yet</p>
                   <p className="text-sm mt-2">When you escalate a case, lawyers' replies will appear here.</p>
                </div>
              ) : (
                allLawyerResponses.map(r => (
                  <div key={r._id} className={`p-5 rounded-lg border shadow-sm ${r.status === "responded" ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex justify-between items-start mb-3">
                       <span className="text-xs font-bold text-blue-700 bg-white px-2 py-1 rounded uppercase tracking-wider border border-blue-200">
                         {r.parsed_brief?.legal_domain || "Legal Advice"}
                       </span>
                       <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest ${r.status === 'responded' ? 'text-blue-700 bg-blue-100' : 'text-gray-500 bg-gray-100'}`}>
                         {r.status === 'responded' ? 'New' : 'Read'}
                       </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 whitespace-pre-wrap pl-4 border-l-2 border-blue-500 leading-relaxed mt-4">{r.lawyer_response}</p>
                    <div className="text-[11px] font-medium text-gray-400 mt-4 text-right">
                      {new Date(r.responded_at || r.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Sidebar for Chat History */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-200 shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}>
         <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <span className="font-bold text-gray-900 font-serif flex items-center gap-2"><History size={18} className="text-blue-600"/> Chat History</span>
            <button onClick={() => setShowSidebar(false)} className="text-gray-400 hover:text-gray-800 transition-colors p-1 rounded-md hover:bg-gray-200">
               <X size={20} />
            </button>
         </div>
         <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {chats.map((chat) => (
               <div key={chat.id} className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${chat.id === activeChatId ? "bg-blue-50 border border-blue-100" : "hover:bg-gray-50 border border-transparent"}`} onClick={() => { setActiveChatId(chat.id); setShowSidebar(false); }}>
                  <div className="flex flex-col overflow-hidden w-full">
                     <span className={`truncate text-sm font-semibold pl-1 border-l-2 ${chat.id === activeChatId ? "text-blue-800 border-blue-600" : "text-gray-700 border-transparent"}`}>
                       {chat.title}
                     </span>
                     <span className="text-[10px] text-gray-400 mt-1 pl-1 truncate">
                        {chat.messages.length} messages
                     </span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteChat(e, chat.id); }} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                     <Trash2 size={16} />
                  </button>
               </div>
            ))}
         </div>
         <div className="p-5 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 font-medium text-center">
             Your conversations are private and encrpyted.
         </div>
      </div>
      {showSidebar && <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" onClick={() => setShowSidebar(false)}></div>}

      {/* Informational Modal: How it Works */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 transition-opacity" onClick={() => setShowInfoModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col relative z-10 overflow-hidden">
             <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                <div>
                   <h2 className="text-2xl font-bold font-serif mb-1">How Legal AI Works</h2>
                   <p className="text-blue-100 text-sm">Your AI Legal Assistant in 3 Steps</p>
                </div>
                <button onClick={() => setShowInfoModal(false)} className="text-blue-200 hover:text-white transition-colors bg-blue-700 p-2 rounded-full">
                  <X size={20} />
                </button>
             </div>
             <div className="p-8 space-y-6">
                <div className="flex gap-4">
                   <div className="bg-blue-100 text-blue-700 font-bold w-10 h-10 flex items-center justify-center rounded-xl shrink-0 border border-blue-200 shadow-sm">1</div>
                   <div>
                      <h4 className="font-bold text-gray-900 text-base">Intelligent Chat & Voice Interface</h4>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">Discuss your legal concerns naturally via text or voice. Our AI agent listens, translates, and structures your inputs into clear, professional legal queries.</p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="bg-blue-100 text-blue-700 font-bold w-10 h-10 flex items-center justify-center rounded-xl shrink-0 border border-blue-200 shadow-sm">2</div>
                   <div>
                      <h4 className="font-bold text-gray-900 text-base">Document Analysis & Legal Retrieval</h4>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">Upload contracts, legal notices, or FIRs. Our RAG-powered engine securely analyzes your uploaded documents against Indian regulations such as BNS and IPC to provide accurate context and citations.</p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="bg-blue-100 text-blue-700 font-bold w-10 h-10 flex items-center justify-center rounded-xl shrink-0 border border-blue-200 shadow-sm">3</div>
                   <div>
                      <h4 className="font-bold text-gray-900 text-base">Seamless Lawyer Escalation</h4>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">Once your case brief is finalized by the AI, escalate it to the verified lawyers on our network. Receive actionable advice and status updates right in your dashboard.</p>
                   </div>
                </div>
             </div>
             <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button onClick={() => setShowInfoModal(false)} className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-black transition-colors">Understood, Let's Begin</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}