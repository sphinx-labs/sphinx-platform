// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FailsDeployment {
    constructor(bool _shouldRevert) {
        if (block.chainid == 59141 && block.number > 500 && _shouldRevert) {
            revert("revert");
        }
    }
}
