import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import WelcomeModal from './components/WelcomeModal';
import FreeMode from './components/FreeMode';
import SimulationMode from './components/SimulationMode';
import './App.css';

type AppMode = 'welcome' | 'free' | 'simulation';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('welcome');

  const handleSelectMode = (selectedMode: 'free' | 'simulation') => {
    setMode(selectedMode);
  };

  const handleBackToMenu = () => {
    setMode('welcome');
  };

  return (
    <AnimatePresence mode="wait">
      {mode === 'welcome' && <WelcomeModal key="welcome" onSelectMode={handleSelectMode} />}
      {mode === 'free' && <FreeMode key="free" onBackToMenu={handleBackToMenu} />}
      {mode === 'simulation' && <SimulationMode key="simulation" onBackToMenu={handleBackToMenu} />}
    </AnimatePresence>
  );
};

export default App;
