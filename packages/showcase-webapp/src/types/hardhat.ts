export interface HardhatScript {
  id: string;
  name: string;
  path: string;
  description?: string;
  parameters: ScriptParameter[];
  estimatedGas?: string;
  dependencies?: string[];
}

export interface ScriptParameter {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface DeployConfig {
  scriptId: string;
  parameters: Record<string, any>;
  gasLimit?: string;
  gasPrice?: string;
  value?: string;
  confirmations?: number;
}