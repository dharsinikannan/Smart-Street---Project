const hre = require("hardhat");

async function main() {
  const PermitRegistry = await hre.ethers.getContractFactory("PermitRegistry");
  const permitRegistry = await PermitRegistry.deploy();

  await permitRegistry.waitForDeployment();

  const address = await permitRegistry.getAddress();
  console.log(`PermitRegistry deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
