import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface SurveyProps {
  onComplete: () => void;
}

interface Question {
  id: string;
  question: string;
  options: { value: string; label: string }[];
}

const questions: Question[] = [
  {
    id: 'learning_approach',
    question: 'How do you usually approach a new JEE-level concept?',
    options: [
      { value: 'analogies', label: 'I like starting with a real-life analogy before diving into formulas' },
      { value: 'examples', label: 'I jump straight into solved examples and learn by doing' },
      { value: 'videos', label: 'I prefer watching video lectures first, then try problems' },
      { value: 'theory', label: 'I read theory carefully from standard books before attempting anything' },
      { value: 'step_by_step', label: 'I get stuck easily and often need someone to explain step-by-step' },
    ],
  },
  {
    id: 'challenging_subject',
    question: 'Which subject feels most challenging to you right now?',
    options: [
      { value: 'physics', label: 'Physics – especially Mechanics and Electromagnetism' },
      { value: 'chemistry', label: 'Chemistry – Organic reactions are confusing' },
      { value: 'math', label: 'Math – Calculus and Algebra feel overwhelming' },
      { value: 'all_equally', label: 'All three equally' },
      { value: 'none', label: 'None – I\'m confident in all subjects' },
    ],
  },
  {
    id: 'math_hurdle',
    question: 'When solving a math problem, what\'s your biggest hurdle?',
    options: [
      { value: 'formula_selection', label: 'Understanding which formula to use' },
      { value: 'calculation_errors', label: 'Knowing the method but making calculation errors' },
      { value: 'starting_point', label: 'Not knowing where to start at all' },
      { value: 'time_pressure', label: 'Time pressure during exams' },
      { value: 'clean_solutions', label: 'Writing a clean, well-structured solution' },
    ],
  },
  {
    id: 'mistake_reaction',
    question: 'How do you react when you make repeated mistakes in the same type of question?',
    options: [
      { value: 'challenge', label: 'I take it as a challenge and keep trying' },
      { value: 'lookup_solutions', label: 'I look up solutions and try again' },
      { value: 'frustrated', label: 'I feel frustrated and give up temporarily' },
      { value: 'avoid', label: 'I avoid those types of questions altogether' },
      { value: 'ask_help', label: 'I ask someone else to explain again' },
    ],
  },
  {
    id: 'feedback_preference',
    question: 'What kind of feedback helps you the most while studying?',
    options: [
      { value: 'step_correction', label: 'Step-by-step correction showing exactly where I went wrong' },
      { value: 'simplified_method', label: 'A simplified version of the correct method' },
      { value: 'hints', label: 'A hint to guide me toward the answer myself' },
      { value: 'comparison', label: 'A comparison between my attempt and the correct one' },
      { value: 'encouragement', label: 'Encouragement and positive reinforcement even if I\'m wrong' },
    ],
  },
  {
    id: 'study_time',
    question: 'What time of day do you study best?',
    options: [
      { value: 'early_morning', label: 'Early morning (5 AM – 9 AM)' },
      { value: 'late_morning', label: 'Late morning to early afternoon (9 AM – 1 PM)' },
      { value: 'afternoon', label: 'Afternoon (1 PM – 5 PM)' },
      { value: 'evening', label: 'Evening to night (5 PM – 11 PM)' },
      { value: 'flexible', label: 'I don\'t have a fixed time; I study whenever I can' },
    ],
  },
  {
    id: 'lesson_preference',
    question: 'Do you prefer short, quick lessons or deep-dive sessions?',
    options: [
      { value: 'short_bursts', label: 'Short bursts: 10–15 minute focused topics' },
      { value: 'medium_length', label: 'Medium-length: ~30 minutes with examples' },
      { value: 'deep_dives', label: 'Deep dives: 45+ minutes per topic with multiple examples' },
      { value: 'depends', label: 'It depends on the subject or difficulty' },
      { value: 'figure_out', label: 'I don\'t know yet — let\'s figure it out together' },
    ],
  },
  {
    id: 'revision_method',
    question: 'How do you usually revise before a mock test or exam?',
    options: [
      { value: 'previous_papers', label: 'I solve previous year papers only' },
      { value: 'notes_formulas', label: 'I go through notes and formulas quickly' },
      { value: 'mistakes_weak', label: 'I re-solve my old mistakes and weak areas' },
      { value: 'crash_courses', label: 'I attend last-minute crash courses or videos' },
      { value: 'panic_everything', label: 'I panic and try to cover everything at once' },
    ],
  },
  {
    id: 'gamification_preference',
    question: 'Would you rather earn badges and points for progress or just focus on performance?',
    options: [
      { value: 'badges_levels', label: 'I love earning badges, streaks, and unlocking levels' },
      { value: 'points_leaderboards', label: 'Points and leaderboards motivate me' },
      { value: 'silent_tracking', label: 'I prefer tracking my own progress silently' },
      { value: 'both', label: 'I want both — some fun and some serious tracking' },
      { value: 'no_games', label: 'I don\'t care about games — just teach me effectively' },
    ],
  },
  {
    id: 'understanding_check',
    question: 'How would you like fynq to check if you understood something clearly?',
    options: [
      { value: 'explain_back', label: 'Ask me to explain back in my own words' },
      { value: 'quick_quiz', label: 'Give me a quick quiz with 1–3 questions' },
      { value: 'similar_example', label: 'Show me a similar example and ask me to solve it' },
      { value: 'simple_ask', label: 'Just ask "Did that make sense?"' },
      { value: 'let_choose', label: 'Let me choose how to confirm understanding' },
    ],
  },
];

