import { useState } from "react";
import { registerUser, generateEmailOtp, verifyEmailOtp } from "../api/api";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  // STAGES: 0=Email Input, 1=OTP Verify, 2=Final Registration
  const [step, setStep] = useState(0);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [successInfo, setSuccessInfo] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    aadhaar: "",
    role: "user",
    is_adult: false,
  });

  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerateEmailOtp = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setErrorMsg("");
    try {
      const res = await generateEmailOtp(email);
      setSuccessInfo(res.message); 
      setStep(1);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Could not generate OTP.");
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      setErrorMsg("Please enter a valid OTP.");
      return;
    }
    setErrorMsg("");
    try {
      await verifyEmailOtp(email, otp);
      setForm({ ...form, email: email }); // lock it in
      setStep(2);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Invalid OTP.");
    }
  };

  const validateAadhaar = (aadhaar) => {
    if (!/^\d{12}$/.test(aadhaar)) return false;
    const d = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], 
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], 
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1], 
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], 
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ];
    const p = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], 
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], 
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1], 
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ];
    let c = 0;
    const arr = String(aadhaar).split("").map(Number).reverse();
    for (let i = 0; i < arr.length; i++) {
      c = d[c][p[i % 8][arr[i]]];
    }
    return c === 0;
  };

  const validateFinalForm = () => {
    setErrorMsg("");
    if (!form.name || form.name.length < 3) {
      setErrorMsg("Name must be at least 3 characters long.");
      return false;
    }
    
    // Strict Password formatting
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(form.password)) {
      setErrorMsg("Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&).");
      return false;
    }

    if (form.password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-type your password carefully.");
      return false;
    }

    if (!validateAadhaar(form.aadhaar)) {
      setErrorMsg("Please enter a cryptographically valid 12-digit Aadhaar Number.");
      return false;
    }
    if (!form.is_adult) {
      setErrorMsg("You must confirm you are 18+ to use this service.");
      return false;
    }
    return true;
  };

  const handleFinalRegister = async (e) => {
    e.preventDefault();
    if (!validateFinalForm()) return;

    try {
      const res = await registerUser(form);
      alert(res.message || "Registration Successful!");
      navigate("/login");
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Registration failed.");
    }
  };

  return (
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-8 sm:p-10 rounded-2xl w-full space-y-4 border border-gray-200 dark:border-white/5 animate-slide-up shadow-xl transition-colors duration-500">
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-500 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>⚖️ Legal AI</h1>
          <p className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-widest mt-1">Join Platform</p>
        </div>

        {errorMsg && (
          <div className="bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-200 text-sm px-4 py-3 rounded-lg border border-red-200 dark:border-red-500/30 animate-slide-up flex items-start gap-2">
            <span>⚠️</span> <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 0: EMAIL INPUT */}
        {step === 0 && (
          <form onSubmit={handleGenerateEmailOtp} className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-white/10">
              Email Verification
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center pb-2 leading-relaxed">
              We need to verify your email address before creating your account.
            </p>
            <input
              type="email"
              placeholder="Enter your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-white/10 focus:ring-2 focus:ring-yellow-500 outline-none text-center transition"
            />
            <button
              type="submit"
              className="w-full bg-yellow-500 text-slate-900 py-3 rounded-lg font-bold hover:bg-yellow-400 focus:ring-4 focus:ring-yellow-500/50 transition duration-200 mt-2 shadow-lg shadow-yellow-500/20"
            >
              Verify Contact
            </button>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-white/10 mt-6 md:flex justify-center items-center">
              Already have an account?
              <Link to="/login" className="text-yellow-600 hover:text-yellow-500 dark:text-yellow-500 font-semibold ml-2 dark:hover:text-yellow-400 hover:underline transition">
                Login here
              </Link>
            </p>
          </form>
        )}

        {/* STEP 1: OTP VERIFY */}
        {step === 1 && (
          <form onSubmit={handleVerifyEmailOtp} className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-white/10">
              Confirm OTP
            </h2>
            <div className="bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-500/30 p-3 rounded-lg text-sm leading-relaxed text-center flex items-center gap-2 justify-center">
              <span>✅</span> <span>{successInfo}</span>
            </div>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-white/10 focus:ring-2 focus:ring-yellow-500 outline-none tracking-[0.5em] text-xl text-center font-mono transition mt-2"
            />
            <button
              type="submit"
              className="w-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 py-3 rounded-lg font-bold hover:bg-emerald-400 transition"
            >
              Confirm Email
            </button>
            <button
              type="button"
              onClick={() => setStep(0)}
              className="w-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm transition pt-4"
            >
              ← Use a different Email
            </button>
          </form>
        )}

        {/* STEP 2: REGISTRATION FORM */}
        {step === 2 && (
          <form onSubmit={handleFinalRegister} className="space-y-4 animate-slide-up">
            <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-white/10 flex flex-col items-center gap-2">
              Finalize Account
              <span className="text-[11px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30 font-mono tracking-wider">
                 Verified: {email}
              </span>
            </h2>

            <div className="space-y-3 pt-2">
                <input
                  autoComplete="off"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-white/10 focus:ring-2 focus:ring-yellow-500 outline-none transition"
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Secure Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-white/10 focus:ring-2 focus:ring-yellow-500 outline-none transition"
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm Secure Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-white/10 focus:ring-2 focus:ring-yellow-500 outline-none transition"
                />
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="12-Digit Aadhaar Number"
                  value={form.aadhaar}
                  onChange={(e) => setForm({ ...form, aadhaar: e.target.value.replace(/\D/g, "").slice(0, 12) })}
                  className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-white/10 focus:ring-2 focus:ring-yellow-500 outline-none tracking-widest text-center font-mono transition"
                />
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-300 dark:border-white/10 focus:ring-2 focus:ring-yellow-500 outline-none transition appearance-none"
                >
                  <option value="user" className="text-black">Standard Citizen</option>
                  <option value="lawyer" className="text-black">Practicing Lawyer</option>
                </select>
                
                {/* 18+ CHECKBOX */}
                <div className="flex items-start gap-3 pt-3 pb-2 border-t border-gray-200 dark:border-white/10 mt-2">
                  <input 
                     type="checkbox" 
                     id="adultCheck"
                     checked={form.is_adult}
                     onChange={(e) => setForm({...form, is_adult: e.target.checked})}
                     className="mt-0.5 w-4 h-4 rounded border-gray-400 focus:ring-yellow-500 bg-white dark:bg-white/10 accent-yellow-500"
                  />
                  <label htmlFor="adultCheck" className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed cursor-pointer select-none">
                    I confirm that I am 18 years of age or older, and I accept the platform's Terms of Service and Privacy Policy.
                  </label>
                </div>
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-500 text-slate-900 py-3 rounded-lg font-bold hover:bg-yellow-400 focus:ring-4 focus:ring-yellow-500/50 transition duration-200 mt-4 shadow-lg shadow-yellow-500/20"
            >
              Create Account
            </button>
          </form>
        )}
      </div>
  );
}