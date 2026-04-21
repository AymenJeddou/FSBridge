import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-display text-2xl tracking-tight animate-pulse">Chargement...</div>
      </div>
    );
  }
  return <Navigate to={user ? "/dashboard" : "/landing"} replace />;
};

export default Index;
