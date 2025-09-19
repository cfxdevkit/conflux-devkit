import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ERC20TokenModule = buildModule("erc20Token", (m) => {
  const name = m.getParameter("name", "Conflux Token");
  const symbol = m.getParameter("symbol", "CFX");
  const decimals = m.getParameter("decimals", 18);
  const initialSupply = m.getParameter("initialSupply", 1000000);

  const erc20Token = m.contract("ERC20Token", [
    name,
    symbol,
    decimals,
    initialSupply,
  ]);

  return { erc20Token };
});

export default ERC20TokenModule;
