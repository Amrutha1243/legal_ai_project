import { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import ChatInput from "../components/ChatInput";
import { Scale, Sparkles, Moon, Sun, Trash2, X, History, Briefcase, Menu, LogOut, FileText, ClipboardList, BookOpen, AlertCircle } from "lucide-react";

export default function LawyerHome() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Load chats from LocalStorage specific to Lawyer
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("lawyer_chats");
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      {
        id: Date.now(),
        title: "New Analysis",
        messages: [],
        documentContext: "",
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem("lawyer_chats", JSON.stringify(chats));
  }, [chats]);

  const [activeChatId, setActiveChatId] = useState(() => {
    const chatWithHistory = chats.find(c => c.messages.length > 0);
    return chatWithHistory ? chatWithHistory.id : chats[0].id;
  });

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  const [theme, setTheme] = useState(() => localStorage.getItem("lawyer_theme") || "dark");

  useEffect(() => {
    localStorage.setItem("lawyer_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, loading]);

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Analysis",
      messages: [],
      documentContext: "",
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const deleteChat = (e, chatId) => {
    e.stopPropagation();
    let updatedChats = chats.filter((c) => c.id !== chatId);
    if (updatedChats.length === 0) {
      const newChat = {
        id: Date.now(),
        title: "New Analysis",
        messages: [],
        documentContext: "",
      };
      updatedChats = [newChat];
      setActiveChatId(newChat.id);
    } else if (activeChatId === chatId) {
      setActiveChatId(updatedChats[0].id);
    }
    setChats(updatedChats);
  };

  const saveNote = (question, answer) => {
    const existing = JSON.parse(localStorage.getItem("case_notes")) || [];
    const newNote = {
      id: Date.now(),
      question,
      answer,
      date: new Date().toLocaleString()
    };
    existing.unshift(newNote);
    localStorage.setItem("case_notes", JSON.stringify(existing));
  };

  const sendMessage = async (text) => {
    if (loading || (!text?.trim() && !selectedFile)) return;

    setLoading(true);

    let contentToShow = text?.trim() || "";
    if (selectedFile) {
      contentToShow = contentToShow 
        ? `📄 ${selectedFile.name}\n\n${contentToShow}`
        : `📄 Uploaded Document: ${selectedFile.name}`;
    }

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: contentToShow,
    };

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            title: chat.messages.length === 0 && text ? text.slice(0, 25) + "..." : chat.title,
            messages: [...chat.messages, userMessage],
          };
        }
        return chat;
      })
    );

    let currentContext = activeChat.documentContext;
    let fileToUpload = selectedFile;
    setSelectedFile(null);

    try {
      if (fileToUpload) {
        const formData = new FormData();
        formData.append("file", fileToUpload);
        const uploadRes = await fetch("http://127.0.0.1:8001/upload/", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        currentContext = uploadData.extracted_text;
        
        // Update document context
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === activeChatId ? { ...chat, documentContext: currentContext } : chat
          )
        );
      }

      let conversationStr = activeChat.messages.map(c => `User: ${c.content}\nAI: ${c.role === 'assistant' ? c.content : ''}`).join("\n\n");
      let fullContext = currentContext || "";
      if (conversationStr) {
          fullContext += `\n\n--- PREVIOUS CONVERSATION HISTORY ---\n${conversationStr}`;
      }

      const analyzeForm = new FormData();
      analyzeForm.append("context", fullContext);
      analyzeForm.append("question", text || "Please summarize the document.");

      const res = await fetch("http://127.0.0.1:8001/analyze/", {
        method: "POST",
        body: analyzeForm,
      });

      const data = await res.json();
      const answer = data.analysis || "No analysis returned from the engine.";

      saveNote(text || "Document Analysis", answer);

      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: answer,
      };

      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === activeChatId) {
            return {
              ...chat,
              messages: [...chat.messages, assistantMessage],
            };
          }
          return chat;
        })
      );

    } catch (err) {
      console.error("Analysis Failed:", err);
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        isError: true,
        content: "⚠️ Failed to process document or generate analysis. Ensure the backend is reachable."
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
    <div className={`fixed inset-0 flex flex-col bg-white dark:bg-[#0b1320] font-sans overflow-hidden text-gray-800 dark:text-gray-200 transition-colors duration-300`}>
      
      {/* 🚀 MINIMALIST TOP NAVBAR */}
      <header className="h-16 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0F1C]/70 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
         <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(true)} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors mr-1">
               <Menu size={24} />
            </button>
            <Scale size={24} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-xl font-bold font-serif text-gray-900 dark:text-white tracking-tight">Lawyer AI Agent</span>
         </div>
         
         <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300 mr-2 border border-transparent dark:border-gray-700"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <button onClick={createNewChat} className="text-sm font-semibold text-emerald-600 dark:text-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-100 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-full transition-colors hidden sm:block">
               + New Analysis
            </button>
            
            <button onClick={() => { logout(); navigate("/login"); }} className="text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors ml-2">
               <LogOut size={20} />
            </button>
         </div>
      </header>

      {/* 💬 MAIN CHAT WORKSPACE (Centered) */}
      <div className="flex-1 w-full bg-transparent flex justify-center relative overflow-hidden min-h-0">
         
         {/* Container strictly limited to 4xl for readability */}
         <div className="flex-1 w-full max-w-4xl overflow-y-auto px-4 sm:px-6 py-8 custom-scrollbar scroll-smooth flex flex-col relative min-h-0">

            {activeChat?.messages.length === 0 ? (
               <div className="flex flex-col items-center justify-center text-center mt-12 sm:mt-24 pt-5 animate-fade-in-up w-full px-4">
                 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] uppercase tracking-widest mb-6 border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
                    <Sparkles size={14}/> Layer-1 Legal Analysis Engine
                 </div>
                 <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white font-serif mb-5 leading-tight tracking-tight">Professional Document, <br/><span className="text-emerald-600 dark:text-emerald-400">Review & Analysis.</span></h2>
                 <p className="text-gray-600 dark:text-gray-400 text-[15px] max-w-xl mb-12 text-center leading-relaxed font-medium">
                   Upload complex case files, judgments, or affidavits. Our intelligence layer provides rapid summarization, clause extraction, and contradiction checks. 
                 </p>
                 
                 {/* Minimal horizontal suggestion pills */}
                 <div className="flex flex-wrap justify-center gap-3 w-full max-w-3xl mb-10">
                    <button 
                       className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-5 py-3 rounded-full flex items-center gap-2 shadow-sm hover:shadow hover:border-emerald-400 font-medium text-[13px] text-gray-700 dark:text-gray-300 transition" 
                       onClick={() => document.querySelector('input[type="file"]')?.click()}>
                       <FileText size={16} className="text-emerald-600 dark:text-emerald-400" /> Analyze Case File
                    </button>
                    <button 
                       className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-5 py-3 rounded-full flex items-center gap-2 shadow-sm hover:shadow hover:border-emerald-400 font-medium text-[13px] text-gray-700 dark:text-gray-300 transition" 
                       onClick={() => navigate('/lawyer-cases')}>
                       <Briefcase size={16} className="text-emerald-600 dark:text-emerald-400" /> View Pending Client Cases
                    </button>
                 </div>
               </div>
            ) : (
               <div className="max-w-3xl mx-auto space-y-6 pb-40 w-full px-2 lg:px-0">
                 {activeChat?.messages.map((m, idx) => (
                   m.role === "user" ? (
                      <div key={m.id} className="flex justify-end pb-4 group">
                        <div className="flex items-start gap-4 max-w-[80%]">
                          <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl rounded-br-sm shadow-sm break-words whitespace-pre-wrap leading-relaxed text-[15px]">
                            {m.content}
                          </div>
                        </div>
                      </div>
                   ) : (
                      <div key={m.id} className="flex justify-start pb-8 w-full group">
                        <div className={`w-full ${m.isError ? 'bg-red-50 dark:bg-red-900/20 border-red-300' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10'} border shadow-sm px-6 sm:px-8 py-6 rounded-2xl space-y-5 text-gray-800 dark:text-gray-200 font-sans`}>
                           <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                              {m.isError ? <AlertCircle size={18} className="text-red-500" /> : <Scale size={18} className="text-emerald-600 dark:text-emerald-400" />}
                              <span className={`text-[13px] font-bold ${m.isError ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'} uppercase tracking-wide`}>
                                {m.isError ? 'System Error' : 'AI Legal Analysis'}
                              </span>
                           </div>
                           <div className="prose dark:prose-invert prose-emerald max-w-none text-[15px] leading-relaxed break-words whitespace-pre-wrap font-medium">
                              <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/\*/g, "") }} />
                           </div>
                        </div>
                      </div>
                   )
                 ))}
                 
                 {loading && (
                   <div className="flex justify-start">
                     <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm px-5 py-4 rounded-2xl flex items-center gap-3">
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
         <div className="absolute bottom-0 left-0 right-0 py-6 px-4 flex justify-center z-20 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent dark:from-[#0b1320] dark:via-[#0b1320] dark:to-transparent transition-colors duration-300">
            <div className="w-full max-w-3xl bg-white dark:bg-white/10 shadow-lg dark:shadow-2xl rounded-2xl border border-gray-200 dark:border-white/20 backdrop-blur-md">
              <ChatInput
                onSend={sendMessage}
                disabled={loading}
                setSelectedFile={setSelectedFile}
                selectedFile={selectedFile}
              />
             </div>
          </div>
       </div>

      {/* Slide-out Sidebar for Navigation and Analysis History */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-[#111827] border-r border-gray-200 dark:border-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${showSidebar ? "translate-x-0" : "-translate-x-full"}`}>
         <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
            <span className="font-bold text-gray-900 dark:text-white font-serif flex items-center gap-2"><Briefcase size={18} className="text-emerald-600"/> Lawyer Tools</span>
            <button onClick={() => setShowSidebar(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
               <X size={20} />
            </button>
         </div>
         
         <div className="px-4 py-6 border-b border-gray-100 dark:border-gray-800/50 space-y-2">
             <button onClick={() => {navigate('/lawyer-cases'); setShowSidebar(false);}} className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors">
                 <Briefcase size={18} /> Client Cases 
             </button>
             <button onClick={() => {navigate('/notes'); setShowSidebar(false);}} className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors">
                 <ClipboardList size={18} /> Saved Case Notes
             </button>
         </div>

         <div className="px-5 py-4 font-bold text-xs uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800/50">
            Recent Analyses
         </div>

         <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {chats.map((chat) => (
               <div key={chat.id} className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${chat.id === activeChatId ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300" : "hover:bg-gray-50 dark:hover:bg-white/5 border-transparent text-gray-700 dark:text-gray-400"}`} onClick={() => { setActiveChatId(chat.id); setShowSidebar(false); }}>
                  <div className="flex flex-col overflow-hidden w-full">
                     <span className={`truncate text-sm font-semibold pl-1 border-l-2 ${chat.id === activeChatId ? "border-emerald-600" : "border-transparent"}`}>
                       {chat.title}
                     </span>
                     <span className="text-[10px] opacity-70 mt-1 pl-1 truncate">
                        {chat.messages.length} interactions
                     </span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteChat(e, chat.id); }} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                     <Trash2 size={16} />
                  </button>
               </div>
            ))}
         </div>
      </div>
      {showSidebar && <div className="fixed inset-0 bg-gray-900/20 dark:bg-black/60 z-40 transition-opacity backdrop-blur-sm" onClick={() => setShowSidebar(false)}></div>}

    </div>
  );
}