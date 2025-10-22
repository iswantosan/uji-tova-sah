import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Brain } from "lucide-react";

const SetupAdmin = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGrantAdmin = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get current user to check if they're already admin
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Not authenticated");
      }

      // Insert admin role directly using SQL
      const { error } = await (supabase as any)
        .from('user_roles')
        .insert({ 
          user_id: user.id, 
          role: 'admin' 
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Admin role granted successfully!",
      });

      // Redirect to admin page
      window.location.href = "/admin";
    } catch (error: any) {
      console.error('Error granting admin role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to grant admin role",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Brain className="h-12 w-12 text-primary" />
            </div>
            <CardTitle>Setup Admin Access</CardTitle>
            <CardDescription>
              Grant admin privileges to your account to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Your Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleGrantAdmin} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Setting up..." : "Grant Admin Access"}
            </Button>
              <p className="text-sm text-muted-foreground">This will grant admin privileges to your current account.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetupAdmin;