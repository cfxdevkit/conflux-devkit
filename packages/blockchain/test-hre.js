const { DevkitHREDeploymentService } = require('./dist/index.js');

async function testHREIntegration() {
  console.log('🧪 Testing Devkit HRE Integration...');

  const hreService = new DevkitHREDeploymentService();

  try {
    // Test if Hardhat is available
    console.log('🔍 Checking Hardhat availability...');
    const isAvailable = await hreService.isHardhatAvailable();
    console.log(`Hardhat available: ${isAvailable}`);

    if (isAvailable) {
      // Test getting available modules
      console.log('📦 Getting available modules...');
      const modules = await hreService.getModules();
      console.log(`Available modules: ${modules.map(m => m.name).join(', ')}`);

      // Test deployment (this will fail if no network is running, but we can test the setup)
      console.log('🚀 Testing deployment setup...');
      try {
        const result = await hreService.deployContract(
          'Counter',
          'confluxESpaceLocal'
        );
        console.log(`Deployment result: ${JSON.stringify(result, null, 2)}`);
      } catch (error) {
        console.log(`Expected deployment error (no network): ${error.message}`);
      }
    } else {
      console.log(
        '⚠️ Hardhat not available - this is expected if contracts directory is not set up'
      );
    }

    console.log('✅ HRE Integration test completed');
  } catch (error) {
    console.error('❌ HRE Integration test failed:', error);
  }
}

// Run the test
testHREIntegration().catch(console.error);
