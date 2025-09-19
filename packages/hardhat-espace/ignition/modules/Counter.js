const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const CounterModule = buildModule("CounterModule", (m) => {
  const initialCount = m.getParameter("initialCount", 0);

  const counter = m.contract("Counter", [initialCount]);

  return { counter };
});

module.exports = CounterModule;