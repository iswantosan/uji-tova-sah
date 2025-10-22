import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Brain, ArrowLeft, CheckCircle, XCircle, Clock, Users, CreditCard, FileText, LogOut, Search, ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [itemsPerPage] = useState(10);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'registration' | 'result' | null;
    id: string | null;
    name: string;
  }>({ open: false, type: null, id: null, name: '' });

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

  const fetchRegistrations = async () => {
    const { data: regData, error: regError } = await (supabase as any)
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (regError) throw regError;
    setRegistrations(regData || []);
  };

  const fetchTestResults = async () => {
    const { data: testData, error: testError } = await (supabase as any)
      .from('test_results')
      .select('*')
      .order('test_date', { ascending: false });

    if (testError) throw testError;
    setTestResults(testData || []);
  };

  const fetchData = async () => {
    try {
      // Fetch registrations
      await fetchRegistrations();

      // Fetch payments
      const { data: payData, error: payError } = await (supabase as any)
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (payError) throw payError;
      setPayments(payData || []);

      // Fetch test results
      await fetchTestResults();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to retrieve data from database",
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
        title: "Payment Approved",
        description: "Participant can now access the TOVA test",
      });
    } catch (error) {
      console.error('Error approving payment:', error);
      toast({
        title: "Error",
        description: "Failed to approve payment",
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
        title: "Payment Rejected",
        description: "Participant will be notified to resubmit proof of payment",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "Error",
        description: "Failed to reject payment",
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
        title: "Email Sent",
        description: `Test results successfully resent to ${result.email}`,
      });
    } catch (error) {
      console.error('Error resending email:', error);
      toast({
        title: "Error",
        description: "Failed to resend test results email",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRegistration = async () => {
    if (!deleteDialog.id) return;
    
    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', deleteDialog.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Registration successfully deleted",
      });

      // Refresh data
      fetchRegistrations();
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast({
        title: "Error",
        description: "Failed to delete registration",
        variant: "destructive"
      });
    } finally {
      setDeleteDialog({ open: false, type: null, id: null, name: '' });
    }
  };

  const handleDeleteTestResult = async () => {
    if (!deleteDialog.id) return;
    
    try {
      const { error } = await supabase
        .from('test_results')
        .delete()
        .eq('id', deleteDialog.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test result successfully deleted",
      });

      // Refresh data
      fetchTestResults();
    } catch (error) {
      console.error('Error deleting test result:', error);
      toast({
        title: "Error",
        description: "Failed to delete test result",
        variant: "destructive"
      });
    } finally {
      setDeleteDialog({ open: false, type: null, id: null, name: '' });
    }
  };

  const confirmDelete = () => {
    if (deleteDialog.type === 'registration') {
      handleDeleteRegistration();
    } else if (deleteDialog.type === 'result') {
      handleDeleteTestResult();
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
        return <Badge className="bg-success"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "completed":
        return <Badge className="bg-blue-600"><FileText className="h-3 w-3 mr-1" />Completed</Badge>;
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
                  <span>Back</span>
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
              <CardDescription>Total Registrations</CardDescription>
              <CardTitle className="text-3xl">{registrations.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Registered participants</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Payments</CardDescription>
              <CardTitle className="text-3xl">
                {payments.filter(p => p.status === 'pending').length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm text-muted-foreground">Awaiting verification</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Approved Payments</CardDescription>
              <CardTitle className="text-3xl">
                {payments.filter(p => p.status === 'approved').length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm text-muted-foreground">Ready to test</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tests Completed</CardDescription>
              <CardTitle className="text-3xl">{testResults.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Results available</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="registrations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="results">Test Results</TabsTrigger>
          </TabsList>

          {/* Registrations Tab */}
          <TabsContent value="registrations">
            <Card>
              <CardHeader>
                <CardTitle>Registration List</CardTitle>
                <CardDescription>
                  Manage TOVA test participant registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or phone..."
                      value={searchTerms.registrations}
                      onChange={(e) => handleSearch('registrations', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Date</TableHead>
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
                        Page {currentPage.registrations} of {totalPages}
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
                <CardTitle>Payment Verification</CardTitle>
                <CardDescription>
                  Manage and verify participant payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email or payment code..."
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
                      <TableHead>Payment Code</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
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
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleRejectPayment(payment.id)}
                                >
                                  Reject
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
                        Page {currentPage.payments} of {totalPages}
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
                <CardTitle>TOVA Test Results</CardTitle>
                <CardDescription>
                  View completed test results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email or payment code..."
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
                      <TableHead>Code</TableHead>
                      <TableHead>Test Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Omission</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>RT (ms)</TableHead>
                      <TableHead>Variability</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
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
                          <TableCell>
                            {new Date(result.test_date).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                            {' '}
                            {new Date(result.test_date).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
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
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setDeleteDialog({
                                      open: true,
                                      type: 'result',
                                      id: result.id,
                                      name: result.email
                                    })}
                                  >
                                    <Trash2 className="h-4 w-4" />
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
                        Page {currentPage.results} of {totalPages}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, type: null, id: null, name: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteDialog.type === 'registration' ? 'registration' : 'test result'} for <strong>{deleteDialog.name}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;