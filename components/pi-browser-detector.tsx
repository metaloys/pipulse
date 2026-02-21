'use client';

import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';

export function PiBrowserDetector() {
  const [isNotPiBrowser, setIsNotPiBrowser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if window.Pi exists (Pi Network browser API)
    const checkPiBrowser = () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      // Check if already available
      if ((window as any).Pi) {
        console.log("✅ Pi SDK detected immediately");
        setIsLoading(false);
        return;
      }

      // Give Pi SDK more time to load (up to 3 seconds)
      // Check every 100ms instead of just once
      let attempts = 0;
      const maxAttempts = 30; // 30 * 100ms = 3 seconds

      const timer = setInterval(() => {
        attempts++;
        const hasPiSDK = Boolean((window as any).Pi);
        
        if (hasPiSDK) {
          console.log(`✅ Pi SDK detected after ${attempts * 100}ms`);
          clearInterval(timer);
          setIsLoading(false);
          return;
        }

        if (attempts >= maxAttempts) {
          console.log("⚠️ Pi SDK not detected after 3 seconds - not in Pi Browser");
          clearInterval(timer);
          setIsNotPiBrowser(true);
          setIsLoading(false);
        }
      }, 100);
    };

    checkPiBrowser();
  }, []);

  // Don't show anything while checking
  if (isLoading) {
    return null;
  }

  // Don't show anything if Pi Browser detected
  if (!isNotPiBrowser) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="glassmorphism border-white/10 p-8 max-w-md mx-4 space-y-6">
        {/* Icon */}
        <div className="text-center">
          <div className="inline-block p-4 rounded-2xl bg-linear-to-br from-amber-500 to-orange-600">
            <svg
              className="w-12 h-12 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5m-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11m3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">Pi Browser Required</h1>
          <p className="text-white/70">
            PiPulse works best in the Pi Browser. This is where you can earn Pi coins!
          </p>
        </div>

        {/* Key Benefits */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="shrink-0 text-amber-400 font-bold mt-0.5">✓</span>
            <div>
              <div className="text-white font-medium">Secure Pi Transactions</div>
              <div className="text-sm text-white/60">Pay with Pi coins directly</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="shrink-0 text-amber-400 font-bold mt-0.5">✓</span>
            <div>
              <div className="text-white font-medium">Earn Rewards</div>
              <div className="text-sm text-white/60">Complete tasks and get paid in Pi</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="shrink-0 text-amber-400 font-bold mt-0.5">✓</span>
            <div>
              <div className="text-white font-medium">Full Experience</div>
              <div className="text-sm text-white/60">All features unlock in Pi Browser</div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => window.open('https://pi.app', '_blank')}
          className="w-full bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-6"
        >
          Download Pi Browser →
        </Button>

        {/* Info Text */}
        <p className="text-xs text-white/50 text-center">
          Available on iOS and Android. Join 40+ million users.
        </p>

        {/* Continue Anyway (for testing) */}
        <Button
          onClick={() => setIsNotPiBrowser(false)}
          variant="ghost"
          className="w-full text-white/60 hover:text-white"
        >
          Continue Anyway
        </Button>
      </Card>
    </div>
  );
}
