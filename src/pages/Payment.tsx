import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, ArrowLeft, CheckCircle, Upload, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Payment = () => {
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Load payment data on mount
  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        // Get email from localStorage (set during registration)
        const session = localStorage.getItem('tova_session');
        if (!session) {
          toast({
            title: "Error",
            description: "Please register first",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        const { email } = JSON.parse(session);

        // Fetch payment record
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('email', email)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (paymentError || !payment) {
          toast({
            title: "Error",
            description: "Payment record not found. Please register again.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        setPaymentData(payment);
      } catch (error) {
        console.error('Error loading payment:', error);
        toast({
          title: "Error",
          description: "An error occurred. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPaymentData();
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a JPG, PNG, or WEBP image",
          variant: "destructive"
        });
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      setProofFile(file);
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile || !paymentData) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${paymentData.payment_code}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, proofFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      // Update payment record with proof URL and set status to pending
      const { error: updateError } = await supabase
        .from('payments')
        .update({ 
          proof_url: urlData.publicUrl,
          status: 'pending'
        })
        .eq('id', paymentData.id);

      if (updateError) throw updateError;

      // Update local state
      setPaymentData({ ...paymentData, proof_url: urlData.publicUrl, status: 'pending' });
      setProofFile(null);

      toast({
        title: "Success!",
        description: "Payment proof uploaded successfully. Awaiting admin approval.",
      });
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast({
        title: "Error",
        description: "Failed to upload payment proof. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
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
                <span>Back</span>
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
              Complete Your Payment
            </h2>
            <p className="text-lg text-gray-600">
              Upload proof of payment to start your TOVA test
            </p>
          </div>

          {isLoading ? (
            <Card className="shadow-lg mb-6">
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">Loading payment information...</p>
              </CardContent>
            </Card>
          ) : paymentData ? (
            <>
              <div className="text-center mb-6">
                <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Registration Found!
                </h3>
                <p className="text-gray-600">
                  Please complete payment to proceed with the test
                </p>
              </div>

              <Card className="shadow-lg mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                  <CardDescription>
                    Transfer to the following bank account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-6 rounded-lg space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Bank Name</p>
                      <p className="text-lg font-semibold text-gray-900">BNI</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Number</p>
                      <p className="text-2xl font-bold text-primary">0232511024</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Name</p>
                      <p className="text-lg font-semibold text-gray-900">Hendy Yogya</p>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600">Your Payment Code</p>
                      <p className="text-xl font-mono font-bold text-primary">
                        {paymentData.payment_code}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Include this code in your transfer notes
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!paymentData.proof_url ? (
                <Card className="shadow-lg mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Upload Payment Proof
                    </CardTitle>
                    <CardDescription>
                      Upload a screenshot or photo of your transfer receipt
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="proof">Payment Proof (JPG, PNG, WEBP - Max 5MB)</Label>
                        <Input
                          id="proof"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleFileChange}
                        />
                        {proofFile && (
                          <p className="text-sm text-gray-600">
                            Selected: {proofFile.name}
                          </p>
                        )}
                      </div>
                      <Button 
                        onClick={handleUploadProof}
                        className="w-full"
                        disabled={!proofFile || isUploading}
                      >
                        {isUploading ? "Uploading..." : "Upload Proof"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-lg mb-6">
                  <CardHeader>
                    <CardTitle>Payment Status</CardTitle>
                    <CardDescription>
                      Your payment proof has been submitted
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Status</p>
                        <span className={`inline-block px-4 py-2 rounded-full font-semibold ${
                          paymentData.status === 'approved' ? 'bg-green-100 text-green-700' : 
                          paymentData.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {paymentData.status === 'approved' ? 'Approved - You can start the test!' : 
                           paymentData.status === 'pending' ? 'Awaiting Admin Approval' : 
                           'Rejected - Please contact admin'}
                        </span>
                      </div>
                      {paymentData.proof_url && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Uploaded Proof:</p>
                          <img 
                            src={paymentData.proof_url} 
                            alt="Payment proof" 
                            className="w-full max-w-md mx-auto rounded-lg border"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="shadow-lg">
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">Please complete registration first</p>
                <Button asChild className="mt-4">
                  <Link to="/register">Go to Registration</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {paymentData && paymentData.status === 'approved' && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Start Your Test</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" size="lg">
                  <Link to="/test-access">Access TOVA Test</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
};

export default Payment;