
import React from 'react';
import { Sparkles, Menu, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-6">
      <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl px-6 py-4 shadow-2xl">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-2xl shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                fynqAI
              </h1>
              <p className="text-xs text-gray-500 -mt-1">Your AI Learning Companion</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              variant="ghost"
              className="bg-white/30 hover:bg-white/50 text-gray-700 rounded-2xl px-4 py-2 transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-white/20"
            >
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className="bg-white/30 hover:bg-white/50 text-gray-700 rounded-2xl px-4 py-2 transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-white/20"
            >
              My Learning
            </Button>
            <Button
              variant="ghost"
              className="bg-white/30 hover:bg-white/50 text-gray-700 rounded-2xl px-4 py-2 transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-white/20"
            >
              Progress
            </Button>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              className="bg-white/30 hover:bg-white/50 text-gray-700 rounded-2xl p-2 transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-white/20"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl p-2 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <User className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              className="md:hidden bg-white/30 hover:bg-white/50 text-gray-700 rounded-2xl p-2 transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-white/20"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
