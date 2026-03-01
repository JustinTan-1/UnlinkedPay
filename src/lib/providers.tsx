"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { UnlinkProvider } from "@unlink-xyz/react";
import { wagmiConfig } from "./config";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <UnlinkProvider chain="monad-testnet" autoSync={true} syncInterval={5000}>
          {children}
        </UnlinkProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
