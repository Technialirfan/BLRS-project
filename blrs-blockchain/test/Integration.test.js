const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Integration: Full Land Registration Workflow", function () {
  async function deployFixture() {
    const [admin, patwari, tehsildar, dc, citizen, newOwner] = await ethers.getSigners();

    const RoleManager = await ethers.getContractFactory("RoleManager");
    const roleManager = await RoleManager.deploy(admin.address);

    const PATWARI_ROLE = await roleManager.PATWARI_ROLE();
    const TEHSILDAR_ROLE = await roleManager.TEHSILDAR_ROLE();
    const DC_ROLE = await roleManager.DC_ROLE();

    await roleManager.addOfficer(
      patwari.address,
      "Muhammad Ayaz Khan",
      "5430100000002",
      "patwari.quetta@blrs.gov.pk",
      "Quetta",
      PATWARI_ROLE
    );

    await roleManager.addOfficer(
      tehsildar.address,
      "Abdul Qadir Mengal",
      "5430100000003",
      "tehsildar.quetta@blrs.gov.pk",
      "Quetta",
      TEHSILDAR_ROLE
    );

    await roleManager.addOfficer(
      dc.address,
      "Sardar Ahmed Raisani",
      "5430100000004",
      "dc.quetta@blrs.gov.pk",
      "Quetta",
      DC_ROLE
    );

    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    const landRegistry = await LandRegistry.deploy(await roleManager.getAddress());

    const DisputeResolution = await ethers.getContractFactory("DisputeResolution");
    const disputeResolution = await DisputeResolution.deploy(
      await roleManager.getAddress(),
      await landRegistry.getAddress()
    );

    const LandToken = await ethers.getContractFactory("LandToken");
    const landToken = await LandToken.deploy(await roleManager.getAddress());

    await landRegistry.transferOwnership(await disputeResolution.getAddress());

    return {
      roleManager,
      landRegistry,
      disputeResolution,
      landToken,
      admin,
      patwari,
      tehsildar,
      dc,
      citizen,
      newOwner,
    };
  }

  async function register(landRegistry, signer, parcelId, cnic, name) {
    await landRegistry.connect(signer).registerLand(
      parcelId,
      cnic,
      name,
      "",
      "Quetta",
      "Quetta",
      "Brewery Road",
      1800,
      1,
      "QmPrimaryDocHash",
      30179800,
      67008900
    );
  }

  it("WORKFLOW 1: Complete Registration (Patwari->Tehsildar->DC->NFT)", async function () {
    const { landRegistry, landToken, patwari, tehsildar, dc } = await loadFixture(deployFixture);

    await register(landRegistry, patwari, "QTA-2024-001", "5430155667788", "Khan Muhammad Baloch");
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");

    await landToken.connect(dc).mintLandCertificate(
      dc.address,
      "QTA-2024-001",
      "5430155667788",
      "Khan Muhammad Baloch",
      "Quetta",
      1800,
      "Residential",
      "ipfs://QmTokenMetadata001"
    );

    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);

    expect(await landRegistry.getLandStatus("QTA-2024-001")).to.equal(2);
    expect(await landToken.parcelHasToken("QTA-2024-001")).to.equal(true);

    const history = await landRegistry.getOwnershipHistory("QTA-2024-001");
    expect(history.length).to.equal(1);
  });

  it("WORKFLOW 2: Complete Transfer (Patwari initiates -> DC approves)", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);

    await register(landRegistry, patwari, "QTA-2024-002", "5430166778899", "Bibi Zainab Bugti");
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-002");
    await landRegistry.connect(dc).approveLand("QTA-2024-002", 2);

    await landRegistry.connect(patwari).initiateTransfer(
      "QTA-2024-002",
      "5530100223344",
      "Abdul Rehman Mengal",
      "",
      "QmTransferHash1"
    );

    expect(await landRegistry.getLandStatus("QTA-2024-002")).to.equal(4);

    await landRegistry.connect(dc).approveTransfer("QTA-2024-002");

    const land = await landRegistry.getLand("QTA-2024-002");
    expect(land.ownerCNIC).to.equal("5530100223344");
    expect(land.status).to.equal(2);

    const history = await landRegistry.getOwnershipHistory("QTA-2024-002");
    expect(history.length).to.equal(2);
  });

  it("WORKFLOW 3: Dispute (File -> Review -> Resolve)", async function () {
    const { landRegistry, disputeResolution, patwari, tehsildar, dc } = await loadFixture(deployFixture);

    await register(landRegistry, patwari, "QTA-2024-003", "5430188990011", "Sardar Faiz Muhammad Kakar");
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-003");
    await landRegistry.connect(dc).approveLand("QTA-2024-003", 3);

    await disputeResolution.connect(patwari).fileDispute(
      "QTA-2024-003",
      "5430199887711",
      "Haji Gul Muhammad Kakar",
      "03101234567",
      3,
      "This land belongs to our family and must be reviewed because submitted records seem inconsistent.",
      ["QmEvidence001"],
      ["Inheritance Certificate"]
    );

    expect(await landRegistry.getLandStatus("QTA-2024-003")).to.equal(5);

    await disputeResolution.connect(tehsildar).markUnderReview(1);
    await disputeResolution
      .connect(dc)
      .resolveDispute(1, "Reviewed all supporting documents and current registered ownership remains valid.");

    expect(await landRegistry.getLandStatus("QTA-2024-003")).to.equal(2);

    const dispute = await disputeResolution.getDispute(1);
    expect(dispute.status).to.equal(2);
  });

  it("WORKFLOW 4: Rejection flow (Patwari -> Tehsildar rejects)", async function () {
    const { landRegistry, patwari, tehsildar } = await loadFixture(deployFixture);

    await register(landRegistry, patwari, "QTA-2024-004", "5430100011122", "Noor Muhammad");
    await landRegistry
      .connect(tehsildar)
      .rejectLandByTehsildar("QTA-2024-004", "Required survey map is missing from supporting documents.");

    const land = await landRegistry.getLand("QTA-2024-004");
    expect(land.status).to.equal(3);
    expect(land.rejectionReason).to.equal("Required survey map is missing from supporting documents.");
  });

  it("WORKFLOW 5: Role access control (unauthorized calls REVERT)", async function () {
    const { landRegistry, disputeResolution, patwari, tehsildar, dc, citizen } = await loadFixture(deployFixture);

    await register(landRegistry, patwari, "QTA-2024-005", "5430100044455", "Ali Ahmad");

    await expect(
      landRegistry.connect(patwari).verifyLand("QTA-2024-005")
    ).to.be.revertedWithCustomError(landRegistry, "NotAuthorized");

    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-005");

    await expect(
      landRegistry.connect(tehsildar).approveLand("QTA-2024-005", 5)
    ).to.be.revertedWithCustomError(landRegistry, "NotAuthorized");

    await expect(
      register(landRegistry, dc, "QTA-2024-006", "5430100077788", "Sana Bibi")
    ).to.be.revertedWithCustomError(landRegistry, "NotAuthorized");

    await expect(
      disputeResolution.connect(citizen).fileDispute(
        "QTA-2024-005",
        "5430199887711",
        "Haji Gul Muhammad Kakar",
        "03101234567",
        3,
        "This land belongs to our family and must be reviewed because submitted records seem inconsistent.",
        ["QmEvidence001"],
        ["Inheritance Certificate"]
      )
    ).to.be.revertedWith("DisputeResolution: caller is not an officer");
  });

  it("WORKFLOW 6: Transfer rejection (DC rejects transfer)", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);

    await register(landRegistry, patwari, "QTA-2024-007", "5430100099900", "Shah Wali");
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-007");
    await landRegistry.connect(dc).approveLand("QTA-2024-007", 7);

    await landRegistry.connect(patwari).initiateTransfer(
      "QTA-2024-007",
      "5530100223344",
      "Abdul Rehman Mengal",
      "",
      "QmTransferHash2"
    );

    await landRegistry.connect(dc).rejectTransfer("QTA-2024-007", "Transfer deed signature mismatch");

    expect(await landRegistry.getLandStatus("QTA-2024-007")).to.equal(2);
    const request = await landRegistry.getTransferRequest("QTA-2024-007");
    expect(request.isActive).to.equal(false);
  });

  it("WORKFLOW 7: Pause/Unpause emergency stop", async function () {
    const { landRegistry, admin, patwari } = await loadFixture(deployFixture);

    await landRegistry.connect(admin).pause();

    await expect(
      register(landRegistry, patwari, "QTA-2024-008", "5430100001112", "Haji Rahim")
    ).to.be.revertedWithCustomError(landRegistry, "EnforcedPause");

    await landRegistry.connect(admin).unpause();

    await register(landRegistry, patwari, "QTA-2024-008", "5430100001112", "Haji Rahim");
    expect(await landRegistry.doesParcelExist("QTA-2024-008")).to.equal(true);
  });

  it("WORKFLOW 8: Multiple lands for same CNIC", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    const cnic = "5430100012345";

    await register(landRegistry, patwari, "QTA-2024-101", cnic, "Owner Same");
    await register(landRegistry, patwari, "QTA-2024-102", cnic, "Owner Same");
    await register(landRegistry, patwari, "QTA-2024-103", cnic, "Owner Same");

    let ownerParcels = await landRegistry.getOwnerByCNIC(cnic);
    expect(ownerParcels.length).to.equal(3);

    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-101");
    await landRegistry.connect(dc).approveLand("QTA-2024-101", 101);
    await landRegistry.connect(patwari).initiateTransfer(
      "QTA-2024-101",
      "5530100000001",
      "New Owner One",
      "",
      "QmTransferHash3"
    );
    await landRegistry.connect(dc).approveTransfer("QTA-2024-101");

    ownerParcels = await landRegistry.getOwnerByCNIC(cnic);
    const newOwnerParcels = await landRegistry.getOwnerByCNIC("5530100000001");

    expect(ownerParcels.length).to.equal(2);
    expect(newOwnerParcels.length).to.equal(1);
    expect(newOwnerParcels[0]).to.equal("QTA-2024-101");
  });
});
