import React, { useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView, useMotionValueEvent } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  Menu, X, MapPin, Phone, Mail, Instagram, Facebook, 
  ArrowRight, Check, Users, Calendar, Map, ChevronDown,
  MessageCircle, Sparkles, Loader2
} from 'lucide-react';

// Types
interface Recommendation {
  courseName: string;
  emoji: string;
  reason: string;
}

interface GeminiResponse {
  message: string;
  recommendations: Recommendation[];
}

interface Review {
  name: string;
  text: string;
}

interface InputWrapperProps {
  children: ReactNode;
  label: string;
  required?: boolean;
  id: string;
}

// ==========================================
// 1. GLOBAL STYLES & DATA
// ==========================================

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap');

  :root {
    --yellow: #E8C400;
    --gold: #C9982A;
    --red: #C0152A;
    --black: #0A0A0A;
    --cream: #FFFDE7;
  }

  html { cursor: none; scroll-behavior: smooth; }
  body { 
    background: var(--cream); 
    font-family: 'DM Sans', sans-serif;
    color: var(--black);
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3, h4, h5, h6, .font-serif {
    font-family: 'Cormorant Garamond', serif;
  }

  /* Noise Overlay */
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: 0.032;
    pointer-events: none;
    z-index: 9998;
    transform: translate3d(0, 0, 0);
    will-change: transform;
  }

  /* Marquee Animations */
  @keyframes marqueeRight {
    from { transform: translateX(-50%); }
    to { transform: translateX(0); }
  }
  @keyframes marqueeLeft {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  .marquee-inner { display: flex; width: max-content; transform: translate3d(0, 0, 0); will-change: transform; }
  .marquee-row:hover .marquee-inner { animation-play-state: paused !important; }

  /* Utilities */
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  
  /* Form Auto-fill fix */
  input:-webkit-autofill,
  input:-webkit-autofill:hover, 
  input:-webkit-autofill:focus, 
  input:-webkit-autofill:active{
      -webkit-box-shadow: 0 0 0 30px #1a1a1a inset !important;
      -webkit-text-fill-color: white !important;
      transition: background-color 5000s ease-in-out 0s;
  }

  /* Gradient Button CSS */
  @property --pos-x { syntax: '<percentage>'; initial-value: 11.14%; inherits: false; }
  @property --pos-y { syntax: '<percentage>'; initial-value: 140%; inherits: false; }
  @property --spread-x { syntax: '<percentage>'; initial-value: 150%; inherits: false; }
  @property --spread-y { syntax: '<percentage>'; initial-value: 180.06%; inherits: false; }
  @property --color-1 { syntax: '<color>'; initial-value: #000; inherits: false; }
  @property --color-2 { syntax: '<color>'; initial-value: #08012c; inherits: false; }
  @property --color-3 { syntax: '<color>'; initial-value: #4e1e40; inherits: false; }
  @property --color-4 { syntax: '<color>'; initial-value: #70464e; inherits: false; }
  @property --color-5 { syntax: '<color>'; initial-value: #88394c; inherits: false; }
  @property --border-angle { syntax: '<angle>'; initial-value: 20deg; inherits: true; }
  @property --border-color-1 { syntax: '<color>'; initial-value: hsla(340, 75%, 60%, 0.2); inherits: true; }
  @property --border-color-2 { syntax: '<color>'; initial-value: hsla(340, 75%, 40%, 0.75); inherits: true; }
  @property --stop-1 { syntax: '<percentage>'; initial-value: 37.35%; inherits: false; }
  @property --stop-2 { syntax: '<percentage>'; initial-value: 61.36%; inherits: false; }
  @property --stop-3 { syntax: '<percentage>'; initial-value: 78.42%; inherits: false; }
  @property --stop-4 { syntax: '<percentage>'; initial-value: 89.52%; inherits: false; }
  @property --stop-5 { syntax: '<percentage>'; initial-value: 100%; inherits: false; }

  .gradient-button {
    position: relative;
    appearance: none;
    cursor: pointer;
    background-color: #08012c;
    background-image: radial-gradient(
      var(--spread-x, 150%) var(--spread-y, 180.06%) at var(--pos-x, 11.14%) var(--pos-y, 140%),
      var(--color-1, #000) var(--stop-1, 37.35%),
      var(--color-2, #08012c) var(--stop-2, 61.36%),
      var(--color-3, #4e1e40) var(--stop-3, 78.42%),
      var(--color-4, #70464e) var(--stop-4, 89.52%),
      var(--color-5, #88394c) var(--stop-5, 100%)
    );
    transition:
      --pos-x 0.5s, --pos-y 0.5s, --spread-x 0.5s, --spread-y 0.5s,
      --color-1 0.5s, --color-2 0.5s, --color-3 0.5s, --color-4 0.5s, --color-5 0.5s,
      --border-angle 0.5s, --border-color-1 0.5s, --border-color-2 0.5s,
      --stop-1 0.5s, --stop-2 0.5s, --stop-3 0.5s, --stop-4 0.5s, --stop-5 0.5s;
  }

  .gradient-button::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(
      var(--border-angle, 20deg),
      var(--border-color-1, hsla(340, 75%, 60%, 0.2)),
      var(--border-color-2, hsla(340, 75%, 40%, 0.75))
    );
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    pointer-events: none;
  }

  .gradient-button:hover {
    --pos-x: 0%;
    --pos-y: 91.51%;
    --spread-x: 120.24%;
    --spread-y: 103.18%;
    --color-1: #c96287;
    --color-2: #c66c64;
    --color-3: #cc7d23;
    --color-4: #37140a;
    --color-5: #000;
    --border-angle: 190deg;
    --border-color-1: hsla(340, 78%, 90%, 0.1);
    --border-color-2: hsla(340, 75%, 90%, 0.6);
    --stop-1: 0%;
    --stop-2: 8.8%;
    --stop-3: 21.44%;
    --stop-4: 71.34%;
    --stop-5: 85.76%;
  }

  .gradient-button-variant {
    --color-1: #000022;
    --color-2: #1f3f6d;
    --color-3: #469396;
    --color-4: #f1ffa5;
    --border-angle: 200deg;
    --border-color-1: hsla(320, 75%, 90%, 0.6);
    --border-color-2: hsla(320, 50%, 90%, 0.15);
  }

  .gradient-button-variant:hover {
    --pos-x: 0%;
    --pos-y: 95.51%;
    --spread-x: 110.24%;
    --spread-y: 110.2%;
    --color-1: #000020;
    --color-2: #f1ffa5;
    --color-3: #469396;
    --color-4: #1f3f6d;
    --color-5: #000;
    --stop-1: 0%;
    --stop-2: 10%;
    --stop-3: 35.44%;
    --stop-4: 71.34%;
    --stop-5: 90.76%;
    --border-angle: 210deg;
    --border-color-1: hsla(320, 75%, 90%, 0.2);
    --border-color-2: hsla(320, 50%, 90%, 0.75);
  }
`;

const BUSINESS_DATA = {
  name: "AN Study Zone (अं स्टडी जोन)",
  phone: "9226538135",
  email: "anstudyzone@gmail.com",
  whatsapp: "https://wa.me/919226538135",
  address: "B/G-10, Emmanuel CHSL, Shree Krishna Complex, Bhabola, Vasai West, Maharashtra 401202",
  instagram: "https://instagram.com/anstudyzone",
  facebook: "https://facebook.com/anstudyzone",
  logo: "/LogoNew.jpg", 
  storePhoto: "/WhatsApp Image 2025-09-16 at 04.32.07_94744dc9.jpg",
  courseBanner: "/an15x10_Final_m.jpg"
};

const COURSES = [
  { id: 1, name: "ABACUS", age: "Age 5–14", emoji: "🧮", desc: "Mental arithmetic program enhancing brain power, focus, and rapid calculation skills." },
  { id: 2, name: "Vedic Mathematics", age: "Age 8–16", emoji: "✨", desc: "Ancient techniques to solve complex mathematical problems quickly and accurately." },
  { id: 3, name: "Tuition Classes", age: "Class I–X, SSC/CBSE/ICSE", emoji: "📚", desc: "Comprehensive academic support across all major boards with personalized attention." },
  { id: 4, name: "Foreign Languages", age: "Age 5–14", emoji: "🗼", desc: "Learn French to gain a global perspective early on with our dedicated curriculum." },
  { id: 5, name: "Reading & Writing Skills", age: "Age 5–12", emoji: "📖", desc: "Foundational literacy program to improve vocabulary, grammar, and expression." },
  { id: 6, name: "Art & Craft", age: "Age 5–14", emoji: "🎨", desc: "Creative expression through various mediums, fostering imagination and motor skills." },
  { id: 7, name: "Elementary Drawing Exam", age: "Age 5–16", emoji: "✏️", desc: "Structured preparation for government-certified elementary drawing examinations." },
  { id: 8, name: "AI / IT / CA", age: "Age 13+", emoji: "💻", desc: "Future-ready skills in Artificial Intelligence, Information Technology, and basics of CA." },
  { id: 9, name: "Phonics", age: "Age 4–8", emoji: "🔤", desc: "Build strong foundational reading and pronunciation skills for early learners." },
  { id: 10, name: "Calligraphy", age: "Age 8+", emoji: "✒️", desc: "Master the art of beautiful handwriting, improving focus and neatness." }
];

const REVIEWS = [
  { name: "Dhruvi Shah", text: "Feel lucky to find AN Study Zone. Enrolled my son for Abacus — all teachers are amazing. Special thanks to Amishi ma'am — very kind, patient and understanding. My son enjoys studying there ❤️ I suggest all parents enroll their kids here 🙏" },
  { name: "Ankita Miyani Bagadia", text: "I enrolled my daughter for Abacus. The classes have been an excellent learning experience. Trainers are patient, encouraging and have made math genuinely fun and engaging!" },
  { name: "Sweta Raja", text: "Excellent tuition experience 👏 My son is in 5th Std for Maths. Amishi Teacher and Shivali Teacher teach very nicely and take periodic tests with proper updates." },
  { name: "Priyanka Ullal", text: "Enrolled my son for Abacus. Amishi ma'am teaches in an excellent manner! Nitu ma'am is also very polite and friendly. Amazing student-friendly atmosphere!" },
  { name: "Mayuri Thakkar", text: "Excellent academic support AND extracurricular activities — this is the perfect place! Amishi Miss and Nitu Miss are incredibly dedicated teachers." },
  { name: "TARLIKA JHAVERI", text: "Vedic maths and other learning techniques are the need of the hour. Well educated teachers nurturing the young minds beautifully." },
  { name: "Monika Sadhu", text: "A very excellent education centre where teachers are very creative, humble and full of innovative ideas." },
];

// ==========================================
// 2. CUSTOM HOOKS & UTILS
// ==========================================

const useMagneticHover = (strength = 0.35) => {
  const ref = useRef<HTMLElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * strength, y: middleY * strength });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return { ref, position, handleMouseMove, handleMouseLeave };
};

// Gemini API call (API key loaded from .env)
const fetchGeminiRecommendation = async (age: string, interests: string, retries = 5, delay = 1000): Promise<GeminiResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/
  "gemini-1.5-flash"-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ 
      parts: [{ 
        text: `Child's Age: ${age}\nInterests/Needs: ${interests}` 
      }] 
    }],
    systemInstruction: { 
      parts: [{ 
        text: `You are a warm, expert educational counselor for "AN Study Zone" in Vasai West. 
        Available Courses:
        1. ABACUS (Age 5-14)
        2. Vedic Mathematics (Age 8-16)
        3. Tuition Classes (Class I-X, SSC/CBSE/ICSE)
        4. Foreign Languages (French) (Age 5-14)
        5. Reading & Writing Skills (Age 5-12)
        6. Art & Craft (Age 5-14)
        7. Elementary Drawing Exam (Age 5-16)
        8. AI / IT / CA (Age 13+)
        9. Phonics (Age 4-8)
        10. Calligraphy (Age 8+)

        Based on the child's age and interests, recommend the top 1 or 2 most suitable courses. Explain why.` 
      }] 
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          message: { type: "STRING" },
          recommendations: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                courseName: { type: "STRING" },
                emoji: { type: "STRING" },
                reason: { type: "STRING" }
              }
            }
          }
        }
      }
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(text);
  } catch (error) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, delay));
      return fetchGeminiRecommendation(age, interests, retries - 1, delay * 2);
    }
    throw error;
  }
};

