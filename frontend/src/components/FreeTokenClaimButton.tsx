"use client";

import React from "react";

interface FreeTokenClaimButtonProps {
  marketId: number;
  onClaimComplete?: () => void;
  className?: string;
  showWhenDisconnected?: boolean;
  marketTypeOverride?: number;
}

export function FreeTokenClaimButton({
  marketId,
  onClaimComplete,
  className,
  showWhenDisconnected = true,
  marketTypeOverride,
}: FreeTokenClaimButtonProps) {
  // Feature disabled for MVP on Celo Alfajores due to missing FreeClaimHandler contract
  return null;
}
