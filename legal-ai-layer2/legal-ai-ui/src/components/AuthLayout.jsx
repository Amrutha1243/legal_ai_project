import React, { useState, useEffect } from "react";
import { Scale, Shield, FileText, Users, Sun, Moon, CheckCircle, ChevronRight, ChevronLeft, MessageSquare, Lock, Zap } from "lucide-react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";

export default function AuthLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/register";

  // Light/Dark mode state
  const [isDark, setIsDark] = useState(true);

  // Apply dark class to HTML body or a wrapper 
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const topConcerns = [
    {
      title: "Corporate & Business Law",
      desc: "Contracts, mergers, and corporate governance.",
      icon: <FileText className="text-yellow-500 mb-4" size={36} />,
    },
    {
      title: "Family & Divorce",
      desc: "Marriage, child custody, and alimony matters.",
      icon: <Users className="text-yellow-500 mb-4" size={36} />,
    },
    {
      title: "Criminal Defense",
      desc: "Legal representation in criminal proceedings.",
      icon: <Shield className="text-yellow-500 mb-4" size={36} />,
    },
    {
      title: "Property & Real Estate",
      desc: "Disputes, leases, and property rights.",
      icon: <Scale className="text-yellow-500 mb-4" size={36} />,
    },
  ];

  const features = [
    { title: "Instant AI Counsel", desc: "Get answers to your legal queries 24/7 without waiting for appointments.", icon: <Zap size={24} className="text-yellow-500"/> },
    { title: "Bank-Grade Security", desc: "Your sensitive legal documents and conversations are fully end-to-end encrypted.", icon: <Lock size={24} className="text-yellow-500"/> },
    { title: "Expert RAG Analysis", desc: "Our engine reads complex judgments and contracts, citing exact clauses.", icon: <MessageSquare size={24} className="text-yellow-500"/> },
    { title: "Verified Network", desc: "Seamlessly transition from AI advice to a verified, practicing lawyer.", icon: <CheckCircle size={24} className="text-yellow-500"/> }
  ];

  return (
    // Changed overflow-hidden to overflow-y-auto to allow scrolling for the new content
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0b1320] dark:text-white relative overflow-x-hidden overflow-y-auto flex flex-col transition-colors duration-500 font-sans">
      
      {/* HEADER WITH LOGIN/SIGNUP OPTIONS */}
      <header className="fixed top-0 left-0 right-0 p-6 z-30 flex items-center justify-between pointer-events-none bg-white/10 dark:bg-black/10 backdrop-blur-md border-b border-gray-200 dark:border-white/5 transition-colors duration-500">
        <div className="flex items-center gap-2 pointer-events-auto cursor-pointer" onClick={() => navigate("/")}>
          <Scale className="text-yellow-500" size={28} />
          <span className="text-2xl font-bold font-playfair tracking-wide text-gray-900 dark:text-white">
            Legal<span className="text-yellow-500">AI</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4 pointer-events-auto z-50">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition mr-2"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <Link 
            to="/login" 
            className={`text-sm font-semibold transition ${location.pathname === "/login" ? "text-yellow-500" : "text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"}`}
          >
            Log in
          </Link>
          
          <Link 
            to="/register" 
            className={`text-sm font-semibold border px-5 py-2.5 rounded-full transition shadow-sm ${location.pathname === "/register" ? "bg-gray-200 border-gray-300 dark:bg-white/10 dark:border-white/20 dark:hover:bg-white/20" : "bg-yellow-500 text-slate-900 border-yellow-500 hover:bg-yellow-400"}`}
          >
            Sign up
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section 
        className="relative pt-32 pb-24 md:pt-48 md:pb-32 px-6 flex flex-col items-center text-center w-full min-h-[90vh] flex-shrink-0"
        style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed"
        }}
      >
        <div className="absolute inset-0 bg-white/90 bg-gradient-to-t from-gray-50/90 to-white/70 dark:bg-[#0f172ae3] dark:bg-gradient-to-t dark:from-[#0b1320] dark:to-[#0b1320]/80 transition-colors duration-500"></div>

        <div className="relative z-10 max-w-4xl flex flex-col items-center animate-slide-up">
          <span className="px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-sm font-medium mb-6 uppercase tracking-widest backdrop-blur-sm">
            The Future of Law
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900 dark:text-white leading-tight font-serif">
            <span className="text-yellow-500 drop-shadow-sm">Legal AI Platform</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-10 leading-relaxed max-w-2xl px-4">
            Democratizing access to justice. Our intelligent platform empowers you with immediate case insights, deep document analysis, and comprehensive guidance across all legal domains.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button onClick={() => navigate('/register')} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-8 py-4 rounded-full font-bold text-lg transition shadow-lg shadow-yellow-500/20 flex items-center gap-2 justify-center">
              Get Started Free <ChevronRight size={20} />
            </button>
            <button onClick={() => window.scrollTo({top: window.innerHeight, behavior: 'smooth'})} className="bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-900 dark:text-white px-8 py-4 rounded-full font-bold text-lg transition backdrop-blur-sm flex items-center justify-center">
              Explore Features
            </button>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4 text-gray-900 dark:text-white">Why Choose Legal AI?</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Our platform leverages extensive case laws and legal statutes to provide you with highly accurate, actionable insights.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((opt, idx) => (
            <div key={idx} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-8 rounded-2xl hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group">
              <div className="bg-gray-50 dark:bg-[#0b1320] w-14 h-14 rounded-full flex items-center justify-center mb-6 border border-gray-100 dark:border-white/5 group-hover:scale-110 transition-transform">
                {opt.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{opt.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{opt.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TOP CONCERNS */}
      <section className="py-24 px-6 bg-gray-50 dark:bg-[#0b1320] transition-colors relative z-10 w-full border-t border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 flex items-center justify-center gap-3 text-gray-900 dark:text-white font-serif">
             <Shield className="text-yellow-500" size={32} /> Domains of Expertise
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topConcerns.map((concern, idx) => (
              <div key={idx} className="bg-white/60 dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 p-8 rounded-2xl hover:bg-white dark:hover:bg-white/10 hover:-translate-y-2 transition-all duration-300 shadow-lg flex flex-col items-center text-center">
                 {concern.icon}
                 <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-xl">{concern.title}</h3>
                 <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{concern.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 p-8 border-l-4 border-yellow-500 bg-white dark:bg-yellow-500/5 rounded-r-2xl max-w-3xl mx-auto shadow-md transition-colors duration-500">
             <p className="text-lg text-gray-800 dark:text-gray-300 italic font-serif leading-relaxed text-center">
               "Justice is the constant and perpetual will to allot to every man his due." <br/> 
               <span className="text-yellow-600 dark:text-yellow-500 not-italic font-bold mt-4 inline-block tracking-wide uppercase text-sm">— Justinian I</span>
             </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 bg-gray-900 dark:bg-black text-center relative z-10 border-t border-gray-800 dark:border-white/5">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
          <Scale className="text-white" size={20} />
          <span className="text-lg font-bold font-playfair tracking-wide text-white">
            Legal<span className="text-white">AI</span>
          </span>
        </div>
        <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Legal AI Platform. All rights reserved.</p>
        <p className="text-gray-500 text-xs mt-2">Not a substitute for formal legal representation.</p>
      </footer>

      {/* DRAWER COMPONENT */}
      {/* Backdrop for click-to-close */}
      <div 
        className={`fixed inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${isAuthRoute ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} 
        onClick={() => navigate("/")} 
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] lg:w-[500px] bg-white dark:bg-[#0f172a] shadow-[-20px_0_40px_rgba(0,0,0,0.1)] dark:shadow-[-20px_0_40px_rgba(0,0,0,0.8)] z-50 overflow-y-auto flex items-center justify-center p-8 border-l border-gray-200 dark:border-white/5 transition-transform duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] transform ${isAuthRoute ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Close Button X */}
        <button 
           onClick={() => navigate("/")} 
           className="absolute top-6 right-6 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-white/5 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition z-50"
        >
           ✕
        </button>

        <div className="w-full pt-16 pb-10">
            <Outlet />
        </div>
      </div>

    </div>
  );
}
