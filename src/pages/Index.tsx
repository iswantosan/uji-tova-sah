import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Users, Shield, Clock } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary">TOVA Test</h1>
            </div>
            <div className="space-x-4">
              <Button asChild>
                <Link to="/register">Register Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Test of Variables of Attention
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            The TOVA test is a reliable diagnostic tool for measuring attention 
            and concentration abilities. Our system provides a secure 
            and professional platform for conducting ADHD tests online.
          </p>
          <div className="space-x-4">
            <Button size="lg" className="px-8 py-4 text-lg" asChild>
              <Link to="/register">Start Registration</Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-4 text-lg" asChild>
              <Link to="/test-access">Access Test</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Why Choose TOVA Test?
          </h3>
          <p className="text-lg text-gray-600">
            Trusted ADHD testing platform with cutting-edge technology
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Accredited Test</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Using internationally recognized and tested TOVA standards
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-12 w-12 text-success mx-auto mb-4" />
              <CardTitle>Safe & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Test participant data is protected with enterprise-level encryption
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Clock className="h-12 w-12 text-warning mx-auto mb-4" />
              <CardTitle>Fast Results</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Test results are available immediately after completing the testing session
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Support 24/7</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Technical support team ready to help you anytime
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Start the TOVA Test?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Register now and get access to a professional ADHD testing platform
          </p>
          <Button size="lg" variant="secondary" className="px-8 py-4 text-lg" asChild>
            <Link to="/register">Register Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="h-6 w-6" />
            <span className="text-lg font-semibold">TOVA Test</span>
          </div>
          <p className="text-gray-400">
            © 2025 TOVA Test Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;