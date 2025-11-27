"use client";

import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export function MiniAppClient() {
  useEffect(() => {
    // Hide splash screen when app is ready
    sdk.actions.ready({ disableNativeGestures: false });
  }, []);

  return null;
}