const callGemini = async (prompt: string, systemText: string, retries = 3, delay = 1000): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemText }] }
  };
  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, delay));
      return callGemini(prompt, systemText, retries - 1, delay * 2);
    }
    throw error;
  }
};

// ==========================================
// 3. UI COMPONENTS
// ==========================================

const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const mouse = useRef({ x: 0, y: 0 });
  const delayedMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsVisible(true);

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };

    let rafId: number;
    const animateRing = () => {
      delayedMouse.current.x += (mouse.current.x - delayedMouse.current.x) * 0.15;
      delayedMouse.current.y += (mouse.current.y - delayedMouse.current.y) * 0.15;
      
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${delayedMouse.current.x}px, ${delayedMouse.current.y}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(animateRing);
    };

    window.addEventListener('mousemove', onMouseMove);
    rafId = requestAnimationFrame(animateRing);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cursorTarget = target.closest('[data-cursor]');
      if (cursorTarget && ringRef.current && dotRef.current) {
        const type = cursorTarget.getAttribute('data-cursor');
        if (type === 'button') {
          dotRef.current.style.opacity = '0';
          ringRef.current.style.width = '60px';
          ringRef.current.style.height = '60px';
          ringRef.current.style.backgroundColor = 'rgba(232,196,0,0.15)';
        } else if (type === 'image') {
          ringRef.current.style.width = '80px';
          ringRef.current.style.height = '50px';
          ringRef.current.style.borderRadius = '12px';
          ringRef.current.style.backgroundColor = 'rgba(232,196,0,0.9)';
          ringRef.current.style.borderColor = 'transparent';
          ringRef.current.innerHTML = '<span style="color:#0A0A0A; font-weight:700; font-size:12px; font-family:\'DM Sans\'">VIEW</span>';
          ringRef.current.style.display = 'flex';
          ringRef.current.style.alignItems = 'center';
          ringRef.current.style.justifyContent = 'center';
        }
      }
    };

    const handleMouseOut = () => {
      if (ringRef.current && dotRef.current) {
        dotRef.current.style.opacity = '1';
        ringRef.current.style.width = '36px';
        ringRef.current.style.height = '36px';
        ringRef.current.style.backgroundColor = 'transparent';
        ringRef.current.style.borderRadius = '50%';
        ringRef.current.style.borderColor = '#E8C400';
        ringRef.current.innerHTML = '';
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div 
        ref={dotRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: '8px', height: '8px',
          backgroundColor: '#E8C400', borderRadius: '50%', pointerEvents: 'none',
          zIndex: 9999, mixBlendMode: 'difference', willChange: 'transform'
        }}
      />
      <div 
        ref={ringRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: '36px', height: '36px',
          border: '1.5px solid #E8C400', borderRadius: '50%', pointerEvents: 'none',
          zIndex: 9998, transition: 'width 0.2s, height 0.2s, background-color 0.2s, border-radius 0.2s',
          willChange: 'transform'
        }}
      />
    </>
  );
};

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  
  return (
    <motion.div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(90deg, #C9982A, #E8C400, #fff)',
        transformOrigin: '0%', scaleX, zIndex: 9999, willChange: 'transform'
      }}
    />
  );
};

interface LiquidButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'dark' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

const LiquidButton = ({ children, variant = 'primary', size = 'md', className = '', onClick, type = 'button', disabled }: LiquidButtonProps) => {
  const { ref, position, handleMouseMove, handleMouseLeave } = useMagneticHover(0.4);

  const baseStyles = "relative overflow-hidden flex items-center justify-center font-medium transition-all duration-300 group w-max";
  
  const sizes = {
    sm: "h-9 px-5 text-sm rounded-full",
    md: "h-11 px-7 text-base rounded-full",
    lg: "h-14 px-10 text-base rounded-full",
    xl: "h-16 px-12 text-lg rounded-[1.25rem]",
    full: "w-full h-14 text-base rounded-[1.25rem]"
  };

  const variants = {
    primary: `text-[#E8C400] bg-[#E8C400]/[0.08] border border-[#E8C400]/30 shadow-[0_8px_32px_rgba(232,196,0,0.15)]`,
    dark: `text-white bg-white/[0.05] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)]`,
    outline: `text-[#E8C400] bg-transparent border-2 border-[#E8C400] hover:bg-[#e8c4001f]`
  };

  return (
    <motion.button
      ref={ref as any}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className} ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
      data-cursor="button"
    >
      {/* Pure CSS Flawless Frosted Glass Layer */}
      {variant !== 'outline' && (
        <>
          <div 
            className="absolute inset-0 z-0 pointer-events-none transition-colors duration-300 group-hover:bg-white/[0.05]"
            style={{ 
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)'
            }}
          />
          {/* Subtle Top Inner Highlight */}
          <div className="absolute inset-0 z-0 rounded-inherit border-t border-white/20 pointer-events-none mix-blend-overlay" />
        </>
      )}
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      
      {/* Hover Inner Glow */}
      {variant === 'primary' && (
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#e8c40033] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}
    </motion.button>
  );
};

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "variant";
  asChild?: boolean;
}

