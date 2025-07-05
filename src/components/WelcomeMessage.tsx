
import React, { useState, useEffect } from 'react';
import { Sparkles, Book, Calculator, Globe, Lightbulb } from 'lucide-react';

interface WelcomeMessageProps {
  username: string;
  onAnimationComplete?: () => void;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ 
  username, 
  onAnimationComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      text: `Welcome back, ${username}! 👋`,
      icon: Sparkles,
      delay: 0
    },
    {
      text: "I'm here to help you learn and solve your doubts!",
      icon: Book,
      delay: 1000
    },
    {
      text: "Whether it's Math, Science, or any subject...",
      icon: Calculator,
      delay: 2000
    },
    {
      text: "Just ask me anything!",
      icon: Lightbulb,
      delay: 3000
    }
  ];

  useEffect(() => {
    const timers = steps.map((step, index) => 
      setTimeout(() => {
        setCurrentStep(index + 1);
        if (index === steps.length - 1) {
          setTimeout(() => onAnimationComplete?.(), 1000);
        }
      }, step.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [username, onAnimationComplete]);

  return (
    <div className="space-y-6">
      {steps.slice(0, currentStep).map((step, index) => {
        const IconComponent = step.icon;
        return (
          <div
            key={index}
            className="flex items-center justify-center space-x-4 animate-fadeIn"
          >
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full shadow-lg">
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <p className="text-xl font-medium text-gray-800 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/30 shadow-lg">
              {step.text}
            </p>
          </div>
        );
      })}
    </div>
  );
};
