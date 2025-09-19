const hre = require("hardhat");

async function main() {
  console.log("Deploying Counter contract to Conflux eSpace...");

  // Get the contract factory
  const Counter = await hre.viem.getContractFactory("Counter");

  // Deploy with initial count of 0
  const counter = await Counter.deploy([0]);

  console.log(`Counter deployed to: ${counter.address}`);

  // Verify on ConfluxScan if not local
  const network = hre.network.name;
  if (network !== "hardhat" && network !== "cfxlocal") {
    console.log("Waiting for block confirmations...");

    // Wait for a few block confirmations
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log("Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: counter.address,
        constructorArguments: [0],
      });
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  return {
    counter: counter,
    address: counter.address,
  };
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;