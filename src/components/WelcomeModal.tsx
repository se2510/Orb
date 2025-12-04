import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import WelcomeScreen from './welcome/WelcomeScreen';
import ModeSelectionScreen from './welcome/ModeSelectionScreen';
import OrbitBackground from './welcome/OrbitBackground';
import { orbitalAnimations } from './welcome/animations';
import type { WelcomeModalProps, WelcomeStep } from './welcome/types';

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onSelectMode }) => {
  const [currentStep, setCurrentStep] = useState<WelcomeStep>('welcome');

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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    overflow: 'hidden'
  };

  return (
    <>
      <style>{orbitalAnimations}</style>
      <div style={overlayStyle}>
        {/* Animated Background */}
        <OrbitBackground zoomLevel={currentStep === 'mode-selection' ? 'close' : 'far'} />

        {/* Screen Transitions */}
        <AnimatePresence mode="wait">
          {currentStep === 'welcome' ? (
            <WelcomeScreen key="welcome" onStart={handleStart} />
          ) : (
            <ModeSelectionScreen key="mode-selection" onSelectMode={handleModeSelect} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default WelcomeModal;
