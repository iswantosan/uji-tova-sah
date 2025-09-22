import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, ArrowLeft, CheckCircle, XCircle, Clock, Users, CreditCard, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase, type Registration, type Payment, type TestResult } from "@/lib/supabase";

const Admin = () => {
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch registrations
      const { data: regData, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (regError) throw regError;
      setRegistrations(regData || []);

      // Fetch payments
      const { data: payData, error: payError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (payError) throw payError;
      setPayments(payData || []);

      // Fetch test results
      const { data: testData, error: testError } = await supabase
        .from('test_results')
        .select('*')
        .order('test_date', { ascending: false });

      if (testError) throw testError;
      setTestResults(testData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Gagal mengambil data dari database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'approved' })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Pembayaran Disetujui",
        description: "Peserta sekarang dapat mengakses tes TOVA",
      });

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error approving payment:', error);
      toast({
        title: "Error",
        description: "Gagal menyetujui pembayaran",
        variant: "destructive"
      });
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'rejected' })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Pembayaran Ditolak",
        description: "Peserta akan diberitahu untuk mengirim ulang bukti pembayaran",
        variant: "destructive"
      });

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "Error",
        description: "Gagal menolak pembayaran",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge className="bg-success"><CheckCircle className="h-3 w-3 mr-1" />Disetujui</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Ditolak</Badge>;
      case "completed":
        return <Badge className="bg-blue-600"><FileText className="h-3 w-3 mr-1" />Selesai</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary">TOVA Test - Admin</h1>
            </div>
            <Button variant="outline" asChild>
              <Link to="/" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Kembali</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Admin Dashboard */}
      <section className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Registrasi</CardDescription>
              <CardTitle className="text-3xl">{registrations.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Peserta terdaftar</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pembayaran Pending</CardDescription>
              <CardTitle className="text-3xl">
                {payments.filter(p => p.status === 'pending').length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm text-muted-foreground">Menunggu verifikasi</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pembayaran Disetujui</CardDescription>
              <CardTitle className="text-3xl">
                {payments.filter(p => p.status === 'approved').length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm text-muted-foreground">Siap tes</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tes Selesai</CardDescription>
              <CardTitle className="text-3xl">{testResults.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Hasil tersedia</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="registrations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="registrations">Registrasi</TabsTrigger>
            <TabsTrigger value="payments">Pembayaran</TabsTrigger>
            <TabsTrigger value="results">Hasil Tes</TabsTrigger>
          </TabsList>

          {/* Registrations Tab */}
          <TabsContent value="registrations">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Registrasi</CardTitle>
                <CardDescription>
                  Kelola registrasi peserta tes TOVA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Usia</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell className="font-medium">{reg.name}</TableCell>
                        <TableCell>{reg.email}</TableCell>
                        <TableCell>{reg.phone}</TableCell>
                        <TableCell>{reg.age}</TableCell>
                        <TableCell>{new Date(reg.created_at).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>{getStatusBadge(reg.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Verifikasi Pembayaran</CardTitle>
                <CardDescription>
                  Kelola dan verifikasi pembayaran peserta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Kode Pembayaran</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.email}</TableCell>
                        <TableCell className="font-mono">{payment.payment_code}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{new Date(payment.created_at).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          {payment.status === 'pending' && (
                            <div className="space-x-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleApprovePayment(payment.id)}
                                className="bg-success hover:bg-success/90"
                              >
                                Setujui
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRejectPayment(payment.id)}
                              >
                                Tolak
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Hasil Tes TOVA</CardTitle>
                <CardDescription>
                  Lihat hasil tes yang telah diselesaikan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead>Tanggal Tes</TableHead>
                      <TableHead>Durasi</TableHead>
                      <TableHead>Omission</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>RT (ms)</TableHead>
                      <TableHead>Variability</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>{result.email}</TableCell>
                        <TableCell className="font-mono">{result.payment_code}</TableCell>
                        <TableCell>{new Date(result.test_date).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>{result.duration}</TableCell>
                        <TableCell>{result.omission_errors}</TableCell>
                        <TableCell>{result.commission_errors}</TableCell>
                        <TableCell>{result.response_time}</TableCell>
                        <TableCell>{result.variability}</TableCell>
                        <TableCell>{getStatusBadge(result.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default Admin;