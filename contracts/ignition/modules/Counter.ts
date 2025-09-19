import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CounterModule = buildModule("counter", (m) => {
  const initialCount = m.getParameter("initialCount", 0);

  const counter = m.contract("Counter", [
    initialCount,
  ]);

  return { counter };
});

export default CounterModule;
