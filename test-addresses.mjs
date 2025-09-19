import { BIP32Factory } from 'bip32';
import { mnemonicToSeedSync } from 'bip39';
import * as ecc from 'tiny-secp256k1';
import { privateKeyToAccount } from 'viem/accounts';

const bip32 = BIP32Factory(ecc);
const testMnemonic =
  'test test test test test test test test test test test junk';
const seed = mnemonicToSeedSync(testMnemonic);
const root = bip32.fromSeed(seed);

console.log('Test Mnemonic:', testMnemonic);
console.log('');

// Ethereum path (what wallets like MetaMask use)
const ethChild = root.derivePath("m/44'/60'/0'/0/0");
const ethPrivateKey = `0x${ethChild.privateKey.toString('hex')}`;
const ethAccount = privateKeyToAccount(ethPrivateKey);
console.log("🦊 Ethereum/MetaMask path (m/44'/60'/0'/0/0):");
console.log('  Private Key:', ethPrivateKey);
console.log('  Address:', ethAccount.address);
console.log('');

// Conflux path (what DevKit currently uses)
const cfxChild = root.derivePath("m/44'/503'/0'/0/0");
const cfxPrivateKey = `0x${cfxChild.privateKey.toString('hex')}`;
const cfxAccount = privateKeyToAccount(cfxPrivateKey);
console.log("⚡ Conflux DevKit path (m/44'/503'/0'/0/0):");
console.log('  Private Key:', cfxPrivateKey);
console.log('  Address:', cfxAccount.address);
console.log('');

console.log(
  '🚨 PROBLEM: Wallet connects with Ethereum address, but DevKit expects Conflux address!'
);
console.log('   Wallet address:  ', ethAccount.address);
console.log('   DevKit address: ', cfxAccount.address);
console.log(
  '   Match:',
  ethAccount.address.toLowerCase() === cfxAccount.address.toLowerCase()
    ? '✅'
    : '❌'
);
