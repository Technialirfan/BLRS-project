// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LandRegistry
 * @author BLRS FYP Team
 * @notice Core contract for the Balochistan Land Registry System.
 *         Handles land registration, verification, approval,
 *         rejection, and ownership transfer workflow.
 * @dev Uses RoleManager for access control.
 *      Uses ReentrancyGuard for security.
 *      Uses Pausable for emergency stop.
 */

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RoleManager.sol";

contract LandRegistry is ReentrancyGuard, Pausable, Ownable {
    enum LandStatus {
        Pending,
        Verified,
        Registered,
        Rejected,
        TransferPending,
        Disputed
    }

    enum LandType {
        Agricultural,
        Residential,
        Commercial,
        Tribal,
        Forest,
        Government,
        Barren
    }

    struct LandParcel {
        uint256 parcelIndex;
        string parcelId;
        string ownerCNIC;
        string ownerName;
        string ownerNameUrdu;
        string district;
        string tehsil;
        string mouza;
        uint256 areaSqFt;
        LandType landType;
        string primaryDocHash;
        string[] allDocHashes;
        string[] docTypes;
        int256 gpsLat;
        int256 gpsLng;
        LandStatus status;
        bool isDisputed;
        string rejectionReason;
        address registeredBy;
        address verifiedBy;
        address approvedBy;
        uint256 registeredAt;
        uint256 verifiedAt;
        uint256 approvedAt;
        uint256 lastUpdatedAt;
        string geoJsonHash;
        string gisMetadataCID;
    }

    struct TransferRequest {
        string parcelId;
        string newOwnerCNIC;
        string newOwnerName;
        string newOwnerNameUrdu;
        string transferDocHash;
        address initiatedBy;
        uint256 initiatedAt;
        bool isActive;
    }

    struct OwnershipHistory {
        string fromCNIC;
        string toCNIC;
        string fromName;
        string toName;
        string transferDocHash;
        address transferredBy;
        uint256 timestamp;
        string transferType;
    }

    RoleManager public roleManager;
    uint256 private _parcelCounter;

    mapping(string => LandParcel) private _landParcels;
    mapping(string => bool) public parcelExists;
    mapping(string => string[]) public cnicToParcelIds;
    mapping(string => string[]) public districtToParcelIds;
    mapping(string => TransferRequest) private _transferRequests;
    mapping(string => OwnershipHistory[]) private _ownershipHistory;

    string[] public allParcelIds;

    uint256 public totalRegistered;
    uint256 public totalVerified;
    uint256 public totalApproved;
    uint256 public totalRejected;
    uint256 public totalTransfers;
    uint256 public totalDisputed;

    event LandRegistered(
        string indexed parcelId,
        string ownerCNIC,
        string ownerName,
        string district,
        address indexed registeredBy,
        uint256 timestamp
    );

    event LandVerified(string indexed parcelId, address indexed verifiedBy, uint256 timestamp);

    event LandApproved(
        string indexed parcelId,
        string ownerCNIC,
        address indexed approvedBy,
        uint256 tokenId,
        uint256 timestamp
    );

    event LandRejected(
        string indexed parcelId,
        string reason,
        address indexed rejectedBy,
        LandStatus previousStatus,
        uint256 timestamp
    );

    event TransferInitiated(
        string indexed parcelId,
        string newOwnerCNIC,
        string newOwnerName,
        address indexed initiatedBy,
        uint256 timestamp
    );

    event TransferApproved(
        string indexed parcelId,
        string fromCNIC,
        string toCNIC,
        address indexed approvedBy,
        uint256 timestamp
    );

    event TransferRejected(
        string indexed parcelId,
        string reason,
        address indexed rejectedBy,
        uint256 timestamp
    );

    event LandDisputeSet(string indexed parcelId, bool isDisputed, uint256 timestamp);

    event DocumentAdded(
        string indexed parcelId,
        string docHash,
        string docType,
        address indexed addedBy,
        uint256 timestamp
    );

    error ParcelAlreadyExists(string parcelId);
    error ParcelNotFound(string parcelId);
    error InvalidStatus(LandStatus current, LandStatus required);
    error NotAuthorized(address caller, string requiredRole);
    error LandIsDisputed(string parcelId);
    error TransferNotPending(string parcelId);
    error EmptyString(string field);
    error InvalidArea(uint256 area);

    modifier onlyPatwari() {
        if (!roleManager.isPatwari(msg.sender)) revert NotAuthorized(msg.sender, "PATWARI");
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
        if (!roleManager.isTehsildar(msg.sender) && !roleManager.isDC(msg.sender)) revert NotAuthorized(msg.sender, "TEHSILDAR_OR_DC");
        _;
    }

    modifier onlyAdmin() {
        if (!roleManager.isAdmin(msg.sender)) revert NotAuthorized(msg.sender, "ADMIN");
        _;
    }

    modifier parcelMustExist(string memory parcelId) {
        if (!parcelExists[parcelId]) revert ParcelNotFound(parcelId);
        _;
    }

    modifier notDisputed(string memory parcelId) {
        if (_landParcels[parcelId].isDisputed) revert LandIsDisputed(parcelId);
        _;
    }

    modifier notEmpty(string memory value, string memory field) {
        if (bytes(value).length == 0) revert EmptyString(field);
        _;
    }

    constructor(address roleManagerAddress) Ownable(msg.sender) {
        require(roleManagerAddress != address(0), "LandRegistry: invalid RoleManager address");
        roleManager = RoleManager(roleManagerAddress);
    }

    function registerLand(
        string calldata parcelId,
        string calldata ownerCNIC,
        string calldata ownerName,
        string calldata ownerNameUrdu,
        string calldata district,
        string calldata tehsil,
        string calldata mouza,
        uint256 areaSqFt,
        LandType landType,
        string calldata primaryDocHash,
        int256 gpsLat,
        int256 gpsLng,
        string calldata geoJsonHash,
        string calldata gisMetadataCID
    )
        external
        nonReentrant
        whenNotPaused
        onlyPatwari
        notEmpty(parcelId, "parcelId")
        notEmpty(ownerCNIC, "ownerCNIC")
        notEmpty(ownerName, "ownerName")
        notEmpty(district, "district")
        notEmpty(primaryDocHash, "primaryDocHash")
    {
        if (parcelExists[parcelId]) revert ParcelAlreadyExists(parcelId);
        if (areaSqFt == 0) revert InvalidArea(areaSqFt);
        require(bytes(ownerCNIC).length == 13, "LandRegistry: CNIC must be 13 digits");

        _parcelCounter++;

        LandParcel storage parcel = _landParcels[parcelId];
        parcel.parcelIndex = _parcelCounter;
        parcel.parcelId = parcelId;
        parcel.ownerCNIC = ownerCNIC;
        parcel.ownerName = ownerName;
        parcel.ownerNameUrdu = ownerNameUrdu;
        parcel.district = district;
        parcel.tehsil = tehsil;
        parcel.mouza = mouza;
        parcel.areaSqFt = areaSqFt;
        parcel.landType = landType;
        parcel.primaryDocHash = primaryDocHash;
        parcel.allDocHashes.push(primaryDocHash);
        parcel.docTypes.push("Primary Document");
        parcel.gpsLat = gpsLat;
        parcel.gpsLng = gpsLng;
        parcel.status = LandStatus.Pending;
        parcel.isDisputed = false;
        parcel.registeredBy = msg.sender;
        parcel.registeredAt = block.timestamp;
        parcel.lastUpdatedAt = block.timestamp;
        parcel.geoJsonHash = geoJsonHash;
        parcel.gisMetadataCID = gisMetadataCID;

        parcelExists[parcelId] = true;
        allParcelIds.push(parcelId);
        cnicToParcelIds[ownerCNIC].push(parcelId);
        districtToParcelIds[district].push(parcelId);

        _ownershipHistory[parcelId].push(
            OwnershipHistory({
                fromCNIC: "0000000000000",
                toCNIC: ownerCNIC,
                fromName: "Origin",
                toName: ownerName,
                transferDocHash: primaryDocHash,
                transferredBy: msg.sender,
                timestamp: block.timestamp,
                transferType: "initial_registration"
            })
        );

        totalRegistered++;

        roleManager.updateLastAction(msg.sender);

        emit LandRegistered(parcelId, ownerCNIC, ownerName, district, msg.sender, block.timestamp);
    }

    function addDocument(
        string calldata parcelId,
        string calldata docHash,
        string calldata docType
    )
        external
        whenNotPaused
        onlyPatwari
        parcelMustExist(parcelId)
        notEmpty(docHash, "docHash")
    {
        LandParcel storage parcel = _landParcels[parcelId];
        parcel.allDocHashes.push(docHash);
        parcel.docTypes.push(docType);
        parcel.lastUpdatedAt = block.timestamp;

        emit DocumentAdded(parcelId, docHash, docType, msg.sender, block.timestamp);
    }

    function initiateTransfer(
        string calldata parcelId,
        string calldata newOwnerCNIC,
        string calldata newOwnerName,
        string calldata newOwnerNameUrdu,
        string calldata transferDocHash
    )
        external
        nonReentrant
        whenNotPaused
        onlyPatwari
        parcelMustExist(parcelId)
        notDisputed(parcelId)
        notEmpty(newOwnerCNIC, "newOwnerCNIC")
        notEmpty(newOwnerName, "newOwnerName")
        notEmpty(transferDocHash, "transferDocHash")
    {
        LandParcel storage parcel = _landParcels[parcelId];

        if (parcel.status != LandStatus.Registered) {
            revert InvalidStatus(parcel.status, LandStatus.Registered);
        }

        require(bytes(newOwnerCNIC).length == 13, "LandRegistry: CNIC must be 13 digits");

        parcel.status = LandStatus.TransferPending;
        parcel.lastUpdatedAt = block.timestamp;

        _transferRequests[parcelId] = TransferRequest({
            parcelId: parcelId,
            newOwnerCNIC: newOwnerCNIC,
            newOwnerName: newOwnerName,
            newOwnerNameUrdu: newOwnerNameUrdu,
            transferDocHash: transferDocHash,
            initiatedBy: msg.sender,
            initiatedAt: block.timestamp,
            isActive: true
        });

        roleManager.updateLastAction(msg.sender);

        emit TransferInitiated(parcelId, newOwnerCNIC, newOwnerName, msg.sender, block.timestamp);
    }

    function verifyLand(string calldata parcelId)
        external
        nonReentrant
        whenNotPaused
        onlyTehsildar
        parcelMustExist(parcelId)
    {
        LandParcel storage parcel = _landParcels[parcelId];

        if (parcel.status != LandStatus.Pending) {
            revert InvalidStatus(parcel.status, LandStatus.Pending);
        }

        parcel.status = LandStatus.Verified;
        parcel.verifiedBy = msg.sender;
        parcel.verifiedAt = block.timestamp;
        parcel.lastUpdatedAt = block.timestamp;

        totalVerified++;
        roleManager.updateLastAction(msg.sender);

        emit LandVerified(parcelId, msg.sender, block.timestamp);
    }

    function rejectLandByTehsildar(
        string calldata parcelId,
        string calldata reason
    )
        external
        nonReentrant
        whenNotPaused
        onlyTehsildar
        parcelMustExist(parcelId)
        notEmpty(reason, "reason")
    {
        require(bytes(reason).length >= 10, "LandRegistry: reason too short");

        LandParcel storage parcel = _landParcels[parcelId];
        if (parcel.status != LandStatus.Pending) {
            revert InvalidStatus(parcel.status, LandStatus.Pending);
        }

        parcel.status = LandStatus.Rejected;
        parcel.rejectionReason = reason;
        parcel.lastUpdatedAt = block.timestamp;

        totalRejected++;
        roleManager.updateLastAction(msg.sender);

        emit LandRejected(parcelId, reason, msg.sender, LandStatus.Pending, block.timestamp);
    }

    function approveLand(string calldata parcelId, uint256 tokenId)
        external
        nonReentrant
        whenNotPaused
        onlyTehsildarOrDC
        parcelMustExist(parcelId)
    {
        LandParcel storage parcel = _landParcels[parcelId];

        if (parcel.status != LandStatus.Verified) {
            revert InvalidStatus(parcel.status, LandStatus.Verified);
        }

        parcel.status = LandStatus.Registered;
        parcel.approvedBy = msg.sender;
        parcel.approvedAt = block.timestamp;
        parcel.lastUpdatedAt = block.timestamp;

        totalApproved++;
        roleManager.updateLastAction(msg.sender);

        emit LandApproved(parcelId, parcel.ownerCNIC, msg.sender, tokenId, block.timestamp);
    }

    function rejectLandByDC(
        string calldata parcelId,
        string calldata reason
    )
        external
        nonReentrant
        whenNotPaused
        onlyDC
        parcelMustExist(parcelId)
        notEmpty(reason, "reason")
    {
        require(bytes(reason).length >= 10, "LandRegistry: reason too short");

        LandParcel storage parcel = _landParcels[parcelId];
        if (parcel.status != LandStatus.Verified) {
            revert InvalidStatus(parcel.status, LandStatus.Verified);
        }

        parcel.status = LandStatus.Rejected;
        parcel.rejectionReason = reason;
        parcel.lastUpdatedAt = block.timestamp;

        totalRejected++;
        roleManager.updateLastAction(msg.sender);

        emit LandRejected(parcelId, reason, msg.sender, LandStatus.Verified, block.timestamp);
    }

    function approveTransfer(string calldata parcelId)
        external
        nonReentrant
        whenNotPaused
        onlyTehsildarOrDC
        parcelMustExist(parcelId)
    {
        LandParcel storage parcel = _landParcels[parcelId];

        if (parcel.status != LandStatus.TransferPending) {
            revert InvalidStatus(parcel.status, LandStatus.TransferPending);
        }

        TransferRequest storage request = _transferRequests[parcelId];
        if (!request.isActive) revert TransferNotPending(parcelId);

        string memory oldCNIC = parcel.ownerCNIC;
        string memory oldName = parcel.ownerName;

        _removeFromCNICMapping(parcel.ownerCNIC, parcelId);

        _ownershipHistory[parcelId].push(
            OwnershipHistory({
                fromCNIC: oldCNIC,
                toCNIC: request.newOwnerCNIC,
                fromName: oldName,
                toName: request.newOwnerName,
                transferDocHash: request.transferDocHash,
                transferredBy: msg.sender,
                timestamp: block.timestamp,
                transferType: "transfer"
            })
        );

        parcel.ownerCNIC = request.newOwnerCNIC;
        parcel.ownerName = request.newOwnerName;
        parcel.ownerNameUrdu = request.newOwnerNameUrdu;
        parcel.status = LandStatus.Registered;
        parcel.lastUpdatedAt = block.timestamp;

        cnicToParcelIds[request.newOwnerCNIC].push(parcelId);

        request.isActive = false;

        totalTransfers++;
        roleManager.updateLastAction(msg.sender);

        emit TransferApproved(parcelId, oldCNIC, request.newOwnerCNIC, msg.sender, block.timestamp);
    }

    function rejectTransfer(
        string calldata parcelId,
        string calldata reason
    )
        external
        nonReentrant
        whenNotPaused
        onlyDC
        parcelMustExist(parcelId)
        notEmpty(reason, "reason")
    {
        LandParcel storage parcel = _landParcels[parcelId];

        if (parcel.status != LandStatus.TransferPending) {
            revert InvalidStatus(parcel.status, LandStatus.TransferPending);
        }

        parcel.status = LandStatus.Registered;
        parcel.lastUpdatedAt = block.timestamp;

        _transferRequests[parcelId].isActive = false;

        roleManager.updateLastAction(msg.sender);

        emit TransferRejected(parcelId, reason, msg.sender, block.timestamp);
    }

    function setDisputeStatus(string calldata parcelId, bool isDisputed)
        external
        parcelMustExist(parcelId)
    {
        require(roleManager.isAdmin(msg.sender) || msg.sender == owner(), "LandRegistry: not authorized");

        LandParcel storage parcel = _landParcels[parcelId];
        parcel.isDisputed = isDisputed;
        parcel.lastUpdatedAt = block.timestamp;

        if (isDisputed) {
            if (parcel.status != LandStatus.Disputed) {
                parcel.status = LandStatus.Disputed;
                totalDisputed++;
            }
        } else {
            parcel.status = LandStatus.Registered;
            if (totalDisputed > 0) totalDisputed--;
        }

        emit LandDisputeSet(parcelId, isDisputed, block.timestamp);
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyAdmin {
        _unpause();
    }

    function getLand(
        string calldata parcelId
    ) external view parcelMustExist(parcelId) returns (LandParcel memory) {
        return _landParcels[parcelId];
    }

    function getLandStatus(string calldata parcelId) external view returns (LandStatus) {
        return _landParcels[parcelId].status;
    }

    function getOwnerByCNIC(string calldata cnic) external view returns (string[] memory) {
        return cnicToParcelIds[cnic];
    }

    function getLandsByDistrict(string calldata district) external view returns (string[] memory) {
        return districtToParcelIds[district];
    }

    function getOwnershipHistory(
        string calldata parcelId
    ) external view returns (OwnershipHistory[] memory) {
        return _ownershipHistory[parcelId];
    }

    function getTransferRequest(
        string calldata parcelId
    ) external view returns (TransferRequest memory) {
        return _transferRequests[parcelId];
    }

    function doesParcelExist(string calldata parcelId) external view returns (bool) {
        return parcelExists[parcelId];
    }

    function getTotalParcels() external view returns (uint256) {
        return allParcelIds.length;
    }

    function getAllParcelIds() external view returns (string[] memory) {
        return allParcelIds;
    }

    function getStats()
        external
        view
        returns (
            uint256 registered,
            uint256 verified,
            uint256 approved,
            uint256 rejected,
            uint256 transfers,
            uint256 disputed
        )
    {
        return (totalRegistered, totalVerified, totalApproved, totalRejected, totalTransfers, totalDisputed);
    }

    function _removeFromCNICMapping(string memory cnic, string memory parcelId) internal {
        string[] storage parcels = cnicToParcelIds[cnic];
        bytes32 target = keccak256(bytes(parcelId));

        for (uint256 i = 0; i < parcels.length; i++) {
            if (keccak256(bytes(parcels[i])) == target) {
                parcels[i] = parcels[parcels.length - 1];
                parcels.pop();
                break;
            }
        }
    }
}