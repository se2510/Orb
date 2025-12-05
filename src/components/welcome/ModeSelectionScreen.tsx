import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ModeSelectionScreenProps {
  onSelectMode: (mode: 'free' | 'simulation') => void;
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
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.3, type: 'spring', stiffness: 150, damping: 15 }}
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
          ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)'
          : 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '2px solid rgba(251, 191, 36, 0.3)',
        borderRadius: '24px',
        padding: 'clamp(30px, 4vh, 45px) clamp(25px, 3vw, 40px)',
        cursor: 'pointer',
        width: 'min(400px, 85vw)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isHovered 
          ? '0 20px 60px rgba(251, 191, 36, 0.4), 0 0 40px rgba(251, 191, 36, 0.3)'
          : '0 15px 40px rgba(0, 0, 0, 0.5)',
        willChange: 'transform'
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
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
            animation: 'shimmerCard 1.2s ease-in-out infinite',
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Emoji Icon */}
      <div style={{
        fontSize: 'clamp(48px, 7vw, 72px)',
        marginBottom: 'clamp(15px, 2vh, 20px)',
        filter: isHovered 
          ? 'drop-shadow(0 4px 12px rgba(251, 191, 36, 0.6))' 
          : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
        transition: 'filter 0.15s ease'
      }}>
        {emoji}
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: 'clamp(22px, 3vw, 28px)',
        fontWeight: '900',
        color: 'white',
        margin: '0 0 clamp(12px, 1.5vh, 16px) 0',
        letterSpacing: '0.5px',
        textShadow: isHovered 
          ? '0 0 20px rgba(255, 255, 255, 0.8), 0 2px 8px rgba(0, 0, 0, 0.3)'
          : '0 2px 8px rgba(0, 0, 0, 0.3)',
        transition: 'text-shadow 0.15s ease'
      }}>
        {title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: 'clamp(13px, 1.8vw, 15px)',
        color: 'rgba(255, 255, 255, 0.95)',
        lineHeight: '1.6',
        margin: '0',
        fontWeight: '500',
        textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)'
      }}>
        {description}
      </p>
    </motion.button>
  );
});

ModeCard.displayName = 'ModeCard';

const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = React.memo(({ onSelectMode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        position: 'relative',
        zIndex: 1,
        padding: 'clamp(20px, 3vh, 40px)'
      }}
    >
      {/* Título de Selección */}
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        style={{
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #e9d5ff 0%, #c084fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 clamp(40px, 6vh, 60px) 0',
          textAlign: 'center',
          filter: 'drop-shadow(0 2px 10px rgba(168, 85, 247, 0.4))'
        }}
      >
        Selecciona un Modo
      </motion.h2>

      {/* Mode Cards Container */}
      <div style={{
        display: 'flex',
        gap: 'clamp(20px, 3vw, 30px)',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center'
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
