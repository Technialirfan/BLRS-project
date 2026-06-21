// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDisputeResolution {
    enum DisputeStatus {
        Filed,
        UnderReview,
        Resolved,
        Rejected
    }

    enum DisputeType {
        OwnershipClaim,
        Boundary,
        Fraud,
        Inheritance,
        Other
    }

    function fileDispute(
        string calldata parcelId,
        string calldata claimantCNIC,
        string calldata claimantName,
        string calldata claimantPhone,
        DisputeType disputeType,
        string calldata description,
        string[] calldata evidenceHashes,
        string[] calldata evidenceTypes
    ) external;

    function markUnderReview(uint256 disputeId) external;
    function resolveDispute(uint256 disputeId, string calldata resolution) external;
    function rejectDispute(uint256 disputeId, string calldata reason) external;
}