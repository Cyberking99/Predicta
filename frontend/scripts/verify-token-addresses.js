/**
 * Script to verify token addresses on BSC Testnet
 * Run with: node scripts/verify-token-addresses.js
 */

import { createPublicClient, http } from 'viem';
import { celoAlfajores } from 'viem/chains';

// Token addresses from .env
const cUSD_ADDRESS = '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b';
const USDC_ADDRESS = '0x01C5C0122039549AD1493B8220cABEdD739BC44E';

// ERC20 ABI for basic token info
const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
];

// Create public client for BSC Testnet
const client = createPublicClient({
  chain: celoAlfajores,
  transport: http('https://rpc.ankr.com/celo_sepolia'),
});

async function verifyToken(address, tokenName) {
  console.log(`\n🔍 Verifying ${tokenName} at ${address}...`);

  try {
    // Check if address has code (is a contract)
    const code = await client.getBytecode({ address });

    if (!code || code === '0x') {
      console.log(`❌ ${tokenName}: No contract found at this address`);
      return false;
    }

    console.log(`✅ ${tokenName}: Contract exists`);

    // Try to read token info
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        client.readContract({
          address,
          abi: ERC20_ABI,
          functionName: 'name',
        }),
        client.readContract({
          address,
          abi: ERC20_ABI,
          functionName: 'symbol',
        }),
        client.readContract({
          address,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }),
        client.readContract({
          address,
          abi: ERC20_ABI,
          functionName: 'totalSupply',
        }),
      ]);

      console.log(`   Name: ${name}`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Decimals: ${decimals}`);
      console.log(`   Total Supply: ${totalSupply.toString()}`);
      console.log(`   ✅ Valid ERC20 token`);

      return true;
    } catch (error) {
      console.log(`   ⚠️  Contract exists but may not be a standard ERC20 token`);
      console.log(`   Error: ${error.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${tokenName}: Error - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Celo Alfajores Token Address Verification');
  console.log('==========================================');
  console.log(`Network: ${celoAlfajores.name} (Chain ID: ${celoAlfajores.id})`);
  console.log(`RPC: https://rpc.ankr.com/celo_sepolia`);

  const cUSDValid = await verifyToken(cUSD_ADDRESS, 'cUSD');
  const USDCValid = await verifyToken(USDC_ADDRESS, 'USDC');

  console.log('\n📊 Summary');
  console.log('==========');
  console.log(`cUSD: ${cUSDValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`USDC: ${USDCValid ? '✅ Valid' : '❌ Invalid'}`);

  if (!cUSDValid || !USDCValid) {
    console.log('\n⚠️  Some tokens are invalid!');
    console.log('\n💡 Recommended Actions:');
    console.log('1. Check https://sepolia.celoscan.io for verified test tokens');
    console.log('2. Common Celo Alfajores tokens:');
    console.log('   - cUSD: 0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b');
    console.log('   - Or deploy your own test ERC20 tokens');
    console.log('3. Update .env with correct addresses');
    console.log('4. Get test tokens from Celo Alfajores faucet');
  } else {
    console.log('\n✅ All token addresses are valid!');
  }
}

main().catch(console.error);
