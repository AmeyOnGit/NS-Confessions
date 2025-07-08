import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Smartphone, Download, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PWAInstallInstructions() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Check if running in PWA mode on mobile
      if (window.navigator.standalone) {
        setIsInstalled(true);
        return;
      }
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show instructions after a delay if not installed
    const timer = setTimeout(() => {
      if (!isInstalled) {
        setIsVisible(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsVisible(false);
      }
    }
  };

  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return {
        platform: 'iOS',
        steps: [
          'Tap the Share button',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" in the top right corner'
        ],
        icon: <Share className="h-4 w-4" />
      };
    } else if (userAgent.includes('android')) {
      return {
        platform: 'Android',
        steps: [
          'Tap the menu button (⋮)',
          'Tap "Add to Home screen"',
          'Tap "Add" to confirm'
        ],
        icon: <Plus className="h-4 w-4" />
      };
    } else {
      return {
        platform: 'Desktop',
        steps: [
          'Click the install button in the address bar',
          'Or click the menu (⋮) and select "Install app"',
          'Click "Install" to confirm'
        ],
        icon: <Download className="h-4 w-4" />
      };
    }
  };

  if (isInstalled || !isVisible) {
    return null;
  }

  const instructions = getInstallInstructions();

  return (
    <Card className="w-full max-w-md mt-4 border-blue-200 bg-blue-50">
      <CardContent className="pt-4 p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-blue-800">
              Install NS Confessions
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-blue-700 mb-3">
          Add this app to your home screen for quick access and a better experience!
        </p>

        {deferredPrompt && (
          <Button
            onClick={handleInstallClick}
            className="w-full mb-3 text-xs py-2 bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Download className="h-3 w-3 mr-1" />
            Install App
          </Button>
        )}

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs text-blue-700">
            {instructions.icon}
            <span className="font-medium">On {instructions.platform}:</span>
          </div>
          <ol className="text-xs text-blue-600 space-y-1 ml-6">
            {instructions.steps.map((step, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-4 h-4 bg-blue-600 text-white rounded-full text-center leading-4 text-[10px] font-bold mr-2 mt-0.5 flex-shrink-0">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-blue-600">
            ✓ Works offline • ✓ Faster loading • ✓ Native app experience
          </p>
        </div>
      </CardContent>
    </Card>
  );
}