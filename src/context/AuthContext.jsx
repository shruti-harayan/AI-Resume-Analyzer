import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { email, role }
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  // Auto-login if token exists
  useEffect(() => {
    if (token) {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      if (savedUser) setUser(savedUser);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, [token]);

  const login = async (email, password,role) => {
    try {
      const res = await axios.post("http://localhost:8000/auth/login", {
        email,
        password,
        role,
      });

      const accessToken = res.data.access_token;
      const payload = JSON.parse(atob(accessToken.split(".")[1])); // decode JWT
      const userData = { email: payload.sub, role: payload.role };

      setUser(userData);
      setToken(accessToken);

      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      return res.data;
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        throw new Error(err.response.data.detail); // show backend message
      } else {
        throw new Error("Login failed. Try again.");
      }
    }
  };

  const signup = async (email, password, role) => {
    try {
      const res = await axios.post("http://localhost:8000/auth/signup", {
        email,
        password,
        role,
      });
      return res.data;
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        throw new Error(err.response.data.detail);
      } else {
        throw new Error("Signup failed. Try again.");
      }
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};
