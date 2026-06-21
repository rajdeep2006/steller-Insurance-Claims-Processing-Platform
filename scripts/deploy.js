const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  console.log(`Running: ${cmd}`);
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

async function main() {
  try {
    console.log("=== Step 1: Building contract ===");
    run("stellar contract build");

    console.log("=== Step 2: Generating or retrieving Testnet identity ===");
    let deployerAddr = "";
    try {
      deployerAddr = run("stellar keys address deployer");
      console.log(`Using existing deployer identity: ${deployerAddr}`);
    } catch (e) {
      console.log("Creating new deployer identity...");
      run("stellar keys generate deployer --network testnet");
      deployerAddr = run("stellar keys address deployer");
      console.log(`Created deployer identity: ${deployerAddr}`);
    }

    console.log("=== Step 3: Deploying/Getting Native Stellar Asset Contract (XLM) ===");
    const nativeAssetAddr = run("stellar contract id asset --asset native --network testnet");
    console.log(`Native Asset Contract Address: ${nativeAssetAddr}`);

    console.log("=== Step 4: Deploying Insurance Claims contract ===");
    const wasmPath = "target/wasm32v1-none/release/soroban_insurance_contract.wasm";
    const contractId = run(`stellar contract deploy --wasm ${wasmPath} --source deployer --network testnet`);
    console.log(`Deployed Contract ID: ${contractId}`);

    console.log("=== Step 5: Initializing contract ===");
    run(`stellar contract invoke --id ${contractId} --source deployer --network testnet -- initialize --admin ${deployerAddr} --token ${nativeAssetAddr}`);
    console.log("Contract initialized successfully!");

    console.log("=== Step 6: Saving configuration ===");
    const configPath = path.join(__dirname, '../src/lib/config.json');
    const configData = {
      contractId: contractId,
      tokenId: nativeAssetAddr,
      adminAddress: deployerAddr
    };
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    console.log(`Saved configuration to ${configPath}:`, configData);

  } catch (err) {
    console.error("Deployment failed:", err.message);
    process.exit(1);
  }
}

main();
