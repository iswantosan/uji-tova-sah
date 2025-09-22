import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, ArrowLeft, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TestAccess = () => {
  const [formData, setFormData] = useState({
    email: "",
    paymentCode: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate verification process
    setTimeout(() => {
      // In real app, this would verify with Supabase
      const isApproved = Math.random() > 0.3; // 70% chance of approval for demo
      
      if (isApproved) {
        toast({
          title: "Akses Disetujui!",
          description: "Pembayaran Anda telah diverifikasi. Selamat mengerjakan tes!",
        });
        window.location.href = "/test";
      } else {
        toast({
          title: "Pembayaran Belum Diverifikasi",
          description: "Silakan tunggu hingga admin memverifikasi pembayaran Anda.",
          variant: "destructive"
        });
      }
      setIsLoading(false);
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary">TOVA Test</h1>
            </Link>
            <Button variant="outline" asChild>
              <Link to="/" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Kembali</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Access Form */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <Lock className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Akses Tes TOVA
            </h2>
            <p className="text-lg text-gray-600">
              Masukkan email dan kode pembayaran untuk memulai tes
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Verifikasi Akses</CardTitle>
              <CardDescription>
                Pastikan Anda telah melakukan pembayaran sebelum mengakses tes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Terdaftar *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="contoh@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentCode">Kode Pembayaran *</Label>
                  <Input
                    id="paymentCode"
                    name="paymentCode"
                    type="text"
                    placeholder="TOVA-XXXXXX"
                    value={formData.paymentCode}
                    onChange={handleInputChange}
                    className="font-mono"
                    required
                  />
                </div>

                <Alert>
                  <AlertDescription>
                    Jika pembayaran Anda belum diverifikasi, sistem akan menampilkan pesan error. 
                    Proses verifikasi pembayaran membutuhkan waktu 1-24 jam kerja.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Memverifikasi..." : "Mulai Tes"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Belum memiliki kode pembayaran?
                </p>
                <Button variant="outline" asChild>
                  <Link to="/register">Daftar Sekarang</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-blue-900 mb-2">Bantuan:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Pastikan email yang dimasukkan sama dengan saat registrasi</li>
                  <li>• Kode pembayaran dapat ditemukan di halaman pembayaran</li>
                  <li>• Hubungi admin jika mengalami kesulitan akses</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TestAccess;