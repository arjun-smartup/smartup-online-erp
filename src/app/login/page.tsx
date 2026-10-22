"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ChevronDown
} from "lucide-react";

const HERO_SLIDES = [
  {
    src: "/images/hero-1.png",
    alt: "Father and daughter learning together with SmartUp",
  },
  {
    src: "/images/hero-2.png",
    alt: "Parent mentoring student with SmartUp curriculum",
  },
  {
    src: "/images/hero-3.png",
    alt: "Interactive SmartUp classroom and mentorship session",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance hero slides every 5 seconds, resetting cleanly on manual selection
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!usr.trim() || !pwd.trim()) {
      setErrorMsg("Please enter both your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usr: usr.trim(), pwd: pwd.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/");
        router.refresh();
      } else {
        setErrorMsg(data.message || "Invalid email or password.");
      }
    } catch {
      setErrorMsg("Failed to connect to authentication service.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white text-slate-800 font-sans antialiased overflow-x-hidden">
      
      {/* ========================================================= */}
      {/* LEFT COLUMN: Lifestyle Hero Slideshow with Organic Curve   */}
      {/* ========================================================= */}
      <div className="w-full md:w-[48%] lg:w-[48%] relative h-[260px] sm:h-[300px] md:h-screen md:min-h-screen overflow-hidden bg-white shrink-0 select-none">
        {/* Slides Container */}
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                className="w-full h-full object-cover object-[center_50%] md:object-[center_30%] transition-transform duration-[7000ms] ease-out"
                style={{
                  transform: isActive ? "scale(1.04)" : "scale(1.0)",
                }}
              />
            </div>
          );
        })}

        {/* Slideshow Indicator Dots */}
        <div className="absolute bottom-6 sm:bottom-8 md:bottom-8 left-5 sm:left-8 z-30 flex items-center gap-1.5 pointer-events-auto">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Jump to hero slide ${idx + 1}`}
              className="py-2.5 px-1 flex items-center justify-center cursor-pointer group"
            >
              <span
                className={`h-1.5 rounded-full transition-all duration-500 block ${
                  idx === currentSlide
                    ? "w-7 bg-white shadow-md shadow-black/40"
                    : "w-2 bg-white/60 group-hover:bg-white/90 shadow-xs shadow-black/20"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Desktop: Vertical Organic Wave / Concave S-Curve Boundary into Right White Panel */}
        <svg
          className="absolute top-0 right-[-1px] h-full w-16 sm:w-20 lg:w-28 text-white fill-current pointer-events-none hidden md:block z-20"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path d="M100,0 L100,100 L44,100 C16,82 -2,64 6,42 C14,24 26,10 48,0 Z" />
        </svg>

        {/* Mobile: Horizontal Organic Curved Cut Boundary into the Bottom White Form */}
        <svg
          className="absolute -bottom-1 left-0 w-full h-11 sm:h-14 text-white fill-current pointer-events-none md:hidden z-20"
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
        >
          <path d="M0,105 L1000,105 L1000,45 C700,85 450,0 0,35 Z" />
        </svg>
      </div>

      {/* ========================================================= */}
      {/* RIGHT COLUMN: Full-Height Form, Centered Rhythm & Footer */}
      {/* ========================================================= */}
      <div className="w-full md:w-[52%] lg:w-[52%] flex-1 md:min-h-screen md:h-screen flex flex-col justify-between p-5 sm:p-8 lg:p-12 xl:p-16 bg-white relative z-20 overflow-y-auto">
        
        {/* Ambient Glassmorphism Light Glows */}
        <div className="absolute top-[18%] right-[10%] w-80 h-80 rounded-full bg-indigo-100/50 blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-[20%] left-[8%] w-72 h-72 rounded-full bg-blue-100/40 blur-3xl pointer-events-none -z-10" />

        {/* Top spacer (desktop only) */}
        <div className="hidden md:block w-full h-2 shrink-0" />

        <div className="w-full max-w-[430px] sm:max-w-[470px] lg:max-w-[480px] mx-auto md:my-auto py-3 sm:py-6 space-y-6 sm:space-y-7">
          
          {/* Header: Logo & Tagline */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2.5 sm:gap-3">
              <img
                src="/images/smartup-logo.png"
                alt="SmartUp Owl Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-sm select-none"
              />
              <h1 className="text-[36px] sm:text-[42px] font-black text-[#1d2766] tracking-tight leading-none">
                smartup
              </h1>
            </div>
            <p className="text-xs sm:text-[14px] text-[#34428e] font-medium tracking-normal">
              Make parents proud
            </p>
          </div>

          {/* 3D Glassmorphic Card Container */}
          <div className="w-full bg-white/80 backdrop-blur-2xl rounded-[26px] sm:rounded-[32px] p-6 sm:p-9 border border-white/95 shadow-[0_20px_50px_-10px_rgba(25,35,85,0.09),0_1px_2px_rgba(255,255,255,1)_inset,0_-1px_1px_rgba(0,0,0,0.02)_inset,0_4px_16px_rgba(30,40,90,0.03)] space-y-5 relative">
            
            {/* Subtle Inset Top Specular Rim */}
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

            {/* Error Message */}
            {errorMsg && (
              <div 
                role="alert" 
                className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              
              {/* Email Input */}
              <div className="space-y-1.5 text-left">
                <label 
                  htmlFor="user-email" 
                  className="text-xs sm:text-[13px] font-semibold text-slate-700 block"
                >
                  Email <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Mail 
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" 
                    aria-hidden="true"
                  />
                  <input
                    id="user-email"
                    type="text"
                    required
                    autoComplete="username"
                    value={usr}
                    onChange={(e) => setUsr(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-[12px] pl-10 pr-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:outline-none focus:border-[#222d64] focus:bg-white focus:ring-4 focus:ring-[#222d64]/10 shadow-[inset_0_2px_4px_rgba(15,23,42,0.025),0_1px_0_rgba(255,255,255,0.8)] [box-shadow:0_0_0_1000px_white_inset] [-webkit-text-fill-color:#1e293b]"
                  />
                </div>
              </div>

              {/* Password Input with Show/Hide Toggle */}
              <div className="space-y-1.5 text-left">
                <label 
                  htmlFor="user-password" 
                  className="text-xs sm:text-[13px] font-semibold text-slate-700 block"
                >
                  Password <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    id="user-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-[12px] pl-4 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 transition-all focus:outline-none focus:border-[#222d64] focus:bg-white focus:ring-4 focus:ring-[#222d64]/10 shadow-[inset_0_2px_4px_rgba(15,23,42,0.025),0_1px_0_rgba(255,255,255,0.8)] [box-shadow:0_0_0_1000px_white_inset] [-webkit-text-fill-color:#1e293b]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Primary 3D Pill Button ('Log in') */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-b from-[#273473] to-[#1c2554] hover:from-[#314088] hover:to-[#222c64] active:from-[#171f47] active:to-[#12193b] text-white font-semibold text-xs sm:text-sm py-3 sm:py-3.5 px-6 rounded-full transition-all shadow-[0_10px_24px_-4px_rgba(28,37,84,0.35),0_2px_4px_rgba(28,37,84,0.2),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_14px_28px_-4px_rgba(28,37,84,0.42)] active:translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-5"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Log in</span>
                )}
              </button>
            </form>

          </div>

        </div>

        {/* Bottom Footer: Language Dropdown */}
        <div className="flex items-center justify-center text-[11px] text-slate-500 pt-6 mt-4 border-t border-slate-200/60 max-w-[430px] sm:max-w-[470px] lg:max-w-[480px] w-full mx-auto">
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <span>English (Inglés)</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        </div>

      </div>
    );
  }
