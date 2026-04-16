import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, LogOut, FileText, Briefcase, ClipboardList } from "lucide-react";

export default function CaseNotes() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem("lawyer_theme") || "light");

  useEffect(() => {
    localStorage.setItem("lawyer_theme", theme);
  }, [theme]);
  
  const [notes, setNotes] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [handoffs, setHandoffs] = useState([]);

  useEffect(() => {
    // Also fetch handoffs to get pending cases count for the sidebar badge
    const fetchHandoffs = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/lawyer/handoffs");
        const data = await res.json();
        if (data.status === "success") setHandoffs(data.handoffs);
      } catch (err) {}
    };
    fetchHandoffs();
  }, []);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("case_notes")) || [];
    setNotes(stored);
  }, []);

  const saveNotesToStorage = (updated) => {
    setNotes(updated);
    localStorage.setItem("case_notes", JSON.stringify(updated));
  };

  const deleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id);
    saveNotesToStorage(updated);
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditText(note.answer);
  };

  const saveEdit = (id) => {
    const updated = notes.map(n => n.id === id ? { ...n, answer: editText } : n);
    saveNotesToStorage(updated);
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const highlightEditContent = () => {
    const selection = window.getSelection();
    const selected = selection.toString();
    if (!selected) return;
    
    // Fallback to simple replace logic to match 'highlightText'
    const highlighted = editText.replace(selected, `<mark>${selected}</mark>`);
    setEditText(highlighted);
  };

  // ✅ Add new manual note
  const addNewNote = () => {
    if (!newText.trim()) return;

    const newNote = {
      id: Date.now(),
      question: "📝 Custom Note",
      answer: newText,
      date: new Date().toLocaleString()
    };

    const updated = [newNote, ...notes];
    saveNotesToStorage(updated);

    setNewText("");
    setShowEditor(false);
  };

  // ✅ Highlight selected text
  const highlightText = () => {
    const selection = window.getSelection();
    const selected = selection.toString();

    if (!selected) return;

    const highlighted = newText.replace(
      selected,
      `<mark>${selected}</mark>`
    );

    setNewText(highlighted);
  };

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
              
              <div 
                onClick={() => navigate("/lawyer-cases")}
                className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Briefcase size={18} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="font-medium">Client Cases</span>
                </div>
                {handoffs.filter(c => c.status === "pending_review").length > 0 && 
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                    {handoffs.filter(c => c.status === "pending_review").length}
                  </span>
                }
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shadow-sm font-medium transition-colors">
                <ClipboardList size={18} />
                <span>Case Notes</span>
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
          <div className="h-16 px-8 border-b border-gray-200 dark:border-gray-800/80 flex items-center justify-between bg-white/80 dark:bg-[#0A0F1C]/70 backdrop-blur-md sticky top-0 z-10">
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-3">
               Saved Research & Case Notes
            </h1>
            <button
              onClick={() => setShowEditor(!showEditor)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              + New Note
            </button>
          </div>

          <div className="p-8 max-w-4xl mx-auto w-full flex-1">
            
            {showEditor && (
              <div className="bg-white dark:bg-[#111827] shadow-xl dark:shadow-2xl rounded-2xl p-6 border border-gray-100 dark:border-gray-800/80 mb-6">
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Write important points..."
                  className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 rounded-xl h-32 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-400 dark:placeholder-gray-500"
                />

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={highlightText}
                    className="bg-yellow-400 px-4 py-2 rounded-lg text-sm font-semibold text-yellow-900 shadow hover:bg-yellow-500 transition-colors"
                  >
                    Highlight
                  </button>

                  <button
                    onClick={addNewNote}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow hover:bg-green-700 transition"
                  >
                    Save Note
                  </button>

                  <button
                    onClick={() => setShowEditor(false)}
                    className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {notes.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-20">No case notes saved yet.</p>
            )}

            <div className="space-y-6">
              {notes.map(note => (
                <div key={note.id} className="bg-white dark:bg-[#111827] shadow-lg dark:shadow-xl rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                  <p className="font-bold text-lg text-blue-600 dark:text-blue-400 mb-1">
                    {note.question}
                  </p>

                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{note.date}</p>

                  {editingId === note.id ? (
                    <div className="mt-3">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 rounded-xl h-32 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-3">
                        <button onClick={highlightEditContent} className="bg-yellow-400 px-4 py-2 rounded-lg text-sm font-semibold text-yellow-900 shadow hover:bg-yellow-500 transition-colors">Highlight</button>
                        <button onClick={() => saveEdit(note.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow hover:bg-green-700 transition">Save</button>
                        <button onClick={cancelEdit} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className="prose dark:prose-invert prose-blue max-w-none prose-p:leading-relaxed text-gray-700 dark:text-gray-300"
                        dangerouslySetInnerHTML={{ __html: note.answer }}
                      />

                      <div className="flex gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                          onClick={() => startEdit(note)}
                          className="text-indigo-500 font-semibold hover:underline text-sm"
                        >
                          Edit Note
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-red-500 font-semibold hover:underline text-sm"
                        >
                          Delete Note
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}