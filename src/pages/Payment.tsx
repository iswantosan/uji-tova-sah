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
  const [paymentCode, setPaymentCode] = useState("");
  const [showPaymentCode, setShowPaymentCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generatePaymentCode = async () => {
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
      // Check if email is registered
      const { data: registration, error: regError } = await (supabase as any)
        .from('registrations')
        .select('*')
        .eq('email', email)
        .single();

      if (regError || !registration) {
        toast({
          title: "Error",
          description: "Email tidak terdaftar. Silakan registrasi terlebih dahulu.",
          variant: "destructive"
        });
        return;
      }

      // Generate unique payment code
      const code = `TOVA-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // Insert payment record
      const { error: paymentError } = await (supabase as any)
        .from('payments')
        .insert({
          registration_id: registration.id,
          email: email,
          payment_code: code,
          amount: 350000
        });

      if (paymentError) {
        throw paymentError;
      }

      setPaymentCode(code);
      setShowPaymentCode(true);
      
      toast({
        title: "Kode Pembayaran Dibuat!",
        description: "Silakan lakukan pembayaran dan simpan bukti transfer",
      });
    } catch (error) {
      console.error('Error generating payment code:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Disalin!",
      description: "Kode pembayaran telah disalin ke clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
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
              Generate Kode Pembayaran
            </h2>
            <p className="text-lg text-gray-600">
              Masukkan email Anda untuk mendapatkan kode pembayaran
            </p>
          </div>

          {!showPaymentCode ? (
            <Card className="shadow-lg mb-6">
              <CardHeader>
                <CardTitle>Email Terdaftar</CardTitle>
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
                    onClick={generatePaymentCode}
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Membuat Kode..." : "Generate Kode Pembayaran"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-center mb-6">
                <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Kode Pembayaran Berhasil Dibuat!
                </h3>
              </div>

              <Card className="shadow-lg mb-6">
                <CardHeader>
                  <CardTitle>Kode Pembayaran Anda</CardTitle>
                  <CardDescription>
                    Gunakan kode ini untuk melakukan pembayaran
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <div className="text-2xl font-mono font-bold text-primary mb-4">
                      {paymentCode}
                    </div>
                    <Button 
                      onClick={() => copyToClipboard(paymentCode)}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span>{copied ? "Disalin!" : "Salin Kode"}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="shadow-lg mb-6">
            <CardHeader>
              <CardTitle>Informasi Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Biaya Tes TOVA:</span>
                <span className="font-bold">Rp 350.000</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Admin:</span>
                <span>Rp 0</span>
              </div>
              <hr />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">Rp 350.000</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Cara Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Transfer Bank:</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Bank BCA:</span>
                    <span className="font-mono">1234567890</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Atas Nama:</span>
                    <span>PT TOVA Indonesia</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">E-Wallet:</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>GoPay/OVO/DANA:</span>
                    <span className="font-mono">081234567890</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Atas Nama:</span>
                    <span>TOVA Indonesia</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">Penting:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Sertakan kode pembayaran sebagai berita transfer</li>
                  <li>• Simpan bukti transfer untuk verifikasi</li>
                  <li>• Proses verifikasi 1-24 jam kerja</li>
                  <li>• Setelah diverifikasi, Anda bisa mulai tes</li>
                </ul>
              </div>

              <Button asChild className="w-full" size="lg">
                <Link to="/test-access">Saya Sudah Transfer - Akses Tes</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Payment;