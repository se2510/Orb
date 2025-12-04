export type WelcomeStep = 'welcome' | 'mode-selection';
export type AppMode = 'free' | 'simulation';

export interface WelcomeModalProps {
  onSelectMode: (mode: AppMode) => void;
}
