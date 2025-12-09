"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { loginUser } from "@/services/supabaseService";
import { useAuth } from "@/app/providers";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [resetEmail, setResetEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [viewportOffset, setViewportOffset] = useState(0);
  const router = useRouter();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Keyboard detection for mobile with iOS viewport offset tracking
  useEffect(() => {
    const handleResize = () => {
      // Detect if keyboard is open by checking if viewport height decreased significantly
      if (typeof window !== 'undefined') {
        const vh = window.visualViewport?.height || window.innerHeight;
        const windowHeight = window.innerHeight;
        const isOpen = vh < windowHeight * 0.75;
        setIsKeyboardOpen(isOpen);
        
        // Track viewport offset for iOS (visual viewport offset from top)
        if (window.visualViewport && isOpen) {
          setViewportOffset(window.visualViewport.offsetTop || 0);
        } else {
          setViewportOffset(0);
        }
      }
    };

    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
      return () => {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      };
    }
  }, []);

  // OTP Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (forgotPasswordStep === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [forgotPasswordStep, otpTimer]);

  // Password validation
  const validatePassword = (pwd: string) => {
    return {
      length: pwd.length >= 8 && pwd.length <= 16,
      hasCapital: /[A-Z]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
  };

  const passwordValidation = validatePassword(newPassword);
  const isPasswordValid = passwordValidation.length && passwordValidation.hasCapital && passwordValidation.hasSpecial;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== "";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Authenticate with Supabase
      const user = await loginUser(email, password);
      
      // Refresh user in context
      refreshUser();
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.firstName}!`,
      });
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleForgotPasswordClick = () => {
    setIsForgotPasswordOpen(true);
    setForgotPasswordStep(1);
    setResetEmail("");
    setOtpDigits(["", "", "", "", "", ""]);
    setNewPassword("");
    setConfirmPassword("");
    setOtpTimer(60);
    setCanResendOtp(false);
  };

  const handleEmailNext = () => {
    // TODO: Validate email exists in database and send OTP
    if (resetEmail.trim() === "") {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    
    // TODO: Send OTP to email
    toast({
      title: "OTP Sent",
      description: "A 6-digit OTP has been sent to your email.",
    });
    setForgotPasswordStep(2);
    setOtpTimer(60);
    setCanResendOtp(false);
    
    // Focus first OTP input field after step changes
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 100);
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue.length > 1) return; // Prevent multiple digits
    
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = numericValue;
    setOtpDigits(newOtpDigits);
    
    // Auto-focus next field if a digit was entered
    if (numericValue && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      // Move to previous field on backspace if current field is empty
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = () => {
    // TODO: Resend OTP to email
    toast({
      title: "OTP Resent",
      description: "A new 6-digit OTP has been sent to your email.",
    });
    setOtpTimer(60);
    setCanResendOtp(false);
    setOtpDigits(["", "", "", "", "", ""]);
    otpInputRefs.current[0]?.focus();
  };

  const handleVerifyOtp = () => {
    const otp = otpDigits.join("");
    
    // TODO: Verify OTP with backend
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Verify OTP against backend
    // For now, simulate successful verification
    toast({
      title: "OTP Verified",
      description: "Please create your new password.",
    });
    setForgotPasswordStep(3);
  };

  const handlePasswordReset = () => {
    if (!isPasswordValid) {
      toast({
        title: "Invalid Password",
        description: "Please ensure your password meets all requirements.",
        variant: "destructive",
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement actual password reset logic
    toast({
      title: "Password Reset Successful",
      description: "Your password has been successfully changed.",
    });
    setIsForgotPasswordOpen(false);
    setForgotPasswordStep(1);
  };

  const handleCancel = () => {
    setIsForgotPasswordOpen(false);
    setForgotPasswordStep(1);
    setResetEmail("");
    setOtpDigits(["", "", "", "", "", ""]);
    setNewPassword("");
    setConfirmPassword("");
    setOtpTimer(60);
    setCanResendOtp(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-[400px] space-y-8">
        {/* Branding - Logo */}
        <div className="flex justify-center">
          <Image
            src="/pyrolert_dark.svg"
            alt="Pyrolert Fire Alert Systems"
            width={400}
            height={120}
            priority
            className="w-full h-auto"
          />
        </div>

        {/* Login Form */}
        <div className="space-y-6">
          <h2 className="text-[18px] font-semibold text-[#D49C00] text-center">
            Log In to Your Account
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email/Username Input */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="text"
                placeholder="Enter Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter Your Password"
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

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPasswordClick}
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

      {/* Forgot Password Dialog */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent 
          className={`max-w-[90vw] sm:max-w-md overflow-y-auto ${isKeyboardOpen ? 'max-h-[60vh] !translate-y-0' : 'max-h-[85vh]'}`}
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
            ...(isKeyboardOpen && {
              position: 'fixed',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
            }),
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-[#002147]">
              {forgotPasswordStep === 1 && "Forgot Password"}
              {forgotPasswordStep === 2 && "Verify OTP"}
              {forgotPasswordStep === 3 && "Create New Password"}
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Email Entry */}
          {forgotPasswordStep === 1 && (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Enter your email address to reset your password.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1 h-9 sm:h-11 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEmailNext}
                  className="flex-1 h-9 sm:h-11 text-sm bg-[#002147] hover:bg-[#003366]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {forgotPasswordStep === 2 && (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Enter the 6-digit OTP sent to <span className="font-semibold">{resetEmail}</span>
              </p>

              {/* OTP Input - 6 Separate Fields */}
              <div className="space-y-2">
                <Label className="text-center block text-sm">6-Digit OTP</Label>
                <div className="flex gap-1 sm:gap-2 justify-center">
                  {otpDigits.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-10 h-10 sm:w-12 sm:h-12 text-center text-xl sm:text-2xl font-semibold p-0"
                    />
                  ))}
                </div>
              </div>

              {/* Timer and Resend */}
              <div className="text-center space-y-2">
                {!canResendOtp ? (
                  <p className="text-sm text-gray-500">
                    Resend OTP in <span className="font-semibold text-[#002147]">{otpTimer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-sm text-[#002147] hover:underline font-semibold"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1 h-9 sm:h-11 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={otpDigits.join("").length !== 6}
                  className="flex-1 h-9 sm:h-11 text-sm bg-[#002147] hover:bg-[#003366] disabled:opacity-50"
                >
                  Verify OTP
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: New Password Creation */}
          {forgotPasswordStep === 3 && (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Create your new password.
              </p>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10 h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10 h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Validation Cues */}
              <div className="space-y-2 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Password Requirements:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {passwordValidation.length ? (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                    )}
                    <span className={`text-xs sm:text-sm ${passwordValidation.length ? "text-green-600" : "text-gray-600"}`}>
                      8-16 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.hasCapital ? (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                    )}
                    <span className={`text-xs sm:text-sm ${passwordValidation.hasCapital ? "text-green-600" : "text-gray-600"}`}>
                      At least one capital letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordValidation.hasSpecial ? (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                    )}
                    <span className={`text-xs sm:text-sm ${passwordValidation.hasSpecial ? "text-green-600" : "text-gray-600"}`}>
                      At least one special character
                    </span>
                  </div>
                  {confirmPassword && (
                    <div className="flex items-center gap-2">
                      {passwordsMatch ? (
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                      )}
                      <span className={`text-xs sm:text-sm ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
                        Passwords match
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1 h-9 sm:h-11 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordReset}
                  disabled={!isPasswordValid || !passwordsMatch}
                  className="flex-1 h-9 sm:h-11 text-sm bg-[#002147] hover:bg-[#003366] disabled:opacity-50"
                >
                  Reset Password
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}