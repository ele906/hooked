import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import {useEffect} from 'react'

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  useEffect(() => {
    if (user === null) {
      alert("You are not logged in!");
    }
  }, [user]);

  if (user === undefined) return (
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

  if (!user) return <Navigate to="/" />;
  return children;                                 
}