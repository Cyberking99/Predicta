"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function OnboardingModal() {
  const [step, setStep] = useState<"buy" | "done">("buy");
  const [isOpen, setIsOpen] = useState(false);
  const [onboardingTriggered, setOnboardingTriggered] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("hasCompletedOnboarding")) {
      setIsOpen(true);
      setOnboardingTriggered(true);
    }
  }, []);

  // Replace with your actual token addresses
  const USDC_CAIP19 =
    "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const CAIP_ETH = "eip155:8453/native";
  const BUSTER_CAIP19 =
    "eip155:8453/erc20:0x53Bd7F868764333de01643ca9102ee4297eFA3cb";

  const handleBuyBuster = async (sellToken: string) => {
    // Placeholder for buy logic
    console.log("Buy Buster with", sellToken);
    setStep("done");
    setIsOpen(false);
    localStorage.setItem("hasCompletedOnboarding", "true");
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("hasCompletedOnboarding", "true");
  };

  const handleDialogOpeChange = (open: boolean) => {
    setIsOpen(open);
    if (
      !open &&
      onboardingTriggered &&
      !localStorage.getItem("hasCompletedOnboarding")
    ) {
      localStorage.setItem("hasCompletedOnboarding", "true");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpeChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "buy" && "Buy $Buster"}
          </DialogTitle>
        </DialogHeader>
        {step === "buy" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              Welcome! Buy your $Buster tokens to start playing.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => handleBuyBuster(USDC_CAIP19)}
                className="bg-gray-800 text-white hover:bg-gray-900"
              >
                Buy with USDC
              </Button>
              <Button
                onClick={() => handleBuyBuster(CAIP_ETH)}
                className="bg-gray-800 text-white hover:bg-gray-900"
              >
                Buy with ETH
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Skip
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
