import React from 'react';
import { motion } from 'framer-motion';

interface ModeSelectionScreenProps {
  onSelectMode: (mode: 'free' | 'simulation') => void;
}

interface ModeCardProps {
  emoji: string;
  title: string;
  description: string;
  gradient: string;
  delay: number;
  onClick: () => void;
}

const ModeCard: React.FC<ModeCardProps> = React.memo(({ 
  emoji, 
  title, 
  description, 
  gradient, 
  delay,
  onClick 
}) => {
  return (
    <motion.button
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.6, type: 'spring', stiffness: 100 }}
      whileHover={{ 
        scale: 1.05,
        y: -10,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        background: gradient,
        border: '2px solid rgba(233, 213, 255, 0.3)',
        borderRadius: '24px',
        padding: 'clamp(30px, 4vh, 45px) clamp(25px, 3vw, 40px)',
        cursor: 'pointer',
        width: 'min(400px, 85vw)',
        transition: 'box-shadow 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.3)',
        willChange: 'transform'
      }}
    >
      {/* Emoji Icon */}
      <div style={{
        fontSize: 'clamp(48px, 7vw, 72px)',
        marginBottom: 'clamp(15px, 2vh, 20px)',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
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
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
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

      {/* Hover Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%)',
        opacity: 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none'
      }} />
    </motion.button>
  );
});

ModeCard.displayName = 'ModeCard';

const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = React.memo(({ onSelectMode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
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
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
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
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          delay={0.3}
          onClick={() => onSelectMode('free')}
        />

        <ModeCard
          emoji="🌍"
          title="Modo Simulación"
          description="Simula escenarios reales seleccionando ubicación y fecha. Visualiza datos completos de ángulos e incidencia solar."
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          delay={0.5}
          onClick={() => onSelectMode('simulation')}
        />
      </div>

      {/* Indicador de regreso (opcional) */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
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
