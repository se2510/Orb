import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';

interface OrbTitleProps {
  fontSize?: string;
}

const OrbTitle: React.FC<OrbTitleProps> = memo(({ fontSize = 'clamp(64px, 12vw, 120px)' }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Stars overlay on hover */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 1,
          background: 'radial-gradient(2px 2px at 20% 30%, white, transparent), radial-gradient(2px 2px at 60% 70%, white, transparent), radial-gradient(1px 1px at 50% 50%, white, transparent), radial-gradient(1px 1px at 80% 10%, white, transparent), radial-gradient(2px 2px at 90% 60%, white, transparent), radial-gradient(1px 1px at 33% 80%, white, transparent), radial-gradient(2px 2px at 15% 90%, white, transparent)',
          backgroundSize: '200px 200px, 300px 300px, 250px 250px, 280px 280px, 220px 220px, 260px 260px, 290px 290px',
          animation: 'twinkle 3s ease-in-out infinite'
        }}
      />

      {/* Dark overlay on hover */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.85 : 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: '#000',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          cursor: 'pointer',
          zIndex: 2,
          perspective: '1000px'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Orbital path - 3D inclined ellipse */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '220px',
            height: '220px',
            border: '3px dashed rgba(168, 85, 247, 0.5)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%) rotateX(65deg) rotateZ(45deg)',
            transformStyle: 'preserve-3d',
            pointerEvents: 'none',
            zIndex: 5
          }}
        />

        {/* Orbiting planet - 3D motion */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotateX(65deg) rotateZ(45deg)',
            transformStyle: 'preserve-3d',
            pointerEvents: 'none',
            zIndex: 5,
            willChange: 'transform'
          }}
        >
          <motion.div
            style={{
              transformStyle: 'preserve-3d',
              position: 'relative',
              willChange: 'transform'
            }}
            animate={{
              rotateZ: [0, 360]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            <motion.div
              style={{
                position: 'absolute',
                top: '0',
                left: '110px',
                width: '16px',
                height: '16px',
                marginLeft: '-8px',
                marginTop: '-8px',
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 0 15px rgba(255, 255, 255, 0.9), 0 0 25px rgba(255, 255, 255, 0.5)',
                filter: isHovered ? 'brightness(1.5)' : 'brightness(1)',
                transition: 'filter 0.25s ease',
                willChange: 'transform, opacity, scale'
              }}
              animate={{
                scale: [1.2, 1.2, 0.7, 0.7, 1.2],
                opacity: [1, 1, 0.4, 0.4, 1]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'linear',
                times: [0, 0.2, 0.5, 0.7, 1]
              }}
            />
          </motion.div>
        </div>

        {/* ORB Title with effects */}
        <h1
          className="orb-title"
          style={{
            fontSize,
            margin: '0',
            fontWeight: '900',
            letterSpacing: '-2px',
            position: 'relative',
            animation: 'float 3s ease-in-out infinite',
            filter: isHovered 
              ? 'drop-shadow(0 0 30px rgba(168, 85, 247, 1)) drop-shadow(0 0 60px rgba(168, 85, 247, 0.8)) drop-shadow(0 0 90px rgba(168, 85, 247, 0.6))' 
              : 'drop-shadow(0 2px 10px rgba(168, 85, 247, 0.4))',
            transition: 'filter 0.25s ease',
          }}
        >
          Orb
        </h1>
      </div>
    </>
  );
});

OrbTitle.displayName = 'OrbTitle';

export default OrbTitle;
