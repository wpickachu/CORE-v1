pragma solidity ^0.6.0;

interface ICoreVault {
    function addPendingRewards(uint256 _amount) external;

    function depositFor(
        address depositFor,
        uint256 _pid,
        uint256 _amount
    ) external;
}
