import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Shield } from "lucide-react";

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
              <svg className="h-12 w-16" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Flag pole */}
                <rect x="8" y="10" width="4" height="60" fill="#374151" />
                <circle cx="10" cy="10" r="3" fill="#374151" />
                {/* Flag with wavy effect */}
                <path d="M12 15 C50 15 60 20 90 15 C100 25 90 35 90 40 C60 45 50 40 12 40 Z" fill="#1e3a8a" />
                {/* Cross on flag */}
                <rect x="45" y="22" width="6" height="16" fill="white" />
                <rect x="35" y="27" width="26" height="6" fill="white" />
              </svg>
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
