import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Brain, ArrowLeft, CheckCircle, XCircle, Clock, Users, CreditCard, FileText, LogOut, Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { checkAdminStatus } from "@/lib/adminHelper";

type Registration = {
  id: string
  name: string
  email: string
  phone: string
  age: number
  created_at: string
  status: 'pending' | 'approved' | 'rejected'
}

type Payment = {
  id: string
  registration_id: string
  email: string
  payment_code: string
  amount: number
  proof_url?: string
  created_at: string
  status: 'pending' | 'approved' | 'rejected'
}

type TestResult = {
  id: string
  payment_id: string
  email: string
  payment_code: string
  test_date: string
  duration: string
  omission_errors: number
  commission_errors: number
  response_time: number
  variability: number
  status: 'in_progress' | 'completed'
}

const Admin = () => {
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Pagination and search states
  const [searchTerms, setSearchTerms] = useState({
    registrations: '',
    payments: '',
    results: ''
  });
  const [currentPage, setCurrentPage] = useState({
    registrations: 1,
    payments: 1,
    results: 1
  });
  const itemsPerPage = 10;

  useEffect(() => {
    const checkAdmin = async () => {
      const adminStatus = await checkAdminStatus();
      setIsAdmin(adminStatus);
      if (adminStatus) {
        fetchData();
      } else {
        setLoading(false);
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive"
        });
      }
    };
    checkAdmin();
  }, []);

  const fetchData = async () => {

    try {
      // Fetch registrations
      const { data: regData, error: regError } = await (supabase as any)
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (regError) throw regError;
      setRegistrations(regData || []);

      // Fetch payments
      const { data: payData, error: payError } = await (supabase as any)
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (payError) throw payError;
      setPayments(payData || []);

      // Fetch test results
      const { data: testData, error: testError } = await (supabase as any)
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
      // Update payment status
      const { error } = await (supabase as any)
        .from('payments')
        .update({ status: 'approved' })
        .eq('id', paymentId);

      if (error) throw error;

      // Update local state instead of refetching everything
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'approved' as const }
          : payment
      ));

      toast({
        title: "Pembayaran Disetujui",
        description: "Peserta sekarang dapat mengakses tes TOVA",
      });
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
      // Update payment status
      const { error } = await (supabase as any)
        .from('payments')
        .update({ status: 'rejected' })
        .eq('id', paymentId);

      if (error) throw error;

      // Update local state instead of refetching everything
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId 
          ? { ...payment, status: 'rejected' as const }
          : payment
      ));

      toast({
        title: "Pembayaran Ditolak",
        description: "Peserta akan diberitahu untuk mengirim ulang bukti pembayaran",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "Error",
        description: "Gagal menolak pembayaran",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (result: TestResult) => {
    // Store result data in sessionStorage to be accessed by Results page
    sessionStorage.setItem('currentTestResult', JSON.stringify(result));
    navigate('/results');
  };

  const handleResendEmail = async (result: TestResult) => {
    try {
      console.log('Attempting to resend email for:', result.email);
      
      // Get participant name from registrations
      const registration = registrations.find(r => r.email === result.email);
      const participantName = registration?.name || 'Peserta';

      const emailData = {
        email: result.email,
        name: participantName,
        testDate: new Date(result.test_date).toLocaleDateString('id-ID'),
        duration: result.duration,
        attentiveness: Math.max(0, Math.min(100, 100 - (result.omission_errors * 2))),
        impulsivity: Math.max(0, Math.min(100, 100 - (result.commission_errors * 3))),
        consistency: Math.max(0, Math.min(100, 100 - (result.variability / 10))),
        omissionErrors: result.omission_errors,
        commissionErrors: result.commission_errors,
        responseTime: Math.round(result.response_time),
        variability: Math.round(result.variability)
      };

      console.log('Email data prepared:', emailData);

      const response = await supabase.functions.invoke('send-test-results', {
        body: emailData
      });

      console.log('Supabase function response:', response);

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Email Terkirim",
        description: `Hasil tes berhasil dikirim ulang ke ${result.email}`,
      });
    } catch (error) {
      console.error('Error resending email:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim ulang email hasil tes",
        variant: "destructive"
      });
    }
  };

  // Pagination and search helper functions
  const filterAndPaginateData = (data: any[], searchTerm: string, page: number, searchFields: string[]) => {
    const filtered = data.filter(item => 
      searchFields.some(field => 
        item[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filtered.slice(startIndex, endIndex);
    
    return {
      data: paginatedData,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / itemsPerPage)
    };
  };

  const handleSearch = (type: 'registrations' | 'payments' | 'results', value: string) => {
    setSearchTerms(prev => ({ ...prev, [type]: value }));
    setCurrentPage(prev => ({ ...prev, [type]: 1 })); // Reset to first page on search
  };

  const handlePageChange = (type: 'registrations' | 'payments' | 'results', page: number) => {
    setCurrentPage(prev => ({ ...prev, [type]: page }));
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

  if (!isAdmin && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have admin privileges to access this page.</p>
          <Button asChild>
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </div>
    );
  }

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
            <div className="flex gap-2">
              <Button variant="outline" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
              <Button variant="outline" asChild>
                <Link to="/" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Kembali</span>
                </Link>
              </Button>
            </div>
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
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari berdasarkan nama, email, atau telepon..."
                      value={searchTerms.registrations}
                      onChange={(e) => handleSearch('registrations', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
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
                    {(() => {
                      const { data: paginatedRegs, totalPages } = filterAndPaginateData(
                        registrations, 
                        searchTerms.registrations, 
                        currentPage.registrations,
                        ['name', 'email', 'phone']
                      );
                      return paginatedRegs.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">{reg.name}</TableCell>
                          <TableCell>{reg.email}</TableCell>
                          <TableCell>{reg.phone}</TableCell>
                          <TableCell>{reg.age}</TableCell>
                          <TableCell>{new Date(reg.created_at).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell>{getStatusBadge(reg.status)}</TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
                
                {/* Pagination Controls */}
                {(() => {
                  const { totalPages } = filterAndPaginateData(
                    registrations, 
                    searchTerms.registrations, 
                    currentPage.registrations,
                    ['name', 'email', 'phone']
                  );
                  return totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Halaman {currentPage.registrations} dari {totalPages}
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange('registrations', currentPage.registrations - 1)}
                          disabled={currentPage.registrations === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange('registrations', currentPage.registrations + 1)}
                          disabled={currentPage.registrations === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })()}
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
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari berdasarkan email atau kode pembayaran..."
                      value={searchTerms.payments}
                      onChange={(e) => handleSearch('payments', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Kode Pembayaran</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const { data: paginatedPayments, totalPages } = filterAndPaginateData(
                        payments, 
                        searchTerms.payments, 
                        currentPage.payments,
                        ['email', 'payment_code']
                      );
                      return paginatedPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.email}</TableCell>
                          <TableCell className="font-mono">{payment.payment_code}</TableCell>
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
                      ));
                    })()}
                  </TableBody>
                </Table>
                
                {/* Pagination Controls */}
                {(() => {
                  const { totalPages } = filterAndPaginateData(
                    payments, 
                    searchTerms.payments, 
                    currentPage.payments,
                    ['email', 'payment_code']
                  );
                  return totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Halaman {currentPage.payments} dari {totalPages}
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange('payments', currentPage.payments - 1)}
                          disabled={currentPage.payments === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange('payments', currentPage.payments + 1)}
                          disabled={currentPage.payments === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })()}
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
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari berdasarkan email atau kode pembayaran..."
                      value={searchTerms.results}
                      onChange={(e) => handleSearch('results', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
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
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const { data: paginatedResults, totalPages } = filterAndPaginateData(
                        testResults, 
                        searchTerms.results, 
                        currentPage.results,
                        ['email', 'payment_code']
                      );
                      return paginatedResults.map((result) => (
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
                          <TableCell>
                            <div className="flex gap-2">
                              {result.status === 'completed' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleViewDetails(result)}
                                  >
                                    <Eye className="mr-1 h-4 w-4" />
                                    View
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleResendEmail(result)}
                                  >
                                    Resend Email
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
                
                {/* Pagination Controls */}
                {(() => {
                  const { totalPages } = filterAndPaginateData(
                    testResults, 
                    searchTerms.results, 
                    currentPage.results,
                    ['email', 'payment_code']
                  );
                  return totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Halaman {currentPage.results} dari {totalPages}
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange('results', currentPage.results - 1)}
                          disabled={currentPage.results === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange('results', currentPage.results + 1)}
                          disabled={currentPage.results === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default Admin;