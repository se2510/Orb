import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ModeSelectionScreenProps {
  onSelectMode: (mode: 'free' | 'simulation') => void;
  onBack: () => void;
}

interface ModeCardProps {
  emoji: string;
  title: string;
  description: string;
  delay: number;
  onClick: () => void;
}

const ModeCard: React.FC<ModeCardProps> = React.memo(({ 
  emoji, 
  title, 
  description, 
  delay,
  onClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      initial={{ y: 30, opacity: 0, scale: 0.8, rotateX: 20 }}
      animate={{ 
        y: 0, 
        opacity: 1, 
        scale: 1,
        rotateX: 0,
        transition: {
          delay, 
          duration: 0.5, 
          type: 'spring', 
          stiffness: 120,
          damping: 12,
          mass: 0.8
        }
      }}
      whileHover={{ 
        scale: 1.03,
        y: -5,
        transition: { duration: 0.2, ease: 'easeOut' }
      }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered 
          ? 'rgba(30, 41, 59, 0.8)'
          : 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: isHovered 
          ? '2px solid #fbbf24' 
          : '2px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: 'clamp(16px, 3vw, 24px)',
        cursor: 'pointer',
        width: '100%',
        maxWidth: '280px',
        height: 'auto',
        minHeight: 'clamp(200px, 30vh, 280px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        textAlign: 'center',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isHovered 
          ? '0 0 30px rgba(251, 191, 36, 0.2), 0 0 0 1px rgba(251, 191, 36, 0.5) inset'
          : '0 10px 30px rgba(0, 0, 0, 0.5)',
        willChange: 'transform, background, box-shadow'
      }}
    >
      {/* Shimmer effect on hover */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
            animation: 'shimmerCard 1.2s ease-in-out infinite',
            pointerEvents: 'none',
            transform: 'translateZ(0)',
            willChange: 'left'
          }}
        />
      )}

      {/* Emoji Icon */}
      <div style={{
        fontSize: 'clamp(32px, 6vw, 52px)',
        marginBottom: 'clamp(10px, 2vh, 16px)',
        filter: isHovered 
          ? 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.6))' 
          : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {emoji}
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: 'clamp(16px, 3vw, 20px)',
        fontWeight: '800',
        color: 'white',
        margin: '0 0 10px 0',
        letterSpacing: '0.5px',
        textShadow: isHovered 
          ? '0 0 20px rgba(255, 255, 255, 0.5)'
          : '0 2px 4px rgba(0, 0, 0, 0.3)',
        transition: 'text-shadow 0.3s ease'
      }}>
        {title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: 'clamp(11px, 2.5vw, 13px)',
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: '1.5',
        margin: '0',
        fontWeight: '500',
        maxWidth: '220px'
      }}>
        {description}
      </p>

      {/* Select Button Indicator */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '16px',
        width: '100%',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{
          padding: '6px 20px',
          background: isHovered ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)',
          color: isHovered ? '#000' : '#fff',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: '700',
          transition: 'all 0.3s ease',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {isHovered ? 'Comenzar' : 'Seleccionar'}
        </div>
      </div>
    </motion.button>
  );
});

ModeCard.displayName = 'ModeCard';

const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = React.memo(({ onSelectMode, onBack }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        filter: 'blur(0px)',
        transition: {
          duration: 0.5,
          ease: [0.34, 1.56, 0.64, 1]
        }
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.95,
        filter: 'blur(10px)',
        transition: { duration: 0.3, ease: 'easeInOut' }
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: '100%',
        position: 'relative',
        zIndex: 1,
        padding: 'clamp(20px, 3vh, 40px)'
      }}
    >
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        onClick={onBack}
        style={{
          position: 'absolute',
          top: 'clamp(20px, 3vh, 40px)',
          left: 'clamp(20px, 3vw, 40px)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'white',
          backdropFilter: 'blur(5px)',
          zIndex: 10,
          padding: 0
        }}
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        whileTap={{ scale: 0.95 }}
        aria-label="Volver"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </motion.button>

      {/* Título de Selección */}
      <motion.h2
        initial={{ y: -20, opacity: 0, scale: 0.9 }}
        animate={{ 
          y: 0, 
          opacity: 1, 
          scale: 1,
          transition: {
            delay: 0.15,
            duration: 0.4,
            ease: [0.34, 1.56, 0.64, 1]
          }
        }}
        style={{
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #e9d5ff 0%, #c084fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 clamp(30px, 5vh, 40px) 0',
          textAlign: 'center',
          filter: 'drop-shadow(0 2px 10px rgba(168, 85, 247, 0.4))'
        }}
      >
        Selecciona un Modo
      </motion.h2>

      {/* Mode Cards Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'clamp(12px, 3vw, 24px)',
        width: '100%',
        maxWidth: '600px',
        justifyItems: 'center'
      }}>
        <ModeCard
          emoji="🔧"
          title="Modo Libre"
          description="Experimenta y controla manualmente los ángulos solares, del panel y de la construcción en tiempo real."
          delay={0.3}
          onClick={() => onSelectMode('free')}
        />

        <ModeCard
          emoji="🌍"
          title="Modo Simulación"
          description="Simula escenarios reales seleccionando ubicación y fecha. Visualiza datos completos de ángulos e incidencia solar."
          delay={0.5}
          onClick={() => onSelectMode('simulation')}
        />
      </div>

      {/* Indicador de regreso (opcional) */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        style={{
          position: 'absolute',
          bottom: 'clamp(20px, 3vh, 40px)',
          fontSize: 'clamp(11px, 1.4vw, 13px)',
          color: '#9ca3af',
          fontWeight: '500',
          textShadow: '0 2px 6px rgba(0, 0, 0, 0.7)',
          margin: '0'
        }}
      >
        Presiona ESC para volver
      </motion.p>
    </motion.div>
  );
});

ModeSelectionScreen.displayName = 'ModeSelectionScreen';

export default ModeSelectionScreen;
