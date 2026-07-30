'use client';
import {
  memo,
  ReactNode,
  useState,
  ChangeEvent,
  FormEvent,
} from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Cpu, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== Ripple Component ====================

type RippleProps = {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  className?: string;
};

export const Ripple = memo(function Ripple({
  mainCircleSize = 100,
  mainCircleOpacity = 0.15,
  numCircles = 8,
  className = '',
}: RippleProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center pointer-events-none select-none",
        "[mask-image:linear-gradient(to_bottom,black,transparent)]",
        className
      )}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 80;
        const opacity = mainCircleOpacity - i * 0.015;
        return (
          <div
            key={i}
            className="absolute rounded-full border border-white/5 animate-pulse"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity: Math.max(opacity, 0.01),
              animationDelay: `${i * 0.15}s`,
            }}
          />
        );
      })}
    </div>
  );
});

Ripple.displayName = 'Ripple';

// ==================== TechOrbitDisplay Component ====================

export interface OrbitIcon {
  component: () => ReactNode;
  className: string;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
  reverse?: boolean;
}

export function TechOrbitDisplay({ iconsArray }: { iconsArray: OrbitIcon[] }) {
  const radii = Array.from(new Set(iconsArray.map((icon) => icon.radius || 100))).sort((a, b) => a - b);

  return (
    <div className="relative w-full h-full min-h-[500px] flex items-center justify-center overflow-hidden">
      {/* Concentric orbit lines */}
      {radii.map((r, i) => (
        <div
          key={i}
          className="absolute rounded-full border border-white/5 pointer-events-none"
          style={{
            width: `${r * 2}px`,
            height: `${r * 2}px`,
          }}
        />
      ))}

      {/* Center branding */}
      <div className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-[#0088ff] to-[#ff5500]/40 flex items-center justify-center border border-white/10 shadow-lg shadow-black/50 z-10 animate-pulse">
        <Cpu className="w-10 h-10 text-white drop-shadow-[0_0_8px_rgba(0,136,255,0.4)]" />
      </div>

      {/* Orbiting Icons */}
      {iconsArray.map((icon, index) => {
        const r = icon.radius || 100;
        const duration = icon.duration || 20;
        const delay = icon.delay || 0;
        const reverse = icon.reverse || false;

        return (
          <motion.div
            key={index}
            className="absolute flex items-center justify-center"
            style={{
              width: `${r * 2}px`,
              height: `${r * 2}px`,
            }}
            animate={{ rotate: reverse ? -360 : 360 }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: "linear",
              delay: delay / 10,
            }}
          >
            <div
              className={cn(
                "absolute flex items-center justify-center rounded-full bg-[#070d19] border border-white/10 p-2 shadow-md hover:scale-115 transition-transform cursor-pointer",
                icon.className
              )}
              style={{
                top: 0,
                left: '50%',
                transform: `translate(-50%, -50%)`,
              }}
            >
              {/* Keep the icon upright by counter-rotating */}
              <motion.div
                animate={{ rotate: reverse ? 360 : -360 }}
                transition={{
                  duration: duration,
                  repeat: Infinity,
                  ease: "linear",
                  delay: delay / 10,
                }}
                className="w-full h-full flex items-center justify-center"
              >
                {icon.component()}
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ==================== AuthTabs Component ====================

interface AuthTabsProps {
  formFields: {
    header: string;
    subHeader: string;
    fields: Array<{
      label: string;
      required?: boolean;
      type: string;
      placeholder: string;
      onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    }>;
    submitButton: string;
    textVariantButton: string;
  };
  goTo: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function AuthTabs({ formFields, goTo, handleSubmit }: AuthTabsProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md flex flex-col text-left relative">
      {/* Header */}
      <div className="text-left mb-6">
        <h2 className="text-4xl font-bold text-white tracking-tight">
          {formFields.header}
        </h2>
        <p className="text-sm text-neutral-400 mt-2 font-normal">
          {formFields.subHeader}
        </p>
      </div>

      {/* Google Login Option */}
      <button
        type="button"
        className="w-full py-3 rounded-xl border border-neutral-800 bg-[#080d19]/25 hover:bg-[#080d19]/60 text-white font-semibold text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer mb-6"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>Login with Google</span>
      </button>

      {/* Dashed Separator */}
      <div className="flex items-center justify-center mb-6 gap-4">
        <div className="h-[1px] flex-1 bg-neutral-800 border-dashed border-t" />
        <span className="text-xs text-neutral-500 font-mono">or</span>
        <div className="h-[1px] flex-1 bg-neutral-800 border-dashed border-t" />
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {formFields.fields.map((field, idx) => (
          <div key={idx} className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white flex items-center gap-1">
              <span>{field.label}</span>
              {field.required && <span className="text-red-500 font-bold">*</span>}
            </label>
            <div className="relative w-full">
              <input
                type={field.type === 'password' && showPassword ? 'text' : field.type}
                required={field.required}
                placeholder={field.placeholder}
                onChange={field.onChange}
                className="w-full bg-[#121620] border border-neutral-800 rounded-xl p-4 text-white placeholder-neutral-500 outline-none text-sm transition-all focus:border-[#0088ff] focus:ring-1 focus:ring-[#0088ff] pr-12"
              />
              {field.type === 'password' && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer select-none bg-transparent border-none outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-4 rounded-xl bg-[#121620] hover:bg-[#1b2234] border border-neutral-800 text-white font-semibold text-sm transition-colors mt-4 text-center flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{formFields.submitButton}</span>
          <ArrowRight size={16} />
        </button>

        {/* Link / Text Button */}
        {formFields.textVariantButton && (
          <button
            type="button"
            onClick={goTo}
            className="text-sm font-medium text-[#0088ff] hover:underline text-left mt-3 cursor-pointer self-start bg-transparent border-none outline-none"
          >
            {formFields.textVariantButton}
          </button>
        )}
      </form>
    </div>
  );
}
