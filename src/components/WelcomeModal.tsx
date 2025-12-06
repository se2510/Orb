import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import WelcomeScreen from './welcome/WelcomeScreen';
import ModeSelectionScreen from './welcome/ModeSelectionScreen';
import OrbitBackground from './welcome/OrbitBackground';
import { orbitalAnimations } from './welcome/animations';
import type { WelcomeModalProps, WelcomeStep } from './welcome/types';

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onSelectMode }) => {
  const [currentStep, setCurrentStep] = useState<WelcomeStep>('welcome');

  const zoomLevel = useMemo(() => currentStep === 'mode-selection' ? 0.7 : 1, [currentStep]);

  const handleStart = useCallback(() => {
    setCurrentStep('mode-selection');
  }, []);

  const handleModeSelect = useCallback((mode: 'free' | 'simulation') => {
    onSelectMode(mode);
  }, [onSelectMode]);

  // Listen for ESC key to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentStep === 'mode-selection') {
        setCurrentStep('welcome');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    zIndex: 9999,
  };

  return (
    <>
      <style>{orbitalAnimations}</style>
      <div style={overlayStyle}>
        {/* Animated Background */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
          <OrbitBackground zoom={zoomLevel} />
        </div>

        {/* Screen Transitions */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          <AnimatePresence mode="wait">
            {currentStep === 'welcome' ? (
              <WelcomeScreen key="welcome" onStart={handleStart} />
            ) : (
              <ModeSelectionScreen 
                key="mode-selection" 
                onSelectMode={handleModeSelect} 
                onBack={() => setCurrentStep('welcome')}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default WelcomeModal;