const GradientButton = React.forwardRef<HTMLElement, GradientButtonProps>(
  ({ className = "", variant = "default", asChild = false, ...props }, ref) => {
    const baseClasses = "gradient-button inline-flex items-center justify-center rounded-[11px] min-w-[132px] px-9 py-4 text-base leading-[19px] font-[500] text-white font-sans font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
    const variantClass = variant === "variant" ? "gradient-button-variant" : "";
    
    const Comp = asChild ? "span" : "button"; 
    
    return (
      <Comp
        ref={ref as any}
        className={`${baseClasses} ${variantClass} ${className}`}
        {...props}
      />
    );
  }
);
GradientButton.displayName = "GradientButton";

// ==========================================
// 4. SECTIONS
// ==========================================

const LoadingScreen = () => {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#0A0A0A] overflow-hidden"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.6 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="w-44 h-44 mb-6 rounded-2xl bg-[#111] border border-[#222] flex items-center justify-center overflow-hidden">
           {!imgError ? (
             <img 
              src={BUSINESS_DATA.logo} 
              alt="AN Study Zone Logo" 
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
             />
           ) : (
             <div className="text-[#C0152A] font-serif text-4xl font-bold flex flex-col items-center"><span className="text-[#C9982A] mb-2"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></span>AN</div>
           )}
        </div>
        
        <div 
          className="text-transparent font-medium text-lg tracking-wide"
          style={{
            backgroundImage: 'linear-gradient(90deg, rgba(201,152,42,0.4) 0%, rgba(232,196,0,1) 40%, rgba(255,255,255,0.95) 50%, rgba(232,196,0,1) 60%, rgba(201,152,42,0.4) 100%)',
            backgroundSize: '250% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            animation: 'shimmerText 1.8s linear infinite'
          }}
        >
          Enriching young minds in Vasai West...
        </div>
      </motion.div>

      {/* Curtain Reveal */}
      <motion.div
        className="fixed top-0 left-0 w-full h-[50vh] bg-[#0A0A0A] z-0"
        initial={{ y: 0 }}
        animate={{ y: "-100%" }}
        transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1], delay: 2.6 }}
      />
      <motion.div
        className="fixed bottom-0 left-0 w-full h-[50vh] bg-[#0A0A0A] z-0"
        initial={{ y: 0 }}
        animate={{ y: "100%" }}
        transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1], delay: 2.6 }}
      />
      
      <style>{`
        @keyframes shimmerText {
          from { background-position: 200% center }
          to { background-position: -200% center }
        }
      `}</style>
    </motion.div>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => setIsScrolled(latest > 100));

  const handleNavClick = (id: string) => {
    setIsOpen(false);
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
    }
  };

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Courses', id: 'courses' },
    { name: 'About', id: 'about' },
    { name: 'Testimonials', id: 'testimonials' },
    { name: 'Contact', id: 'form' },
  ];

  return (
    <>
      <motion.nav
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-4 left-0 right-0 mx-auto z-[100] flex items-center justify-between px-6 py-2.5 w-full max-w-[920px] rounded-full transition-all duration-300"
        style={{
          background: 'rgba(10,10,10,0.6)',
          backdropFilter: isScrolled ? 'blur(36px) saturate(180%)' : 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: isScrolled ? 'blur(36px) saturate(180%)' : 'blur(28px) saturate(180%)',
          border: `1px solid ${isScrolled ? 'rgba(201,152,42,0.5)' : 'rgba(201,152,42,0.25)'}`,
          boxShadow: isScrolled 
            ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 16px 40px rgba(0,0,0,0.6), 0 0 80px rgba(232,196,0,0.08)' 
            : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 12px 40px rgba(0,0,0,0.5), 0 0 80px rgba(232,196,0,0.04)',
          width: 'calc(100% - 32px)'
        }}
      >
        <div 
          className="flex items-center cursor-pointer h-[44px] w-auto max-w-[120px] rounded-lg overflow-hidden bg-black/50" 
          data-cursor="image"
          onClick={() => handleNavClick('home')}
        >
           {!imgError ? (
             <img 
              src={BUSINESS_DATA.logo} 
              alt="Logo" 
              className="h-full w-auto object-contain mix-blend-lighten"
              onError={() => setImgError(true)}
             />
           ) : (
             <div className="text-white font-serif font-bold tracking-widest px-2">AN</div>
           )}
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <div key={link.name} className="relative group">
              <button 
                onClick={() => handleNavClick(link.id)}
                className="text-white/60 hover:text-white text-[15px] font-medium transition-colors"
                data-cursor="link"
              >
                {link.name}
              </button>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E8C400] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <LiquidButton size="sm" onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSe0uKA4Mh9iS56vojtAUOd7XiqllpdXlt-lJO5CYxgnrKOaLg/viewform', '_blank')}>
              Enroll Now
            </LiquidButton>
          </div>
          
          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-white p-2"
            onClick={() => setIsOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#0A0A0A]/95 backdrop-blur-xl flex flex-col items-center justify-center"
          >
            <button 
              className="absolute top-8 right-8 text-white p-2"
              onClick={() => setIsOpen(false)}
            >
              <X size={32} />
            </button>

            <div className="flex flex-col items-center gap-8">
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.name}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 30, opacity: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => handleNavClick(link.id)}
                  className="font-serif text-4xl text-white hover:text-[#E8C400] transition-colors"
                >
                  {link.name}
                </motion.button>
              ))}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: navLinks.length * 0.08 }}
                className="mt-8"
              >
                <LiquidButton size="lg" onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSe0uKA4Mh9iS56vojtAUOd7XiqllpdXlt-lJO5CYxgnrKOaLg/viewform', '_blank')}>
                  Enroll Now
                </LiquidButton>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Hero = () => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const isInView = useInView(titleRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: panelRef,
    offset: ["start 85%", "start 20%"]
  });
  const panelScale = useTransform(scrollYProgress, [0, 1], [0.88, 1.0]);
  const panelBorderRadius = useTransform(scrollYProgress, [0, 1], ["3rem 3rem 0 0", "2rem 2rem 0 0"]);

  const words = ["learn.", "calculate.", "create.", "explore.", "communicate.", "draw.", "achieve."];
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setWordIdx((p) => (p + 1) % words.length), 2000);
    return () => clearInterval(t);
  }, [words.length]);

  return (
    <section id="home" className="relative w-full">
      
      {/* Word Cycling Sticky Area */}
      <div className="relative w-full bg-[#0A0A0A]" style={{ height: '400vh' }}>
        <div className="sticky top-[40vh] flex flex-col items-center justify-center pointer-events-none px-4">
          <div className="text-center font-serif leading-[1.05]" style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)', fontWeight: 700 }}>
            <span className="text-white/30 italic block mb-2 md:inline md:mb-0 md:mr-6 text-[clamp(1.5rem,3.5vw,3rem)]" style={{fontFamily: 'DM Sans'}}>your child can</span>
            
            <div className="relative inline-block h-[1.1em] align-bottom min-w-[360px] md:min-w-[520px] text-center md:text-left">
               <AnimatePresence mode="wait">
                 <motion.span
                    key={wordIdx}
                    initial={{ y: 20, opacity: 0, filter: 'blur(4px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    exit={{ y: -20, opacity: 0, filter: 'blur(4px)' }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-0 top-0 block w-full bg-clip-text text-transparent bg-gradient-to-b from-white/20 via-[#E8C400] to-white/20"
                 >
                   {words[wordIdx]}
                 </motion.span>
               </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Main Hero Dark Panel */}
      <motion.div ref={panelRef} style={{ scale: panelScale, borderRadius: panelBorderRadius }} className="relative z-10 bg-[#0A0A0A] min-h-screen pt-32 pb-24 px-6 md:px-12 rounded-t-[2rem] transform-gpu overflow-hidden">
        
        <div className="max-w-[860px] mx-auto text-center flex flex-col items-center">
          
          {/* Badge */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8 inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#E8C400]/30 bg-[#E8C400]/10 backdrop-blur-md"
            style={{ boxShadow: '0 0 20px rgba(232,196,0,0.1)' }}
          >
            <span className="text-sm tracking-wide text-[#E8C400] font-medium">
              ⭐ 5.0 · 22 Google Reviews · Vasai West
            </span>
          </motion.div>

          {/* H1 Title */}
          <h1 ref={titleRef} className="font-serif font-bold leading-[1.05] tracking-tight mb-6" style={{ fontSize: 'clamp(2.5rem, 7vw, 6rem)' }}>
            <div className="overflow-hidden">
              <motion.div initial={{ y: "105%" }} animate={isInView ? { y: 0 } : {}} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="text-white">
                Enrich Your
              </motion.div>
            </div>
            <div className="overflow-hidden">
              <motion.div initial={{ y: "105%" }} animate={isInView ? { y: 0 } : {}} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.14 }} className="text-white">
                Child's Future
              </motion.div>
            </div>
            <div className="overflow-hidden pb-4">
              <motion.div initial={{ y: "105%" }} animate={isInView ? { y: 0 } : {}} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.28 }}>
                <span className="text-transparent bg-clip-text" style={{
                  backgroundImage: 'linear-gradient(135deg, #C9982A 0%, #E8C400 35%, #ffffff 50%, #E8C400 65%, #C9982A 100%)',
                  backgroundSize: '300% 100%',
                  animation: 'titleShimmer 6s linear infinite'
                }}>
                  One Skill at a Time.
                </span>
              </motion.div>
            </div>
          </h1>

          {/* Subheading */}
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-white/60 text-lg md:text-xl max-w-2xl leading-relaxed mb-10"
          >
            Like a tree drawing strength from the soil — watch your child's roots grow deeper into the vast expanse of Knowledge. 🌱
          </motion.p>

          {/* CTAs */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.65 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <LiquidButton size="lg" onClick={() => document.getElementById('courses')?.scrollIntoView({behavior: 'smooth'})}>
              Explore Courses <ArrowRight size={18} />
            </LiquidButton>
            <LiquidButton variant="dark" size="lg" onClick={() => document.getElementById('form')?.scrollIntoView({behavior: 'smooth'})}>
              Enquire Now
            </LiquidButton>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
            className="mt-16 flex flex-col items-center gap-3"
          >
            <span className="text-white/30 text-xs uppercase tracking-widest">Scroll to explore</span>
            <motion.div 
              animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="text-white/30" size={20} />
            </motion.div>
          </motion.div>

        </div>
      </motion.div>
      
      <style>{`
        @keyframes titleShimmer {
          0% { background-position: 100% }
          100% { background-position: -100% }
        }
      `}</style>
    </section>
  );
};

