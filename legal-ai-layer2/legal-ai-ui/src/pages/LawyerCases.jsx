import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, LogOut, FileText, Briefcase, ClipboardList } from "lucide-react";

export default function LawyerCases() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem("lawyer_theme") || "light");

  useEffect(() => {
    localStorage.setItem("lawyer_theme", theme);
  }, [theme]);
  
  const [handoffs, setHandoffs] = useState([]);

  const fetchHandoffs = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/lawyer/handoffs");
      const data = await res.json();
      if (data.status === "success") setHandoffs(data.handoffs);
    } catch (err) {
      console.error("Failed to load handoffs");
    }
  };

  useEffect(() => {
    fetchHandoffs();
  }, []);

  const pendingCount = handoffs.filter(c => c.status === "pending_review").length;

  return (
    <div className={`${theme} h-screen w-full overflow-hidden`}>
      <div className="flex h-full bg-slate-50 dark:bg-[#0A0F1C] text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300">

        {/* SIDEBAR */}
        <div className="w-72 bg-white dark:bg-[#111827] border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between shadow-xl z-20 transition-all duration-300">
          <div>
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-2">
                ⚖️ Lawyer AI
              </span>
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>

            <nav className="p-4 space-y-2">
              <div 
                onClick={() => navigate("/lawyer-home")}
                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors group"
              >
                <FileText size={18} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                <span className="font-medium">Document Analysis</span>
              </div>
              
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shadow-sm font-medium transition-colors">
                <div className="flex items-center gap-3">
                  <Briefcase size={18} />
                  <span>Client Cases</span>
                </div>
                {handoffs.filter(c => c.status === "pending_review").length > 0 && 
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                    {handoffs.filter(c => c.status === "pending_review").length}
                  </span>
                }
              </div>

              <div
                onClick={() => navigate("/notes")}
                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors group"
              >
                <ClipboardList size={18} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                <span className="font-medium">Case Notes</span>
              </div>
            </nav>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
             <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700/50">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                   L
                 </div>
                 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lawyer</span>
               </div>
               <button 
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                className="text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
               >
                 <LogOut size={16} />
               </button>
             </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-auto relative flex flex-col">

          {/* TOP BORDER / NAV AESTHETIC */}
          <div className="h-16 px-8 border-b border-gray-200 dark:border-gray-800/80 flex items-center bg-white/80 dark:bg-[#0A0F1C]/70 backdrop-blur-md sticky top-0 z-10">
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-3">
               Escalated Client Workflows
            </h1>
          </div>

          <div className="p-8 max-w-5xl mx-auto w-full flex-1">

          {handoffs.length === 0 ? (
            <p className="text-gray-500">No cases available.</p>
          ) : (
            <div className="space-y-6">
              {handoffs.map((c) => {
                const isSolved = c.status === "responded" || c.status === "read";
                const cardColor = isSolved ? "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700" : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50";
                const titleColor = isSolved ? "text-gray-800 dark:text-gray-200" : "text-red-700 dark:text-red-400";
                const badgeColor = isSolved ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400" : "bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300";
                const bodyTextTitle = isSolved ? "text-gray-700 dark:text-gray-400" : "text-red-900 dark:text-red-300";
                const bodyText = isSolved ? "text-gray-600 dark:text-gray-300" : "text-red-800 dark:text-red-200";
                const alertBoxColor = isSolved ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700" : "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800/50";

                return (
                  <div key={c._id} className={`${cardColor} border p-6 rounded-2xl shadow-xl dark:shadow-2xl transition-all`}>
                    <div className="flex justify-between items-start mb-4">
                        <span className={`font-bold text-xl ${titleColor}`}>{c.parsed_brief?.legal_domain || "General Case"}</span>
                        <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider ${badgeColor}`}>
                          {isSolved ? "Solved" : "Pending"}
                        </span>
                    </div>
                    <div className="space-y-2 mb-6">
                      <p className="text-sm flex gap-2"><strong className={`${bodyTextTitle}`}>📍 Location:</strong> <span className={bodyText}>{c.location}</span></p>
                      <p className="text-sm flex gap-2"><strong className={`${bodyTextTitle}`}>📖 Timeline:</strong> <span className={bodyText}>{c.parsed_brief?.client_timeline}</span></p>
                      <hr className="my-3 border-gray-200 dark:border-gray-700/50" />
                      <p className="text-sm flex gap-2"><strong className={`${bodyTextTitle}`}>⚠️ Risk Factor:</strong> <span className={bodyText}>{c.parsed_brief?.risk_assessment}</span></p>
                    </div>

                    {c.raw_history && Array.isArray(c.raw_history) && c.raw_history.length > 0 && (
                      <div className="mb-6 border border-gray-200 dark:border-gray-700/80 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                          Original User Case Context
                        </div>
                        <div className="p-4 max-h-40 overflow-y-auto bg-gray-50 dark:bg-[#0A0F1C]/50 space-y-3 custom-scrollbar text-sm">
                          {c.raw_history.map((msg, i) => (
                             <div key={i} className="text-gray-800 dark:text-gray-300 border-l-2 pl-3 border-gray-300 dark:border-gray-700">
                               <strong className={msg.role === 'user' ? "text-blue-600 dark:text-blue-400 mr-2" : "text-emerald-600 dark:text-emerald-400 mr-2"}>
                                 {msg.role === 'user' ? "Client:" : "AI Check:"}
                               </strong>
                               <span className="whitespace-pre-wrap">{msg.content}</span>
                             </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={`${alertBoxColor} p-4 rounded-xl border mb-6`}>
                      <strong className={`${bodyTextTitle} text-sm uppercase tracking-wider`}>Action Needed:</strong>
                      <p className={`text-sm mt-2 ${bodyText}`}>{c.parsed_brief?.lawyer_instructions}</p>
                    </div>

                    {!isSolved ? (
                      <div className="flex flex-col gap-3">
                        <textarea
                          className="w-full p-4 border border-red-300 dark:border-red-800 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-red-400 placeholder-red-300 dark:placeholder-red-800/50 transition-all shadow-inner"
                          placeholder="Write your response to the user..."
                          id={`response-${c._id}`}
                          rows="4"
                        />
                        <button
                          onClick={async () => {
                            const textarea = document.getElementById(`response-${c._id}`);
                            const responseText = textarea.value;
                            if (!responseText.trim()) {
                              alert("Please enter a response.");
                              return;
                            }
                            try {
                              const res = await fetch(`http://127.0.0.1:8000/lawyer/handoffs/${c._id}/respond`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ response_text: responseText })
                              });
                              const data = await res.json();
                              if (data.status === "success") {
                                alert("Response sent successfully!");
                                fetchHandoffs(); // refresh list
                              } else {
                                alert("Error: " + data.message);
                              }
                            } catch (err) {
                              console.error("Failed to send response", err);
                              alert("Failed to send response.");
                            }
                          }}
                          className="self-end bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95"
                        >
                          Send Response to User
                        </button>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                        <strong className="text-emerald-800 dark:text-emerald-400 text-sm uppercase tracking-wider">Your Response:</strong>
                        <p className="text-sm mt-2 text-emerald-900 dark:text-emerald-300 leading-relaxed font-medium">{c.lawyer_response}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
    </div>
  );
}
