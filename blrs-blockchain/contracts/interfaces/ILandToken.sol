// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILandToken {
    function mintLandCertificate(
        address toWallet,
        string calldata parcelId,
        string calldata ownerCNIC,
        string calldata ownerName,
        string calldata district,
        uint256 areaSqFt,
        string calldata landType,
        string calldata tokenURI_
    ) external returns (uint256);

    function transferLandCertificate(
        string calldata parcelId,
        address toWallet,
        string calldata newCNIC,
        string calldata newName
    ) external;

    function getTokenByParcel(string calldata parcelId) external view returns (uint256);
}