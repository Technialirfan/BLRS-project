const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("LandRegistry", function () {
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

    return { landRegistry, roleManager, admin, patwari, tehsildar, dc, citizen };
  }

  async function registerDefault(landRegistry, signer, parcelId = "QTA-2024-001") {
    return landRegistry.connect(signer).registerLand(
      parcelId,
      "5430155667788",
      "Khan Muhammad Baloch",
      "??? ???? ????",
      "Quetta",
      "Quetta",
      "Brewery Road",
      1800,
      1,
      "QmXyz123abcdef",
      30179800,
      67008900
    );
  }

  it("Should deploy with correct RoleManager address", async function () {
    const { landRegistry, roleManager } = await loadFixture(deployFixture);
    expect(await landRegistry.roleManager()).to.equal(await roleManager.getAddress());
  });

  it("Should start with zero parcels", async function () {
    const { landRegistry } = await loadFixture(deployFixture);
    expect(await landRegistry.getTotalParcels()).to.equal(0);
  });

  it("Should allow Patwari to register land", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    expect(await landRegistry.getTotalParcels()).to.equal(1);
  });

  it("Should emit LandRegistered event with all args", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await expect(registerDefault(landRegistry, patwari))
      .to.emit(landRegistry, "LandRegistered")
      .withArgs(
        "QTA-2024-001",
        "5430155667788",
        "Khan Muhammad Baloch",
        "Quetta",
        patwari.address,
        anyValue
      );
  });

  it("Should store correct land details on-chain", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);

    const land = await landRegistry.getLand("QTA-2024-001");
    expect(land.parcelId).to.equal("QTA-2024-001");
    expect(land.ownerCNIC).to.equal("5430155667788");
    expect(land.ownerName).to.equal("Khan Muhammad Baloch");
    expect(land.areaSqFt).to.equal(1800);
  });

  it("Should add parcel to cnicToParcelIds mapping", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    const parcels = await landRegistry.getOwnerByCNIC("5430155667788");
    expect(parcels[0]).to.equal("QTA-2024-001");
  });

  it("Should add parcel to districtToParcelIds mapping", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    const parcels = await landRegistry.getLandsByDistrict("Quetta");
    expect(parcels[0]).to.equal("QTA-2024-001");
  });

  it("Should create initial ownership history entry", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    const history = await landRegistry.getOwnershipHistory("QTA-2024-001");
    expect(history.length).to.equal(1);
    expect(history[0].transferType).to.equal("initial_registration");
  });

  it("Should set initial status to Pending", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    expect(await landRegistry.getLandStatus("QTA-2024-001")).to.equal(0);
  });

  it("Should REVERT if Patwari registers duplicate parcelId", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await expect(registerDefault(landRegistry, patwari)).to.be.revertedWithCustomError(
      landRegistry,
      "ParcelAlreadyExists"
    );
  });

  it("Should REVERT if non-Patwari tries to register", async function () {
    const { landRegistry, citizen } = await loadFixture(deployFixture);
    await expect(registerDefault(landRegistry, citizen)).to.be.revertedWithCustomError(
      landRegistry,
      "NotAuthorized"
    );
  });

  it("Should REVERT if area is 0", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await expect(
      landRegistry.connect(patwari).registerLand(
        "QTA-2024-001",
        "5430155667788",
        "Khan Muhammad Baloch",
        "",
        "Quetta",
        "Quetta",
        "Brewery Road",
        0,
        1,
        "QmXyz123abcdef",
        30179800,
        67008900
      )
    ).to.be.revertedWithCustomError(landRegistry, "InvalidArea");
  });

  it("Should REVERT if CNIC is not 13 digits", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await expect(
      landRegistry.connect(patwari).registerLand(
        "QTA-2024-001",
        "5430155",
        "Khan Muhammad Baloch",
        "",
        "Quetta",
        "Quetta",
        "Brewery Road",
        1800,
        1,
        "QmXyz123abcdef",
        30179800,
        67008900
      )
    ).to.be.revertedWith("LandRegistry: CNIC must be 13 digits");
  });

  it("Should REVERT if parcelId is empty", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await expect(
      landRegistry.connect(patwari).registerLand(
        "",
        "5430155667788",
        "Khan Muhammad Baloch",
        "",
        "Quetta",
        "Quetta",
        "Brewery Road",
        1800,
        1,
        "QmXyz123abcdef",
        30179800,
        67008900
      )
    ).to.be.revertedWithCustomError(landRegistry, "EmptyString");
  });

  it("Should REVERT if primaryDocHash is empty", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await expect(
      landRegistry.connect(patwari).registerLand(
        "QTA-2024-001",
        "5430155667788",
        "Khan Muhammad Baloch",
        "",
        "Quetta",
        "Quetta",
        "Brewery Road",
        1800,
        1,
        "",
        30179800,
        67008900
      )
    ).to.be.revertedWithCustomError(landRegistry, "EmptyString");
  });

  it("Should REVERT when contract is paused", async function () {
    const { landRegistry, admin, patwari } = await loadFixture(deployFixture);
    await landRegistry.connect(admin).pause();
    await expect(registerDefault(landRegistry, patwari)).to.be.revertedWithCustomError(
      landRegistry,
      "EnforcedPause"
    );
  });

  it("Should increment totalRegistered stat", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    const stats = await landRegistry.getStats();
    expect(stats[0]).to.equal(1);
  });

  it("Should allow Tehsildar to verify Pending land", async function () {
    const { landRegistry, patwari, tehsildar } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    expect(await landRegistry.getLandStatus("QTA-2024-001")).to.equal(1);
  });

  it("Should change status from Pending to Verified", async function () {
    const { landRegistry, patwari, tehsildar } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    const land = await landRegistry.getLand("QTA-2024-001");
    expect(land.status).to.equal(1);
  });

  it("Should store verifiedBy address correctly", async function () {
    const { landRegistry, patwari, tehsildar } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    const land = await landRegistry.getLand("QTA-2024-001");
    expect(land.verifiedBy).to.equal(tehsildar.address);
  });

  it("Should emit LandVerified event", async function () {
    const { landRegistry, patwari, tehsildar } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await expect(landRegistry.connect(tehsildar).verifyLand("QTA-2024-001"))
      .to.emit(landRegistry, "LandVerified")
      .withArgs("QTA-2024-001", tehsildar.address, anyValue);
  });

  it("Should REVERT if Tehsildar verifies non-Pending land", async function () {
    const { landRegistry, patwari, tehsildar } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await expect(
      landRegistry.connect(tehsildar).verifyLand("QTA-2024-001")
    ).to.be.revertedWithCustomError(landRegistry, "InvalidStatus");
  });

  it("Should REVERT if non-Tehsildar tries to verify", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await expect(
      landRegistry.connect(patwari).verifyLand("QTA-2024-001")
    ).to.be.revertedWithCustomError(landRegistry, "NotAuthorized");
  });

  it("Should increment totalVerified stat", async function () {
    const { landRegistry, patwari, tehsildar } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    const stats = await landRegistry.getStats();
    expect(stats[1]).to.equal(1);
  });

  it("Should allow DC to approve Verified land", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);
    expect(await landRegistry.getLandStatus("QTA-2024-001")).to.equal(2);
  });

  it("Should change status from Verified to Registered", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);
    const land = await landRegistry.getLand("QTA-2024-001");
    expect(land.status).to.equal(2);
  });

  it("Should store approvedBy address correctly", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);
    const land = await landRegistry.getLand("QTA-2024-001");
    expect(land.approvedBy).to.equal(dc.address);
  });

  it("Should emit LandApproved event with tokenId", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await expect(landRegistry.connect(dc).approveLand("QTA-2024-001", 7))
      .to.emit(landRegistry, "LandApproved")
      .withArgs("QTA-2024-001", "5430155667788", dc.address, 7, anyValue);
  });

  it("Should REVERT if DC approves non-Verified land", async function () {
    const { landRegistry, patwari, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await expect(
      landRegistry.connect(dc).approveLand("QTA-2024-001", 1)
    ).to.be.revertedWithCustomError(landRegistry, "InvalidStatus");
  });

  it("Should REVERT if non-DC tries to approve", async function () {
    const { landRegistry, patwari, tehsildar } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await expect(
      landRegistry.connect(patwari).approveLand("QTA-2024-001", 1)
    ).to.be.revertedWithCustomError(landRegistry, "NotAuthorized");
  });

  it("Should increment totalApproved stat", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);
    const stats = await landRegistry.getStats();
    expect(stats[2]).to.equal(1);
  });

  it("Should allow Tehsildar to reject Pending land", async function () {
    const { landRegistry, patwari, tehsildar } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).rejectLandByTehsildar("QTA-2024-001", "Insufficient documents submitted");
    expect(await landRegistry.getLandStatus("QTA-2024-001")).to.equal(3);
  });

  it("Should set status to Rejected", async function () {
    const { landRegistry, patwari, tehsildar } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).rejectLandByTehsildar("QTA-2024-001", "Insufficient documents submitted");
    const land = await landRegistry.getLand("QTA-2024-001");
    expect(land.status).to.equal(3);
  });

  it("Should store rejection reason", async function () {
    const { landRegistry, patwari, tehsildar } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    const reason = "Insufficient documents submitted";
    await landRegistry.connect(tehsildar).rejectLandByTehsildar("QTA-2024-001", reason);
    const land = await landRegistry.getLand("QTA-2024-001");
    expect(land.rejectionReason).to.equal(reason);
  });

  it("Should emit LandRejected event", async function () {
    const { landRegistry, patwari, tehsildar } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);

    await expect(
      landRegistry.connect(tehsildar).rejectLandByTehsildar("QTA-2024-001", "Insufficient documents submitted")
    ).to.emit(landRegistry, "LandRejected");
  });

  it("Should REVERT if reason is too short (< 10 chars)", async function () {
    const { landRegistry, patwari, tehsildar } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await expect(
      landRegistry.connect(tehsildar).rejectLandByTehsildar("QTA-2024-001", "short")
    ).to.be.revertedWith("LandRegistry: reason too short");
  });

  it("Should allow DC to reject Verified land", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).rejectLandByDC("QTA-2024-001", "Verification mismatch in survey map");
    expect(await landRegistry.getLandStatus("QTA-2024-001")).to.equal(3);
  });

  it("Should allow Patwari to initiate transfer on Registered land", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);

    await landRegistry.connect(patwari).initiateTransfer(
      "QTA-2024-001",
      "5530100223344",
      "Abdul Rehman Mengal",
      "????????? ?????",
      "QmTransfer001"
    );

    expect(await landRegistry.getLandStatus("QTA-2024-001")).to.equal(4);
  });

  it("Should set status to TransferPending", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);

    await landRegistry.connect(patwari).initiateTransfer(
      "QTA-2024-001",
      "5530100223344",
      "Abdul Rehman Mengal",
      "",
      "QmTransfer001"
    );

    const land = await landRegistry.getLand("QTA-2024-001");
    expect(land.status).to.equal(4);
  });

  it("Should store transfer request with correct details", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);

    await landRegistry.connect(patwari).initiateTransfer(
      "QTA-2024-001",
      "5530100223344",
      "Abdul Rehman Mengal",
      "",
      "QmTransfer001"
    );

    const transfer = await landRegistry.getTransferRequest("QTA-2024-001");
    expect(transfer.newOwnerCNIC).to.equal("5530100223344");
    expect(transfer.newOwnerName).to.equal("Abdul Rehman Mengal");
    expect(transfer.isActive).to.equal(true);
  });

  it("Should emit TransferInitiated event", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);

    await expect(
      landRegistry.connect(patwari).initiateTransfer(
        "QTA-2024-001",
        "5530100223344",
        "Abdul Rehman Mengal",
        "",
        "QmTransfer001"
      )
    ).to.emit(landRegistry, "TransferInitiated");
  });

  it("Should REVERT transfer on non-Registered land", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);

    await expect(
      landRegistry.connect(patwari).initiateTransfer(
        "QTA-2024-001",
        "5530100223344",
        "Abdul Rehman Mengal",
        "",
        "QmTransfer001"
      )
    ).to.be.revertedWithCustomError(landRegistry, "InvalidStatus");
  });

  it("Should REVERT transfer on disputed land", async function () {
    const { landRegistry, admin, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);
    await landRegistry.connect(admin).setDisputeStatus("QTA-2024-001", true);

    await expect(
      landRegistry.connect(patwari).initiateTransfer(
        "QTA-2024-001",
        "5530100223344",
        "Abdul Rehman Mengal",
        "",
        "QmTransfer001"
      )
    ).to.be.revertedWithCustomError(landRegistry, "LandIsDisputed");
  });

  it("Should allow DC to approve transfer", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);
    await landRegistry.connect(patwari).initiateTransfer(
      "QTA-2024-001",
      "5530100223344",
      "Abdul Rehman Mengal",
      "",
      "QmTransfer001"
    );

    await landRegistry.connect(dc).approveTransfer("QTA-2024-001");
    expect(await landRegistry.getLandStatus("QTA-2024-001")).to.equal(2);
  });

  it("Should update ownerCNIC and ownerName after transfer", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);
    await landRegistry.connect(patwari).initiateTransfer(
      "QTA-2024-001",
      "5530100223344",
      "Abdul Rehman Mengal",
      "",
      "QmTransfer001"
    );

    await landRegistry.connect(dc).approveTransfer("QTA-2024-001");
    const land = await landRegistry.getLand("QTA-2024-001");
    expect(land.ownerCNIC).to.equal("5530100223344");
    expect(land.ownerName).to.equal("Abdul Rehman Mengal");
  });

  it("Should update cnicToParcelIds mappings correctly", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);

    await landRegistry.connect(patwari).initiateTransfer(
      "QTA-2024-001",
      "5530100223344",
      "Abdul Rehman Mengal",
      "",
      "QmTransfer001"
    );

    await landRegistry.connect(dc).approveTransfer("QTA-2024-001");

    const oldOwnerParcels = await landRegistry.getOwnerByCNIC("5430155667788");
    const newOwnerParcels = await landRegistry.getOwnerByCNIC("5530100223344");

    expect(oldOwnerParcels.length).to.equal(0);
    expect(newOwnerParcels.length).to.equal(1);
    expect(newOwnerParcels[0]).to.equal("QTA-2024-001");
  });

  it("Should add transfer to ownership history", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);
    await landRegistry.connect(patwari).initiateTransfer(
      "QTA-2024-001",
      "5530100223344",
      "Abdul Rehman Mengal",
      "",
      "QmTransfer001"
    );
    await landRegistry.connect(dc).approveTransfer("QTA-2024-001");

    const history = await landRegistry.getOwnershipHistory("QTA-2024-001");
    expect(history.length).to.equal(2);
    expect(history[1].transferType).to.equal("transfer");
  });

  it("Should emit TransferApproved event", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);
    await landRegistry.connect(patwari).initiateTransfer(
      "QTA-2024-001",
      "5530100223344",
      "Abdul Rehman Mengal",
      "",
      "QmTransfer001"
    );

    await expect(landRegistry.connect(dc).approveTransfer("QTA-2024-001")).to.emit(
      landRegistry,
      "TransferApproved"
    );
  });

  it("Should allow DC to reject transfer", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);
    await landRegistry.connect(patwari).initiateTransfer(
      "QTA-2024-001",
      "5530100223344",
      "Abdul Rehman Mengal",
      "",
      "QmTransfer001"
    );

    await landRegistry.connect(dc).rejectTransfer("QTA-2024-001", "Transfer docs invalid");
    expect(await landRegistry.getLandStatus("QTA-2024-001")).to.equal(2);
  });

  it("Should revert status to Registered on rejection", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);
    await landRegistry.connect(patwari).initiateTransfer(
      "QTA-2024-001",
      "5530100223344",
      "Abdul Rehman Mengal",
      "",
      "QmTransfer001"
    );

    await landRegistry.connect(dc).rejectTransfer("QTA-2024-001", "Transfer docs invalid");
    const transfer = await landRegistry.getTransferRequest("QTA-2024-001");
    expect(transfer.isActive).to.equal(false);
  });

  it("Should allow setDisputeStatus to be called by owner", async function () {
    const { landRegistry, admin, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(admin).setDisputeStatus("QTA-2024-001", true);
    const land = await landRegistry.getLand("QTA-2024-001");
    expect(land.isDisputed).to.equal(true);
  });

  it("Should set status to Disputed when isDisputed=true", async function () {
    const { landRegistry, admin, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(admin).setDisputeStatus("QTA-2024-001", true);
    expect(await landRegistry.getLandStatus("QTA-2024-001")).to.equal(5);
  });

  it("Should clear dispute and set Registered when false", async function () {
    const { landRegistry, admin, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);

    await landRegistry.connect(admin).setDisputeStatus("QTA-2024-001", true);
    await landRegistry.connect(admin).setDisputeStatus("QTA-2024-001", false);

    expect(await landRegistry.getLandStatus("QTA-2024-001")).to.equal(2);
  });

  it("Should emit LandDisputeSet event", async function () {
    const { landRegistry, admin, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);

    await expect(landRegistry.connect(admin).setDisputeStatus("QTA-2024-001", true)).to.emit(
      landRegistry,
      "LandDisputeSet"
    );
  });

  it("Should allow Patwari to add documents", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(patwari).addDocument("QTA-2024-001", "QmDoc2", "Sale Deed");

    const land = await landRegistry.getLand("QTA-2024-001");
    expect(land.allDocHashes.length).to.equal(2);
  });

  it("Should append to allDocHashes array", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(patwari).addDocument("QTA-2024-001", "QmDoc2", "Sale Deed");

    const land = await landRegistry.getLand("QTA-2024-001");
    expect(land.allDocHashes[1]).to.equal("QmDoc2");
  });

  it("Should emit DocumentAdded event", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);

    await expect(
      landRegistry.connect(patwari).addDocument("QTA-2024-001", "QmDoc2", "Sale Deed")
    ).to.emit(landRegistry, "DocumentAdded");
  });

  it("getLand should return complete land data", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    const land = await landRegistry.getLand("QTA-2024-001");
    expect(land.mouza).to.equal("Brewery Road");
  });

  it("getOwnerByCNIC should return correct parcel IDs", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    const ids = await landRegistry.getOwnerByCNIC("5430155667788");
    expect(ids).to.deep.equal(["QTA-2024-001"]);
  });

  it("getLandsByDistrict should return correct parcels", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    const ids = await landRegistry.getLandsByDistrict("Quetta");
    expect(ids).to.deep.equal(["QTA-2024-001"]);
  });

  it("getOwnershipHistory should return full history", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    const history = await landRegistry.getOwnershipHistory("QTA-2024-001");
    expect(history.length).to.equal(1);
  });

  it("doesParcelExist should return correct bool", async function () {
    const { landRegistry, patwari } = await loadFixture(deployFixture);
    expect(await landRegistry.doesParcelExist("QTA-2024-001")).to.equal(false);
    await registerDefault(landRegistry, patwari);
    expect(await landRegistry.doesParcelExist("QTA-2024-001")).to.equal(true);
  });

  it("getStats should return correct counters", async function () {
    const { landRegistry, patwari, tehsildar, dc } = await loadFixture(deployFixture);
    await registerDefault(landRegistry, patwari);
    await landRegistry.connect(tehsildar).verifyLand("QTA-2024-001");
    await landRegistry.connect(dc).approveLand("QTA-2024-001", 1);
    const stats = await landRegistry.getStats();
    expect(stats[0]).to.equal(1);
    expect(stats[1]).to.equal(1);
    expect(stats[2]).to.equal(1);
  });
});
