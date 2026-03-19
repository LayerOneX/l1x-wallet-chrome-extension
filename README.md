# x_Wallet

x_Wallet is a next-gen crypto wallet Chrome extension with seamless, unmatched interoperability across L1X, EVM-compatible networks, and Solana — all from a single interface.

## Features

- **Multi-Chain Support** — Manage assets across L1X, Ethereum, BSC, Arbitrum, Optimism, Avalanche, Base, Polygon, and Solana from one wallet
- **dApp Integration** — Connect to decentralized applications with full EVM JSON-RPC compatibility and message signing
- **Token & NFT Management** — Send, receive, and import custom tokens and NFTs across supported chains
- **Transaction Processing** — Native transfers, token transfers, NFT transfers, contract interactions, and token swaps
- **Custom Networks** — Add and manage custom blockchain networks
- **Security** — Client-side encryption, recovery phrase backup, and private key management — your keys never leave your device
- **Browser Extension** — Chrome Manifest V3 for fast, secure access

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Modular virtual machine architecture (EVM, L1XVM, SolanaVM)

## Getting Started

1. **Clone the repository:**
   ```sh
   git clone https://github.com/L1X-Foundation-Public/l1x-wallet-chrome-extension.git
   cd l1x-wallet-chrome-extension
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Run in development mode:**
   ```sh
   npm run dev
   ```

4. **Build for production:**
   ```sh
   npm run build
   ```

5. **Load in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist/` folder

## For Developers

- **API Integration:** Refer to the <a href="https://static-website-l1x-wallet-chrome-extension-public.s3.eu-west-1.amazonaws.com/docs/interfaces/IXWalletAPI.html" target="_blank">API documentation</a> to integrate x_Wallet functionalities into your applications.
- **Examples:** Check out the <a href="https://static-website-l1x-wallet-chrome-extension-public.s3.eu-west-1.amazonaws.com/example/index.html" target="_blank">integration examples</a>.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -m "Description of changes"`)
4. Push to your fork (`git push origin feature-name`)
5. Open a Pull Request

Please ensure your code is clean, well-tested, and follows the existing code style.

## Reporting Issues

If you encounter bugs or have suggestions, please open an issue on GitHub with steps to reproduce, your environment details, and any relevant logs or screenshots.

## License

See [LICENSE](./LICENSE) for details.
