import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Shield } from "lucide-react";
import logoImage from "@assets/Screenshot 2025-07-05 at 16.37.55_1751705681308.png";

export default function Login() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        localStorage.setItem("anonymousboard_auth", "true");
        setLocation("/board");
      } else {
        toast({
          title: "Access Denied",
          description: "Invalid password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="pt-8 p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mx-auto mb-4">
              <img 
                src={logoImage}
                alt="NS Flag Logo" 
                className="h-12 w-auto object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">NS Confessions</h1>
            <p className="text-slate-600">Enter the NS WiFi password to gain access.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                placeholder="Enter password"
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: '#0f162b', borderColor: '#0f162b' }}
              disabled={isLoading}
            >
              {isLoading ? (
                "Verifying..."
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Access NS Confessions
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 mb-3">
              Vibecoded at an NS learnathon by{' '}
              <a 
                href="https://x.com/ameyonx" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                @AmeyOnX
              </a>
            </p>
            <p className="text-xs text-slate-500 flex items-center justify-center">
              <Shield className="h-3 w-3 mr-1" />
              Your messages are completely anonymous
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
