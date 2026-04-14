import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (user === undefined) return <div>Loading...</div>; // still checking
  if (!user) return <Navigate to="/login" />;           // not logged in
  return children;                                       // logged in
}