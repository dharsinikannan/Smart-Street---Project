const { ethers } = require("ethers");
require("dotenv").config();

const RPC_URL = process.env.POLYGON_RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const ABI = [
  "function issuePermit(bytes32 permitHash) external",
  "function isValid(bytes32 permitHash) external view returns (bool)"
];

const getContract = () => {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        return new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
    } catch (err) {
        console.error("[Blockchain] Init Error:", err.message);
        throw err;
    }
}

const recordPermitOnChain = async (permitDataStr) => {
    try {
        if (!CONTRACT_ADDRESS) {
            console.warn("[Blockchain] No Contract Address configured.");
            return null;
        }

        const contract = getContract();
        // Create hash of the key data
        // API ensures permitDataStr is a unique string (e.g. permit_id + secret)
        const hash = ethers.id(permitDataStr);
        console.log(`[Blockchain] Recording permit hash: ${hash} for data: ${permitDataStr}`);

        const tx = await contract.issuePermit(hash);
        console.log(`[Blockchain] Transaction sent: ${tx.hash}`);

        // Wait for confirmation (1 block is enough for testing)
        await tx.wait(1);
        console.log(`[Blockchain] Transaction confirmed`);

        return tx.hash;
    } catch (error) {
        console.error("[Blockchain] Error recording permit:", error.message);
        return null; // Fail soft
    }
};

module.exports = {
    recordPermitOnChain
};