export const Survey: React.FC<SurveyProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const generateSummary = (responses: Record<string, string>) => {
    // Generate a summary based on responses
    const learningStyle = responses.learning_approach === 'analogies' ? 'conceptual learner' :
                         responses.learning_approach === 'examples' ? 'hands-on learner' :
                         responses.learning_approach === 'videos' ? 'visual learner' :
                         responses.learning_approach === 'theory' ? 'theoretical learner' : 'support-dependent learner';
    
    const challengeArea = responses.challenging_subject === 'physics' ? 'Physics (Mechanics & Electromagnetism)' :
                         responses.challenging_subject === 'chemistry' ? 'Chemistry (Organic reactions)' :
                         responses.challenging_subject === 'math' ? 'Mathematics (Calculus & Algebra)' :
                         responses.challenging_subject === 'all_equally' ? 'All subjects equally' : 'Confident in all subjects';
    
    const studyPattern = responses.study_time === 'early_morning' ? 'early bird' :
                        responses.study_time === 'late_morning' ? 'morning person' :
                        responses.study_time === 'afternoon' ? 'afternoon learner' :
                        responses.study_time === 'evening' ? 'night owl' : 'flexible scheduler';

    return `${learningStyle} who finds ${challengeArea} most challenging. Prefers ${studyPattern} study sessions and benefits from ${responses.feedback_preference} feedback style.`;
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const summary = generateSummary(answers);
      
      const { error } = await supabase
        .from('survey_responses')
        .insert([{
          user_id: user.id,
          learning_approach: answers.learning_approach,
          challenging_subject: answers.challenging_subject,
          math_hurdle: answers.math_hurdle,
          mistake_reaction: answers.mistake_reaction,
          feedback_preference: answers.feedback_preference,
          study_time: answers.study_time,
          lesson_preference: answers.lesson_preference,
          revision_method: answers.revision_method,
          gamification_preference: answers.gamification_preference,
          understanding_check: answers.understanding_check,
          summary,
        }]);

      if (error) throw error;

      toast({
        title: "Profile completed! 🎉",
        description: "We've saved your learning preferences to personalize your experience.",
      });

      onComplete();
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];
  const currentAnswer = answers[currentQ.id];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
        <CardHeader className="space-y-4">
          <div className="text-center">
            <CardTitle className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Let's understand you better
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Help us personalize your learning experience
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 text-center">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">
            {currentQ.question}
          </h3>

          <RadioGroup 
            value={currentAnswer || ''} 
            onValueChange={handleAnswer}
            className="space-y-3"
          >
            {currentQ.options.map((option, index) => (
              <div key={option.value} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                <Label 
                  htmlFor={option.value} 
                  className="text-sm leading-relaxed cursor-pointer flex-1"
                >
                  <span className="font-medium text-purple-600">
                    {String.fromCharCode(65 + index)})
                  </span>{' '}
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <Button
              onClick={handleNext}
              disabled={!currentAnswer || isSubmitting}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white flex items-center space-x-2"
            >
              <span>
                {currentQuestion === questions.length - 1 ? 'Complete' : 'Next'}
              </span>
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};