import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Clock, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Test = () => {
  const [testPhase, setTestPhase] = useState<'verification' | 'instructions' | 'practice' | 'test' | 'completed'>('verification');
  const [paymentCode, setPaymentCode] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [timeLeft, setTimeLeft] = useState(21.6 * 60); // 21.6 minutes in seconds (TOVA standard)
  const [currentTrial, setCurrentTrial] = useState(0);
  const [totalTrials] = useState(648); // TOVA standard: 21.6 min ÷ 2 sec ISI = 648 trials
  const [showStimulus, setShowStimulus] = useState(false);
  const [isTarget, setIsTarget] = useState(false);
  const [responses, setResponses] = useState<{time: number, isCorrect: boolean, responseTime: number, isTarget: boolean}[]>([]);
  const [stimuliShown, setStimuliShown] = useState<{isTarget: boolean, time: number}[]>([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const [stimulusStartTime, setStimulusStartTime] = useState<number>(0);
  const { toast } = useToast();
  
  // Use refs to always get latest state values in timer callback
  const stimuliShownRef = useRef(stimuliShown);
  const responsesRef = useRef(responses);
  const timeLeftRef = useRef(timeLeft);
  const isFinishingRef = useRef(false);
  
  // Keep refs in sync with state
  useEffect(() => {
    stimuliShownRef.current = stimuliShown;
    console.log('🔄 Ref updated - stimuliShown:', stimuliShown.length, 'ref:', stimuliShownRef.current.length);
  }, [stimuliShown]);
  
  useEffect(() => {
    responsesRef.current = responses;
    console.log('🔄 Ref updated - responses:', responses.length, 'ref:', responsesRef.current.length);
  }, [responses]);
  
  useEffect(() => {
    timeLeftRef.current = timeLeft;
    console.log('🔄 Ref updated - timeLeft:', timeLeft, 'ref:', timeLeftRef.current);
  }, [timeLeft]);

  const finishTest = useCallback(async () => {
    // Prevent double execution
    if (isFinishingRef.current) {
      console.log('⚠️ finishTest already running, skipping...');
      return;
    }
    isFinishingRef.current = true;
    
    console.log('🏁 finishTest called - START');
    console.log('🔍 Current state values - stimuliShown:', stimuliShown.length, 'responses:', responses.length, 'timeLeft:', timeLeft);
    
    // Get latest values from refs (not stale closure)
    const latestStimuliShown = stimuliShownRef.current;
    const latestResponses = responsesRef.current;
    const latestTimeLeft = timeLeftRef.current;
    
    console.log('📊 Ref values - stimuliShown:', latestStimuliShown.length);
    console.log('📝 Ref values - responses:', latestResponses.length);
    console.log('⏱️ Ref values - timeLeft:', latestTimeLeft);
    
    // ALWAYS read from localStorage as primary source of truth
    const sessionData = localStorage.getItem('tova_session');
    console.log('💾 localStorage session:', sessionData);
    
    if (!sessionData) {
      console.error('❌ No session in localStorage!');
      toast({
        title: "Error",
        description: "Session lost. Please restart from verification.",
        variant: "destructive"
      });
      isFinishingRef.current = false;
      return;
    }
    
    const session = JSON.parse(sessionData);
    const finalEmail = session.email;
    const finalPaymentCode = session.payment_code;
    
    console.log('✅ Using session from localStorage - email:', finalEmail, 'payment_code:', finalPaymentCode);
    
    if (!finalEmail || !finalPaymentCode) {
      console.error('❌ Missing email or payment_code in session!', session);
      toast({
        title: "Error",
        description: "Session data incomplete. Please restart.",
        variant: "destructive"
      });
      isFinishingRef.current = false;
      return;
    }
    
    setTestPhase('completed');
    
    // Calculate test metrics correctly using latest values
    const targetsShown = latestStimuliShown.filter(s => s.isTarget).length;
    const nonTargetsShown = latestStimuliShown.filter(s => !s.isTarget).length;
    
    const correctTargetResponses = latestResponses.filter(r => r.isTarget && r.isCorrect).length;
    const commissionErrors = latestResponses.filter(r => !r.isTarget).length; // Responses to non-targets
    const omissionErrors = Math.max(0, targetsShown - correctTargetResponses); // Missed targets, never negative
    
    // Calculate response time metrics - be more lenient with filtering
    const allTargetResponses = latestResponses.filter(r => r.isTarget);
    const validTargetResponses = latestResponses.filter(r => r.isTarget && r.responseTime > 0 && r.responseTime < 3000);
    
    console.log('Debug RT calculation:', {
      allTargetResponses: allTargetResponses.length,
      validTargetResponses: validTargetResponses.length,
      responses: responses.length,
      sampleResponse: responses[0],
      validResponseTimes: validTargetResponses.map(r => r.responseTime)
    });
    
    const avgResponseTime = validTargetResponses.length > 0 ? 
      Math.round(validTargetResponses.reduce((sum, r) => sum + r.responseTime, 0) / validTargetResponses.length) : 0;
    
    const rtVariability = validTargetResponses.length > 1 ? 
      Math.round(Math.sqrt(validTargetResponses.reduce((sum, r) => sum + Math.pow(r.responseTime - avgResponseTime, 2), 0) / (validTargetResponses.length - 1))) : 0;

    try {
      console.log('Attempting to save test results:', {
        email: finalEmail,
        payment_code: finalPaymentCode,
        omissionErrors,
        commissionErrors,
        avgResponseTime,
        rtVariability
      });

      // Save test results to database via edge function to bypass RLS
      console.log('Calling save-test-results edge function...');
      const { data, error } = await supabase.functions.invoke('save-test-results', {
        body: {
          email: finalEmail,
          payment_code: finalPaymentCode,
          participant_name: session.name || 'Peserta',
          duration: `${Math.floor((21.6 * 60 - latestTimeLeft) / 60)}:${((21.6 * 60 - latestTimeLeft) % 60).toString().padStart(2, '0')}`,
          omission_errors: omissionErrors,
          commission_errors: commissionErrors,
          response_time: avgResponseTime,
          variability: rtVariability
        }
      });

      console.log('Edge function response:', { data, error });

      // Check if there's an error in the response data
      const responseError = error || data?.error;
      
      if (responseError) {
        console.error('Error saving test results:', responseError);
        
        // Check if it's a duplicate payment_code error
        const errorData = data?.error ? data : responseError;
        const errorCode = errorData?.code || responseError?.code;
        const errorMessage = errorData?.error || errorData?.message || responseError?.message;
        
        if (errorCode === '23505' || errorMessage?.includes('unique_payment_code') || errorMessage?.includes('duplicate key')) {
          toast({
            title: "Payment Code Already Used",
            description: "This payment code has already been used. Please view previous test results or contact admin.",
            variant: "destructive"
          });
          // Navigate to results to try to show existing result
          setTimeout(() => {
            window.location.href = "/results";
          }, 2000);
          return;
        }
        
        toast({
          title: "Warning",
          description: "Test completed but there was an issue saving results. Contact admin.",
          variant: "destructive"
        });
      } else {
        console.log('Test results saved successfully:', data);
        
        toast({
          title: "Test Completed!",
          description: "Results have been saved. Redirecting to results page...",
        });
      }
    } catch (error) {
      console.error('Unexpected error saving test results:', error);
      toast({
        title: "Error",
        description: "Failed to save test results. Contact admin.",
        variant: "destructive"
      });
    }

    // Navigate to results
    setTimeout(() => {
      window.location.href = "/results";
    }, 2000);
  }, [toast]); // Remove stale dependencies - use refs instead

  // Timer for test duration
  useEffect(() => {
    if (testPhase === 'test' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (testPhase === 'test' && timeLeft === 0) {
      console.log('⏰ Time is up! userEmail:', userEmail, 'paymentCode:', paymentCode);
      finishTest();
    }
  }, [testPhase, timeLeft, userEmail, paymentCode, finishTest]);

  // Target presentation logic - TOVA Standard
  useEffect(() => {
    if (testPhase !== 'test') return;
    
    // Hide instructions after 5 seconds
    setTimeout(() => {
      setShowInstructions(false);
    }, 5000);

    const interval = setInterval(() => {
      setCurrentTrial(prev => {
        const nextTrial = prev + 1;
        
        // Check if all trials completed
        if (nextTrial > totalTrials) {
          console.log('✅ All trials completed! Calling finishTest...');
          clearInterval(interval);
          finishTest();
          return prev; // Don't increment further
        }

        // Determine if this trial is a target (22% probability)
        const isTargetTrial = Math.random() < 0.22;
        const startTime = Date.now();
        setIsTarget(isTargetTrial);
        setShowStimulus(true);
        setStimulusStartTime(startTime);
        
        // Track all stimuli shown
        setStimuliShown(prevStimuli => {
          const newArray = [...prevStimuli, { isTarget: isTargetTrial, time: startTime }];
          console.log('🔴 Stimulus shown - new count:', newArray.length, { isTargetTrial, startTime, stimulusType: isTargetTrial ? 'TARGET' : 'NON-TARGET' });
          return newArray;
        });
        
        // Hide stimulus after 100ms (TOVA standard)
        setTimeout(() => {
          setShowStimulus(false);
        }, 100);
        
        return nextTrial;
      });
    }, 2000); // 2-second inter-stimulus interval (TOVA standard)
    
    return () => clearInterval(interval);
  }, [testPhase, totalTrials, finishTest]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSpacePress = useCallback(() => {
    const currentTime = Date.now();
    console.log('🎯 handleSpacePress called:', { testPhase, showStimulus, stimulusStartTime, isTarget, currentTime });
    
    // Allow response within 2 seconds of stimulus (TOVA standard response window)
    const timeSinceStimulus = currentTime - stimulusStartTime;
    if (testPhase === 'test' && stimulusStartTime > 0 && timeSinceStimulus <= 2000) {
      const responseTime = timeSinceStimulus;
      const isCorrect = isTarget;
      console.log('✅ Recording valid response:', { responseTime, isCorrect, isTarget, timeSinceStimulus });
      setResponses(prev => {
        const newArray = [...prev, { time: currentTime, isCorrect, responseTime, isTarget }];
        console.log('✅ Response recorded - new count:', newArray.length);
        return newArray;
      });
    } else if (testPhase === 'test' && (stimulusStartTime === 0 || timeSinceStimulus > 2000)) {
      console.log('❌ Commission error - no recent stimulus');
      setResponses(prev => [...prev, { time: currentTime, isCorrect: false, responseTime: 0, isTarget: false }]);
    } else {
      console.log('🚫 Space press ignored:', { testPhase, showStimulus, stimulusStartTime, timeSinceStimulus });
    }
  }, [testPhase, showStimulus, stimulusStartTime, isTarget]);

  // Keyboard event listener
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      console.log('🎹 Key pressed:', event.code);
      if (event.code === 'Space') {
        event.preventDefault();
        console.log('🚀 Space detected, calling handleSpacePress');
        handleSpacePress();
      }
    };

    console.log('🔗 Adding keyboard listener, testPhase:', testPhase);
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      console.log('🗑️ Removing keyboard listener');
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleSpacePress, testPhase]);

  const verifyPaymentCode = async () => {
    if (!paymentCode) {
      toast({
        title: "Error",
        description: "Enter payment code",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if payment code exists and is approved
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_code', paymentCode)
        .eq('status', 'approved')
        .maybeSingle();

      if (error || !payment) {
        toast({
          title: "Invalid Code",
          description: "Payment code not found or not yet approved by admin.",
          variant: "destructive"
        });
        return;
      }

      // Store user email for test results
      setUserEmail(payment.email);

      // Store session IMMEDIATELY after verification (don't wait for test completion)
      localStorage.setItem('tova_session', JSON.stringify({
        email: payment.email,
        name: payment.email.split('@')[0],
        payment_code: paymentCode
      }));
      
      console.log('Session stored after verification:', { email: payment.email, payment_code: paymentCode });

      toast({
        title: "Verification Successful!",
        description: "Payment code is valid. You can start the test.",
      });
      
      setTestPhase('instructions');
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Error",
        description: "An error occurred during verification.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startTest = () => {
    setTestPhase('test');
    setTestStartTime(Date.now());
    toast({
      title: "Test Started",
      description: "Press SPACE every time you see the target. Focus and concentrate!",
    });
  };

  if (testPhase === 'verification') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto text-center">
            <Brain className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-6">Verify Payment Code</h1>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Enter Payment Code</CardTitle>
                <CardDescription className="text-gray-300">
                  Payment code approved by admin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="TOVA-XXXXXX"
                    value={paymentCode}
                    onChange={(e) => setPaymentCode(e.target.value.toUpperCase())}
                    className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-primary"
                  />
                </div>
                
                <Button 
                  onClick={verifyPaymentCode}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify & Start Test"}
                </Button>
                
                <Button variant="secondary" asChild className="w-full">
                  <Link to="/test-access">Back</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (testPhase === 'instructions') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Brain className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-6">TOVA Test - Instructions</h1>
            
            <Card className="bg-gray-800 border-gray-700 text-left">
              <CardHeader>
                <CardTitle className="text-white">How to Take the TOVA Test:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-300">
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Target:</h4>
                  <div className="bg-gray-700 p-4 rounded flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-white">
                      <div className="w-full h-3 bg-white"></div>
                    </div>
                  </div>
                  <p className="text-sm">Press SPACE when you see a box with a line at the TOP</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Non-Target:</h4>
                  <div className="bg-gray-700 p-4 rounded flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-white">
                      <div className="w-full h-3 bg-white mt-6"></div>
                    </div>
                  </div>
                  <p className="text-sm">DO NOT press SPACE for boxes with a line at the BOTTOM</p>
                </div>

                <div className="bg-blue-900 p-4 rounded">
                  <h4 className="font-semibold mb-2">Important Rules:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Test duration: 21.6 minutes (648 stimuli)</li>
                    <li>• Stimulus appears for 0.1 seconds, 2 second interval</li>
                    <li>• Response only by pressing SPACE for targets</li>
                    <li>• Stay focused on the screen throughout the test</li>
                    <li>• Respond as quickly as possible when you see a target</li>
                    <li>• This is a challenging concentration test</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 space-y-4">
              <Button onClick={startTest} size="lg" className="w-full">
                Start TOVA Test
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/test-access">Back</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (testPhase === 'test') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        {/* Test Header */}
        <div className="bg-gray-800 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Target className="h-5 w-5" />
              <span>{currentTrial} / {totalTrials}</span>
            </div>
          </div>
          <Progress value={(currentTrial / totalTrials) * 100} className="mt-2" />
        </div>

        {/* Test Area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            {showStimulus ? (
              <div className="w-24 h-24 border-8 border-white mx-auto mb-8 relative">
                {isTarget ? (
                  <div className="w-full h-6 bg-white absolute top-0"></div>
                ) : (
                  <div className="w-full h-6 bg-white absolute bottom-0"></div>
                )}
              </div>
            ) : (
              <div className="w-24 h-24 mx-auto mb-8"></div>
            )}
            
            {showInstructions && (
              <p className="text-gray-400 text-sm">
                Press SPACE for target (line at top)
              </p>
            )}
          </div>
        </div>

        {/* Emergency Stop */}
        <div className="p-4 text-center">
          <Button 
            onClick={finishTest} 
            variant="destructive" 
            size="sm"
          >
            Stop Test & View Results
          </Button>
        </div>
      </div>
    );
  }

  if (testPhase === 'completed') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-16 w-16 text-success mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Test Completed!</h1>
          <p className="text-lg text-gray-400 mb-8">
            Thank you for completing the TOVA test.<br />
            Test results are being processed...
          </p>
          <Button asChild>
            <Link to="/results">View Results</Link>
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default Test;