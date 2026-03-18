import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { celo, celoAlfajores } from 'wagmi/chains';

/**
 * Wagmi config for MiniPay Mini Apps.
 * - injected() connector talks to window.ethereum (MiniPay's injected provider)
 * - Celo mainnet + Alfajores testnet (standard for MiniPay)
 */
export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [injected()],
  transports: {
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
  },
});
