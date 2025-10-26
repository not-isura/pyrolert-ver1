import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RegisterRoom from "./pages/RegisterRoom";
import RoomData from "./pages/RoomData";
import EventLogs from "./pages/EventLogs";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";
import CreateAccount from "./pages/CreateAccount";
import UserDatabase from "./pages/UserDatabase";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/register-room" element={<RegisterRoom />} />
          <Route path="/room-data" element={<RoomData />} />
          <Route path="/event-logs" element={<EventLogs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/profile" element={<Profile />} />
          <Route path="/settings/terms" element={<Terms />} />
          <Route path="/settings/create-account" element={<CreateAccount />} />
          <Route path="/settings/users" element={<UserDatabase />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
