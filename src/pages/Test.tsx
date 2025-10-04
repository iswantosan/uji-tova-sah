import { useState, useEffect, useCallback } from "react";
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
  const [timeLeft, setTimeLeft] = useState(21 * 60); // 21 minutes in seconds
  const [currentTrial, setCurrentTrial] = useState(0);
  const [totalTrials] = useState(320);
  const [showStimulus, setShowStimulus] = useState(false);
  const [isTarget, setIsTarget] = useState(false);
  const [responses, setResponses] = useState<{time: number, isCorrect: boolean, responseTime: number, isTarget: boolean}[]>([]);
  const [stimuliShown, setStimuliShown] = useState<{isTarget: boolean, time: number}[]>([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [testStartTime, setTestStartTime] = useState<number>(0);
  const [stimulusStartTime, setStimulusStartTime] = useState<number>(0);
  const { toast } = useToast();

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
  }, [testPhase, timeLeft, userEmail, paymentCode]);

  // Target presentation logic - TOVA Standard
  useEffect(() => {
    if (testPhase === 'test') {
      // Hide instructions after 5 seconds
      setTimeout(() => {
        setShowInstructions(false);
      }, 5000);

      const interval = setInterval(() => {
        if (currentTrial >= totalTrials) {
          setTestPhase('completed');
          return;
        }

        // Determine if this trial is a target (22% probability)
        const isTargetTrial = Math.random() < 0.22;
        const startTime = Date.now();
        setIsTarget(isTargetTrial);
        setShowStimulus(true);
        setStimulusStartTime(startTime);
        setCurrentTrial(prev => prev + 1);
        
        // Track all stimuli shown
        setStimuliShown(prev => [...prev, { isTarget: isTargetTrial, time: startTime }]);
        
        console.log('🔴 Stimulus shown:', { isTargetTrial, startTime, stimulusType: isTargetTrial ? 'TARGET' : 'NON-TARGET' });
        
        // Hide stimulus after 100ms (TOVA standard)
        setTimeout(() => {
          setShowStimulus(false);
        }, 100);
        
      }, 2000); // 2-second inter-stimulus interval (TOVA standard)
      
      return () => clearInterval(interval);
    }
  }, [testPhase, currentTrial, totalTrials]);

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
      setResponses(prev => [...prev, { time: currentTime, isCorrect, responseTime, isTarget }]);
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
        description: "Masukkan kode pembayaran",
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
          title: "Kode Tidak Valid",
          description: "Kode pembayaran tidak ditemukan atau belum disetujui admin.",
          variant: "destructive"
        });
        return;
      }

      // Store user email for test results
      setUserEmail(payment.email);

      toast({
        title: "Verifikasi Berhasil!",
        description: "Kode pembayaran valid. Anda dapat memulai tes.",
      });
      
      setTestPhase('instructions');
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat verifikasi.",
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
      title: "Tes Dimulai",
      description: "Tekan SPASI setiap kali melihat target. Fokus dan konsentrasi!",
    });
  };

  const finishTest = useCallback(async () => {
    console.log('🏁 finishTest called - userEmail:', userEmail, 'paymentCode:', paymentCode);
    
    if (!userEmail || !paymentCode) {
      console.error('❌ Missing userEmail or paymentCode!', { userEmail, paymentCode });
      toast({
        title: "Error",
        description: "Data email atau kode pembayaran hilang. Silakan coba lagi.",
        variant: "destructive"
      });
      return;
    }
    
    setTestPhase('completed');
    
    // Calculate test metrics correctly
    const targetsShown = stimuliShown.filter(s => s.isTarget).length;
    const nonTargetsShown = stimuliShown.filter(s => !s.isTarget).length;
    
    const correctTargetResponses = responses.filter(r => r.isTarget && r.isCorrect).length;
    const commissionErrors = responses.filter(r => !r.isTarget).length; // Responses to non-targets
    const omissionErrors = Math.max(0, targetsShown - correctTargetResponses); // Missed targets, never negative
    
    // Calculate response time metrics - be more lenient with filtering
    const allTargetResponses = responses.filter(r => r.isTarget);
    const validTargetResponses = responses.filter(r => r.isTarget && r.responseTime > 0 && r.responseTime < 3000);
    
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
        email: userEmail,
        payment_code: paymentCode,
        omissionErrors,
        commissionErrors,
        avgResponseTime,
        rtVariability
      });

      // Save test results to database
      const { data, error } = await supabase
        .from('test_results')
        .insert({
          email: userEmail,
          payment_code: paymentCode,
          duration: `${Math.floor((21 * 60 - timeLeft) / 60)}:${((21 * 60 - timeLeft) % 60).toString().padStart(2, '0')}`,
          omission_errors: omissionErrors,
          commission_errors: commissionErrors,
          response_time: avgResponseTime,
          variability: rtVariability,
          status: 'completed'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving test results:', error);
        
        // Check if it's a duplicate payment_code error
        if (error.code === '23505' && error.message.includes('unique_payment_code')) {
          toast({
            title: "Test Sudah Pernah Dikerjakan",
            description: "Kode pembayaran ini sudah digunakan untuk test sebelumnya. Hubungi admin jika ada masalah.",
            variant: "destructive"
          });
          // Still navigate to results to show existing result
          setTimeout(() => {
            window.location.href = "/results";
          }, 2000);
          return;
        }
        
        toast({
          title: "Warning",
          description: "Tes selesai tapi ada masalah menyimpan hasil. Hubungi admin.",
          variant: "destructive"
        });
      } else {
        console.log('Test results saved successfully:', data);
        
        // Store session with payment_code for results access
        localStorage.setItem('tova_session', JSON.stringify({
          email: userEmail,
          name: userEmail.split('@')[0],
          payment_code: paymentCode
        }));
        
        console.log('Session stored:', { email: userEmail, payment_code: paymentCode });
        
        toast({
          title: "Tes Selesai!",
          description: "Hasil telah disimpan. Mengarahkan ke halaman hasil...",
        });
      }
    } catch (error) {
      console.error('Unexpected error saving test results:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan hasil tes. Hubungi admin.",
        variant: "destructive"
      });
    }

    // Navigate to results
    setTimeout(() => {
      window.location.href = "/results";
    }, 2000);
  }, [userEmail, paymentCode, stimuliShown, responses, timeLeft, toast]);

  if (testPhase === 'verification') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto text-center">
            <Brain className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-6">Verifikasi Kode Pembayaran</h1>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Masukkan Kode Pembayaran</CardTitle>
                <CardDescription className="text-gray-300">
                  Kode pembayaran yang sudah disetujui admin
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
                  {isLoading ? "Memverifikasi..." : "Verifikasi & Mulai Tes"}
                </Button>
                
                <Button variant="secondary" asChild className="w-full">
                  <Link to="/test-access">Kembali</Link>
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
            <h1 className="text-3xl font-bold mb-6">Tes TOVA - Instruksi</h1>
            
            <Card className="bg-gray-800 border-gray-700 text-left">
              <CardHeader>
                <CardTitle className="text-white">Cara Mengerjakan Tes TOVA:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-300">
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Target:</h4>
                  <div className="bg-gray-700 p-4 rounded flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-white">
                      <div className="w-full h-3 bg-white"></div>
                    </div>
                  </div>
                  <p className="text-sm">Tekan SPASI ketika melihat kotak dengan garis di ATAS</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Non-Target:</h4>
                  <div className="bg-gray-700 p-4 rounded flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-white">
                      <div className="w-full h-3 bg-white mt-6"></div>
                    </div>
                  </div>
                  <p className="text-sm">JANGAN tekan SPASI untuk kotak dengan garis di BAWAH</p>
                </div>

                <div className="bg-blue-900 p-4 rounded">
                  <h4 className="font-semibold mb-2">Aturan Penting:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Durasi tes: 21 menit (320 stimulus)</li>
                    <li>• Stimulus muncul 0.1 detik, interval 2 detik</li>
                    <li>• Respon hanya dengan menekan SPASI untuk target</li>
                    <li>• Tetap fokus pada layar sepanjang tes</li>
                    <li>• Respon secepatnya saat melihat target</li>
                    <li>• Ini adalah tes konsentrasi yang menantang</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 space-y-4">
              <Button onClick={startTest} size="lg" className="w-full">
                Mulai Tes TOVA
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/test-access">Kembali</Link>
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
                Tekan SPASI untuk target (garis di atas)
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
            Hentikan Tes & Lihat Hasil
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
          <h1 className="text-3xl font-bold mb-4">Tes Selesai!</h1>
          <p className="text-lg text-gray-400 mb-8">
            Terima kasih telah menyelesaikan tes TOVA.<br />
            Hasil tes sedang diproses...
          </p>
          <Button asChild>
            <Link to="/results">Lihat Hasil</Link>
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default Test;