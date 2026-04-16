import axios from "axios";

/* =========================
   USER BACKEND (Layer2)
========================= */

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

/* =========================
   LAWYER BACKEND
========================= */

const lawyerApi = axios.create({
  baseURL: "http://127.0.0.1:8001",
});

/* =========================
   JWT INTERCEPTOR (USER API)
========================= */

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user_name");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/* =========================
   JWT INTERCEPTOR (LAWYER API)
========================= */

lawyerApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   AUTH APIs
========================= */

// REGISTER
export const registerUser = async (data) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

// EMAIL GENERATE OTP
export const generateEmailOtp = async (email) => {
  const res = await api.post("/auth/email/generate-otp", { email });
  return res.data;
};

// EMAIL VERIFY OTP
export const verifyEmailOtp = async (email, otp) => {
  const res = await api.post("/auth/email/verify-otp", { email, otp });
  return res.data;
};

// LOGIN OTP
export const generateLoginOtp = async (email) => {
  const res = await api.post("/auth/email/generate-login-otp", { email });
  return res.data;
};

// RESET PASSWORD
export const resetPassword = async (data) => {
  const res = await api.post("/auth/email/reset-password", data);
  return res.data;
};

// LOGIN
export const loginUser = async (data) => {
  const res = await api.post("/auth/login", data);

  if (res.data.token) {
    localStorage.setItem("token", res.data.token);
  }

  return res.data;
};

/* =========================
   CHAT API (USER BACKEND)
========================= */

export const sendChatMessage = async ({
  user_query,
  conversation_context = [],
  user_location = null,
  selected_language="english",
}) => {
  const res = await api.post("/analyze", {
    user_query,
    conversation_context,
    user_location,
    selected_language, // 🔥 default to english for now
  });

  return res.data;
};

/* =========================
   USER PDF ANALYSIS
========================= */

export const analyzePdf = async ({
  user_query,
  user_location,
  document_text,
  pdf,
  conversation_context,
}) => {

  const formData = new FormData();

  if (user_query) formData.append("user_query", user_query);
  if (user_location) formData.append("user_location", user_location);
  if (document_text) formData.append("document_text", document_text);
  if (pdf) formData.append("document", pdf);

  if (conversation_context) {
    formData.append(
      "conversation_context",
      JSON.stringify(conversation_context)
    );
  }

  const res = await api.post("/analyze/document", formData);

  return res.data;
};

/* =========================
   LAWYER PDF SUMMARY
========================= */

export const summarizePdf = async (pdf) => {

  const formData = new FormData();
  formData.append("pdf", pdf);
  formData.append("user_query", "Summarize this legal document");

  const res = await lawyerApi.post("/summarize", formData);

  return res.data;
};

/* =========================
   USER TO LAWYER HANDOFF
========================= */

export const handoffCase = async ({ chat_context, user_location }) => {
  const res = await api.post("/handoff", {
    chat_context,
    user_location,
    user_id: "guest", // Could use real user from token
  });
  return res.data;
};

export default api;