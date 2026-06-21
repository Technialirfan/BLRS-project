// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DisputeResolution
 * @author BLRS FYP Team
 * @notice Handles land dispute filing, review, and resolution
 *         for the Balochistan Land Registry System.
 * @dev Interacts with LandRegistry to set dispute status.
 */

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RoleManager.sol";
import "./LandRegistry.sol";

contract DisputeResolution is ReentrancyGuard, Pausable, Ownable {
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

    struct Dispute {
        uint256 disputeId;
        string parcelId;
        string claimantCNIC;
        string claimantName;
        string claimantPhone;
        DisputeType disputeType;
        string description;
        string[] evidenceHashes;
        string[] evidenceTypes;
        DisputeStatus status;
        string resolution;
        string rejectionReason;
        address filedByOfficer;
        address reviewedBy;
        address resolvedBy;
        uint256 filedAt;
        uint256 reviewedAt;
        uint256 resolvedAt;
    }

    RoleManager public roleManager;
    LandRegistry public landRegistry;

    uint256 private _disputeCounter;

    mapping(uint256 => Dispute) private _disputes;
    mapping(string => uint256[]) public parcelDisputes;
    uint256[] public allDisputeIds;

    uint256 public totalDisputes;
    uint256 public totalResolved;
    uint256 public totalRejected;

    event DisputeFiled(
        uint256 indexed disputeId,
        string indexed parcelId,
        string claimantCNIC,
        DisputeType disputeType,
        address indexed filedBy,
        uint256 timestamp
    );

    event DisputeMarkedUnderReview(
        uint256 indexed disputeId,
        address indexed reviewedBy,
        uint256 timestamp
    );

    event DisputeResolved(
        uint256 indexed disputeId,
        string indexed parcelId,
        string resolution,
        address indexed resolvedBy,
        uint256 timestamp
    );

    event DisputeRejected(
        uint256 indexed disputeId,
        string reason,
        address indexed rejectedBy,
        uint256 timestamp
    );

    error DisputeNotFound(uint256 disputeId);
    error InvalidDisputeStatus(DisputeStatus current, DisputeStatus required);
    error NotAuthorized(address caller, string requiredRole);
    error EmptyString(string field);
    error DescriptionTooShort(uint256 length, uint256 minimum);

    modifier onlyOfficer() {
        require(
            roleManager.isPatwari(msg.sender) ||
                roleManager.isTehsildar(msg.sender) ||
                roleManager.isDC(msg.sender) ||
                roleManager.isAdmin(msg.sender),
            "DisputeResolution: caller is not an officer"
        );
        _;
    }

    modifier onlyTehsildar() {
        if (!roleManager.isTehsildar(msg.sender)) revert NotAuthorized(msg.sender, "TEHSILDAR");
        _;
    }

    modifier onlyDC() {
        if (!roleManager.isDC(msg.sender)) revert NotAuthorized(msg.sender, "DC");
        _;
    }

    modifier onlyTehsildarOrDC() {
        if (!roleManager.isTehsildar(msg.sender) && !roleManager.isDC(msg.sender)) {
            revert NotAuthorized(msg.sender, "TEHSILDAR_OR_DC");
        }
        _;
    }

    modifier onlyAdmin() {
        if (!roleManager.isAdmin(msg.sender)) revert NotAuthorized(msg.sender, "ADMIN");
        _;
    }

    modifier disputeMustExist(uint256 disputeId) {
        if (_disputes[disputeId].filedAt == 0) revert DisputeNotFound(disputeId);
        _;
    }

    modifier notEmpty(string memory value, string memory field) {
        if (bytes(value).length == 0) revert EmptyString(field);
        _;
    }

    constructor(address roleManagerAddress, address landRegistryAddress) Ownable(msg.sender) {
        require(roleManagerAddress != address(0), "invalid RoleManager");
        require(landRegistryAddress != address(0), "invalid LandRegistry");

        roleManager = RoleManager(roleManagerAddress);
        landRegistry = LandRegistry(landRegistryAddress);
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
    )
        external
        nonReentrant
        whenNotPaused
        onlyOfficer
        notEmpty(parcelId, "parcelId")
        notEmpty(claimantCNIC, "claimantCNIC")
        notEmpty(claimantName, "claimantName")
        notEmpty(description, "description")
    {
        require(landRegistry.doesParcelExist(parcelId), "DisputeResolution: parcel does not exist");

        if (bytes(description).length < 50) {
            revert DescriptionTooShort(bytes(description).length, 50);
        }

        require(bytes(claimantCNIC).length == 13, "DisputeResolution: CNIC must be 13 digits");
        require(evidenceHashes.length == evidenceTypes.length, "DisputeResolution: evidence arrays mismatch");

        _disputeCounter++;
        uint256 newId = _disputeCounter;

        Dispute storage dispute = _disputes[newId];
        dispute.disputeId = newId;
        dispute.parcelId = parcelId;
        dispute.claimantCNIC = claimantCNIC;
        dispute.claimantName = claimantName;
        dispute.claimantPhone = claimantPhone;
        dispute.disputeType = disputeType;
        dispute.description = description;
        dispute.evidenceHashes = evidenceHashes;
        dispute.evidenceTypes = evidenceTypes;
        dispute.status = DisputeStatus.Filed;
        dispute.filedByOfficer = msg.sender;
        dispute.filedAt = block.timestamp;

        parcelDisputes[parcelId].push(newId);
        allDisputeIds.push(newId);
        totalDisputes++;

        landRegistry.setDisputeStatus(parcelId, true);

        roleManager.updateLastAction(msg.sender);

        emit DisputeFiled(newId, parcelId, claimantCNIC, disputeType, msg.sender, block.timestamp);
    }

    function markUnderReview(uint256 disputeId)
        external
        nonReentrant
        whenNotPaused
        onlyTehsildar
        disputeMustExist(disputeId)
    {
        Dispute storage dispute = _disputes[disputeId];

        if (dispute.status != DisputeStatus.Filed) {
            revert InvalidDisputeStatus(dispute.status, DisputeStatus.Filed);
        }

        dispute.status = DisputeStatus.UnderReview;
        dispute.reviewedBy = msg.sender;
        dispute.reviewedAt = block.timestamp;

        roleManager.updateLastAction(msg.sender);

        emit DisputeMarkedUnderReview(disputeId, msg.sender, block.timestamp);
    }

    function resolveDispute(
        uint256 disputeId,
        string calldata resolution
    )
        external
        nonReentrant
        whenNotPaused
        onlyTehsildarOrDC
        disputeMustExist(disputeId)
        notEmpty(resolution, "resolution")
    {
        require(bytes(resolution).length >= 20, "DisputeResolution: resolution too short");

        Dispute storage dispute = _disputes[disputeId];
        LandRegistry.LandParcel memory parcel = landRegistry.getLand(dispute.parcelId);

        if (parcel.landType == LandRegistry.LandType.Government) {
            require(roleManager.isDC(msg.sender), "DisputeResolution: Only DC can resolve Govt land");
            if (dispute.status != DisputeStatus.UnderReview) {
                revert InvalidDisputeStatus(dispute.status, DisputeStatus.UnderReview);
            }
        } else {
            // Private land
            require(
                dispute.status == DisputeStatus.Filed || dispute.status == DisputeStatus.UnderReview,
                "DisputeResolution: Invalid status for resolution"
            );
        }

        dispute.status = DisputeStatus.Resolved;
        dispute.resolution = resolution;
        dispute.resolvedBy = msg.sender;
        dispute.resolvedAt = block.timestamp;

        totalResolved++;

        landRegistry.setDisputeStatus(dispute.parcelId, false);

        roleManager.updateLastAction(msg.sender);

        emit DisputeResolved(disputeId, dispute.parcelId, resolution, msg.sender, block.timestamp);
    }

    function rejectDispute(
        uint256 disputeId,
        string calldata reason
    )
        external
        nonReentrant
        whenNotPaused
        onlyTehsildarOrDC
        disputeMustExist(disputeId)
        notEmpty(reason, "reason")
    {
        Dispute storage dispute = _disputes[disputeId];
        LandRegistry.LandParcel memory parcel = landRegistry.getLand(dispute.parcelId);

        if (parcel.landType == LandRegistry.LandType.Government) {
            require(roleManager.isDC(msg.sender), "DisputeResolution: Only DC can reject Govt land");
        }

        require(
            dispute.status == DisputeStatus.Filed || dispute.status == DisputeStatus.UnderReview,
            "DisputeResolution: cannot reject resolved dispute"
        );

        dispute.status = DisputeStatus.Rejected;
        dispute.rejectionReason = reason;
        dispute.resolvedBy = msg.sender;
        dispute.resolvedAt = block.timestamp;

        totalRejected++;

        landRegistry.setDisputeStatus(dispute.parcelId, false);

        roleManager.updateLastAction(msg.sender);

        emit DisputeRejected(disputeId, reason, msg.sender, block.timestamp);
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    function getDispute(uint256 disputeId) external view returns (Dispute memory) {
        return _disputes[disputeId];
    }

    function getDisputesByParcel(string calldata parcelId) external view returns (uint256[] memory) {
        return parcelDisputes[parcelId];
    }

    function getAllDisputeIds() external view returns (uint256[] memory) {
        return allDisputeIds;
    }

    function getTotalDisputes() external view returns (uint256) {
        return totalDisputes;
    }
}