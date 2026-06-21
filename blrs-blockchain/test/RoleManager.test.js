const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("RoleManager", function () {
  async function deployFixture() {
    const [admin, patwari, tehsildar, dc, other] = await ethers.getSigners();
    const RoleManager = await ethers.getContractFactory("RoleManager");
    const roleManager = await RoleManager.deploy(admin.address);

    return { roleManager, admin, patwari, tehsildar, dc, other };
  }

  it("Should deploy with correct admin address", async function () {
    const { roleManager, admin } = await loadFixture(deployFixture);
    expect(await roleManager.owner()).to.equal(admin.address);
  });

  it("Should set deployer as ADMIN_ROLE", async function () {
    const { roleManager, admin } = await loadFixture(deployFixture);
    const ADMIN_ROLE = await roleManager.ADMIN_ROLE();
    expect(await roleManager.hasRole(ADMIN_ROLE, admin.address)).to.equal(true);
  });

  it("Should set DEFAULT_ADMIN_ROLE correctly", async function () {
    const { roleManager, admin } = await loadFixture(deployFixture);
    const DEFAULT_ADMIN_ROLE = await roleManager.DEFAULT_ADMIN_ROLE();
    expect(await roleManager.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.equal(true);
  });

  it("Should register deployer as first officer", async function () {
    const { roleManager, admin } = await loadFixture(deployFixture);
    const officer = await roleManager.getOfficer(admin.address);
    expect(officer.wallet).to.equal(admin.address);
    expect(officer.fullName).to.equal("System Administrator");
    expect(await roleManager.totalOfficers()).to.equal(1);
  });

  it("Should have correct PATWARI_ROLE hash", async function () {
    const { roleManager } = await loadFixture(deployFixture);
    const hash = ethers.keccak256(ethers.toUtf8Bytes("PATWARI_ROLE"));
    expect(await roleManager.PATWARI_ROLE()).to.equal(hash);
  });

  it("Should have correct TEHSILDAR_ROLE hash", async function () {
    const { roleManager } = await loadFixture(deployFixture);
    const hash = ethers.keccak256(ethers.toUtf8Bytes("TEHSILDAR_ROLE"));
    expect(await roleManager.TEHSILDAR_ROLE()).to.equal(hash);
  });

  it("Should have correct DC_ROLE hash", async function () {
    const { roleManager } = await loadFixture(deployFixture);
    const hash = ethers.keccak256(ethers.toUtf8Bytes("DC_ROLE"));
    expect(await roleManager.DC_ROLE()).to.equal(hash);
  });

  it("Should allow admin to add a Patwari officer", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await roleManager.addOfficer(
      patwari.address,
      "Muhammad Ayaz Khan",
      "5430100000002",
      "patwari.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    expect(await roleManager.isPatwari(patwari.address)).to.equal(true);
  });

  it("Should allow admin to add a Tehsildar officer", async function () {
    const { roleManager, tehsildar } = await loadFixture(deployFixture);
    const role = await roleManager.TEHSILDAR_ROLE();

    await roleManager.addOfficer(
      tehsildar.address,
      "Abdul Qadir Mengal",
      "5430100000003",
      "tehsildar.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    expect(await roleManager.isTehsildar(tehsildar.address)).to.equal(true);
  });

  it("Should allow admin to add a DC officer", async function () {
    const { roleManager, dc } = await loadFixture(deployFixture);
    const role = await roleManager.DC_ROLE();

    await roleManager.addOfficer(
      dc.address,
      "Sardar Ahmed Raisani",
      "5430100000004",
      "dc.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    expect(await roleManager.isDC(dc.address)).to.equal(true);
  });

  it("Should emit OfficerAdded event with correct args", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await expect(
      roleManager.addOfficer(
        patwari.address,
        "Muhammad Ayaz Khan",
        "5430100000002",
        "patwari.quetta@blrs.gov.pk",
        "Quetta",
        role
      )
    )
      .to.emit(roleManager, "OfficerAdded")
      .withArgs(patwari.address, role, "Muhammad Ayaz Khan", "Quetta", anyValue);
  });

  it("Should REVERT if non-admin tries to add officer", async function () {
    const { roleManager, other, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await expect(
      roleManager
        .connect(other)
        .addOfficer(
          patwari.address,
          "Name",
          "5430100000002",
          "x@blrs.gov.pk",
          "Quetta",
          role
        )
    ).to.be.revertedWith("RoleManager: caller is not admin");
  });

  it("Should REVERT if officer already exists", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await roleManager.addOfficer(
      patwari.address,
      "Muhammad Ayaz Khan",
      "5430100000002",
      "patwari.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    await expect(
      roleManager.addOfficer(
        patwari.address,
        "Muhammad Ayaz Khan",
        "5430100000002",
        "patwari.quetta@blrs.gov.pk",
        "Quetta",
        role
      )
    )
      .to.be.revertedWithCustomError(roleManager, "OfficerAlreadyExists")
      .withArgs(patwari.address);
  });

  it("Should REVERT if invalid role is provided", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const invalidRole = ethers.keccak256(ethers.toUtf8Bytes("INVALID_ROLE"));

    await expect(
      roleManager.addOfficer(
        patwari.address,
        "Muhammad Ayaz Khan",
        "5430100000002",
        "patwari.quetta@blrs.gov.pk",
        "Quetta",
        invalidRole
      )
    ).to.be.revertedWithCustomError(roleManager, "InvalidRole");
  });

  it("Should REVERT if CNIC is not 13 digits", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await expect(
      roleManager.addOfficer(
        patwari.address,
        "Muhammad Ayaz Khan",
        "5430100000",
        "patwari.quetta@blrs.gov.pk",
        "Quetta",
        role
      )
    ).to.be.revertedWithCustomError(roleManager, "InvalidCNIC");
  });

  it("Should REVERT if fullName is empty", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await expect(
      roleManager.addOfficer(
        patwari.address,
        "",
        "5430100000002",
        "patwari.quetta@blrs.gov.pk",
        "Quetta",
        role
      )
    )
      .to.be.revertedWithCustomError(roleManager, "EmptyString")
      .withArgs("fullName");
  });

  it("Should increment totalOfficers correctly", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await roleManager.addOfficer(
      patwari.address,
      "Muhammad Ayaz Khan",
      "5430100000002",
      "patwari.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    expect(await roleManager.totalOfficers()).to.equal(2);
  });

  it("Should allow admin to deactivate an officer", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await roleManager.addOfficer(
      patwari.address,
      "Muhammad Ayaz Khan",
      "5430100000002",
      "patwari.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    await roleManager.deactivateOfficer(patwari.address);
    expect(await roleManager.isActiveOfficer(patwari.address)).to.equal(false);
  });

  it("Should revoke role on deactivation", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await roleManager.addOfficer(
      patwari.address,
      "Muhammad Ayaz Khan",
      "5430100000002",
      "patwari.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    await roleManager.deactivateOfficer(patwari.address);
    expect(await roleManager.hasRole(role, patwari.address)).to.equal(false);
  });

  it("Should emit OfficerDeactivated event", async function () {
    const { roleManager, admin, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await roleManager.addOfficer(
      patwari.address,
      "Muhammad Ayaz Khan",
      "5430100000002",
      "patwari.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    await expect(roleManager.deactivateOfficer(patwari.address))
      .to.emit(roleManager, "OfficerDeactivated")
      .withArgs(patwari.address, admin.address, anyValue);
  });

  it("Should REVERT if admin tries to deactivate self", async function () {
    const { roleManager, admin } = await loadFixture(deployFixture);
    await expect(roleManager.deactivateOfficer(admin.address)).to.be.revertedWithCustomError(
      roleManager,
      "CannotRemoveSelf"
    );
  });

  it("Should allow admin to reactivate officer", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await roleManager.addOfficer(
      patwari.address,
      "Muhammad Ayaz Khan",
      "5430100000002",
      "patwari.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    await roleManager.deactivateOfficer(patwari.address);
    await roleManager.activateOfficer(patwari.address);

    expect(await roleManager.isActiveOfficer(patwari.address)).to.equal(true);
  });

  it("Should grant role on reactivation", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await roleManager.addOfficer(
      patwari.address,
      "Muhammad Ayaz Khan",
      "5430100000002",
      "patwari.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    await roleManager.deactivateOfficer(patwari.address);
    await roleManager.activateOfficer(patwari.address);

    expect(await roleManager.hasRole(role, patwari.address)).to.equal(true);
  });

  it("isActiveOfficer should return false for deactivated", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await roleManager.addOfficer(
      patwari.address,
      "Muhammad Ayaz Khan",
      "5430100000002",
      "patwari.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    await roleManager.deactivateOfficer(patwari.address);
    expect(await roleManager.isActiveOfficer(patwari.address)).to.equal(false);
  });

  it("Should allow admin to update officer district", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await roleManager.addOfficer(
      patwari.address,
      "Muhammad Ayaz Khan",
      "5430100000002",
      "patwari.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    await roleManager.updateOfficerDistrict(patwari.address, "Gwadar");
    expect(await roleManager.getOfficerDistrict(patwari.address)).to.equal("Gwadar");
  });

  it("Should emit OfficerDistrictUpdated event", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await roleManager.addOfficer(
      patwari.address,
      "Muhammad Ayaz Khan",
      "5430100000002",
      "patwari.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    await expect(roleManager.updateOfficerDistrict(patwari.address, "Gwadar")).to.emit(
      roleManager,
      "OfficerDistrictUpdated"
    );
  });

  it("Should REVERT if new district is empty", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await roleManager.addOfficer(
      patwari.address,
      "Muhammad Ayaz Khan",
      "5430100000002",
      "patwari.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    await expect(roleManager.updateOfficerDistrict(patwari.address, ""))
      .to.be.revertedWithCustomError(roleManager, "EmptyString")
      .withArgs("newDistrict");
  });

  it("isPatwari should return true for Patwari", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await roleManager.addOfficer(
      patwari.address,
      "Muhammad Ayaz Khan",
      "5430100000002",
      "patwari.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    expect(await roleManager.isPatwari(patwari.address)).to.equal(true);
  });

  it("isTehsildar should return true for Tehsildar", async function () {
    const { roleManager, tehsildar } = await loadFixture(deployFixture);
    const role = await roleManager.TEHSILDAR_ROLE();

    await roleManager.addOfficer(
      tehsildar.address,
      "Abdul Qadir Mengal",
      "5430100000003",
      "tehsildar.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    expect(await roleManager.isTehsildar(tehsildar.address)).to.equal(true);
  });

  it("isDC should return true for DC", async function () {
    const { roleManager, dc } = await loadFixture(deployFixture);
    const role = await roleManager.DC_ROLE();

    await roleManager.addOfficer(
      dc.address,
      "Sardar Ahmed Raisani",
      "5430100000004",
      "dc.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    expect(await roleManager.isDC(dc.address)).to.equal(true);
  });

  it("isAdmin should return true for Admin", async function () {
    const { roleManager, admin } = await loadFixture(deployFixture);
    expect(await roleManager.isAdmin(admin.address)).to.equal(true);
  });

  it("Should return correct officer details", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await roleManager.addOfficer(
      patwari.address,
      "Muhammad Ayaz Khan",
      "5430100000002",
      "patwari.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    const officer = await roleManager.getOfficer(patwari.address);
    expect(officer.fullName).to.equal("Muhammad Ayaz Khan");
    expect(officer.assignedDistrict).to.equal("Quetta");
  });

  it("Should return all officers list", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();

    await roleManager.addOfficer(
      patwari.address,
      "Muhammad Ayaz Khan",
      "5430100000002",
      "patwari.quetta@blrs.gov.pk",
      "Quetta",
      role
    );

    const list = await roleManager.getAllOfficers();
    expect(list.length).to.equal(2);
  });

  it("Should allow admin to pause contract", async function () {
    const { roleManager } = await loadFixture(deployFixture);
    await roleManager.pause();
    expect(await roleManager.paused()).to.equal(true);
  });

  it("Should REVERT addOfficer when paused", async function () {
    const { roleManager, patwari } = await loadFixture(deployFixture);
    const role = await roleManager.PATWARI_ROLE();
    await roleManager.pause();

    await expect(
      roleManager.addOfficer(
        patwari.address,
        "Muhammad Ayaz Khan",
        "5430100000002",
        "patwari.quetta@blrs.gov.pk",
        "Quetta",
        role
      )
    ).to.be.revertedWithCustomError(roleManager, "EnforcedPause");
  });

  it("Should allow admin to unpause contract", async function () {
    const { roleManager } = await loadFixture(deployFixture);
    await roleManager.pause();
    await roleManager.unpause();
    expect(await roleManager.paused()).to.equal(false);
  });

  it("Should REVERT pause if called by non-admin", async function () {
    const { roleManager, other } = await loadFixture(deployFixture);
    await expect(roleManager.connect(other).pause()).to.be.revertedWith(
      "RoleManager: caller is not admin"
    );
  });
});
