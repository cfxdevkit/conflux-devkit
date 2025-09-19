import { mnemonicToSeedSync } from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { privateKeyToAccount as evmPrivateKeyToAccount } from 'viem/accounts';

const bip32 = BIP32Factory(ecc);

function derivePrivateKey(mnemonic: string, path: string): string {
  const seed = mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed);
  const child = root.derivePath(path);
  if (!child.privateKey) throw new Error(`No private key at path ${path}`);
  return `0x${child.privateKey.toString('hex')}`;
}

function evmAddressFromPrivateKey(pk: string): string {
  return evmPrivateKeyToAccount(pk).address;
}

describe('Derivation paths produce expected EVM addresses', () => {
  test('Provided mnemonic derivation matches observed addresses', () => {
    const mnemonic = 'math exact mail easily trophy awkward creek wire okay diamond snow decade';
    const confluxPath = "m/44'/503'/0'/0/0";
    const ethPath = "m/44'/60'/0'/0/0";

    const confluxPk = derivePrivateKey(mnemonic, confluxPath);
    const ethPk = derivePrivateKey(mnemonic, ethPath);

    expect(evmAddressFromPrivateKey(confluxPk).toLowerCase()).toBe('0x42dd162696e709314c4931797e2f7ea4c0868ad3');
    expect(evmAddressFromPrivateKey(ethPk).toLowerCase()).toBe('0xbc621b293c3a35078d3520dec246e70de40bba15');
  });

  test('Repository test mnemonic derivation matches known addresses', () => {
    const mnemonic = 'test test test test test test test test test test test junk';
    const confluxPath = "m/44'/503'/0'/0/0";
    const ethPath = "m/44'/60'/0'/0/0";

    const confluxPk = derivePrivateKey(mnemonic, confluxPath);
    const ethPk = derivePrivateKey(mnemonic, ethPath);

    expect(evmAddressFromPrivateKey(confluxPk).toLowerCase()).toBe('0x861db721d8b3f501d6cc1de85c5579def881ceae');
    expect(evmAddressFromPrivateKey(ethPk).toLowerCase()).toBe('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
  });
});
