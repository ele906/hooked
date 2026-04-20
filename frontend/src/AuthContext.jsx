// -----------------------------------------------------------------------
// AuthContext.jsx
// Authentication context and provider
// -----------------------------------------------------------------------

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  function fetchUser() {
    // Check if tokens exist in sessionStorage
    const accessToken = sessionStorage.getItem('accesstoken');
    const username = sessionStorage.getItem('username');
    
    if (!accessToken || !username) {
      setUser(null);
      return Promise.resolve(null);
    }

    // If tokens exist, user is logged in
    setUser({ username, accessToken });
    return Promise.resolve({ username, accessToken });
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