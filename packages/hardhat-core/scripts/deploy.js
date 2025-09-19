const hre = require("hardhat");

async function main() {
  console.log("Deploying Counter contract to Conflux Core...");

  // Get the contract factory
  const Counter = await hre.ethers.getContractFactory("Counter");

  // Deploy with initial count of 0
  const counter = await Counter.deploy(0);

  await counter.waitForDeployment();

  const address = await counter.getAddress();
  console.log(`Counter deployed to: ${address}`);

  // Verify on Conflux scan if not local
  const network = hre.network.name;
  if (network !== "hardhat" && network !== "cfxlocal") {
    console.log("Waiting for block confirmations...");
    await counter.deploymentTransaction()?.wait(5);

    console.log("Verifying contract...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [0],
      });
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  return {
    counter: counter,
    address: address,
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