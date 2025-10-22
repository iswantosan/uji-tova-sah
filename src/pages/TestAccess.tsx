import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, ArrowLeft, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const TestAccess = () => {
  const [formData, setFormData] = useState({
    email: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast({
        title: "Error",
        description: "Please enter email",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if registration exists
      const { data: registrations, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('email', formData.email)
        .limit(1);

      if (error) {
        console.error('Database error:', error);
        toast({
          title: "Error Database",
          description: `Database error: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      if (!registrations || registrations.length === 0) {
        toast({
          title: "Email Not Found",
          description: "Email not registered yet. Please register first.",
          variant: "destructive"
        });
        return;
      }

      // Check payment status - get first approved payment for email
      const { data: payments, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('email', formData.email)
        .eq('status', 'approved')
        .limit(1);

      if (paymentError) {
        console.error('Payment check error:', paymentError);
        toast({
          title: "Error",
          description: "An error occurred while checking payment status.",
          variant: "destructive"
        });
        return;
      }

      if (!payments || payments.length === 0) {
        toast({
          title: "Payment Not Yet Approved",
          description: "Your payment has not been approved by admin yet. Please wait or contact admin.",
          variant: "destructive"
        });
        return;
      }

      // Store session for test access
      const registration = registrations[0];
      localStorage.setItem('tova_session', JSON.stringify({
        email: registration.email,
        name: registration.name
      }));

      toast({
        title: "Access Approved!",
        description: "Good luck with the TOVA test!",
      });
      window.location.href = "/test";
    } catch (error) {
      console.error('Error verifying access:', error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
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
            <Button variant="secondary" asChild>
              <Link to="/" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
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
              Access TOVA Test
            </h2>
            <p className="text-lg text-gray-600">
              Enter your registered email to start the test
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Access Verification</CardTitle>
              <CardDescription>
                Enter your registered email to access the test
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email">Registered Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <Alert>
                    <AlertDescription>
                      Make sure the email entered is the same as during registration.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Verifying..." : "Start Test"}
                  </Button>
              </form>

              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Not registered yet?
                </p>
                <Button variant="outline" asChild>
                  <Link to="/register">Register Now</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-blue-900 mb-2">Help:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Make sure the email entered is the same as during registration</li>
                  <li>• Contact admin if you have access difficulties</li>
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