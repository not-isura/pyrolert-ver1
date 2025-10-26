"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Implement actual authentication
    setTimeout(() => {
      toast({
        title: "Login Successful",
        description: "Welcome to Pyrolert!",
      });
      router.push("/dashboard");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-[400px] space-y-8">
        {/* Branding */}
        <div className="text-center space-y-2">
          <h1 className="text-[48px] font-bold text-[#002147] leading-tight" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
            PYROLERT
          </h1>
          <p className="text-[20px] font-semibold text-[#002147]" style={{ fontFamily: 'Poppins, Inter, sans-serif' }}>
            FIRE ALERT SYSTEMS
          </p>
        </div>

        {/* Login Form */}
        <div className="space-y-6">
          <h2 className="text-[14px] font-semibold text-[#D49C00] mb-4">
            Log In to Your Account
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email/Username Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-700">
                Email/Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="text"
                  placeholder="Email/Username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-[12px] text-[#002147] hover:underline transition-all"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#002147] hover:bg-[#003366] text-white font-semibold rounded-[25px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? "Signing in..." : "Login"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}