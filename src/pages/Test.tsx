import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Clock, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Test = () => {
  const [testPhase, setTestPhase] = useState<'instructions' | 'practice' | 'test' | 'completed'>('instructions');
  const [timeLeft, setTimeLeft] = useState(21 * 60); // 21 minutes in seconds
  const [currentTrial, setCurrentTrial] = useState(0);
  const [totalTrials] = useState(320);
  const [showStimulus, setShowStimulus] = useState(false);
  const [isTarget, setIsTarget] = useState(false);
  const [responses, setResponses] = useState<number[]>([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const { toast } = useToast();

  // Timer for test duration
  useEffect(() => {
    if (testPhase === 'test' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setTestPhase('completed');
    }
  }, [testPhase, timeLeft]);

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
        setIsTarget(isTargetTrial);
        setShowStimulus(true);
        setCurrentTrial(prev => prev + 1);
        
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

  const handleSpacePress = () => {
    if (testPhase === 'test') {
      const responseTime = Date.now();
      setResponses(prev => [...prev, responseTime]);
    }
  };

  // Keyboard event listener
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        handleSpacePress();
      }
    };

    if (testPhase === 'test') {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [testPhase]);

  const startTest = () => {
    setTestPhase('test');
    toast({
      title: "Tes Dimulai",
      description: "Tekan SPASI setiap kali melihat target. Fokus dan konsentrasi!",
    });
  };

  const finishTest = () => {
    setTestPhase('completed');
    toast({
      title: "Tes Selesai!",
      description: "Terima kasih telah menyelesaikan tes TOVA.",
    });
    // Navigate to results
    setTimeout(() => {
      window.location.href = "/results";
    }, 2000);
  };

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
              <Button variant="outline" asChild>
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
            Hentikan Tes Darurat
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