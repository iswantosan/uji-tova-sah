import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    purpose: ""
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, this would connect to Supabase
    toast({
      title: "Registrasi Berhasil!",
      description: "Silakan lanjut ke pembayaran untuk mendapatkan kode akses tes.",
    });
    // Navigate to payment page
    window.location.href = "/payment";
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

                <Button type="submit" className="w-full" size="lg">
                  Lanjut ke Pembayaran
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Register;