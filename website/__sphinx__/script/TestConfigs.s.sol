// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Network, DeployOptions, Version } from "@sphinx-labs/contracts/SphinxPluginTypes.sol";
import { Script, console } from "forge-std/Script.sol";
import { HelloSphinx } from "../contracts/HelloSphinx.sol";
import { CREATE3 } from "solady/utils/CREATE3.sol";
import { Sphinx } from "@sphinx-labs/contracts/Sphinx.sol";
import { FailsDeployment } from "../contracts/FailsDeployment.sol";

abstract contract AbstractConfig is Script, Sphinx {

  address ownerAddress = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
  address ownerTwoAddress = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
  address ownerThreeAddress = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;

  string orgId = vm.envString("SPHINX_ORG_ID");
  string[] mainnets = ["optimism", "ethereum"];
  string[] testnets = ["arbitrum_sepolia", "sepolia", "optimism_sepolia"];

  mapping (Network => uint) public myNumber;

  function fetchMyNumber() internal view returns (uint8) {
    if (block.chainid == 11155420) {
      return 2;
    } else if (block.chainid == 421614 || block.chainid == 11155111) {
      return 3;
    } else {
      return 1;
    }
  }

  function fetchMyAddress() internal view returns (address) {
    if (block.chainid == 421614 || block.chainid == 11155111) {
      return 0x0000000000000000000000000000000000000033;
    } else {
      return 0x0000000000000000000000000000000000000011;
    }
  }

  function deployBaseContracts() internal {
    bytes memory initCode = abi.encodePacked(
      type(HelloSphinx).creationCode,
      abi.encode(
        fetchMyNumber(),
        fetchMyAddress()
      )
    );
    CREATE3.deploy(keccak256(abi.encodePacked(safeAddress())), initCode, 0);
  }
}

contract EOAOwnerConfig is AbstractConfig {
  string projectName = "Sphinx-Website-Test-EOAOwnerTest";

  function configureSphinx() public override {
    sphinxConfig.projectName = projectName;
    sphinxConfig.testnets = testnets;
    sphinxConfig.mainnets = mainnets;
  }

  function run() public sphinx {
    deployBaseContracts();
  }
}

contract AirdropConfig is AbstractConfig {
  string projectName = "Sphinx-Website-Test-AirdropConfig";

  function configureSphinx() public override {
    sphinxConfig.projectName = projectName;
    sphinxConfig.testnets = testnets;
    sphinxConfig.mainnets = mainnets;
  }

  function run() public sphinx {
    fundSafe(0.06 ether);
    new HelloSphinx{ value: 0.01 ether }(0, address(0));
    (bool success, ) = payable(address(2)).call{ value: 0.02 ether}("");
    require(success);
  }
}

contract MultiSigOwnerProposerConfig is AbstractConfig {
  string projectName = "Sphinx-Website-Test-MultiSigOwnerProposerTest";

  function configureSphinx() public override {
    sphinxConfig.projectName = projectName;
    sphinxConfig.testnets = testnets;
    sphinxConfig.mainnets = mainnets;
  }

  function run() public sphinx {
    deployBaseContracts();
  }
}

contract MultiSigOwnerConfig is AbstractConfig {
  string projectName = "Sphinx-Website-Test-MultiSigOwnerWithDifferentProposerTest";

  function configureSphinx() public override {
    sphinxConfig.projectName = projectName;
    sphinxConfig.testnets = testnets;
    sphinxConfig.mainnets = mainnets;
  }

  function run() public sphinx {
    deployBaseContracts();
  }
}

abstract contract CancelConfigAbstract is AbstractConfig {
  string projectName = "Sphinx-Website-Test-CancelTest";

  function configureSphinx() public override {
    sphinxConfig.projectName = projectName;
    sphinxConfig.testnets = testnets;
    sphinxConfig.mainnets = mainnets;
  }

  function deployBase(uint8 _myNumber) internal {
    new HelloSphinx{ salt: 0 }(
      _myNumber,
      0x0000000000000000000000000000000000000011
    );
  }
}

contract CancelConfigOne is CancelConfigAbstract {
  function run() public sphinx {
    deployBase(1);
  }
}

