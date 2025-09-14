declare global {
  interface EthereumProvider {
    request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>;
    on?: (event: string, handler: (...args: any[]) => void) => void;
    removeListener?: (event: string, handler: (...args: any[]) => void) => void;
    isMetaMask?: boolean;
  }

  interface Window {
    /**
     * Navigate to the auth page with a custom redirect URL
     * @param redirectUrl - URL to redirect to after successful authentication
     */
    navigateToAuth: (redirectUrl: string) => void;

    // Add EIP-1193 provider (MetaMask, etc.)
    ethereum?: EthereumProvider;
  }
}

export {};