import React from 'react';
import { motion } from 'framer-motion';
import OrbTitle from './OrbTitle';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = React.memo(({ onStart }) => {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(20px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ 
        opacity: 0, 
        scale: 0.9,
        filter: 'blur(10px)',
        transition: { duration: 0.4, ease: 'easeInOut' }
      }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: '100%',
        position: 'relative',
        zIndex: 1,
        padding: '20px 0'
      }}
    >
      {/* Logo y Título Principal */}
      <motion.div
        initial={{ y: -30, opacity: 0, scale: 0.9 }}
        animate={{ 
          y: 0, 
          opacity: 1, 
          scale: 1,
          transition: { 
            duration: 0.6, 
            ease: [0.34, 1.56, 0.64, 1],
            delay: 0.1
          }
        }}
        transition={{ delay: 0.2, duration: 0.8 }}
        style={{
          textAlign: 'center',
          marginBottom: 'clamp(20px, 4vh, 40px)'
        }}
      >
        <OrbTitle />
      </motion.div>

      {/* Brief del Proyecto */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ 
          y: 0, 
          opacity: 1,
          transition: {
            delay: 0.2,
            duration: 0.5,
            ease: 'easeOut'
          }
        }}
        style={{
          maxWidth: 'min(600px, 85vw)',
          marginBottom: 'clamp(30px, 5vh, 50px)',
          textAlign: 'center'
        }}
      >
        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 22px)',
          color: '#f3f4f6',
          lineHeight: '1.6',
          fontWeight: '500',
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
          margin: '0',
          letterSpacing: '0.3px'
        }}>
          Simulador interactivo de posicionamiento solar y paneles fotovoltaicos.
          Experimenta con diferentes configuraciones y optimiza la captación de energía solar.
        </p>
      </motion.div>

      {/* Botón de Inicio */}
      <motion.button
        initial={{ y: 30, opacity: 0, scale: 0.8 }}
        animate={{ 
          y: 0,
          scale: 1, 
          opacity: 1,
          transition: {
            delay: 0.3,
            duration: 0.5,
            ease: [0.34, 1.56, 0.64, 1]
          }
        }}
        whileHover={{ 
          scale: 1.08,
          y: -3,
          boxShadow: '0 20px 60px rgba(168, 85, 247, 0.6)',
          transition: { duration: 0.2, ease: 'easeOut' }
        }}
        whileTap={{ 
          scale: 0.95,
          transition: { duration: 0.1 }
        }}
        onClick={onStart}
        style={{
          padding: 'clamp(18px, 2.5vh, 25px) clamp(50px, 8vw, 80px)',
          fontSize: 'clamp(18px, 2.5vw, 24px)',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
          color: 'white',
          border: '2px solid rgba(233, 213, 255, 0.4)',
          borderRadius: '50px',
          cursor: 'pointer',
          boxShadow: '0 15px 40px rgba(124, 58, 237, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <span style={{ position: 'relative', zIndex: 1 }}>Iniciar</span>
      </motion.button>

      {/* Footer Izquierdo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ 
          opacity: 1, 
          x: 0,
          transition: {
            delay: 0.5,
            duration: 0.5,
            ease: 'easeOut'
          }
        }}
        style={{
          position: 'absolute',
          bottom: 'clamp(20px, 3vh, 40px)',
          left: 'clamp(20px, 3vw, 40px)',
          textAlign: 'left'
        }}
      >
        <p style={{
          fontSize: 'clamp(11px, 1.5vw, 14px)',
          color: '#d1d5db',
          margin: '0',
          fontWeight: '600',
          textShadow: '0 2px 6px rgba(0, 0, 0, 0.7)',
          letterSpacing: '0.5px'
        }}>
          Energías Renovables
        </p>
        <p style={{
          fontSize: 'clamp(11px, 1.5vw, 14px)',
          color: '#9ca3af',
          margin: '4px 0 0 0',
          fontWeight: '500',
          textShadow: '0 2px 6px rgba(0, 0, 0, 0.7)'
        }}>
          UNAM
        </p>
      </motion.div>

      {/* Footer Derecho */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ 
          opacity: 1, 
          x: 0,
          transition: {
            delay: 0.6,
            duration: 0.5,
            ease: 'easeOut'
          }
        }}
        style={{
          position: 'absolute',
          bottom: 'clamp(20px, 3vh, 40px)',
          right: 'clamp(20px, 3vw, 40px)',
          textAlign: 'right'
        }}
      >
        <p style={{
          fontSize: 'clamp(11px, 1.5vw, 14px)',
          color: '#d1d5db',
          margin: '0 0 4px 0',
          fontWeight: '600',
          textShadow: '0 2px 6px rgba(0, 0, 0, 0.7)',
          letterSpacing: '0.3px'
        }}>
          Domínguez Riera Erik Ivanov
        </p>
        <p style={{
          fontSize: 'clamp(11px, 1.5vw, 14px)',
          color: '#d1d5db',
          margin: '0 0 8px 0',
          fontWeight: '600',
          textShadow: '0 2px 6px rgba(0, 0, 0, 0.7)',
          letterSpacing: '0.3px'
        }}>
          González García David Elías
        </p>
        <p style={{
          fontSize: 'clamp(10px, 1.3vw, 12px)',
          color: '#9ca3af',
          margin: '0',
          fontWeight: '500',
          textShadow: '0 2px 6px rgba(0, 0, 0, 0.7)'
        }}>
          Dr. Gabriel León de los Santos
        </p>
      </motion.div>
    </motion.div>
  );
});

WelcomeScreen.displayName = 'WelcomeScreen';

export default WelcomeScreen;
