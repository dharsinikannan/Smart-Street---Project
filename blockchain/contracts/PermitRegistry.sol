// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PermitRegistry {
    // Mapping from permit hash to boolean (true if valid/issued)
    mapping(bytes32 => bool) public permits;

    event PermitIssued(bytes32 indexed permitHash, uint256 timestamp);

    /**
     * @dev Records a new permit hash on the blockchain.
     * @param permitHash The SHA-256 or Keccak-256 hash of the permit data.
     */
    function issuePermit(bytes32 permitHash) external {
        require(!permits[permitHash], "Permit already issued");
        permits[permitHash] = true;
        emit PermitIssued(permitHash, block.timestamp);
    }

    /**
     * @dev Checks if a permit hash is valid (exists).
     * @param permitHash The hash to check.
     */
    function isValid(bytes32 permitHash) external view returns (bool) {
        return permits[permitHash];
    }
}
