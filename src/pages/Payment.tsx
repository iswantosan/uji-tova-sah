import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, ArrowLeft, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Payment = () => {
  const [email, setEmail] = useState("");
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const checkPaymentStatus = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Masukkan email terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('email', email)
        .single();

      if (paymentError || !payment) {
        toast({
          title: "Error",
          description: "Email tidak ditemukan atau belum terdaftar.",
          variant: "destructive"
        });
        return;
      }

      setPaymentData(payment);
      
      toast({
        title: "Data Ditemukan!",
        description: "Informasi pembayaran Anda telah ditemukan.",
      });
    } catch (error) {
      console.error('Error checking payment:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
              <Link to="/register" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Kembali</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Payment Info */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Status Registrasi & Pembayaran
            </h2>
            <p className="text-lg text-gray-600">
              Cek status registrasi dan kode pembayaran Anda
            </p>
          </div>

          {!paymentData ? (
            <Card className="shadow-lg mb-6">
              <CardHeader>
                <CardTitle>Cek Status Registrasi</CardTitle>
                <CardDescription>
                  Masukkan email yang sama dengan saat registrasi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contoh@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    onClick={checkPaymentStatus}
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Mengecek..." : "Cek Status"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-center mb-6">
                <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Registrasi Berhasil!
                </h3>
                <p className="text-gray-600">
                  Kami akan memverifikasi registrasi Anda dalam 1x24 jam
                </p>
              </div>

              <Card className="shadow-lg mb-6">
                <CardHeader>
                  <CardTitle>Kode Pembayaran Anda</CardTitle>
                  <CardDescription>
                    Kode ini sudah otomatis dibuat saat registrasi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <div className="text-2xl font-mono font-bold text-primary mb-4">
                      {paymentData.payment_code}
                    </div>
                    <div className="text-sm text-gray-600">
                      Status: <span className={`font-semibold ${
                        paymentData.status === 'approved' ? 'text-green-600' : 
                        paymentData.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {paymentData.status === 'approved' ? 'Disetujui' : 
                         paymentData.status === 'pending' ? 'Menunggu Verifikasi' : 'Ditolak'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="shadow-lg mb-6">
            <CardHeader>
              <CardTitle>Verifikasi Registrasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 font-medium">
                  Kami akan memverifikasi registrasi Anda dalam 1x24 jam. 
                  Setelah diverifikasi, Anda dapat melakukan pembayaran dan mengakses tes TOVA.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Proses Selanjutnya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Langkah Selanjutnya:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>1. Hubungi admin untuk detail pembayaran</li>
                  <li>2. Lakukan pembayaran sesuai instruksi admin</li>
                  <li>3. Tunggu persetujuan dari admin</li>
                  <li>4. Setelah disetujui, Anda dapat mengakses tes</li>
                </ul>
              </div>

              <Button asChild className="w-full" size="lg">
                <Link to="/test-access">Cek Status Pembayaran</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Payment;