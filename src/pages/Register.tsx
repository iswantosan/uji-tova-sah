import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, ArrowLeft, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    purpose: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [paymentCode, setPaymentCode] = useState("");
  const [showPaymentCode, setShowPaymentCode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const generatePaymentCode = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY-${timestamp.slice(-6)}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.age) {
      toast({
        title: "Error",
        description: "Harap lengkapi semua field yang wajib",
        variant: "destructive"
      });
      return;
    }

    if (parseInt(formData.age) < 6 || parseInt(formData.age) > 65) {
      toast({
        title: "Error", 
        description: "Usia harus antara 6-65 tahun",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Generate payment code
      const generatedCode = generatePaymentCode();

      // Insert registration
      const { error: regError } = await supabase
        .from('registrations')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          age: parseInt(formData.age)
        });

      if (regError) {
        if (regError.code === '23505') { // Unique constraint violation
          toast({
            title: "Error",
            description: "Email sudah terdaftar",
            variant: "destructive"
          });
        } else {
          throw regError;
        }
        return;
      }

      // Insert payment record with generated code
      const { error: payError } = await supabase
        .from('payments')
        .insert({
          email: formData.email,
          payment_code: generatedCode,
          amount: 350000,
          status: 'pending'
        });

      if (payError) {
        throw payError;
      }

      setPaymentCode(generatedCode);
      setShowPaymentCode(true);

      toast({
        title: "Registrasi Berhasil!",
        description: "Kode pembayaran telah dibuat. Silakan lakukan pembayaran sesuai instruksi.",
      });

    } catch (error) {
      console.error('Error registering:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat registrasi. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentCode);
    setIsCopied(true);
    toast({
      title: "Disalin!",
      description: "Kode pembayaran berhasil disalin ke clipboard.",
    });
    setTimeout(() => setIsCopied(false), 2000);
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

      {/* Registration Form */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Registrasi Peserta Tes TOVA
            </h2>
            <p className="text-lg text-gray-600">
              Lengkapi data diri Anda untuk memulai proses registrasi
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Data Peserta</CardTitle>
              <CardDescription>
                Pastikan semua informasi yang Anda masukkan sudah benar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showPaymentCode ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Lengkap *</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Masukkan nama lengkap"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Usia *</Label>
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        placeholder="Masukkan usia"
                        value={formData.age}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
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
                    <Label htmlFor="phone">Nomor Telepon *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Tujuan Tes</Label>
                    <Input
                      id="purpose"
                      name="purpose"
                      type="text"
                      placeholder="Contoh: Diagnosa ADHD, Evaluasi konsentrasi, dll"
                      value={formData.purpose}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Informasi Penting:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Biaya tes: Rp 350.000</li>
                      <li>• Durasi tes: Sekitar 21 menit</li>
                      <li>• Hasil tersedia langsung setelah tes selesai</li>
                      <li>• Tes hanya dapat dilakukan sekali per registrasi</li>
                    </ul>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? "Mendaftar & Buat Kode..." : "Daftar & Buat Kode Pembayaran"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Registrasi Berhasil!
                    </h3>
                    <p className="text-gray-600">
                      Kode pembayaran Anda telah dibuat
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
                    <Label className="text-sm font-medium text-gray-700">Kode Pembayaran Anda:</Label>
                    <div className="flex items-center justify-between bg-white p-4 rounded-lg border-2 border-dashed border-blue-300 mt-2">
                      <span className="text-2xl font-mono font-bold text-blue-600 tracking-wider">
                        {paymentCode}
                      </span>
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        size="sm"
                        className="ml-2"
                      >
                        {isCopied ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">Instruksi Pembayaran:</h4>
                    <div className="text-sm text-yellow-700 space-y-2">
                      <p><strong>Jumlah:</strong> Rp 350.000</p>
                      <p><strong>Transfer ke:</strong></p>
                      <ul className="ml-4 space-y-1">
                        <li>• BCA: 1234567890 (a.n. TOVA Test Center)</li>
                        <li>• Mandiri: 0987654321 (a.n. TOVA Test Center)</li>
                        <li>• Dana/GoPay: 081234567890</li>
                      </ul>
                      <p className="font-medium mt-3">
                        Cantumkan kode pembayaran <span className="font-mono bg-yellow-100 px-1 rounded">{paymentCode}</span> sebagai berita transfer
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Langkah Selanjutnya:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>1. Lakukan pembayaran sesuai instruksi di atas</li>
                      <li>2. Tunggu konfirmasi dari admin (biasanya 1-24 jam)</li>
                      <li>3. Setelah disetujui, gunakan email + kode pembayaran untuk mulai tes</li>
                      <li>4. Hasil tes akan tersedia langsung setelah selesai</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Button asChild className="flex-1">
                      <Link to="/test-access">Mulai Tes Sekarang</Link>
                    </Button>
                    <Button variant="outline" asChild className="flex-1">
                      <Link to="/">Kembali ke Beranda</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Register;