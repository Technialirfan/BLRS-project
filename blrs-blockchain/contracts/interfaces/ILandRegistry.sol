// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILandRegistry {
    enum LandStatus {
        Pending,
        Verified,
        Registered,
        Rejected,
        TransferPending,
        Disputed
    }

    function doesParcelExist(string calldata parcelId) external view returns (bool);

    function getLandStatus(string calldata parcelId) external view returns (LandStatus);

    function setDisputeStatus(string calldata parcelId, bool isDisputed) external;
}