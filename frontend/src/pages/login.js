'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ShieldAlert } from 'lucide-react';
import {
  Ripple,
  AuthTabs,
  TechOrbitDisplay,
} from '@/components/blocks/modern-animated-sign-in';
import Image from 'next/image';

const INJECTED_STYLES = `
  .film-grain {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 50; opacity: 0.05; mix-blend-mode: overlay;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }
`;

const iconsArray = [
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg"
        alt="HTML5"
        className="w-full h-full object-contain"
      />
    ),
    className: 'w-[30px] h-[30px] border-none bg-transparent',
    duration: 20,
    delay: 20,
    radius: 100,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg"
        alt="CSS3"
        className="w-full h-full object-contain"
      />
    ),
    className: 'w-[30px] h-[30px] border-none bg-transparent',
    duration: 20,
    delay: 10,
    radius: 100,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg"
        alt="TypeScript"
        className="w-full h-full object-contain"
      />
    ),
    className: 'w-[50px] h-[50px] border-none bg-transparent',
    radius: 210,
    duration: 20,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg"
        alt="JavaScript"
        className="w-full h-full object-contain"
      />
    ),
    className: 'w-[50px] h-[50px] border-none bg-transparent',
    radius: 210,
    duration: 20,
    delay: 20,
    path: false,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg"
        alt="TailwindCSS"
        className="w-full h-full object-contain"
      />
    ),
    className: 'w-[30px] h-[30px] border-none bg-transparent',
    duration: 20,
    delay: 20,
    radius: 150,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg"
        alt="Nextjs"
        className="w-full h-full object-contain filter invert"
      />
    ),
    className: 'w-[30px] h-[30px] border-none bg-transparent',
    duration: 20,
    delay: 10,
    radius: 150,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg"
        alt="React"
        className="w-full h-full object-contain"
      />
    ),
    className: 'w-[50px] h-[50px] border-none bg-transparent',
    radius: 270,
    duration: 20,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg"
        alt="Figma"
        className="w-full h-full object-contain"
      />
    ),
    className: 'w-[50px] h-[50px] border-none bg-transparent',
    radius: 270,
    duration: 20,
    delay: 60,
    path: false,
    reverse: true,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg"
        alt="Git"
        className="w-full h-full object-contain"
      />
    ),
    className: 'w-[50px] h-[50px] border-none bg-transparent',
    radius: 320,
    duration: 20,
    delay: 20,
    path: false,
    reverse: false,
  },
];

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const { login, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const goToForgotPassword = (event) => {
    event.preventDefault();
    setErrorMsg('Password recovery has been sent to your registered email address.');
  };

  const handleInputChange = (event, name) => {
    const value = event.target.value;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    try {
      setErrorMsg('');
      await login(formData.email, formData.password);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    }
  };

  const formFields = {
    header: 'Welcome back',
    subHeader: 'Sign in to your account',
    fields: [
      {
        label: 'Email',
        required: true,
        type: 'email',
        placeholder: 'Enter your email address',
        onChange: (event) => handleInputChange(event, 'email'),
      },
      {
        label: 'Password',
        required: true,
        type: 'password',
        placeholder: 'Enter your password',
        onChange: (event) => handleInputChange(event, 'password'),
      },
    ],
    submitButton: 'Sign in',
    textVariantButton: 'Forgot password?',
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050811] relative overflow-hidden font-mono">
        <div className="text-xl text-[#0088ff] animate-pulse z-10">BOOTING SYSTEM...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050811] relative overflow-hidden flex flex-col justify-center">
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="film-grain" aria-hidden="true" />

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-50">
        <Link href="/" className="flex items-center gap-2 text-sm font-sans font-medium text-white hover:text-blue-200 transition-all bg-[#080b15]/90 border border-blue-500/35 hover:border-blue-400/70 px-6 py-2 rounded-full backdrop-blur-md shadow-[0_2px_12px_rgba(37,99,235,0.25)]">
          ← Back to Home
        </Link>
      </div>

      <section className="flex max-lg:justify-center w-full max-w-7xl mx-auto px-6 relative z-10 items-center">
        {/* Left Side: Animated Orbit & concentric rings */}
        <span className="flex flex-col justify-center w-1/2 max-lg:hidden relative h-[90dvh]">
          <Ripple mainCircleSize={100} />
          <TechOrbitDisplay iconsArray={iconsArray} />
        </span>

        {/* Right Side: Auth Form */}
        <span className="w-1/2 h-[100dvh] flex flex-col justify-center items-center max-lg:w-full max-lg:px-[5%] gap-6">
          {errorMsg && (
            <div className="w-full max-w-md flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-xs font-mono font-bold">
              <ShieldAlert className="text-red-400 shrink-0" size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <AuthTabs
            formFields={formFields}
            goTo={goToForgotPassword}
            handleSubmit={handleSubmit}
          />
        </span>
      </section>
    </div>
  );
}
