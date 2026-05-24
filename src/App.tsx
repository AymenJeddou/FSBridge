import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Profil from "./pages/Profil";
import Professeurs from "./pages/Professeurs";
import EmploiDuTemps from "./pages/EmploiDuTemps";
import Documents from "./pages/Documents";
import Assistant from "./pages/Assistant";
import Admin from "./pages/Admin";
import Actualites from "./pages/Actualites";
import NotFound from "./pages/NotFound";
import MesMatieres from "./pages/MesMatieres";
import SaisieNotes from "./pages/SaisieNotes";

const queryClient = new QueryClient();

const Shell = ({ children }: { children: React.ReactNode }) => (
  <RequireAuth><AppShell>{children}</AppShell></RequireAuth>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Shell><Dashboard /></Shell>} />
            <Route path="/notes" element={<Shell><Notes /></Shell>} />
            <Route path="/profil" element={<Shell><Profil /></Shell>} />
            <Route path="/professeurs" element={<Shell><Professeurs /></Shell>} />
            <Route path="/emploi-du-temps" element={<Shell><EmploiDuTemps /></Shell>} />
            <Route path="/mes-matieres" element={<Shell><MesMatieres /></Shell>} />
            <Route path="/saisie-notes" element={<Shell><SaisieNotes /></Shell>} />
            <Route path="/documents" element={<Shell><Documents /></Shell>} />
            <Route path="/assistant" element={<Shell><Assistant /></Shell>} />
            <Route path="/admin" element={<RequireAuth role="admin"><AppShell><Admin /></AppShell></RequireAuth>} />
            <Route path="/actualites" element={<Actualites />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
