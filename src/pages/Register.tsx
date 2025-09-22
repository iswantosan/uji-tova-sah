import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, ArrowLeft } from "lucide-react";
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
  const { toast } = useToast();
  const navigate = useNavigate();

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

      // Store session for direct test access
      localStorage.setItem('tova_session', JSON.stringify({
        email: formData.email,
        name: formData.name
      }));

      toast({
        title: "Registrasi Berhasil!",
        description: "Anda dapat langsung mengakses tes TOVA.",
      });

      // Redirect to test
      navigate('/test');

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
                    <li>• Durasi tes: Sekitar 21 menit</li>
                    <li>• Hasil tersedia langsung setelah tes selesai</li>
                    <li>• Tes dapat dilakukan setelah registrasi</li>
                  </ul>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Mendaftar..." : "Daftar & Mulai Tes"}
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