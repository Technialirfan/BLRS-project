const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("DisputeResolution", function () {
  async function deployFixture() {
    const [admin, patwari, tehsildar, dc, citizen] = await ethers.getSigners();

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

    await landRegistry.transferOwnership(await disputeResolution.getAddress());

    await landRegistry.connect(patwari).registerLand(
      "QTA-2024-003",
      "5430188990011",
      "Sardar Faiz Muhammad Kakar",
      "",
      "Quetta",
      "Mastung",
      "Kuchlak Road",
      43560,
      0,
      "QmJkl345mno",
      29792400,
      66734600
    );

    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-003");
    await landRegistry.connect(dc).approveLand("QTA-2024-003", 2);

    return {
      roleManager,
      landRegistry,
      disputeResolution,
      admin,
      patwari,
      tehsildar,
      dc,
      citizen,
    };
  }

  async function fileBaseDispute(disputeResolution, signer) {
    return disputeResolution.connect(signer).fileDispute(
      "QTA-2024-003",
      "5430199887711",
      "Haji Gul Muhammad Kakar",
      "03101234567",
      3,
      "This land belongs to our family by inheritance and current owner details are incomplete and incorrect records.",
      ["QmEvidence001", "QmEvidence002"],
      ["Inheritance Certificate", "Court Document"]
    );
  }

  it("Should deploy with correct RoleManager and LandRegistry", async function () {
    const { disputeResolution, roleManager, landRegistry } = await loadFixture(deployFixture);
    expect(await disputeResolution.roleManager()).to.equal(await roleManager.getAddress());
    expect(await disputeResolution.landRegistry()).to.equal(await landRegistry.getAddress());
  });

  it("Should allow officer to file a dispute", async function () {
    const { disputeResolution, patwari } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    expect(await disputeResolution.getTotalDisputes()).to.equal(1);
  });

  it("Should set dispute status to Filed", async function () {
    const { disputeResolution, patwari } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    const dispute = await disputeResolution.getDispute(1);
    expect(dispute.status).to.equal(0);
  });

  it("Should set land isDisputed to true on LandRegistry", async function () {
    const { disputeResolution, landRegistry, patwari } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    const land = await landRegistry.getLand("QTA-2024-003");
    expect(land.isDisputed).to.equal(true);
  });

  it("Should set land status to Disputed", async function () {
    const { disputeResolution, landRegistry, patwari } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    expect(await landRegistry.getLandStatus("QTA-2024-003")).to.equal(5);
  });

  it("Should emit DisputeFiled event with all args", async function () {
    const { disputeResolution, patwari } = await loadFixture(deployFixture);
    await expect(fileBaseDispute(disputeResolution, patwari))
      .to.emit(disputeResolution, "DisputeFiled")
      .withArgs(1, "QTA-2024-003", "5430199887711", 3, patwari.address, anyValue);
  });

  it("Should store evidence hashes and types", async function () {
    const { disputeResolution, patwari } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    const dispute = await disputeResolution.getDispute(1);
    expect(dispute.evidenceHashes.length).to.equal(2);
    expect(dispute.evidenceTypes.length).to.equal(2);
  });

  it("Should REVERT if description < 50 characters", async function () {
    const { disputeResolution, patwari } = await loadFixture(deployFixture);
    await expect(
      disputeResolution.connect(patwari).fileDispute(
        "QTA-2024-003",
        "5430199887711",
        "Haji Gul Muhammad Kakar",
        "03101234567",
        3,
        "Too short description",
        ["QmEvidence001"],
        ["Inheritance Certificate"]
      )
    ).to.be.revertedWithCustomError(disputeResolution, "DescriptionTooShort");
  });

  it("Should REVERT if parcel does not exist", async function () {
    const { disputeResolution, patwari } = await loadFixture(deployFixture);
    await expect(
      disputeResolution.connect(patwari).fileDispute(
        "XYZ-0000-999",
        "5430199887711",
        "Haji Gul Muhammad Kakar",
        "03101234567",
        3,
        "This description is intentionally long enough to satisfy the minimum length check in contract.",
        ["QmEvidence001"],
        ["Inheritance Certificate"]
      )
    ).to.be.revertedWith("DisputeResolution: parcel does not exist");
  });

  it("Should REVERT if CNIC not 13 digits", async function () {
    const { disputeResolution, patwari } = await loadFixture(deployFixture);
    await expect(
      disputeResolution.connect(patwari).fileDispute(
        "QTA-2024-003",
        "5430199",
        "Haji Gul Muhammad Kakar",
        "03101234567",
        3,
        "This description is intentionally long enough to satisfy the minimum length check in contract.",
        ["QmEvidence001"],
        ["Inheritance Certificate"]
      )
    ).to.be.revertedWith("DisputeResolution: CNIC must be 13 digits");
  });

  it("Should REVERT if non-officer tries to file", async function () {
    const { disputeResolution, citizen } = await loadFixture(deployFixture);
    await expect(fileBaseDispute(disputeResolution, citizen)).to.be.revertedWith(
      "DisputeResolution: caller is not an officer"
    );
  });

  it("Should increment totalDisputes counter", async function () {
    const { disputeResolution, patwari } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    expect(await disputeResolution.totalDisputes()).to.equal(1);
  });

  it("Should assign correct disputeId (auto-increment)", async function () {
    const { disputeResolution, patwari } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await fileBaseDispute(disputeResolution, patwari);

    const d1 = await disputeResolution.getDispute(1);
    const d2 = await disputeResolution.getDispute(2);

    expect(d1.disputeId).to.equal(1);
    expect(d2.disputeId).to.equal(2);
  });

  it("Should allow Tehsildar to mark Filed dispute as UnderReview", async function () {
    const { disputeResolution, patwari, tehsildar } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await disputeResolution.connect(tehsildar).markUnderReview(1);
    const dispute = await disputeResolution.getDispute(1);
    expect(dispute.status).to.equal(1);
  });

  it("Should store reviewedBy address", async function () {
    const { disputeResolution, patwari, tehsildar } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await disputeResolution.connect(tehsildar).markUnderReview(1);
    const dispute = await disputeResolution.getDispute(1);
    expect(dispute.reviewedBy).to.equal(tehsildar.address);
  });

  it("Should emit DisputeMarkedUnderReview event", async function () {
    const { disputeResolution, patwari, tehsildar } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);

    await expect(disputeResolution.connect(tehsildar).markUnderReview(1))
      .to.emit(disputeResolution, "DisputeMarkedUnderReview")
      .withArgs(1, tehsildar.address, anyValue);
  });

  it("Should REVERT if dispute is not in Filed status", async function () {
    const { disputeResolution, patwari, tehsildar } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await disputeResolution.connect(tehsildar).markUnderReview(1);

    await expect(
      disputeResolution.connect(tehsildar).markUnderReview(1)
    ).to.be.revertedWithCustomError(disputeResolution, "InvalidDisputeStatus");
  });

  it("Should REVERT if non-Tehsildar calls markUnderReview", async function () {
    const { disputeResolution, patwari } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await expect(
      disputeResolution.connect(patwari).markUnderReview(1)
    ).to.be.revertedWithCustomError(disputeResolution, "NotAuthorized");
  });

  it("Should allow DC to resolve UnderReview dispute", async function () {
    const { disputeResolution, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await disputeResolution.connect(tehsildar).markUnderReview(1);
    await disputeResolution
      .connect(dc)
      .resolveDispute(1, "The submitted documents are not linked to this parcel and owner remains unchanged.");

    const dispute = await disputeResolution.getDispute(1);
    expect(dispute.status).to.equal(2);
  });

  it("Should set status to Resolved", async function () {
    const { disputeResolution, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await disputeResolution.connect(tehsildar).markUnderReview(1);
    await disputeResolution
      .connect(dc)
      .resolveDispute(1, "The submitted documents are not linked to this parcel and owner remains unchanged.");

    const dispute = await disputeResolution.getDispute(1);
    expect(dispute.status).to.equal(2);
  });

  it("Should store resolution text", async function () {
    const { disputeResolution, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    const resolution = "The submitted documents are not linked to this parcel and owner remains unchanged.";

    await fileBaseDispute(disputeResolution, patwari);
    await disputeResolution.connect(tehsildar).markUnderReview(1);
    await disputeResolution.connect(dc).resolveDispute(1, resolution);

    const dispute = await disputeResolution.getDispute(1);
    expect(dispute.resolution).to.equal(resolution);
  });

  it("Should set land isDisputed to false", async function () {
    const { disputeResolution, landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await disputeResolution.connect(tehsildar).markUnderReview(1);
    await disputeResolution
      .connect(dc)
      .resolveDispute(1, "The submitted documents are not linked to this parcel and owner remains unchanged.");

    const land = await landRegistry.getLand("QTA-2024-003");
    expect(land.isDisputed).to.equal(false);
  });

  it("Should restore land status to Registered", async function () {
    const { disputeResolution, landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await disputeResolution.connect(tehsildar).markUnderReview(1);
    await disputeResolution
      .connect(dc)
      .resolveDispute(1, "The submitted documents are not linked to this parcel and owner remains unchanged.");

    expect(await landRegistry.getLandStatus("QTA-2024-003")).to.equal(2);
  });

  it("Should emit DisputeResolved event", async function () {
    const { disputeResolution, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await disputeResolution.connect(tehsildar).markUnderReview(1);

    await expect(
      disputeResolution
        .connect(dc)
        .resolveDispute(1, "The submitted documents are not linked to this parcel and owner remains unchanged.")
    )
      .to.emit(disputeResolution, "DisputeResolved")
      .withArgs(1, "QTA-2024-003", anyValue, dc.address, anyValue);
  });

  it("Should REVERT if resolution < 20 chars", async function () {
    const { disputeResolution, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await disputeResolution.connect(tehsildar).markUnderReview(1);

    await expect(disputeResolution.connect(dc).resolveDispute(1, "too short"))
      .to.be.revertedWith("DisputeResolution: resolution too short");
  });

  it("Should REVERT if dispute not UnderReview", async function () {
    const { disputeResolution, patwari, dc } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);

    await expect(
      disputeResolution
        .connect(dc)
        .resolveDispute(1, "The submitted documents are not linked to this parcel and owner remains unchanged.")
    ).to.be.revertedWithCustomError(disputeResolution, "InvalidDisputeStatus");
  });

  it("Should REVERT if non-DC calls resolveDispute", async function () {
    const { disputeResolution, patwari, tehsildar } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await disputeResolution.connect(tehsildar).markUnderReview(1);

    await expect(
      disputeResolution
        .connect(tehsildar)
        .resolveDispute(1, "The submitted documents are not linked to this parcel and owner remains unchanged.")
    ).to.be.revertedWithCustomError(disputeResolution, "NotAuthorized");
  });

  it("Should allow DC to reject a Filed dispute", async function () {
    const { disputeResolution, patwari, dc } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await disputeResolution.connect(dc).rejectDispute(1, "Not related to parcel ownership");
    const dispute = await disputeResolution.getDispute(1);
    expect(dispute.status).to.equal(3);
  });

  it("Should allow DC to reject an UnderReview dispute", async function () {
    const { disputeResolution, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await disputeResolution.connect(tehsildar).markUnderReview(1);
    await disputeResolution.connect(dc).rejectDispute(1, "Evidence is not legally admissible");
    const dispute = await disputeResolution.getDispute(1);
    expect(dispute.status).to.equal(3);
  });

  it("Should set status to Rejected", async function () {
    const { disputeResolution, patwari, dc } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await disputeResolution.connect(dc).rejectDispute(1, "Not related to parcel ownership");
    const dispute = await disputeResolution.getDispute(1);
    expect(dispute.status).to.equal(3);
  });

  it("Should clear land dispute status", async function () {
    const { disputeResolution, landRegistry, patwari, dc } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await disputeResolution.connect(dc).rejectDispute(1, "Not related to parcel ownership");
    const land = await landRegistry.getLand("QTA-2024-003");
    expect(land.isDisputed).to.equal(false);
  });

  it("Should emit DisputeRejected event", async function () {
    const { disputeResolution, patwari, dc } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);

    await expect(disputeResolution.connect(dc).rejectDispute(1, "Not related to parcel ownership"))
      .to.emit(disputeResolution, "DisputeRejected")
      .withArgs(1, "Not related to parcel ownership", dc.address, anyValue);
  });

  it("getDispute should return full dispute data", async function () {
    const { disputeResolution, patwari } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    const dispute = await disputeResolution.getDispute(1);
    expect(dispute.claimantName).to.equal("Haji Gul Muhammad Kakar");
    expect(dispute.parcelId).to.equal("QTA-2024-003");
  });

  it("getDisputesByParcel should return correct IDs", async function () {
    const { disputeResolution, patwari } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await fileBaseDispute(disputeResolution, patwari);
    const ids = await disputeResolution.getDisputesByParcel("QTA-2024-003");
    expect(ids.length).to.equal(2);
    expect(ids[0]).to.equal(1);
    expect(ids[1]).to.equal(2);
  });

  it("getAllDisputeIds should return all IDs", async function () {
    const { disputeResolution, patwari } = await loadFixture(deployFixture);
    await fileBaseDispute(disputeResolution, patwari);
    await fileBaseDispute(disputeResolution, patwari);
    const ids = await disputeResolution.getAllDisputeIds();
    expect(ids.length).to.equal(2);
  });
});