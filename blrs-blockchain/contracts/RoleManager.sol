// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RoleManager
 * @author BLRS FYP Team
 * @notice Manages role-based access control for the
 *         Balochistan Land Registry System.
 *         Defines 4 roles: ADMIN, PATWARI, TEHSILDAR, DC
 * @dev Uses OpenZeppelin AccessControl + Ownable + Pausable
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract RoleManager is AccessControl, Ownable, Pausable {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PATWARI_ROLE = keccak256("PATWARI_ROLE");
    bytes32 public constant TEHSILDAR_ROLE = keccak256("TEHSILDAR_ROLE");
    bytes32 public constant DC_ROLE = keccak256("DC_ROLE");

    struct Officer {
        address wallet;
        string fullName;
        string cnic;
        string email;
        string assignedDistrict;
        bytes32 role;
        bool isActive;
        uint256 createdAt;
        uint256 lastActionAt;
    }

    mapping(address => Officer) public officers;
    address[] public officerList;
    uint256 public totalOfficers;

    event OfficerAdded(
        address indexed wallet,
        bytes32 indexed role,
        string fullName,
        string assignedDistrict,
        uint256 timestamp
    );

    event OfficerDeactivated(
        address indexed wallet,
        address indexed deactivatedBy,
        uint256 timestamp
    );

    event OfficerActivated(
        address indexed wallet,
        address indexed activatedBy,
        uint256 timestamp
    );

    event OfficerDistrictUpdated(
        address indexed wallet,
        string oldDistrict,
        string newDistrict,
        uint256 timestamp
    );

    event RoleGrantedToOfficer(
        address indexed wallet,
        bytes32 indexed role,
        address indexed grantedBy,
        uint256 timestamp
    );

    event RoleRevokedFromOfficer(
        address indexed wallet,
        bytes32 indexed role,
        address indexed revokedBy,
        uint256 timestamp
    );

    event ContractPaused(address indexed by, uint256 timestamp);
    event ContractUnpaused(address indexed by, uint256 timestamp);

    error OfficerAlreadyExists(address wallet);
    error OfficerNotFound(address wallet);
    error OfficerNotActive(address wallet);
    error InvalidRole(bytes32 role);
    error CannotRemoveSelf();
    error EmptyString(string fieldName);
    error InvalidCNIC(string cnic);

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "RoleManager: caller is not admin");
        _;
    }

    modifier officerExists(address wallet) {
        if (officers[wallet].wallet == address(0)) revert OfficerNotFound(wallet);
        _;
    }

    modifier officerIsActive(address wallet) {
        if (!officers[wallet].isActive) revert OfficerNotActive(wallet);
        _;
    }

    modifier notEmpty(string memory value, string memory field) {
        if (bytes(value).length == 0) revert EmptyString(field);
        _;
    }

    /**
     * @notice Deploys RoleManager and sets deployer as Admin
     * @param adminWallet Address to receive ADMIN_ROLE
     */
    constructor(address adminWallet) Ownable(adminWallet) {
        require(adminWallet != address(0), "RoleManager: admin cannot be zero address");

        _grantRole(DEFAULT_ADMIN_ROLE, adminWallet);
        _grantRole(ADMIN_ROLE, adminWallet);

        officers[adminWallet] = Officer({
            wallet: adminWallet,
            fullName: "System Administrator",
            cnic: "0000000000000",
            email: "admin@blrs.gov.pk",
            assignedDistrict: "All",
            role: ADMIN_ROLE,
            isActive: true,
            createdAt: block.timestamp,
            lastActionAt: block.timestamp
        });

        officerList.push(adminWallet);
        totalOfficers++;

        emit OfficerAdded(adminWallet, ADMIN_ROLE, "System Administrator", "All", block.timestamp);
    }

    /**
     * @notice Add a new officer with a specific role
     */
    function addOfficer(
        address wallet,
        string calldata fullName,
        string calldata cnic,
        string calldata email,
        string calldata assignedDistrict,
        bytes32 role
    )
        external
        onlyAdmin
        whenNotPaused
        notEmpty(fullName, "fullName")
        notEmpty(cnic, "cnic")
        notEmpty(assignedDistrict, "assignedDistrict")
    {
        require(wallet != address(0), "RoleManager: invalid wallet");

        if (officers[wallet].wallet != address(0)) revert OfficerAlreadyExists(wallet);

        if (role != PATWARI_ROLE && role != TEHSILDAR_ROLE && role != DC_ROLE && role != ADMIN_ROLE) {
            revert InvalidRole(role);
        }

        if (bytes(cnic).length != 13) revert InvalidCNIC(cnic);

        _grantRole(role, wallet);

        officers[wallet] = Officer({
            wallet: wallet,
            fullName: fullName,
            cnic: cnic,
            email: email,
            assignedDistrict: assignedDistrict,
            role: role,
            isActive: true,
            createdAt: block.timestamp,
            lastActionAt: block.timestamp
        });

        officerList.push(wallet);
        totalOfficers++;

        emit OfficerAdded(wallet, role, fullName, assignedDistrict, block.timestamp);
        emit RoleGrantedToOfficer(wallet, role, msg.sender, block.timestamp);
    }

    /**
     * @notice Deactivate an officer (revokes role, keeps record)
     */
    function deactivateOfficer(address wallet) external onlyAdmin officerExists(wallet) {
        if (wallet == msg.sender) revert CannotRemoveSelf();

        Officer storage officer = officers[wallet];
        officer.isActive = false;
        officer.lastActionAt = block.timestamp;

        _revokeRole(officer.role, wallet);

        emit OfficerDeactivated(wallet, msg.sender, block.timestamp);
        emit RoleRevokedFromOfficer(wallet, officer.role, msg.sender, block.timestamp);
    }

    /**
     * @notice Reactivate a deactivated officer
     */
    function activateOfficer(address wallet) external onlyAdmin officerExists(wallet) {
        Officer storage officer = officers[wallet];
        officer.isActive = true;
        officer.lastActionAt = block.timestamp;

        _grantRole(officer.role, wallet);

        emit OfficerActivated(wallet, msg.sender, block.timestamp);
        emit RoleGrantedToOfficer(wallet, officer.role, msg.sender, block.timestamp);
    }

    /**
     * @notice Update officer's assigned district
     */
    function updateOfficerDistrict(
        address wallet,
        string calldata newDistrict
    ) external onlyAdmin officerExists(wallet) notEmpty(newDistrict, "newDistrict") {
        Officer storage officer = officers[wallet];
        string memory oldDistrict = officer.assignedDistrict;

        officer.assignedDistrict = newDistrict;
        officer.lastActionAt = block.timestamp;

        emit OfficerDistrictUpdated(wallet, oldDistrict, newDistrict, block.timestamp);
    }

    /**
     * @notice Update officer's last action timestamp
     * @dev Called by other contracts when officer performs action
     */
    function updateLastAction(address wallet) external {
        if (officers[wallet].wallet != address(0)) {
            officers[wallet].lastActionAt = block.timestamp;
        }
    }

    function pause() external onlyAdmin {
        _pause();
        emit ContractPaused(msg.sender, block.timestamp);
    }

    function unpause() external onlyAdmin {
        _unpause();
        emit ContractUnpaused(msg.sender, block.timestamp);
    }

    function getOfficer(address wallet) external view returns (Officer memory) {
        return officers[wallet];
    }

    function isActiveOfficer(address wallet) external view returns (bool) {
        return officers[wallet].isActive && officers[wallet].wallet != address(0);
    }

    function getOfficerRole(address wallet) external view returns (bytes32) {
        return officers[wallet].role;
    }

    function getOfficerDistrict(address wallet) external view returns (string memory) {
        return officers[wallet].assignedDistrict;
    }

    function getAllOfficers() external view returns (address[] memory) {
        return officerList;
    }

    function isPatwari(address wallet) external view returns (bool) {
        return hasRole(PATWARI_ROLE, wallet) && officers[wallet].isActive;
    }

    function isTehsildar(address wallet) external view returns (bool) {
        return hasRole(TEHSILDAR_ROLE, wallet) && officers[wallet].isActive;
    }

    function isDC(address wallet) external view returns (bool) {
        return hasRole(DC_ROLE, wallet) && officers[wallet].isActive;
    }

    function isAdmin(address wallet) external view returns (bool) {
        return hasRole(ADMIN_ROLE, wallet) && officers[wallet].isActive;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}