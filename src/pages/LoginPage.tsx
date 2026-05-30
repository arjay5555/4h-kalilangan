import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { LogIn, ShieldAlert } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, updatePassword } from "firebase/auth";

export default function LoginPage() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSettingNewPassword, setIsSettingNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkRedirect = async (email: string) => {
      setIsLoggingIn(true);
      await handleRedirect(email);
    };
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      if (u) {
        checkRedirect(u.email || "");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleRedirect = async (email: string) => {
    try {
      const staffRef = doc(db, "staff", email.replace(/[@.]/g, "_"));
      const staffDoc = await getDoc(staffRef);
      if (staffDoc.exists()) {
        const role = staffDoc.data().role;
        const requiresPasswordChange = staffDoc.data().requiresPasswordChange;
        
        setUserRole(role);
        
        if (requiresPasswordChange) {
          setIsSettingNewPassword(true);
          setIsLoggingIn(false);
          return;
        }

        if (role === "secretary") {
          navigate("/secretary");
        } else if (role === "treasurer") {
          navigate("/treasurer");
        } else if (role === "business") {
          navigate("/business");
        } else {
          navigate("/dashboard");
        }
      } else {
        await signOut(auth);
        setLoginError("Access Denied: You are not assigned to any staff role.");
        setIsLoggingIn(false);
      }
    } catch (err: any) {
      console.error(err);
      await signOut(auth);
      setLoginError("An error occurred while checking permissions.");
      setIsLoggingIn(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setLoginError("Password must be at least 6 characters.");
      return;
    }
    setLoginError("");
    setIsLoggingIn(true);
    try {
      if (auth.currentUser && auth.currentUser.email) {
         await updatePassword(auth.currentUser, newPassword);
         const staffRef = doc(db, "staff", auth.currentUser.email.replace(/[@.]/g, "_"));
         await updateDoc(staffRef, { requiresPasswordChange: false });
         
         if (userRole === "secretary") {
           navigate("/secretary");
         } else if (userRole === "treasurer") {
           navigate("/treasurer");
         } else if (userRole === "business") {
           navigate("/business");
         } else {
           navigate("/dashboard");
         }
      }
    } catch (error: any) {
      console.error("Update password failed", error);
      if (error.code === 'auth/requires-recent-login') {
         setLoginError("Session expired. Please log out, log in again, and retry updating password.");
      } else {
         setLoginError(error.message || "Failed to update password.");
      }
      setIsLoggingIn(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError("");
    setResetMessage("");
    setIsLoggingIn(true);
    try {
      if (loginEmail && loginPassword) {
        const cred = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        await handleRedirect(cred.user.email || "");
      } else {
        setLoginError("Please enter both email and password.");
        setIsLoggingIn(false);
      }
    } catch (error: any) {
      console.error("Login failed", error);
      setLoginError(error.message || "Failed to log in.");
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError("");
    setResetMessage("");
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await handleRedirect(cred.user.email || "");
    } catch (error: any) {
      console.error("Google Login failed", error);
      setLoginError(error.message || "Failed to log in with Google.");
      setIsLoggingIn(false);
    }
  };

  const handleResetPassword = async () => {
    if (!loginEmail) {
      setLoginError("Please enter your email address to reset password.");
      return;
    }
    try {
      // Send Firebase reset email
      await sendPasswordResetEmail(auth, loginEmail);
      
      // Also notify admins by creating a request in Firestore
      const { setDoc, doc } = await import("firebase/firestore");
      await setDoc(doc(db, "passwordResets", loginEmail.replace(/[@.]/g, "_")), {
        email: loginEmail,
        requestedAt: new Date().toISOString(),
        status: "pending"
      });

      setResetMessage("Admin notified! A secure password reset link has been sent to your email.");
      setLoginError("");
    } catch (error: any) {
      console.error("Reset failed", error);
      setLoginError(error.message || "Failed to send reset request.");
      setResetMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800/60 p-8 rounded-3xl max-w-md w-full shadow-xl"
      >
        <div className="flex justify-center mb-6">
          <img src="/logo.jpg" alt="4-H Kalilangan Logo" className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-[var(--color-4h-green)]" />
        </div>
        {isSettingNewPassword ? (
          <div>
            <h1 className="font-display text-2xl font-bold text-center mb-2">Set Your Password</h1>
            <p className="text-slate-500 text-center mb-6 text-sm">Please set a new password for your account to continue.</p>
            <form className="w-full flex flex-col gap-4 mb-6" onSubmit={handleUpdatePassword}>
              <div>
                <label className="block text-xs font-bold mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required minLength={6} className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" placeholder="••••••••" />
              </div>
              {loginError && <p className="text-red-500 text-xs text-center font-semibold">{loginError}</p>}
              <button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-[var(--color-4h-green)] border-none px-6 py-4 mt-2 rounded-xl font-bold text-white hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {isLoggingIn ? "Saving..." : "Save Password & Continue"}
              </button>
            </form>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-center mb-2">Staff Portal Login</h1>
            <p className="text-slate-500 text-center mb-6 text-sm">Log in as an admin or secretary to access your assigned dashboard.</p>
            
            <form className="w-full flex flex-col gap-4 mb-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-bold mb-1">Email Address</label>
                <input type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} required className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" placeholder="admin@example.com" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Password</label>
                <input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} required className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" placeholder="••••••••" />
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={handleResetPassword} className="text-xs font-bold text-[var(--color-4h-green)] hover:underline">Forgot password?</button>
              </div>
              {loginError && <p className="text-red-500 text-xs text-center font-semibold">{loginError}</p>}
              {resetMessage && <p className="text-green-600 text-xs text-center font-semibold">{resetMessage}</p>}
              <button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-[var(--color-4h-green)] border-none px-6 py-4 mt-2 rounded-xl font-bold text-white hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {isLoggingIn ? "Logging in..." : "Login"}
              </button>

              <div className="relative flex py-2 mt-4 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-semibold tracking-wider">Or</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-sm flex items-center justify-center gap-3 mt-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </button>
            </form>
          </>
        )}
        
        <Link to="/" className="block text-center mt-6 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium">
          &larr; Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
