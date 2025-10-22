// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IEntropyConsumer } from "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";
import { IEntropyV2 } from "@pythnetwork/entropy-sdk-solidity/IEntropyV2.sol";

/**
 * @title PythEntropyExample
 * @notice Minimal working contract for on-chain randomness using Pyth Entropy V2.
 * Compatible with Arbitrum Sepolia Entropy deployment.
 */
contract PythEntropyExample is IEntropyConsumer {
    // Address of the main Entropy contract (Arbitrum Sepolia)
    IEntropyV2 public entropy;

    // Mapping from sequence number to random number
    mapping(uint64 => bytes32) public randomResults;

    event Requested(uint64 sequenceNumber);
    event Fulfilled(uint64 sequenceNumber, bytes32 randomNumber);

    constructor(address entropyAddress) {
        entropy = IEntropyV2(entropyAddress);
    }

    /// @notice Requests a random number from Pyth Entropy.
    function requestRandomNumber() external payable {
        uint256 fee = entropy.getFeeV2();
        require(msg.value >= fee, "fee too low");

        uint64 seq = entropy.requestV2{ value: fee }();
        randomResults[seq] = bytes32(0);
        emit Requested(seq);

        if (msg.value > fee) {
            payable(msg.sender).transfer(msg.value - fee);
        }
    }

    /**
     * @notice This callback is invoked by the Entropy contract.
     * @param sequenceNumber The request sequence ID.
     * @param randomNumber The generated random number.
     *
     * IMPORTANT:
     *  - Must be `internal override`
     *  - Must NOT revert
     *  - Must exist in the same contract that made the request
     */
    function entropyCallback(
        uint64 sequenceNumber,
        address /* provider */,
        bytes32 randomNumber
    ) internal override {
        randomResults[sequenceNumber] = randomNumber;
        emit Fulfilled(sequenceNumber, randomNumber);
    }

    /// @notice Returns the Entropy contract address. Required by IEntropyConsumer.
    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }
}
