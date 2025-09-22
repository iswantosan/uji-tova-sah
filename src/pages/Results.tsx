import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, ArrowLeft, Download, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

const Results = () => {
  // Mock test results - in real app, this would come from Supabase
  const testResults = {
    participantInfo: {
      name: "John Doe",
      email: "john@email.com",
      testDate: "15 Januari 2024",
      duration: "21:00"
    },
    performance: {
      omissionErrors: 12,
      commissionErrors: 8,
      responseTime: 456,
      responseTimeVariability: 89,
      attentiveness: 78,
      impulsivity: 85,
      consistency: 72
    },
    interpretation: {
      overall: "Normal",
      attention: "Sedikit di bawah rata-rata",
      impulseControl: "Normal",
      consistency: "Perlu perbaikan"
    }
  };

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
            <div className="space-x-4">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Unduh PDF
              </Button>
              <Button variant="outline" asChild>
                <Link to="/" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Beranda</span>
                </Link>
              </Button>
            </div>
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
                  <span>Response Time (ms):</span>
                  <span className="font-semibold">{testResults.performance.responseTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>RT Variability:</span>
                  <span className="font-semibold">{testResults.performance.responseTimeVariability}</span>
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
                    <span className="font-semibold text-success">{testResults.interpretation.overall}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Perhatian:</span>
                    <span className="font-semibold text-warning">{testResults.interpretation.attention}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kontrol Impuls:</span>
                    <span className="font-semibold text-success">{testResults.interpretation.impulseControl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Konsistensi:</span>
                    <span className="font-semibold text-warning">{testResults.interpretation.consistency}</span>
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
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Hasil Normal dengan Catatan:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Skor perhatian sedikit di bawah rata-rata, latihan konsentrasi dapat membantu</li>
                    <li>• Konsistensi respons perlu diperbaiki dengan latihan rutin</li>
                    <li>• Kontrol impuls dalam rentang normal</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Saran Tindak Lanjut:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Konsultasikan hasil dengan profesional kesehatan mental</li>
                    <li>• Pertimbangkan latihan mindfulness untuk meningkatkan fokus</li>
                    <li>• Evaluasi faktor lingkungan yang dapat mempengaruhi konsentrasi</li>
                    <li>• Tes ulang dapat dilakukan setelah 6 bulan jika diperlukan</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            <Button size="lg">
              <Download className="h-4 w-4 mr-2" />
              Unduh Laporan Lengkap
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/">Kembali ke Beranda</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Results;