import React from 'react';
import { useTypewriter } from '@/hooks/useTypewriter';

interface WelcomeMessageProps {
  username: string;
  onAnimationComplete?: () => void;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ 
  username, 
  onAnimationComplete 
}) => {
  const welcomeText = `Welcome back, ${username}!`;
  const studyText = "What should we study today?";
  
  const { displayText: welcomeDisplay, isComplete: welcomeComplete } = useTypewriter(welcomeText, 80);
  const { displayText: studyDisplay, isComplete: studyComplete } = useTypewriter(
    welcomeComplete ? studyText : '', 
    60
  );

  React.useEffect(() => {
    if (studyComplete && onAnimationComplete) {
      onAnimationComplete();
    }
  }, [studyComplete, onAnimationComplete]);

  return (
    <div className="text-center space-y-4">
      <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 bg-clip-text text-transparent">
        {welcomeDisplay}
        {!welcomeComplete && <span className="animate-pulse">|</span>}
      </h1>
      {welcomeComplete && (
        <p className="text-xl lg:text-2xl text-gray-600">
          {studyDisplay}
          {!studyComplete && <span className="animate-pulse">|</span>}
        </p>
      )}
    </div>
  );
};