// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { LibAsset } from "../Libraries/LibAsset.sol";
import { ILiFi } from "../Interfaces/ILiFi.sol";
import { LibSwap } from "../Libraries/LibSwap.sol";
import { ISynapse } from "../Interfaces/ISynapse.sol";
import { LibDiamond } from "../Libraries/LibDiamond.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract SynapseFacet is ILiFi {
    /* ========== Storage ========== */

    address it = address(0xdAC17F958D2ee523a2206206994597C13D831ec7);
    address it1 = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
    bytes32 internal constant NAMESPACE = keccak256("com.lifi.facets.synapse");
    struct Storage {
        address synapse;
        uint256 chainId;
    }

    /* ========== Types ========== */

    struct SynapseData {
        address to;
        uint256 chainId;
        IERC20 token;
        IERC20 nUSD;
        uint256 amount;
        uint256 minToMint;
        uint256 liqDeadline;
        uint8 tokenIndexFrom;
        uint8 tokenIndexTo;
        uint256 minDy;
        uint256 swapDeadline;
    }

    /* ========== Init ========== */

    function initSynapse(address _synapse, uint256 _chainId) external {
        Storage storage s = getStorage();
        LibDiamond.enforceIsContractOwner();
        s.synapse = _synapse;
        s.chainId = _chainId;
    }

    /* ========== Public Bridge Functions ========== */

    function startBridgeTokensViaSynapse(LiFiData memory _lifiData, SynapseData calldata _synapseData) public payable {
        if (address(_synapseData.token) != address(0)) {
            uint256 _fromTokenBalance = LibAsset.getOwnBalance(address(_synapseData.token));

            LibAsset.transferFromERC20(address(_synapseData.token), msg.sender, address(this), _synapseData.amount);

            require(
                LibAsset.getOwnBalance(address(_synapseData.token)) - _fromTokenBalance == _synapseData.amount,
                "ERR_INVALID_AMOUNT"
            );
        } else {
            require(msg.value >= _synapseData.amount, "ERR_INVALID_AMOUNT");
        }

        _startBridge(_synapseData);

        emit LiFiTransferStarted(
            _lifiData.transactionId,
            _lifiData.integrator,
            _lifiData.referrer,
            _lifiData.sendingAssetId,
            _lifiData.receivingAssetId,
            _lifiData.receiver,
            _lifiData.amount,
            _lifiData.destinationChainId,
            block.timestamp
        );
    }

    function swapAndStartBridgeTokensViaSynapse(
        LiFiData memory _lifiData,
        LibSwap.SwapData[] calldata _swapData,
        SynapseData calldata _synapseData
    ) public payable {
        if (address(_synapseData.token) != address(0)) {
            uint256 _fromTokenBalance = LibAsset.getOwnBalance(address(_synapseData.token));

            // Swap
            for (uint8 i; i < _swapData.length; i++) {
                LibSwap.swap(_lifiData.transactionId, _swapData[i]);
            }
            require(
                LibAsset.getOwnBalance(address(_synapseData.token)) - _fromTokenBalance >= _synapseData.amount,
                "ERR_INVALID_AMOUNT"
            );
            console.log("ASDF", LibAsset.getOwnBalance(address(_synapseData.token)));
            console.log(
                address(_synapseData.token),
                LibAsset.getOwnBalance(it),
                _fromTokenBalance,
                _synapseData.amount
            );
        } else {
            uint256 _fromBalance = address(this).balance;

            // Swap
            for (uint8 i; i < _swapData.length; i++) {
                LibSwap.swap(_lifiData.transactionId, _swapData[i]);
            }

            require(address(this).balance - _fromBalance >= _synapseData.amount, "ERR_INVALID_AMOUNT");
        }

        _startBridge(_synapseData);

        emit LiFiTransferStarted(
            _lifiData.transactionId,
            _lifiData.integrator,
            _lifiData.referrer,
            _lifiData.sendingAssetId,
            _lifiData.receivingAssetId,
            _lifiData.receiver,
            _lifiData.amount,
            _lifiData.destinationChainId,
            block.timestamp
        );
    }

    /* ========== Internal Functions ========== */

    /*
     * @dev Conatains the business logic for the bridge via Synapse
     * @param _synapseData data specific to Synapse
     */
    function _startBridge(SynapseData calldata _synapseData) internal {
        Storage storage s = getStorage();
        address bridge = _bridge();

        // Do _synapseData stuff
        require(s.chainId != _synapseData.chainId, "Cannot bridge to the same network.");

        if (LibAsset.isNativeAsset(address(_synapseData.token))) {
            ISynapse(bridge).depositETHAndSwap(
                _synapseData.to,
                _synapseData.chainId,
                _synapseData.amount,
                _synapseData.tokenIndexFrom,
                _synapseData.tokenIndexTo,
                _synapseData.minDy,
                _synapseData.swapDeadline
            );
        } else {
            // Give Synapse approval to bridge tokens
            LibAsset.approveERC20(IERC20(_synapseData.token), bridge, _synapseData.amount);
            // solhint-disable check-send-result

            uint256[] memory liquidityAmounts = new uint256[](3);
            liquidityAmounts[0] = 0;
            liquidityAmounts[1] = _synapseData.amount;
            liquidityAmounts[2] = 0;

            console.log(bridge, "bridge");
            console.log(_synapseData.minToMint, _synapseData.liqDeadline);

            console.log(
                address(_synapseData.token),
                LibAsset.getOwnBalance(address(_synapseData.token)),
                _synapseData.amount
            );

            ISynapse(bridge).zapAndDepositAndSwap(
                _synapseData.to,
                _synapseData.chainId,
                _synapseData.nUSD,
                liquidityAmounts,
                _synapseData.minToMint,
                _synapseData.liqDeadline,
                _synapseData.tokenIndexFrom,
                _synapseData.tokenIndexTo,
                _synapseData.minDy,
                _synapseData.swapDeadline
            );
        }
    }

    function _bridge() internal view returns (address) {
        Storage storage s = getStorage();
        return s.synapse;
    }

    function getStorage() internal pure returns (Storage storage s) {
        bytes32 namespace = NAMESPACE;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            s.slot := namespace
        }
    }
}
