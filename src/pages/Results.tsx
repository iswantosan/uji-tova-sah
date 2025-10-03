import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, ArrowLeft, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Results = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        // Get session info
        const sessionData = localStorage.getItem('tova_session');
        if (!sessionData) {
          console.error('No session data found');
          toast({
            title: "Error",
            description: "Session tidak ditemukan. Silakan login kembali.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        const session = JSON.parse(sessionData);
        console.log('Fetching results for session:', session);
        
        // Fetch test results based on email from session
        const { data, error } = await supabase
          .from('test_results')
          .select('*')
          .eq('email', session.email)
          .order('test_date', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching results:', error);
          if (error.code === 'PGRST116') {
            toast({
              title: "Tidak Ada Data",
              description: "Belum ada hasil tes untuk email ini.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Error",
              description: `Gagal mengambil hasil tes: ${error.message}`,
              variant: "destructive"
            });
          }
          setLoading(false);
          return;
        }

        if (!data) {
          console.log('No test results found');
          toast({
            title: "Tidak Ada Data",
            description: "Belum ada hasil tes untuk email ini.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        console.log('Test results fetched successfully:', data);

        setTestResults({
          participantInfo: {
            name: session.name,
            email: session.email,
            testDate: new Date(data.test_date).toLocaleDateString('id-ID'),
            duration: data.duration
          },
          performance: {
            omissionErrors: data.omission_errors,
            commissionErrors: data.commission_errors,
            responseTime: Math.round(data.response_time),
            responseTimeVariability: Math.round(data.variability),
            attentiveness: Math.max(0, Math.min(100, 100 - (data.omission_errors * 2))),
            impulsivity: Math.max(0, Math.min(100, 100 - (data.commission_errors * 3))),
            consistency: Math.max(0, Math.min(100, 100 - (data.variability / 10)))
          }
        });

        // Send email automatically
        try {
          console.log('Attempting to send automatic email for:', session.email);
          
          const emailData = {
            email: session.email,
            name: session.name,
            testDate: new Date(data.test_date).toLocaleDateString('id-ID'),
            duration: data.duration,
            attentiveness: Math.max(0, Math.min(100, 100 - (data.omission_errors * 2))),
            impulsivity: Math.max(0, Math.min(100, 100 - (data.commission_errors * 3))),
            consistency: Math.max(0, Math.min(100, 100 - (data.variability / 10))),
            omissionErrors: data.omission_errors,
            commissionErrors: data.commission_errors,
            responseTime: Math.round(data.response_time),
            variability: Math.round(data.variability)
          };

          console.log('Email data prepared for automatic send:', emailData);

          const response = await supabase.functions.invoke('send-test-results', {
            body: emailData
          });

          console.log('Automatic email response:', response);

          if (response.error) {
            throw response.error;
          }

          toast({
            title: "Email Terkirim",
            description: "Hasil tes telah dikirim ke email Anda",
          });
        } catch (emailError) {
          console.error('Error sending automatic email:', emailError);
          toast({
            title: "Peringatan",
            description: "Email gagal dikirim otomatis, silakan klik tombol Email Hasil",
            variant: "default"
          });
          // Don't block the results page if email fails
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat mengambil data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg">Memuat hasil tes...</p>
        </div>
      </div>
    );
  }

  if (!testResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Hasil Tes Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-4">Belum ada hasil tes untuk akun ini.</p>
          <Button asChild>
            <Link to="/">Kembali ke Beranda</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-4 w-4 text-success" />;
    if (score >= 60) return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary">Hasil Tes TOVA</h1>
            </div>
            <Button variant="outline" asChild>
              <Link to="/" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Beranda</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Results Content */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Participant Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Peserta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-semibold">{testResults.participantInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{testResults.participantInfo.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Tes</p>
                  <p className="font-semibold">{testResults.participantInfo.testDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Durasi Tes</p>
                  <p className="font-semibold">{testResults.participantInfo.duration}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Metrik Kinerja</CardTitle>
              <CardDescription>
                Hasil pengukuran perhatian dan konsentrasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Perhatian</span>
                    <div className="flex items-center space-x-2">
                      {getPerformanceIcon(testResults.performance.attentiveness)}
                      <span className={`font-bold ${getPerformanceColor(testResults.performance.attentiveness)}`}>
                        {testResults.performance.attentiveness}%
                      </span>
                    </div>
                  </div>
                  <Progress value={testResults.performance.attentiveness} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Kontrol Impuls</span>
                    <div className="flex items-center space-x-2">
                      {getPerformanceIcon(testResults.performance.impulsivity)}
                      <span className={`font-bold ${getPerformanceColor(testResults.performance.impulsivity)}`}>
                        {testResults.performance.impulsivity}%
                      </span>
                    </div>
                  </div>
                  <Progress value={testResults.performance.impulsivity} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Konsistensi</span>
                    <div className="flex items-center space-x-2">
                      {getPerformanceIcon(testResults.performance.consistency)}
                      <span className={`font-bold ${getPerformanceColor(testResults.performance.consistency)}`}>
                        {testResults.performance.consistency}%
                      </span>
                    </div>
                  </div>
                  <Progress value={testResults.performance.consistency} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Teknis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Omission Errors:</span>
                  <span className="font-semibold">{testResults.performance.omissionErrors}</span>
                </div>
                <div className="flex justify-between">
                  <span>Commission Errors:</span>
                  <span className="font-semibold">{testResults.performance.commissionErrors}</span>
                </div>
                <div className="flex justify-between">
                  <span>Response Time:</span>
                  <span className="font-semibold">{testResults.performance.responseTime} ms</span>
                </div>
                <div className="flex justify-between">
                  <span>RT Variability:</span>
                  <span className="font-semibold">{testResults.performance.responseTimeVariability} ms</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interpretasi Hasil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Keseluruhan:</span>
                    <span className="font-semibold text-success">Normal</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Perhatian:</span>
                    <span className={`font-semibold ${getPerformanceColor(testResults.performance.attentiveness)}`}>
                      {testResults.performance.attentiveness >= 80 ? 'Baik' : 
                       testResults.performance.attentiveness >= 60 ? 'Sedang' : 'Perlu Perbaikan'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kontrol Impuls:</span>
                    <span className={`font-semibold ${getPerformanceColor(testResults.performance.impulsivity)}`}>
                      {testResults.performance.impulsivity >= 80 ? 'Baik' : 
                       testResults.performance.impulsivity >= 60 ? 'Sedang' : 'Perlu Perbaikan'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Konsistensi:</span>
                    <span className={`font-semibold ${getPerformanceColor(testResults.performance.consistency)}`}>
                      {testResults.performance.consistency >= 80 ? 'Baik' : 
                       testResults.performance.consistency >= 60 ? 'Sedang' : 'Perlu Perbaikan'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Rekomendasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-center text-muted-foreground">
                <p>Konsultasikan hasil dengan profesional kesehatan mental untuk interpretasi yang lebih mendalam.</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            <Button variant="outline" size="lg" asChild>
              <Link to="/">Kembali ke Beranda</Link>
            </Button>
            <Button 
              size="lg" 
              onClick={() => {
                const emailSubject = encodeURIComponent('Hasil Tes TOVA - ' + testResults.participantInfo.name);
                const emailBody = encodeURIComponent(`
Hasil Tes TOVA

Nama: ${testResults.participantInfo.name}
Email: ${testResults.participantInfo.email}
Tanggal Tes: ${testResults.participantInfo.testDate}
Durasi Tes: ${testResults.participantInfo.duration}

METRIK KINERJA:
- Perhatian: ${testResults.performance.attentiveness}%
- Kontrol Impuls: ${testResults.performance.impulsivity}%
- Konsistensi: ${testResults.performance.consistency}%

DATA TEKNIS:
- Omission Errors: ${testResults.performance.omissionErrors}
- Commission Errors: ${testResults.performance.commissionErrors}
- Response Time: ${testResults.performance.responseTime} ms
- RT Variability: ${testResults.performance.responseTimeVariability} ms

Konsultasikan hasil dengan profesional kesehatan mental untuk interpretasi yang lebih mendalam.
                `);
                window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`);
              }}
            >
              Email Hasil
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Results;