contract CancelConfigTwo is CancelConfigAbstract {
  function run() public sphinx {
    deployBase(2);
  }
}

contract SimultaneousProposalConfig is AbstractConfig {
  string projectName = "Sphinx-Website-Test-SimultaneousProposalTest";

  function configureSphinx() public override {
    sphinxConfig.projectName = projectName;
    sphinxConfig.testnets = testnets;
    sphinxConfig.mainnets = mainnets;
  }

  function run() public sphinx {
    deployBaseContracts();
  }
}

abstract contract ReproposeConfigAbstract is AbstractConfig {
  string projectName = "Sphinx-Website-Test-ReproposeTest";

  function configureSphinx() public override {
    sphinxConfig.projectName = projectName;
    sphinxConfig.testnets = testnets;
    sphinxConfig.mainnets = mainnets;
  }

  function deployBase(uint8 _myNumber) internal {
    new HelloSphinx{ salt: keccak256("1") }(
      _myNumber,
      0x0000000000000000000000000000000000000011
    );
  }
}

contract ReproposeConfigZero is ReproposeConfigAbstract {
  function run() public sphinx {
    deployBase(1);
  }
}

contract ReproposeConfigOne is ReproposeConfigAbstract {
  function run() public sphinx {
    deployBase(1);
  }
}

contract ReproposeConfigTwo is ReproposeConfigAbstract {
  function run() public sphinx {
    deployBase(2);
  }
}

contract PostDeploymentConfig is AbstractConfig {
  string projectName = "Sphinx-Website-Test-PostDeploymentTest";

  function configureSphinx() public override {
    sphinxConfig.projectName = projectName;
    sphinxConfig.testnets = testnets;
    sphinxConfig.mainnets = mainnets;
  }

  function run() public sphinx {
    HelloSphinx helloSphinx = new HelloSphinx{ salt: keccak256("2") }(
      1,
      0x0000000000000000000000000000000000000011
    );
    helloSphinx.increment();
    helloSphinx.increment();
    helloSphinx.increment();
    helloSphinx.set(0x0000000000000000000000000000000000000022);
  }
}

contract PostDeploymentFailureConfig is AbstractConfig {
  string projectName = "Sphinx-Website-Test-PostDeploymentFailureTest";
  string[] customTestnets = ["linea_sepolia", "sepolia", "optimism_sepolia"];

  function configureSphinx() public override {
    sphinxConfig.projectName = projectName;
    sphinxConfig.testnets = customTestnets;
    sphinxConfig.mainnets = mainnets;
  }

  function run() public sphinx {
    HelloSphinx helloSphinx = new HelloSphinx{ salt: keccak256("3") }(
      1,
      0x0000000000000000000000000000000000000011
    );
    helloSphinx.doRevert();
  }
}

abstract contract ContractDeploymentFailureConfigAbstract is AbstractConfig {
  string projectName = "Sphinx-Website-Test-ContractDeploymentFailureTest";
  string[] customTestnets = ["linea_sepolia"];

  function configureSphinx() public override {
    sphinxConfig.projectName = projectName;
    sphinxConfig.testnets = customTestnets;
    sphinxConfig.mainnets = mainnets;
  }
}

contract ContractDeploymentFailureConfigOne is ContractDeploymentFailureConfigAbstract {
  function run() public sphinx {
    new FailsDeployment{ salt: 0 }(true);
  }
}

contract ContractDeploymentFailureConfigTwo is ContractDeploymentFailureConfigAbstract {
  function run() public sphinx {
    new FailsDeployment{ salt: 0}(false);
  }
}

contract AssertProjectNotCurrentylExecutingConfig is Script, Sphinx {
  function configureSphinx() public override {
    sphinxConfig.projectName = 'Sphinx-Website-Test-AssertProjectNotCurrentylExecutingConfig';
    sphinxConfig.testnets = ["arbitrum_sepolia", "sepolia", "optimism_sepolia"];
    sphinxConfig.mainnets = ["optimism", "ethereum"];
  }

  function run() public sphinx {
    new HelloSphinx(
      1,
      0x0000000000000000000000000000000000000011
    );
  }
}