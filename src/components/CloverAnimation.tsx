import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from "motion/react";

const fourHs = [
  {
    letter: "Head",
    title: "Learning and Thinking",
    description: "Knowledge, critical thinking, and informed decision-making;",
    rotation: -45
  },
  {
    letter: "Heart",
    title: "Caring and Service",
    description: "Compassion, respect, and commitment to community;",
    rotation: 45
  },
  {
    letter: "Hands",
    title: "Action and Skills",
    description: "Productivity, teamwork, and practical competence;",
    rotation: 135
  },
  {
    letter: "Health",
    title: "Well-being",
    description: "Physical, mental, and social well-being.",
    rotation: 225
  }
];

export function CloverAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollDirection, setScrollDirection] = useState<"down" | "up">("down");
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    const previous = scrollYProgress.getPrevious();
    if (previous !== undefined) {
      const diff = current - previous;
      if (diff > 0) {
        setScrollDirection("down");
      } else if (diff < 0) {
        setScrollDirection("up");
      }
    }
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Rotate the entire clover so the active leaf points straight UP (0 degrees)
  const rotateLeaves = useTransform(smoothProgress, [0, 0.33, 0.66, 1], [45, -45, -135, -225]);

  return (
    <div ref={containerRef} className="h-[400vh] relative w-full mb-24">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden px-4 bg-gradient-to-br from-[#06180e] to-[#0a2a18] rounded-3xl py-12 md:py-20 relative border border-white/5 shadow-2xl">
        
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:32px_32px]"></div>

        {/* Title Section */}
        <div className="text-center md:text-left mb-8 md:mb-16 w-full max-w-5xl mx-auto relative z-10">
          <h5 className="text-[#f59e0b] font-bold tracking-widest text-sm uppercase mb-3 drop-shadow-sm">
            The Four H's
          </h5>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-tight drop-shadow-md">
            What 4-H Stands For
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 w-full max-w-5xl mx-auto flex-1 relative z-10">
          {/* The Clover */}
          <div className="relative w-64 h-64 md:w-[350px] md:h-[350px] lg:w-[450px] lg:h-[450px] flex-shrink-0 flex items-center justify-center">
            
            <motion.div style={{ rotate: rotateLeaves }} className="relative w-full h-full flex items-center justify-center">
              {fourHs.map((h, i) => (
                <Leaf 
                  key={h.letter}
                  index={i}
                  word={h.letter}
                  rotation={h.rotation}
                  progress={smoothProgress}
                  cloverRotation={rotateLeaves}
                />
              ))}
              {/* Small circle in the center */}
              <div className="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] w-3 h-3 md:w-5 md:h-5 lg:w-7 lg:h-7 bg-white rounded-full z-30 drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]" />
            </motion.div>

            {/* Stem */}
            <svg viewBox="0 0 100 200" className="absolute top-[50%] left-[50%] w-16 h-32 md:w-20 md:h-40 lg:w-28 lg:h-56 -translate-x-[45%] fill-[var(--color-4h-green)] -z-20 drop-shadow-md">
              <path d="M40,0 C40,50 60,150 20,200 C50,200 80,100 60,0 Z" />
            </svg>
            
          </div>

          {/* The Text Info */}
          <div className="w-full max-w-md lg:max-w-2xl flex flex-col justify-center text-center md:text-left mt-8 md:mt-0">
            <div className="relative h-48 md:h-64 lg:h-80 w-full">
              {fourHs.map((h, i) => (
                <TextReveal 
                  key={h.letter}
                  index={i}
                  title={h.title}
                  description={h.description}
                  letter={h.letter}
                  progress={smoothProgress}
                />
              ))}

              {/* Scroll instruction */}
              <motion.div 
                 className="absolute bottom-[-10px] left-0 right-0 flex justify-center md:justify-start items-center gap-2 text-slate-400 font-medium text-sm"
                 animate={{ y: scrollDirection === "down" ? [0, 5, 0] : [0, -5, 0] }}
                 transition={{ repeat: Infinity, duration: 2 }}
              >
                 <span>Scroll {scrollDirection} to explore</span>
                 {scrollDirection === "down" ? (
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
                 ) : (
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                 )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Leaf({ word, progress, index, rotation, cloverRotation }: any) {
  const isActive = useTransform(progress, (p: number) => {
    if (index === 0) return p < 0.25;
    if (index === 1) return p >= 0.25 && p < 0.5;
    if (index === 2) return p >= 0.5 && p < 0.75;
    if (index === 3) return p >= 0.75;
    return false;
  });

  const scale = useTransform(isActive, (active) => active ? 1.15 : 0.95);
  const opacity = useTransform(isActive, (active) => active ? 1 : 0.5);
  const filter = useTransform(isActive, (active) => active ? "drop-shadow(0px 15px 20px rgba(0,0,0,0.2))" : "drop-shadow(0px 0px 0px rgba(0,0,0,0))");
  const zIndex = useTransform(isActive, (active) => active ? 20 : 10);
  
  // Keep the text perfectly upright regardless of the clover's global rotation
  const counterRotation = useTransform(cloverRotation, (r: number) => -(r + rotation));

  return (
    <motion.div 
      style={{ 
        position: 'absolute',
        top: '50%',
        left: '50%',
        x: '-50%',
        y: '-102%', // 102% offset to leave a tiny gap in the center
        transformOrigin: "50% 102%",
        rotate: rotation,
        scale,
        opacity,
        zIndex,
        filter
      }}
      className="w-28 h-28 md:w-36 md:h-36 lg:w-48 lg:h-48 flex flex-col items-center justify-center text-[var(--color-4h-green)]"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full fill-current -z-10">
        <path d="M50,100 C50,100 0,60 0,25 C0,8 15,0 30,0 C42,0 50,15 50,15 C50,15 58,0 70,0 C85,0 100,8 100,25 C100,60 50,100 50,100 Z" />
      </svg>
      {/* The H and Word */}
      <motion.div 
        style={{ rotate: counterRotation }}
        className="absolute inset-0 flex flex-col items-center justify-center mt-3 md:mt-4 lg:mt-6"
      >
        <motion.span 
          whileHover={{ scale: 1.15 }}
          className="text-white font-display font-bold text-5xl md:text-6xl lg:text-[5.5rem] leading-none tracking-tight cursor-default"
        >
          H
        </motion.span>
        <span className="text-white font-bold text-[10px] md:text-[11px] lg:text-sm uppercase tracking-widest mt-1 lg:mt-2 drop-shadow-sm">
          {word}
        </span>
      </motion.div>
    </motion.div>
  );
}

function TextReveal({ index, title, description, letter, progress }: any) {
  const yOffset = useTransform(progress, (p: number) => {
    let currIdx = 0;
    if (p >= 0.25 && p < 0.5) currIdx = 1;
    if (p >= 0.5 && p < 0.75) currIdx = 2;
    if (p >= 0.75) currIdx = 3;
    
    if (currIdx === index) return 0;
    if (currIdx > index) return -50;
    return 50;
  });

  const opacity = useTransform(progress, (p: number) => {
    // Smoother crossfades between the text items
    if (index === 0) {
      if (p < 0.23) return 1;
      if (p < 0.27) return 1 - ((p - 0.23) / 0.04);
      return 0;
    }
    if (index === 1) {
      if (p < 0.23) return 0;
      if (p < 0.27) return (p - 0.23) / 0.04;
      if (p < 0.48) return 1;
      if (p < 0.52) return 1 - ((p - 0.48) / 0.04);
      return 0;
    }
    if (index === 2) {
      if (p < 0.48) return 0;
      if (p < 0.52) return (p - 0.48) / 0.04;
      if (p < 0.73) return 1;
      if (p < 0.77) return 1 - ((p - 0.73) / 0.04);
      return 0;
    }
    if (index === 3) {
      if (p < 0.73) return 0;
      if (p < 0.77) return (p - 0.73) / 0.04;
      return 1;
    }
    return 0;
  });

  const pointerEvents = useTransform(opacity, (o) => o > 0.5 ? "auto" : "none");

  return (
    <motion.div 
      style={{ y: yOffset, opacity, pointerEvents }}
      className="absolute inset-0 flex flex-col justify-center"
    >
      <h3 className="text-3xl md:text-4xl lg:text-6xl font-display font-bold text-[#4ade80] mb-3 lg:mb-5 drop-shadow-md">
        {letter} <span className="text-slate-300 font-medium whitespace-nowrap text-2xl md:text-3xl lg:text-5xl">({title})</span>
      </h3>
      <p className="text-xl md:text-2xl lg:text-3xl text-slate-200 leading-relaxed md:pr-12 font-light">
        {description}
      </p>
    </motion.div>
  );
}
