
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Sparkles, BookOpen, Target, Clock, MessageSquare, Zap, RefreshCw, Users } from 'lucide-react';

interface SurveyProps {
  onComplete: () => void;
}

export const Survey: React.FC<SurveyProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = [
    {
      id: 'learning_approach',
      title: 'How do you prefer to learn?',
      icon: BookOpen,
      options: [
        { value: 'visual', label: 'Visual (diagrams, charts, images)' },
        { value: 'auditory', label: 'Auditory (listening, discussions)' },
        { value: 'hands_on', label: 'Hands-on (practice, experiments)' },
        { value: 'reading', label: 'Reading and writing' }
      ]
    },
    {
      id: 'challenging_subject',
      title: 'Which subject do you find most challenging?',
      icon: Target,
      options: [
        { value: 'mathematics', label: 'Mathematics' },
        { value: 'science', label: 'Science (Physics, Chemistry, Biology)' },
        { value: 'languages', label: 'Languages' },
        { value: 'social_studies', label: 'Social Studies' },
        { value: 'other', label: 'Other subjects' }
      ]
    },
    {
      id: 'study_time',
      title: 'How much time do you usually spend studying per day?',
      icon: Clock,
      options: [
        { value: 'less_than_1', label: 'Less than 1 hour' },
        { value: '1_to_2', label: '1-2 hours' },
        { value: '2_to_4', label: '2-4 hours' },
        { value: 'more_than_4', label: 'More than 4 hours' }
      ]
    },
    {
      id: 'feedback_preference',
      title: 'How do you prefer to receive feedback?',
      icon: MessageSquare,
      options: [
        { value: 'immediate', label: 'Immediate corrections' },
        { value: 'detailed', label: 'Detailed explanations' },
        { value: 'encouraging', label: 'Encouraging and supportive' },
        { value: 'step_by_step', label: 'Step-by-step guidance' }
      ]
    }
  ];

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('survey_responses')
        .insert([{
          user_id: user.id,
          learning_approach: answers.learning_approach,
          challenging_subject: answers.challenging_subject,
          study_time: answers.study_time,
          feedback_preference: answers.feedback_preference,
          // Default values for other required fields
          math_hurdle: 'not_specified',
          mistake_reaction: 'not_specified',
          lesson_preference: 'not_specified',
          revision_method: 'not_specified',
          gamification_preference: 'not_specified',
          understanding_check: 'not_specified'
        }]);

      if (error) throw error;

      toast({
        title: "Welcome aboard! 🎉",
        description: "Your preferences have been saved. Let's start learning!",
      });

      onComplete();
    } catch (error) {
      console.error('Error saving survey:', error);
      toast({
        title: "Error",
        description: "Failed to save your preferences. You can still continue using the app.",
        variant: "destructive",
      });
      onComplete(); // Allow user to continue even if survey fails
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[currentQuestion];
  const IconComponent = currentQ.icon;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/80 backdrop-blur-xl border-white/30 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
            Let's personalize your learning experience!
          </CardTitle>
          <p className="text-gray-600">
            Question {currentQuestion + 1} of {questions.length}
          </p>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">
              {currentQ.title}
            </h3>
          </div>

          <RadioGroup
            value={answers[currentQ.id] || ''}
            onValueChange={handleAnswer}
            className="space-y-4"
          >
            {currentQ.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label 
                  htmlFor={option.value}
                  className="flex-1 cursor-pointer text-gray-700 font-medium"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="border-white/30 hover:bg-white/30"
            >
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!answers[currentQ.id] || isSubmitting}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8"
            >
              {isSubmitting ? (
                'Saving...'
              ) : currentQuestion === questions.length - 1 ? (
                'Complete Setup'
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
