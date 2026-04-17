// -----------------------------------------------------------------------
// Profile.jsx
// Profile interface for Hooked (in progress)
// Authors: Eleanor Liu
// -----------------------------------------------------------------------

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  function fetchUser() {
    return fetch("/auth/user", { credentials: "include" })
      .then(res => {
          console.log("auth/user status:", res.status)  // add this
          return res.ok ? res.json() : null
      })
      .then(data => {
          console.log("auth/user data:", data)  // add this
          setUser(data)
      })
      .catch(() => setUser(null));
  }

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}