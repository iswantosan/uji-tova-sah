import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, ArrowLeft, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Results = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        // Check if coming from admin view (sessionStorage)
        const adminViewData = sessionStorage.getItem('currentTestResult');
        
        // Otherwise check regular user session (localStorage)
        const sessionData = localStorage.getItem('tova_session');
        
        if (!adminViewData && !sessionData) {
          console.error('No session data found');
          toast({
            title: "Error",
            description: "Session not found.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        let data, session;
        
        // If viewing from admin, use sessionStorage data directly
        if (adminViewData) {
          data = JSON.parse(adminViewData);
          session = {
            name: data.participant_name || data.email,
            email: data.email,
            payment_code: data.payment_code
          };
          
          console.log('Viewing test results from admin:', data);
        } else {
          // Regular user flow - fetch from database via edge function
          session = JSON.parse(sessionData!);
          console.log('Fetching results for session:', session);
          
          // Fetch test results using edge function to bypass RLS
          const response = await supabase.functions.invoke('get-test-results', {
            body: { payment_code: session.payment_code || '' }
          });

          if (response.error) {
            console.error('Error fetching results:', response.error);
            toast({
              title: "Error",
              description: `Failed to fetch test results: ${response.error.message}`,
              variant: "destructive"
            });
            setLoading(false);
            return;
          }

          if (!response.data?.data) {
            console.log('No test results found');
            toast({
              title: "No Data",
              description: "No test results yet for this payment code.",
              variant: "destructive"
            });
            setLoading(false);
            return;
          }
          
          data = response.data.data;
        }

        console.log('Test results fetched successfully:', data);

        setTestResults({
          participantInfo: {
            name: session.name,
            email: session.email || data.email,
            testDate: new Date(data.test_date).toLocaleDateString('en-US'),
            duration: data.duration
          },
          performance: {
            omissionErrors: data.omission_errors,
            commissionErrors: data.commission_errors,
            responseTime: Math.round(data.response_time),
            responseTimeVariability: Math.round(data.variability),
            attentiveness: Math.max(0, Math.min(100, 100 - (data.omission_errors * 2))),
            impulsivity: Math.max(0, Math.min(100, 100 - (data.commission_errors * 3))),
            consistency: Math.max(0, Math.min(100, 100 - (data.variability / 10)))
          }
        });

        // Send email automatically for regular users, NOT when viewing from admin
        if (!adminViewData) {
          setTimeout(async () => {
            try {
              console.log('Attempting to send automatic email for:', session.email);
              
              const emailData = {
                email: session.email,
                name: session.name,
                testDate: new Date(data.test_date).toLocaleDateString('en-US'),
                duration: data.duration,
                attentiveness: Math.max(0, Math.min(100, 100 - (data.omission_errors * 2))),
                impulsivity: Math.max(0, Math.min(100, 100 - (data.commission_errors * 3))),
                consistency: Math.max(0, Math.min(100, 100 - (data.variability / 10))),
                omissionErrors: data.omission_errors,
                commissionErrors: data.commission_errors,
                responseTime: Math.round(data.response_time),
                variability: Math.round(data.variability)
              };

              console.log('Email data prepared for automatic send:', emailData);

              const response = await supabase.functions.invoke('send-test-results', {
                body: emailData
              });

              console.log('Automatic email response:', response);

              if (response.error) {
                console.error('Email error:', response.error);
                toast({
                  title: "Warning",
                  description: "Email failed to send automatically, please click Email Results button",
                  variant: "default"
                });
              } else {
                toast({
                  title: "Email Sent",
                  description: "Test results have been sent to your email",
                });
              }
            } catch (emailError) {
              console.error('Error sending automatic email:', emailError);
              toast({
                title: "Warning",
                description: "Email failed to send automatically, please click Email Results button",
                variant: "default"
              });
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "An error occurred while fetching data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg">Loading test results...</p>
        </div>
      </div>
    );
  }

  if (!testResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Test Results Not Found</h2>
          <p className="text-gray-600 mb-4">No test results available for this account.</p>
          <Button asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-4 w-4 text-success" />;
    if (score >= 60) return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary">TOVA Test Results</h1>
            </div>
            <Button variant="outline" asChild>
              <Link to="/" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Home</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Results Content */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Participant Info */}
          <Card>
            <CardHeader>
              <CardTitle>Participant Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{testResults.participantInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{testResults.participantInfo.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Test Date</p>
                  <p className="font-semibold">{testResults.participantInfo.testDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Test Duration</p>
                  <p className="font-semibold">{testResults.participantInfo.duration}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Attention and concentration measurement results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Attention</span>
                    <div className="flex items-center space-x-2">
                      {getPerformanceIcon(testResults.performance.attentiveness)}
                      <span className={`font-bold ${getPerformanceColor(testResults.performance.attentiveness)}`}>
                        {testResults.performance.attentiveness}%
                      </span>
                    </div>
                  </div>
                  <Progress value={testResults.performance.attentiveness} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Impulse Control</span>
                    <div className="flex items-center space-x-2">
                      {getPerformanceIcon(testResults.performance.impulsivity)}
                      <span className={`font-bold ${getPerformanceColor(testResults.performance.impulsivity)}`}>
                        {testResults.performance.impulsivity}%
                      </span>
                    </div>
                  </div>
                  <Progress value={testResults.performance.impulsivity} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Consistency</span>
                    <div className="flex items-center space-x-2">
                      {getPerformanceIcon(testResults.performance.consistency)}
                      <span className={`font-bold ${getPerformanceColor(testResults.performance.consistency)}`}>
                        {testResults.performance.consistency}%
                      </span>
                    </div>
                  </div>
                  <Progress value={testResults.performance.consistency} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Technical Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Omission Errors:</span>
                  <span className="font-semibold">{testResults.performance.omissionErrors}</span>
                </div>
                <div className="flex justify-between">
                  <span>Commission Errors:</span>
                  <span className="font-semibold">{testResults.performance.commissionErrors}</span>
                </div>
                <div className="flex justify-between">
                  <span>Response Time:</span>
                  <span className="font-semibold">{testResults.performance.responseTime} ms</span>
                </div>
                <div className="flex justify-between">
                  <span>RT Variability:</span>
                  <span className="font-semibold">{testResults.performance.responseTimeVariability} ms</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Results Interpretation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Overall:</span>
                    <span className={`font-semibold ${
                      testResults.performance.attentiveness >= 60 && 
                      testResults.performance.impulsivity >= 60 && 
                      testResults.performance.consistency >= 60 
                        ? 'text-success' 
                        : 'text-destructive'
                    }`}>
                      {testResults.performance.attentiveness >= 60 && 
                       testResults.performance.impulsivity >= 60 && 
                       testResults.performance.consistency >= 60 
                        ? 'Normal' 
                        : 'Impaired'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Attention:</span>
                    <span className={`font-semibold ${getPerformanceColor(testResults.performance.attentiveness)}`}>
                      {testResults.performance.attentiveness >= 80 ? 'Good' : 
                       testResults.performance.attentiveness >= 60 ? 'Fair' : 'Needs Improvement'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impulse Control:</span>
                    <span className={`font-semibold ${getPerformanceColor(testResults.performance.impulsivity)}`}>
                      {testResults.performance.impulsivity >= 80 ? 'Good' : 
                       testResults.performance.impulsivity >= 60 ? 'Fair' : 'Needs Improvement'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consistency:</span>
                    <span className={`font-semibold ${getPerformanceColor(testResults.performance.consistency)}`}>
                      {testResults.performance.consistency >= 80 ? 'Good' : 
                       testResults.performance.consistency >= 60 ? 'Fair' : 'Needs Improvement'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-center text-muted-foreground">
                <p>Consult with a mental health professional for a more in-depth interpretation of the results.</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            <Button variant="outline" size="lg" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
            <Button 
              size="lg" 
              onClick={() => {
                const emailSubject = encodeURIComponent('TOVA Test Results - ' + testResults.participantInfo.name);
                const emailBody = encodeURIComponent(`
TOVA Test Results

Name: ${testResults.participantInfo.name}
Email: ${testResults.participantInfo.email}
Test Date: ${testResults.participantInfo.testDate}
Test Duration: ${testResults.participantInfo.duration}

PERFORMANCE METRICS:
- Attention: ${testResults.performance.attentiveness}%
- Impulse Control: ${testResults.performance.impulsivity}%
- Consistency: ${testResults.performance.consistency}%

TECHNICAL DATA:
- Omission Errors: ${testResults.performance.omissionErrors}
- Commission Errors: ${testResults.performance.commissionErrors}
- Response Time: ${testResults.performance.responseTime} ms
- RT Variability: ${testResults.performance.responseTimeVariability} ms

Consult with a mental health professional for a more in-depth interpretation of the results.
                `);
                window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`);
              }}
            >
              Email Results
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Results;
