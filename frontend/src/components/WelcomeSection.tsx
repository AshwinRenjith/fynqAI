
import React from 'react';
import { Sparkles, Camera, Upload, MessageCircle, BookOpen, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeSectionProps {
  onStartChat: () => void;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ onStartChat }) => {
  const features = [
    {
      icon: Camera,
      title: "Photo Problem Solver",
      description: "Upload any problem image and get step-by-step solutions",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: BookOpen,
      title: "Personal Learning Assistant",
      description: "Upload your textbooks and notes for personalized tutoring",
      gradient: "from-blue-500 to-purple-500"
    },
    {
      icon: MessageCircle,
      title: "Interactive Chat",
      description: "Ask questions in natural language and get clear explanations",
      gradient: "from-green-500 to-blue-500"
    },
    {
      icon: Zap,
      title: "Instant Solutions",
      description: "Get accurate answers with the highest precision in seconds",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-4xl mx-auto px-4">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-3xl shadow-xl animate-pulse">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Welcome to fynqAI
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Your intelligent learning companion that makes complex problems simple. 
            Ask questions, upload images, share your study materials - and learn like never before! ✨
          </p>

          <Button
            onClick={onStartChat}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white rounded-3xl px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 mb-12"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Start Learning Now
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
            >
              <div className={`bg-gradient-to-r ${feature.gradient} p-3 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <div className="bg-white/30 backdrop-blur-xl border border-white/30 rounded-2xl px-6 py-3 shadow-lg">
            <span className="text-gray-700 text-sm">💡 Ask any question</span>
          </div>
          <div className="bg-white/30 backdrop-blur-xl border border-white/30 rounded-2xl px-6 py-3 shadow-lg">
            <span className="text-gray-700 text-sm">📸 Upload problem images</span>
          </div>
          <div className="bg-white/30 backdrop-blur-xl border border-white/30 rounded-2xl px-6 py-3 shadow-lg">
            <span className="text-gray-700 text-sm">📚 Share your materials</span>
          </div>
          <div className="bg-white/30 backdrop-blur-xl border border-white/30 rounded-2xl px-6 py-3 shadow-lg">
            <span className="text-gray-700 text-sm">🎯 Get step-by-step solutions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
