// -----------------------------------------------------------------------
// Profile.jsx
// Profile interface for Hooked (in progress)
// Authors: Eleanor Liu
// -----------------------------------------------------------------------


import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import {useEffect} from 'react'

export default function ProtectedRoute({ children }) {
  const { user, fetchUser } = useAuth();

  useEffect(() => {
    // Re-sync context from sessionStorage in case login just set tokens
    if (user === null || user === undefined) {
      fetchUser();
    }
  }, [user, fetchUser]);

  // Check sessionStorage directly to avoid race condition after login
  const hasTokens = sessionStorage.getItem('accesstoken') && sessionStorage.getItem('username');

  if (user === undefined && !hasTokens) return (
    <div style={{ 
      backgroundColor: "#18171d", 
      height: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      color: "#debff7"
    }}>
      Loading...
    </div>
  );

  if (!user && !hasTokens) return <Navigate to="/" />;
  return children;                                 
}