import { useState } from "react";
import { loginUser, generateLoginOtp, verifyEmailOtp, resetPassword } from "../api/api";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const validateForm = () => {
    setErrorMsg("");
    setSuccessMsg("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return false;
    }
    if (!isForgotPassword && !password) {
      setErrorMsg("Please enter your password.");
      return false;
    }
    if (isForgotPassword && showOTP) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            setErrorMsg("Password must be at least 8 chars, include uppercase, lowercase, number, and special character.");
            return false;
        }
    }
    return true;
  };

  const handleAction = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!showOTP) {
        if (!validateForm()) return;
        
        if (isForgotPassword) {
            try {
                const res = await generateLoginOtp(email);
                setSuccessMsg(res.message || "OTP sent to your email!");
                setShowOTP(true);
            } catch(err) {
                setErrorMsg(err.response?.data?.detail || "Could not generate OTP. Account may not exist.");
            }
        } else {
            // Normal Login: Bypass OTP and login directly
            try {
                const res = await loginUser({ email, password });

                localStorage.setItem("token", res.token);
                if (res.name) {
                  localStorage.setItem("user_name", res.name);
                }

                if (res.role === "lawyer") {
                  navigate("/lawyer-home");
                } else {
                  navigate("/Chat");
                }
            } catch (err) {
                setErrorMsg(err.response?.data?.detail || "Login failed. Invalid credentials.");
            }
        }
        return;
    }

    // Verify OTP for Forgot Password flow
    if (otp.length < 4) {
        setErrorMsg("Please enter a valid OTP.");
        return;
    }

    try {
      if (isForgotPassword) {
          if (!validateForm()) return;
          await resetPassword({ email, otp, new_password: newPassword });
          setSuccessMsg("Password reset successfully! You can now login.");
          setIsForgotPassword(false);
          setShowOTP(false);
          setOtp("");
          setPassword("");
          setNewPassword("");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Operation failed. Invalid OTP.");
    }
  };

  return (
      <form
        onSubmit={handleAction}
        className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-8 sm:p-10 rounded-2xl w-full space-y-5 border border-gray-200 dark:border-white/5 animate-slide-up shadow-xl transition-colors duration-500"
      >
        {/* TITLE */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-500 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>⚖️ Legal AI</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Intelligent Legal Assistance</p>
        </div>

        <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-white/10">
          {isForgotPassword 
            ? (showOTP ? "Reset Password" : "Forgot Password") 
            : (showOTP ? "Security Check" : "Secure Login")}
        </h2>

        {/* FEEDBACK MECHANISM */}
        {errorMsg && (
          <div className="bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-200 text-sm px-4 py-3 rounded-lg border border-red-200 dark:border-red-500/30 animate-slide-up flex items-start gap-2">
            <span>⚠️</span> <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-200 text-sm px-4 py-3 rounded-lg border border-green-200 dark:border-green-500/30 animate-slide-up flex items-start gap-2">
            <span>✅</span> <span>{successMsg}</span>
          </div>
        )}

        {!showOTP ? (
          <>
            {/* INPUTS */}
            <div className="space-y-4">
              <input
                autoComplete="off"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-white/10 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
              />

              {!isForgotPassword && (
                  <div className="relative">
                    <input
                      autoComplete="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-white/10 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none pr-10 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center px-4">
              Enter the OTP sent to your registered email.
            </p>
            <input
              type="text"
              placeholder="Enter OTP (e.g. 1234)"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-white/10 focus:ring-2 focus:ring-yellow-500 outline-none text-center text-xl tracking-[0.5em] font-mono transition"
            />

            {isForgotPassword && (
                <div className="relative mt-4">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Secure Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-white/10 focus:ring-2 focus:ring-yellow-500 outline-none pr-10 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
            )}
          </>
        )}

        {!showOTP && !isForgotPassword && (
            <div className="flex justify-end pt-1">
                <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-sm text-yellow-600 hover:text-yellow-500 dark:text-yellow-500 dark:hover:text-yellow-400 hover:underline transition"
                >
                    Forgot Password?
                </button>
            </div>
        )}

        {/* BUTTON */}
        <button
          type="submit"
          className="w-full bg-yellow-500 text-slate-900 py-3 rounded-lg font-bold hover:bg-yellow-400 focus:ring-4 focus:ring-yellow-500/50 transition duration-200 mt-2 shadow-lg shadow-yellow-500/20"
        >
          {showOTP ? (isForgotPassword ? "Reset & Login" : "Verify Login") : (isForgotPassword ? "Send OTP" : "Login to Platform")}
        </button>

        {/* BACK / CANCEL BUTTON */}
        {(showOTP || isForgotPassword) && (
          <button
            type="button"
            onClick={() => {
                setShowOTP(false);
                setIsForgotPassword(false);
                setErrorMsg("");
                setSuccessMsg("");
                setOtp("");
            }}
            className="w-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm transition pt-2"
          >
            ← Back to Login
          </button>
        )}

        {/* REGISTER */}
        {!showOTP && !isForgotPassword && (
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-white/10 mt-6 md:hidden">
            Don't have an account?
            <Link
                to="/register"
                className="text-yellow-600 hover:text-yellow-500 dark:text-yellow-500 font-semibold ml-2 dark:hover:text-yellow-400 hover:underline transition"
            >
                Create Account
            </Link>
            </p>
        )}
      </form>
  );
}