const CourseCard = ({ course, index }: { course: typeof COURSES[0], index: number }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("rotateX(0deg) rotateY(0deg)");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFlipped || window.matchMedia('(pointer: coarse)').matches) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    
    setTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
  };

  const handleMouseLeave = () => {
    setTransform("rotateX(0deg) rotateY(0deg)");
  };

  return (
    <motion.div
      initial={{ y: 90, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.07 }}
      className="relative h-[340px] w-full perspective-[1200px] group transform-gpu"
      data-cursor="button"
    >
      <div 
        ref={cardRef}
        className="w-full h-full relative preserve-3d transition-transform duration-700 cursor-pointer"
        style={{ 
          transform: isFlipped ? 'rotateY(180deg)' : transform,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform'
        }}
        onClick={() => setIsFlipped(!isFlipped)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setIsFlipped(true)}
        onMouseOut={() => setIsFlipped(false)}
      >
        {/* Front Face */}
        <div className="absolute inset-0 backface-hidden bg-white rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] group-hover:shadow-[0_24px_64px_rgba(232,196,0,0.15)] transition-all duration-500 overflow-hidden">
          {/* Ambient Inner Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-[#E8C400]/30 to-[#C9982A]/10 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out pointer-events-none" />
          
          <div className="relative z-10">
            <motion.div 
              animate={{ y: [0, -6, 0] }}
              whileHover={{ scale: 1.3, rotate: [0, -10, 10, -10, 0] }}
              whileTap={{ scale: 0.8 }}
              transition={{ y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
              className="text-4xl sm:text-5xl mb-6 inline-block transform-gpu transition-transform group-hover:translate-z-[50px] duration-500 ease-out origin-bottom cursor-pointer"
            >
              {course.emoji}
            </motion.div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#0A0A0A] mb-3 leading-tight group-hover:text-[#C9982A] transition-colors duration-300">{course.name}</h3>
            <div className="inline-block bg-[#E8C400]/15 border border-[#E8C400]/20 text-[#C9982A] text-[11px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 shadow-sm">
              {course.age}
            </div>
            <p className="text-[#5A5A5A] text-[15px] leading-relaxed line-clamp-2">{course.desc}</p>
          </div>
          <div className="text-[#C9982A] text-xs font-bold tracking-widest uppercase flex items-center gap-2 mt-auto relative z-10 group-hover:gap-3 transition-all duration-300">
            Explore <ArrowRight size={14} className="group-hover:text-[#E8C400] transition-colors duration-300" />
          </div>
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 backface-hidden bg-gradient-to-b from-[#0A0A0A] to-[#111] rounded-[2rem] p-6 sm:p-8 flex flex-col border border-[#E8C400]/20 shadow-2xl overflow-hidden"
             style={{ transform: 'rotateY(180deg)' }}>
          {/* Subtle Golden Backlight */}
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-[#E8C400]/20 to-transparent rounded-full blur-[50px] pointer-events-none opacity-60" />
          
          <div className="flex-1 flex flex-col justify-center relative z-10">
            <h3 className="font-serif text-3xl font-bold text-white mb-4 border-b border-white/10 pb-4">{course.name}</h3>
            <p className="text-white/70 text-[15px] leading-[1.8] mb-8">{course.desc}</p>
            
            <LiquidButton 
              variant="primary" 
              size="sm" 
              className="mt-auto w-max"
              onClick={(e) => {
                e?.stopPropagation();
                document.getElementById('form')?.scrollIntoView({behavior: 'smooth'});
              }}
            >
              Enquire Now
            </LiquidButton>
          </div>
        </div>
      </div>
      
      <style>{`
        .perspective-\\[1200px\\] { perspective: 1200px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      `}</style>
    </motion.div>
  );
};

const AICourseAdvisorModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [age, setAge] = useState('');
  const [interests, setInterests] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeminiResponse | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!age || !interests) {
      setError('Please fill in both fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetchGeminiRecommendation(age, interests);
      setResult(res);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] hide-scrollbar"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
              <X size={24} />
            </button>
            
            <h3 className="font-serif text-3xl text-white font-bold mb-2 flex items-center gap-2">
              <Sparkles className="text-[#E8C400]" /> AI Course Matcher
            </h3>
            
            {!result ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-white/60 mb-6 text-sm">Tell us a little about your child, and our AI counselor will recommend the perfect programs from AN Study Zone.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Child's Age</label>
                    <input 
                      type="text" 
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g., 8 years old"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#E8C400]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Interests or Areas for Improvement</label>
                    <textarea 
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                      placeholder="e.g., Loves drawing but struggles with fast calculations..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#E8C400]/50 resize-none transition-colors"
                    />
                  </div>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  
                  <button 
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full mt-4 bg-gradient-to-r from-[#E8C400] to-[#C9982A] text-black font-bold rounded-xl py-3.5 flex justify-center items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={20} /> ✨ Analyze</>}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
                <p className="text-white/80 italic mb-6 text-sm bg-white/5 p-4 rounded-xl border border-white/10">"{result.message}"</p>
                <div className="space-y-4 mb-8">
                  {result.recommendations?.map((rec: Recommendation, i: number) => (
                    <div key={i} className="bg-[#E8C400]/10 border border-[#E8C400]/30 rounded-xl p-4">
                      <h4 className="font-serif text-xl font-bold text-[#E8C400] mb-2">{rec.emoji} {rec.courseName}</h4>
                      <p className="text-white/70 text-sm leading-relaxed">{rec.reason}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { onClose(); document.getElementById('form')?.scrollIntoView({behavior: 'smooth'}); }} className="flex-1 bg-white text-black font-bold rounded-xl py-3 hover:bg-gray-200 transition-colors">
                    Enquire Now
                  </button>
                  <button onClick={() => setResult(null)} className="flex-1 bg-white/10 text-white font-bold rounded-xl py-3 hover:bg-white/20 transition-colors border border-white/10">
                    Reset
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Courses = () => {
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);

  return (
    <section id="courses" className="bg-[#FFFDE7] py-24 px-6 md:px-12 relative z-20 overflow-hidden">
      
      {/* Ambient Light Backgrounds */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] bg-white rounded-full blur-[140px] opacity-[0.8]" />
        <div className="absolute bottom-[20%] right-[-5%] w-[600px] h-[600px] bg-[#E8C400]/[0.08] rounded-full blur-[160px]" />
      </div>

      <div className="max-w-[1200px] mx-auto relative z-10">
        
        {/* Added Course Banner Image with Glassmorphism Frame */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-24 relative p-2 md:p-3 rounded-[2.5rem] bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_20px_80px_rgba(0,0,0,0.06)]"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-[#E8C400]/20 to-transparent blur-3xl -z-10 rounded-[2.5rem]" />
          <img 
            src={BUSINESS_DATA.courseBanner} 
            alt="AN Study Zone Courses" 
            className="w-full h-auto object-cover rounded-[2rem] shadow-inner"
          />
        </motion.div>

        <div className="mb-16 flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-[#C9982A] uppercase tracking-[0.2em] text-sm font-bold mb-4"
          >
            Our Programs
          </motion.div>
          
          <motion.h2 
            initial={{ clipPath: "inset(100% 0 0 0)" }}
            whileInView={{ clipPath: "inset(0% 0 0 0)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif font-bold text-[#0A0A0A] mb-4"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
          >
            What We Teach
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[#5A5A5A] text-lg max-w-xl"
          >
            10 holistic programs carefully designed for every young learner's growth journey.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {COURSES.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>

        {/* Bottom Banner with AI */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-[0_20px_60px_rgba(232,196,0,0.15)]"
          style={{
            background: 'linear-gradient(135deg, #E8C400, #C9982A, #E8C400)',
            backgroundSize: '200% 200%',
            animation: 'bannerShimmer 6s ease infinite'
          }}
        >
          <div className="flex flex-col gap-2 z-10">
            <h3 className="font-serif text-[#0A0A0A] text-2xl md:text-4xl italic font-bold max-w-lg text-center md:text-left">
              Not sure which course fits your child perfectly?
            </h3>
            <p className="text-[#0A0A0A]/80 text-sm md:text-base font-medium text-center md:text-left">
              Let our AI counselor analyze your child's needs and suggest the perfect learning path.
            </p>
          </div>
          <GradientButton 
            className="shrink-0 z-10 shadow-2xl"
            onClick={() => setIsAdvisorOpen(true)}
          >
            <Sparkles size={18} className="mr-2 text-white/80" /> ✨ AI Course Matcher
          </GradientButton>
        </motion.div>

        <AICourseAdvisorModal isOpen={isAdvisorOpen} onClose={() => setIsAdvisorOpen(false)} />

      </div>
      <style>{`
        @keyframes bannerShimmer {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
      `}</style>
    </section>
  );
};

const AIParentAssistant = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    const sys = `You are the AI representative of "AN Study Zone" in Vasai West. Answer the parent's question concisely (2-3 sentences max) in a warm, encouraging tone. Highlight the founders (Ms. Amishi, Ms. Nitu) or relevant courses if applicable. Use the provided details.`;
    try {
      const res = await callGemini(question, sys);
      setAnswer(res);
    } catch {
      setAnswer("I'm sorry, I'm having trouble connecting right now. Please call us at 9226538135!");
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-12 bg-gradient-to-r from-white/[0.03] to-transparent border border-white/[0.07] backdrop-blur-[20px] rounded-[1.5rem] p-8 md:p-10 relative overflow-hidden"
    >
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 w-full">
           <span className="text-4xl mb-4 block">🤖</span>
           <h3 className="font-serif text-3xl text-white font-bold mb-3 flex items-center gap-2">
             Ask our AI Director <Sparkles className="text-[#E8C400]" size={24}/>
           </h3>
           <p className="text-white/60 text-lg">Curious about our teaching methods, timings, or a specific course? Ask any question and get an instant, personalized answer.</p>
        </div>
        <div className="flex-1 w-full flex flex-col gap-4">
          <div className="relative">
            <input 
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., How does Abacus help my 7-year-old?"
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-4 pr-12 py-4 text-white focus:outline-none focus:border-[#E8C400]/50 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            />
            <button 
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-[#E8C400]/20 flex items-center justify-center text-[#E8C400] hover:bg-[#E8C400] hover:text-black transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            </button>
          </div>
          <AnimatePresence>
            {answer && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#E8C400]/10 border border-[#E8C400]/30 rounded-xl p-4 text-white/80 text-sm leading-relaxed"
              >
                ✨ {answer}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const WhyUs = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [isQuoteHovered, setIsQuoteHovered] = useState(false);

  useEffect(() => {
    if (isQuoteHovered) return;
    
    const t = setInterval(() => setQuoteIdx((p) => (p + 1) % REVIEWS.length), 1000);
    return () => clearInterval(t);
  }, [isQuoteHovered]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const yA = useTransform(scrollYProgress, [0, 1], [0, -45]);
  const yB = useTransform(scrollYProgress, [0, 1], [0, -20]);
  const yC = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const yD = useTransform(scrollYProgress, [0, 1], [0, -15]);

  const title = "Why AN Study Zone?".split("");

  return (
    <section id="about" ref={containerRef} className="bg-[#0A0A0A] py-24 md:py-32 px-6 md:px-12 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#E8C400] rounded-full blur-[180px] opacity-[0.03] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#C0152A] rounded-full blur-[150px] opacity-[0.02] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto relative z-10">
        
        <h2 className="font-serif font-bold text-white mb-16 text-center" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>
          {title.map((char, i) => (
            <motion.span
              key={i}
              initial={{ y: 60, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block"
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </h2>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[auto]">
          
          {/* Card A (Large) */}
          <motion.div style={{ y: yA }} className="md:col-span-2 bg-white/[0.03] border border-white/[0.07] backdrop-blur-[20px] rounded-[1.5rem] p-8 md:p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#E8C400]/[0.06] rounded-full blur-[80px]" />
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(var(--yellow) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            
            <div className="relative z-10">
              <span className="text-5xl mb-6 block">🧑‍🏫</span>
              <h3 className="font-serif text-3xl text-white font-bold mb-3 group-hover:text-[#E8C400] transition-colors">Expert & Caring Teachers</h3>
              <p className="text-white/60 text-lg max-w-md leading-relaxed">Patient, encouraging educators dedicated to understanding how each individual child learns best.</p>
            </div>
          </motion.div>

          {/* Card B */}
          <motion.div style={{ y: yB }} className="bg-white/[0.03] border border-white/[0.07] backdrop-blur-[20px] rounded-[1.5rem] p-8 flex flex-col justify-center">
             <span className="text-4xl mb-4 block">🧠</span>
             <h3 className="font-serif text-2xl text-white font-bold mb-2">Proven Methods</h3>
             <p className="text-white/50 text-sm">Combining traditional techniques like Abacus with modern teaching aids for holistic brain development.</p>
          </motion.div>

          {/* Card C */}
          <motion.div style={{ y: yC }} className="bg-white/[0.03] border border-white/[0.07] backdrop-blur-[20px] rounded-[1.5rem] p-8 flex flex-col justify-center relative">
             <span className="text-4xl mb-4 block">🌱</span>
             <h3 className="font-serif text-2xl text-white font-bold mb-2">Holistic Growth</h3>
             <p className="text-white/50 text-sm">Beyond academics, we focus on creativity, confidence, and cognitive skills.</p>
          </motion.div>

          {/* Card D (Progress Bars) */}
          <motion.div style={{ y: yD }} className="md:col-span-2 bg-white/[0.03] border border-white/[0.07] backdrop-blur-[20px] rounded-[1.5rem] p-8 md:p-10">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 w-full">
                 <span className="text-4xl mb-4 block">📊</span>
                 <h3 className="font-serif text-3xl text-white font-bold mb-3">Visible Progress</h3>
                 <p className="text-white/60 text-lg">Regular updates and assessments ensure you see the tangible results of your child's effort.</p>
              </div>
              <div className="flex-1 w-full flex flex-col gap-4">
                {[
                  { label: "Mental Math Speed", pct: 92 },
                  { label: "Academic Confidence", pct: 88 },
                  { label: "Creative Expression", pct: 76 }
                ].map((stat, i) => (
                  <div key={i} className="w-full">
                    <div className="flex justify-between text-white/70 text-sm mb-1">
                      <span>{stat.label}</span>
                      <span className="text-[#E8C400]">{stat.pct}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 1.2, delay: i * 0.2, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-[#C9982A] to-[#E8C400] origin-left"
                        style={{ width: `${stat.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>

        {/* AI Parent Assistant */}
        <AIParentAssistant />

        {/* Pull Quote / Animated Reviews */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-[#e8c4000d] border border-[#e8c40026] rounded-[1.5rem] p-8 md:p-12 text-center relative overflow-hidden min-h-[250px] flex flex-col justify-center cursor-pointer group"
          onMouseEnter={() => setIsQuoteHovered(true)}
          onMouseLeave={() => setIsQuoteHovered(false)}
        >
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#E8C400] to-[#C9982A] rounded-l-md" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={quoteIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <p className="font-serif italic text-white/90 text-xl md:text-3xl max-w-3xl mx-auto leading-relaxed mb-6">
                {REVIEWS[quoteIdx].text}
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-white font-semibold">{REVIEWS[quoteIdx].name}</span>
                <span className="text-[#E8C400]/50">•</span>
                <span className="text-[#E8C400] text-sm">⭐⭐⭐⭐⭐ Google Review</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
};

const Founders = () => {
  const founders = [
    {
      name: "Ms. Amishi Thakkar",
      role: "Co-Founder & ABACUS Specialist",
      bio: "Patient, encouraging, and deeply passionate — Amishi Ma'am has built a reputation for making math genuinely joyful and accessible for every child in Vasai West.",
    },
    {
      name: "Ms. Nitu Bhat",
      role: "Co-Founder & Academic Director",
      bio: "Warm, dedicated and student-first — Nitu Ma'am ensures every learner receives personal attention and the right guidance to truly flourish in their academic journey.",
    }
  ];

  return (
    <section className="bg-[#FFFDE7] py-24 md:py-32 px-6 relative overflow-hidden">
      
      {/* Animated Ambient Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-[#E8C400]/[0.04] rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[0%] -left-[10%] w-[500px] h-[500px] bg-[#C9982A]/[0.05] rounded-full blur-[80px]"
        />
      </div>

      <div className="max-w-[1000px] mx-auto text-center relative z-10">
        
        <motion.div 
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-[#C9982A] uppercase tracking-[0.2em] text-sm font-bold mb-4"
        >
          The People Behind The Magic
        </motion.div>
        
        <h2 className="font-serif font-bold text-[#0A0A0A] flex flex-wrap justify-center gap-x-3 overflow-hidden" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
          {["Meet", "Our", "Founders"].map((word, i) => (
            <motion.span
              key={i}
              initial={{ y: "100%" }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block"
            >
              {word}
            </motion.span>
          ))}
        </h2>

        <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-12 mt-16 px-4">
          {founders.map((founder, i) => (
            <motion.div
              key={i}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: i * 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[400px] mx-auto group relative"
            >
              {/* Outer glowing border effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#E8C400]/30 to-transparent rounded-[2.2rem] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700 pointer-events-none" />
              
              <div className="relative bg-white/90 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_64px_rgba(232,196,0,0.12)] p-8 md:p-10 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-2 overflow-hidden flex flex-col items-center text-center">
                
                {/* Ambient Inner Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-[#E8C400]/30 to-[#C9982A]/10 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out pointer-events-none" />

                {/* Icon Container */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-[#E8C400]/20 rounded-full blur-md group-hover:scale-[1.8] transition-transform duration-700 ease-out opacity-0 group-hover:opacity-100" />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-[#FFFDE7] to-white border border-[#E8C400]/30 rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-6 group-hover:scale-105 transition-all duration-500 z-10">
                    <Users size={32} className="text-[#C9982A]" />
                  </div>
                </div>

                <h3 className="font-serif text-3xl font-bold text-[#0A0A0A] mb-1 relative z-10 group-hover:text-[#C9982A] transition-colors duration-300">
                  {founder.name}
                </h3>
                
                {/* Box Enlargement (Role & Bio) revealed on hover */}
                <div className="grid grid-rows-[0fr] opacity-0 group-hover:grid-rows-[1fr] group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] w-full">
                  <div className="overflow-hidden">
                    <div className="pt-5 flex flex-col items-center">
                      <div className="inline-block bg-[#E8C400]/15 border border-[#E8C400]/30 text-[#C9982A] text-[11px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 shadow-sm">
                        {founder.role}
                      </div>
                      <p className="text-[#5A5A5A] text-[15px] leading-[1.8] relative z-10">
                        {founder.bio}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Decorative expanding line */}
                <div className="w-12 h-1 bg-[#E8C400]/20 rounded-full mt-6 group-hover:w-24 group-hover:bg-[#E8C400] transition-all duration-500 ease-out" />

              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

const Testimonials = () => {
  const row1 = [REVIEWS[0], REVIEWS[1], REVIEWS[2], REVIEWS[3]];
  const row2 = [REVIEWS[4], REVIEWS[5], REVIEWS[6], REVIEWS[0]];

  const TestimonialCard = ({ review }: { review: Review }) => (
    <div className="w-[320px] sm:w-[360px] shrink-0 mr-5 relative bg-white/[0.04] border border-white/[0.07] backdrop-blur-[12px] rounded-[1.25rem] p-6 sm:p-7 overflow-hidden transition-all duration-300 hover:border-[#E8C400]/40 hover:shadow-[0_8px_32px_rgba(232,196,0,0.1)] hover:-translate-y-1">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#E8C400] to-[#C9982A] rounded-l-md" />
      
      <div className="text-[#E8C400] text-sm tracking-widest mb-3">★★★★★</div>
      <p className="text-white/75 text-[15px] italic leading-relaxed mb-6 line-clamp-4 h-[90px]">
        "{review.text}"
      </p>
      
      <div className="flex items-center justify-between mt-auto">
        <span className="text-white font-semibold text-sm">{review.name}</span>
        <span className="bg-[#E8C400]/10 border border-[#E8C400]/20 text-[#E8C400] text-[10px] uppercase font-bold px-2 py-1 rounded">Google ✓</span>
      </div>
    </div>
  );

  return (
    <section id="testimonials" className="bg-[#0A0A0A] py-24 overflow-hidden border-y border-white/[0.05]">
      <div className="text-center mb-16 px-6">
        <h2 className="font-serif text-white font-bold text-4xl sm:text-5xl mb-4">What Parents Are Saying</h2>
        <div className="inline-flex items-center gap-2 bg-[#E8C400]/10 px-4 py-1.5 rounded-full border border-[#E8C400]/20">
          <span className="text-[#E8C400] text-sm">⭐ 5.0 · 22 Reviews · Vasai West</span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Row 1: Left to Right */}
        <div className="marquee-row w-full relative -rotate-1 scale-105">
          <div className="marquee-inner" style={{ animation: 'marqueeLeft 35s linear infinite' }}>
            {[...row1, ...row1, ...row1, ...row1].map((review, i) => (
              <TestimonialCard key={`r1-${i}`} review={review} />
            ))}
          </div>
        </div>

        {/* Row 2: Right to Left (slightly slower) */}
        <div className="marquee-row w-full relative rotate-1 scale-105">
          <div className="marquee-inner" style={{ animation: 'marqueeRight 45s linear infinite' }}>
            {[...row2, ...row2, ...row2, ...row2].map((review, i) => (
              <TestimonialCard key={`r2-${i}`} review={review} />
            ))}
          </div>
        </div>
      </div>

      <div className="text-center mt-16">
        <LiquidButton variant="outline" size="md" onClick={() => window.open('https://www.google.com/search?q=an+study+zone+vasai', '_blank')}>
          Read All Google Reviews <ArrowRight size={16} className="ml-2" />
        </LiquidButton>
      </div>
    </section>
  );
};

const StorePreview = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 85%", "end 20%"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1.15, 1.0]);

  return (
    <section className="bg-[#FFFDE7] py-16 px-4 md:px-8">
      <div ref={containerRef} className="max-w-[1100px] mx-auto relative aspect-video md:h-[70vh] rounded-[2rem] overflow-hidden bg-black shadow-2xl">
        
        {/* Using requested store image directly without emojis */}
        <motion.div style={{ scale }} className="absolute inset-0 w-full h-full flex items-center justify-center bg-black transform-gpu will-change-transform">
          <img 
            src={BUSINESS_DATA.storePhoto} 
            alt="AN Study Zone Storefront"
            className="w-full h-full object-cover object-top opacity-80"
          />
        </motion.div>

        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.6) 30%, transparent 100%)' }} />

        {/* Content */}
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <div className="text-[#E8C400] text-xs font-bold tracking-[0.2em] uppercase mb-3">Visit Us In Vasai West</div>
            <h2 className="font-serif text-white text-3xl md:text-5xl italic font-bold mb-3">Where Learning Comes Alive</h2>
            <div className="flex items-center gap-2 text-white/70 text-sm md:text-base">
              <MapPin size={16} className="text-[#E8C400]" />
              {BUSINESS_DATA.address}
            </div>
          </div>
          
          <LiquidButton size="md" onClick={() => window.open('https://maps.google.com/?q=' + encodeURIComponent(BUSINESS_DATA.address), '_blank')}>
            Get Directions <Map size={16} className="ml-2" />
          </LiquidButton>
        </div>
      </div>
    </section>
  );
};

const AdmissionForm = () => {
  const { register, handleSubmit, formState: { isSubmitting }, reset, watch, setValue } = useForm();
  const [isSuccess, setIsSuccess] = useState(false);
  const [drafting, setDrafting] = useState(false);

  const parentName = watch("parent");
  const childName = watch("name");
  const age = watch("age");
  const selectedCourses = watch("courses");

  const onSubmit = async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Form Submitted:", data);
    setIsSuccess(true);
    reset();
    setTimeout(() => setIsSuccess(false), 5000);
  };

  const handleAutoDraft = async () => {
    setDrafting(true);
    const prompt = `Parent: ${parentName || 'A parent'}, Child: ${childName || 'my child'} (Age: ${age || 'not specified'}), Interested in: ${selectedCourses?.length ? selectedCourses.join(', ') : 'your courses'}.`;
    const sys = `You are a helpful assistant writing a short, extremely polite 2-sentence enquiry message for a parent to send to "AN Study Zone". Address the founders Ms. Amishi and Ms. Nitu. Use the provided details.`;
    try {
      const result = await callGemini(prompt, sys);
      setValue('message', result.replace(/"/g, '').trim());
    } catch (e) {
      console.error("Drafting failed", e);
    }
    setDrafting(false);
  };

  const InputWrapper = ({ children, label, required = true, id }: InputWrapperProps) => (
    <div className="relative group w-full mb-5">
      {children}
      <label 
        htmlFor={id} 
        className="absolute left-4 top-[14px] text-white/40 text-[15px] pointer-events-none transition-all duration-300 peer-focus:-translate-y-[26px] peer-focus:text-[#E8C400] peer-focus:text-xs peer-focus:font-medium peer-valid:-translate-y-[26px] peer-valid:text-xs peer-valid:text-white/70"
      >
        {label} {required && <span className="text-[#E8C400]">*</span>}
      </label>
    </div>
  );

  return (
    <section id="form" className="bg-[#0A0A0A] py-24 md:py-32 px-6 relative overflow-hidden min-h-screen flex items-center">
      
      {/* Animated Mesh Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-[#E8C400] rounded-full mix-blend-screen filter blur-[160px] opacity-[0.08] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#C0152A] rounded-full mix-blend-screen filter blur-[140px] opacity-[0.06] animate-blob animation-delay-2000" />
        <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-[#C9982A] rounded-full mix-blend-screen filter blur-[120px] opacity-[0.07] animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-[760px] w-full mx-auto relative z-10">
        
        <motion.div 
          initial={{ y: 60, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="bg-white/[0.04] backdrop-blur-[40px] border border-white/[0.1] border-t-white/[0.18] rounded-[2rem] p-8 md:p-14 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_40px_80px_rgba(0,0,0,0.5)]"
        >
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div key="form" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="text-center mb-10">
                  <h2 className="font-serif text-white text-4xl md:text-5xl font-bold mb-3">Ready to Begin?</h2>
                  <p className="text-white/55">Let's talk — we'll guide your child's journey 🌱</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                    <InputWrapper label="Child's Full Name" id="name">
                      <input 
                        {...register("name", { required: true })} 
                        id="name" required
                        className="peer w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-[14px] text-white focus:outline-none focus:border-[#E8C400]/50 focus:bg-white/[0.09] transition-all"
                      />
                    </InputWrapper>
                    <InputWrapper label="Parent / Guardian Name" id="parent">
                      <input 
                        {...register("parent", { required: true })} 
                        id="parent" required
                        className="peer w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-[14px] text-white focus:outline-none focus:border-[#E8C400]/50 focus:bg-white/[0.09] transition-all"
                      />
                    </InputWrapper>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                    <InputWrapper label="Mobile Number" id="phone">
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-white/10 bg-white/[0.04] text-white/50 text-sm pointer-events-none">
                          +91
                        </span>
                        <input 
                          {...register("phone", { required: true, pattern: /^[0-9]{10}$/ })} 
                          id="phone" required type="tel"
                          className="peer w-full bg-white/[0.06] border border-white/10 rounded-r-xl px-4 py-[14px] text-white focus:outline-none focus:border-[#E8C400]/50 focus:bg-white/[0.09] transition-all"
                        />
                      </div>
                    </InputWrapper>
                    <InputWrapper label="Child's Age / Class" id="age">
                      <input 
                        {...register("age", { required: true })} 
                        id="age" required
                        className="peer w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-[14px] text-white focus:outline-none focus:border-[#E8C400]/50 focus:bg-white/[0.09] transition-all"
                      />
                    </InputWrapper>
                  </div>

                  <div className="mb-6 pt-2">
                    <label className="text-white/60 text-sm mb-3 block">Programs of Interest</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {COURSES.map((c) => (
                        <label key={c.id} className="cursor-pointer">
                          <input type="checkbox" value={c.name} {...register("courses")} className="peer sr-only" />
                          <div className="text-xs text-white/60 bg-white/[0.05] border border-transparent rounded-lg px-3 py-2.5 transition-all peer-checked:bg-[#E8C400]/15 peer-checked:border-[#E8C400]/50 peer-checked:text-[#E8C400] flex items-center justify-between">
                            <span className="truncate pr-2">{c.name}</span>
                            <Check size={14} className="opacity-0 peer-checked:opacity-100 shrink-0" />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* AI Message Drafting Field */}
                  <div className="mb-6 pt-2 relative">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-white/60 text-sm">Message / Additional Details</label>
                      <button 
                        type="button"
                        onClick={handleAutoDraft}
                        disabled={drafting}
                        className="text-xs bg-[#E8C400]/10 hover:bg-[#E8C400]/20 text-[#E8C400] border border-[#E8C400]/30 rounded-full px-3 py-1.5 flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {drafting ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                        ✨ Auto-Draft Details
                      </button>
                    </div>
                    <textarea
                      {...register("message")}
                      rows={4}
                      placeholder="Write your message here, or click 'Auto-Draft' to let AI write it based on your filled details above!"
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-[14px] text-white focus:outline-none focus:border-[#E8C400]/50 focus:bg-white/[0.09] transition-all resize-none"
                    />
                  </div>

                  <LiquidButton 
                    type="submit" 
                    size="full" 
                    disabled={isSubmitting}
                    className="mt-8"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      "Send Enquiry 🌱"
                    )}
                  </LiquidButton>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="success" 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="text-center py-12 flex flex-col items-center relative"
              >
                {[...Array(16)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{ 
                      scale: Math.random() + 0.5, 
                      x: (Math.random() - 0.5) * 300, 
                      y: (Math.random() - 0.5) * 300,
                      rotate: Math.random() * 720,
                      opacity: [1, 1, 0]
                    }}
                    transition={{ duration: 1 + Math.random(), ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                    style={{ backgroundColor: ['#E8C400', '#C9982A', '#fff', '#C0152A'][Math.floor(Math.random()*4)] }}
                  />
                ))}
                
                <div className="w-16 h-16 bg-[#E8C400]/20 rounded-full flex items-center justify-center mb-6 border border-[#E8C400]/50">
                  <Check size={32} className="text-[#E8C400]" />
                </div>
                <h3 className="font-serif text-white text-3xl font-bold mb-2">Thank you, we received your enquiry!</h3>
                <p className="text-white/60">We'll reach out to you within 24 hours. 🌱</p>
                <button onClick={() => setIsSuccess(false)} className="mt-8 text-[#E8C400] text-sm underline opacity-50 hover:opacity-100">Send another</button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Contact Quick Links */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <a href={BUSINESS_DATA.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-5 py-2.5 text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors text-sm">
            <MessageCircle size={16} className="text-[#25D366]" /> {BUSINESS_DATA.phone}
          </a>
          <a href={`mailto:${BUSINESS_DATA.email}`} className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-5 py-2.5 text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors text-sm">
            <Mail size={16} className="text-[#E8C400]" /> Email Us
          </a>
        </div>

      </div>
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 15s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }will-change: transform; 
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-[#080808] border-t border-[#E8C400]/15 pt-20 pb-8 px-6 md:px-12 relative z-20">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">
          
          {/* Col 1 */}
          <div className="md:col-span-5 flex flex-col items-start">
            <motion.div 
              animate={{ scale: [1, 1.02, 1] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="h-[100px] w-auto mb-4 group cursor-pointer bg-black rounded-lg overflow-hidden flex items-center justify-center"
            >
              <img 
                src={BUSINESS_DATA.logo} 
                alt="AN Study Zone Logo" 
                className="h-full object-contain drop-shadow-xl group-hover:drop-shadow-[0_0_20px_rgba(232,196,0,0.3)] transition-all"
              />
            </motion.div>
            <p className="font-serif italic text-white/40 text-lg max-w-sm mb-6 mt-4">
              "Enriching young minds in Vasai West."
            </p>
            <div className="bg-[#E8C400]/[0.08] text-[#E8C400] text-sm font-medium px-4 py-1.5 rounded-full border border-[#E8C400]/20 inline-flex items-center gap-2 mb-4">
              ⭐ 5.0 · 22 Google Reviews
            </div>
            <p className="text-white/25 text-xs">Directed by Ms. Nitu Bhat & Ms. Amishi Thakkar</p>
          </div>

          {/* Col 2 */}
          <div className="md:col-span-3">
            <h4 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {['Courses', 'Testimonials', 'Enroll Now', 'Contact', 'Get Directions'].map((link) => (
                <li key={link}>
                  <button 
                    onClick={() => {
                      const id = link.toLowerCase().replace(' ', '-');
                      if (id === 'enroll-now') {
                        window.open('https://docs.google.com/forms/d/e/1FAIpQLSe0uKA4Mh9iS56vojtAUOd7XiqllpdXlt-lJO5CYxgnrKOaLg/viewform', '_blank');
                        return;
                      }
                      const actualId = id === 'contact' ? 'form' : id;
                      if(actualId === 'get-directions') window.open('https://maps.google.com/?q=' + encodeURIComponent(BUSINESS_DATA.address), '_blank');
                      else document.getElementById(actualId)?.scrollIntoView({behavior: 'smooth'});
                    }}
                    className="text-white/40 hover:text-white transition-colors text-sm group flex items-center"
                  >
                    <ArrowRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 mr-2 transition-all text-[#E8C400]" />
                    <span className="group-hover:text-[#E8C400] group-hover:underline underline-offset-4 decoration-[#E8C400]/50 transition-all">{link}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 */}
          <div className="md:col-span-4">
            <h4 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-6">Get In Touch</h4>
            <div className="space-y-4 text-white/55 text-[15px] leading-[1.7]">
              <a href={`tel:${BUSINESS_DATA.phone}`} className="flex items-start gap-3 hover:text-[#E8C400] transition-colors">
                <Phone size={18} className="mt-1 shrink-0" /> {BUSINESS_DATA.phone}
              </a>
              <a href={`mailto:${BUSINESS_DATA.email}`} className="flex items-start gap-3 hover:text-[#E8C400] transition-colors">
                <Mail size={18} className="mt-1 shrink-0" /> {BUSINESS_DATA.email}
              </a>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-1 shrink-0" /> {BUSINESS_DATA.address}
              </div>
              <div className="flex items-start gap-3 text-white/40">
                <Calendar size={18} className="mt-1 shrink-0" /> Mon–Sat, 9:00 AM – 7:00 PM
              </div>
            </div>
          </div>
        </div>

        {/* Socials & Divider */}
        <div className="flex justify-center gap-4 mb-10">
          <a href={BUSINESS_DATA.whatsapp} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all duration-300 hover:scale-110">
            <MessageCircle size={20} />
          </a>
          <a href={BUSINESS_DATA.instagram} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-[#E1306C]/10 border border-[#E1306C]/25 flex items-center justify-center text-[#E1306C] hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white hover:border-transparent transition-all duration-300 hover:scale-110">
            <Instagram size={20} />
          </a>
          <a href={BUSINESS_DATA.facebook} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-[#1877F2]/15 border border-[#1877F2]/30 flex items-center justify-center text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-all duration-300 hover:scale-110">
            <Facebook size={20} />
          </a>
        </div>

        <div className="w-full h-[1px] bg-white/5 mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div className="text-white/25">© 2025 AN Study Zone. All rights reserved.</div>
          <div className="text-white/20 italic">Made with ❤️ for the learners of Vasai West</div>
        </div>
      </div>
    </footer>
  );
};

const FloatingSocialFAB = () => {
  const [idx, setIdx] = useState(0);
  const { ref, position, handleMouseMove, handleMouseLeave } = useMagneticHover(0.5);

  const platforms = [
    { name: 'whatsapp', bg: '#25D366', link: BUSINESS_DATA.whatsapp, icon: <MessageCircle size={24} color="white" />, tooltip: 'Chat on WhatsApp 💬' },
    { name: 'instagram', bg: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#bc1888)', link: BUSINESS_DATA.instagram, icon: <Instagram size={24} color="white" />, tooltip: 'Follow on Instagram 📸' },
    { name: 'facebook', bg: '#1877F2', link: BUSINESS_DATA.facebook, icon: <Facebook size={24} color="white" />, tooltip: 'Follow on Facebook 👍' },
  ];

  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % platforms.length), 3000);
    return () => clearInterval(t);
  }, [platforms.length]);

  const active = platforms[idx];

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-center">
      <div className="relative flex items-center justify-center group">
        {/* Tooltip moved to the side */}
        <div 
          className="absolute right-full mr-4 whitespace-nowrap bg-black/80 backdrop-blur-md text-white text-xs px-3 py-2 rounded-lg border border-white/10 pointer-events-none opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hidden md:block"
        >
          {active.tooltip}
        </div>

        <motion.a
          ref={ref as any}
          href={active.link}
          target="_blank"
          rel="noreferrer"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          animate={{ x: position.x, y: position.y }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex items-center justify-center w-[58px] h-[58px] rounded-full border border-white/20 shadow-2xl z-10"
          style={{ background: active.bg, backdropFilter: 'blur(12px)' }}
          data-cursor="button"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active.name}
              initial={{ scale: 0.4, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.4, rotate: 90, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 20 }}
            >
              {active.icon}
            </motion.div>
          </AnimatePresence>

          {/* Pulse Ring */}
          <div 
            className="absolute inset-[-8px] rounded-full border-[2px] pointer-events-none"
            style={{ 
              borderColor: active.name === 'instagram' ? '#e6683c' : active.bg,
              animation: 'pulseRing 2.2s ease-out infinite' 
            }}
          />
        </motion.a>
      </div>
    </div>
  );
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================

export default function App() {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    // Dismiss loading screen after exactly 3.2s
    const timer = setTimeout(() => setLoaded(true), 3200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <CustomCursor />
      <ScrollProgress />
      
      <AnimatePresence>
        {!loaded && <LoadingScreen />}
      </AnimatePresence>

      <div className={`transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0 h-screen overflow-hidden'}`}>
        <Navbar />
        <main>
          <Hero />
          <Courses />
          <WhyUs />
          <Founders />
          <Testimonials />
          <StorePreview />
          <AdmissionForm />
        </main>
        <Footer />
        <FloatingSocialFAB />
      </div>
    </>
  );
}

