import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  // 🔹 Load user from localStorage (so refresh works)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  // 🔹 LOGIN
  const login = (userData, token) => {
    setUser(userData);

    localStorage.setItem("user", JSON.stringify(userData)); // store user
    localStorage.setItem("token", token); // store token
  };

  // 🔹 LOGOUT (FIXED)
  const logout = () => {
    setUser(null);

    localStorage.removeItem("user");   // 🔥 remove user
    localStorage.removeItem("token");  // 🔥 remove token
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};