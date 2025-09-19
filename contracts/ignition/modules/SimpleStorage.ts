import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SimpleStorageModule = buildModule("simpleStorage", (m) => {
  const name = m.getParameter("name", "MyStorage");
  const initialValue = m.getParameter("initialValue", 42);

  const simpleStorage = m.contract("SimpleStorage", [
    name,
    initialValue,
  ]);

  return { simpleStorage };
});

export default SimpleStorageModule;
