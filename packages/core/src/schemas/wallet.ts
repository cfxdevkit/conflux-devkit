// Wallet validation schemas using Zod

import { z } from 'zod';

export const WalletInfoSchema = z.object({
  index: z.number().int().min(0),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  privateKey: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  mnemonic: z.string().optional(),
  balance: z.bigint().optional(),
  balanceFormatted: z.string().optional(),
  isMining: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const WalletInputSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  privateKey: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  mnemonic: z.string().optional(),
});

export const WalletConfigSchema = z.object({
  type: z.enum(['mnemonic', 'privateKey']),
  value: z.string().min(1),
  index: z.number().int().min(0).optional(),
});

export type WalletInfoType = z.infer<typeof WalletInfoSchema>;
export type WalletInputType = z.infer<typeof WalletInputSchema>;
export type WalletConfigType = z.infer<typeof WalletConfigSchema>;
