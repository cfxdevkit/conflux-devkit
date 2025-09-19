// Network validation schemas using Zod

import { z } from 'zod';

export const NetworkConfigSchema = z.object({
  name: z.string().min(1),
  rpcUrl: z.string().url(),
  chainId: z.number().int().min(1),
  evmChainId: z.number().int().min(1).optional(),
  currency: z.object({
    name: z.string().min(1),
    symbol: z.string().min(1),
    decimals: z.number().int().min(0).max(18),
  }),
  isTestnet: z.boolean(),
});

export const TransactionRequestSchema = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  value: z.bigint().optional(),
  data: z
    .string()
    .regex(/^0x[a-fA-F0-9]*$/)
    .optional(),
  gasLimit: z.bigint().optional(),
  gasPrice: z.bigint().optional(),
});

export const ContractInfoSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  abi: z.array(z.any()), // ABI validation is complex, using any for now
  name: z.string().min(1),
  version: z.string().optional(),
  deployedAt: z.date().optional(),
  network: z.string().min(1),
});

export type NetworkConfigType = z.infer<typeof NetworkConfigSchema>;
export type TransactionRequestType = z.infer<typeof TransactionRequestSchema>;
export type ContractInfoType = z.infer<typeof ContractInfoSchema>;
