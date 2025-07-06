
import React from 'react';
import { Button } from '@/components/ui/button';
import { Crown, Check, ArrowLeft, FileText, Image, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';

const Premium = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/');
  };

  const handleSubscribe = (plan: string) => {
    // Handle subscription logic here
    console.log(`Subscribing to ${plan}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      
      <div className="pt-20 min-h-screen">
        <div className="container mx-auto px-4 py-12">
          {/* Back Button */}
          <Button
            onClick={handleGoBack}
            variant="ghost"
            className="mb-8 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </Button>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Upgrade to Premium
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Unlock unlimited learning potential with our premium subscription plans
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-4">₹0</div>
                <p className="text-gray-600">Perfect for getting started</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">10 Free Credits</span>
                </li>
                <li className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Up to 3 files/resources in file dumper</span>
                </li>
                <li className="flex items-center">
                  <Image className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">5 image doubts</span>
                </li>
              </ul>
              
              <Button 
                className="w-full bg-gray-300 text-gray-600 cursor-not-allowed rounded-xl py-3"
                disabled
              >
                Current Plan
              </Button>
            </div>

            {/* Plus Plan */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-300 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Plus Version</h3>
                <div className="text-4xl font-bold text-purple-600 mb-2">₹99</div>
                <div className="text-gray-600 mb-4">per month</div>
                <p className="text-gray-600">Everything you need for serious learning</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <MessageSquare className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Infinite text-based chat</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited doubt solving and learning</span>
                </li>
                <li className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Up to 10 files in file manager</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Delete and re-add resources anytime</span>
                </li>
                <li className="flex items-center">
                  <Crown className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Priority support</span>
                </li>
              </ul>
              
              <Button 
                onClick={() => handleSubscribe('plus')}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl py-3 transition-all duration-300 hover:scale-105"
              >
                Subscribe to Plus
              </Button>
            </div>

            {/* Ultra Plan */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Ultra Version</h3>
                <div className="text-4xl font-bold text-gray-400 mb-4">Coming Soon</div>
                <p className="text-gray-600">The ultimate learning experience</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Crown className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">All Plus features</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Advanced AI capabilities</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited file storage</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Video and audio processing</span>
                </li>
                <li className="flex items-center">
                  <Crown className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Premium features & more</span>
                </li>
              </ul>
              
              <Button 
                className="w-full bg-gray-300 text-gray-600 cursor-not-allowed rounded-xl py-3"
                disabled
              >
                Coming Soon
              </Button>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Why Choose Premium?</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                <MessageSquare className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Unlimited Learning</h3>
                <p className="text-gray-600">Chat without limits and get instant help with any topic</p>
              </div>
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                <FileText className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">File Management</h3>
                <p className="text-gray-600">Store and manage your learning resources efficiently</p>
              </div>
              <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Priority Support</h3>
                <p className="text-gray-600">Get faster responses and premium customer service</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Premium;
