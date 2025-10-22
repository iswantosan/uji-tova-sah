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
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (parseInt(formData.age) < 6 || parseInt(formData.age) > 65) {
      toast({
        title: "Error", 
        description: "Age must be between 6-65 years",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Generate unique payment code
      const paymentCode = `TOVA-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // Insert registration
      const { data: regData, error: regError } = await supabase
        .from('registrations')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          age: parseInt(formData.age)
        })
        .select()
        .single();

      if (regError) {
        if (regError.code === '23505') { // Unique constraint violation
          toast({
            title: "Error",
            description: "Email already registered",
            variant: "destructive"
          });
        } else {
          throw regError;
        }
        return;
      }

      // Insert payment record with generated code
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          registration_id: regData.id,
          email: formData.email,
          payment_code: paymentCode,
          amount: 350000
        });

      if (paymentError) {
        throw paymentError;
      }

      // Store session for direct test access
      localStorage.setItem('tova_session', JSON.stringify({
        email: formData.email,
        name: formData.name
      }));

      toast({
        title: "Registration Successful!",
        description: "We will verify your registration. Please proceed to payment.",
        duration: 4000
      });

      // Redirect to payment
      navigate('/payment');

    } catch (error) {
      console.error('Error registering:', error);
      toast({
        title: "Error",
        description: "An error occurred during registration. Please try again.",
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

      {/* Registration Form */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              TOVA Test Participant Registration
            </h2>
            <p className="text-lg text-gray-600">
              Fill in your personal information to start the registration process
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Participant Data</CardTitle>
              <CardDescription>
                Make sure all the information you enter is correct
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      placeholder="Enter age"
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
                    <Label htmlFor="phone">Phone Number *</Label>
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
                    <Label htmlFor="purpose">Test Purpose</Label>
                    <Input
                      id="purpose"
                      name="purpose"
                      type="text"
                      placeholder="Example: ADHD diagnosis, concentration evaluation, etc."
                      value={formData.purpose}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Registration Process:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>1. Complete the registration form</li>
                      <li>2. We will verify your data</li>
                      <li>3. Make payment as instructed</li>
                      <li>4. Wait for admin approval to start the test</li>
                    </ul>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? "Registering..." : "Register & Proceed to Payment"}
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