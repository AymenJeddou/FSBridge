import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, role, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-display text-2xl tracking-tight animate-pulse">Chargement...</div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/landing" replace />;
  
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "professor") return <Navigate to="/emploi-du-temps" replace />;
  return <Navigate to="/dashboard" replace />;
};

export default Index;
