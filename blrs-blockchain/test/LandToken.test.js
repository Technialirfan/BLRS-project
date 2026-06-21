const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("LandToken", function () {
  async function deployFixture() {
    const [admin, dc, ownerWallet, newOwnerWallet, other] = await ethers.getSigners();

    const RoleManager = await ethers.getContractFactory("RoleManager");
    const roleManager = await RoleManager.deploy(admin.address);

    const DC_ROLE = await roleManager.DC_ROLE();
    await roleManager.addOfficer(
      dc.address,
      "Sardar Ahmed Raisani",
      "5430100000004",
      "dc.quetta@blrs.gov.pk",
      "Quetta",
      DC_ROLE
    );

    const LandToken = await ethers.getContractFactory("LandToken");
    const landToken = await LandToken.deploy(await roleManager.getAddress());

    return { landToken, roleManager, admin, dc, ownerWallet, newOwnerWallet, other };
  }

  async function mintDefault(landToken, dc, toWallet = null) {
    const receiver = toWallet || dc.address;
    return landToken.connect(dc).mintLandCertificate(
      receiver,
      "QTA-2024-001",
      "5430155667788",
      "Khan Muhammad Baloch",
      "Quetta",
      1800,
      "Residential",
      "ipfs://QmTokenMetadata001"
    );
  }

  it("Should deploy with name: Balochistan Land Certificate", async function () {
    const { landToken } = await loadFixture(deployFixture);
    expect(await landToken.name()).to.equal("Balochistan Land Certificate");
  });

  it("Should deploy with symbol: BLRS", async function () {
    const { landToken } = await loadFixture(deployFixture);
    expect(await landToken.symbol()).to.equal("BLRS");
  });

  it("Should support ERC-721 interface", async function () {
    const { landToken } = await loadFixture(deployFixture);
    expect(await landToken.supportsInterface("0x80ac58cd")).to.equal(true);
  });

  it("Should allow DC to mint land certificate NFT", async function () {
    const { landToken, dc } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc);
    expect(await landToken.totalMinted()).to.equal(1);
  });

  it("Should assign token to correct wallet address", async function () {
    const { landToken, dc, ownerWallet } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc, ownerWallet.address);
    expect(await landToken.ownerOf(1)).to.equal(ownerWallet.address);
  });

  it("Should store correct tokenToParcel mapping", async function () {
    const { landToken, dc } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc);
    expect(await landToken.tokenToParcel(1)).to.equal("QTA-2024-001");
  });

  it("Should store correct parcelToToken mapping", async function () {
    const { landToken, dc } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc);
    expect(await landToken.parcelToToken("QTA-2024-001")).to.equal(1);
  });

  it("Should set hasToken to true for parcelId", async function () {
    const { landToken, dc } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc);
    expect(await landToken.parcelHasToken("QTA-2024-001")).to.equal(true);
  });

  it("Should store complete token metadata", async function () {
    const { landToken, dc } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc);
    const metadata = await landToken.getMetadata(1);

    expect(metadata.parcelId).to.equal("QTA-2024-001");
    expect(metadata.ownerCNIC).to.equal("5430155667788");
    expect(metadata.ownerName).to.equal("Khan Muhammad Baloch");
    expect(metadata.district).to.equal("Quetta");
  });

  it("Should emit LandTokenMinted event", async function () {
    const { landToken, dc } = await loadFixture(deployFixture);

    await expect(mintDefault(landToken, dc))
      .to.emit(landToken, "LandTokenMinted")
      .withArgs(1, "QTA-2024-001", "5430155667788", "Khan Muhammad Baloch", dc.address, anyValue);
  });

  it("Should return correct tokenURI", async function () {
    const { landToken, dc } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc);
    expect(await landToken.tokenURI(1)).to.equal("ipfs://QmTokenMetadata001");
  });

  it("Should REVERT if DC mints duplicate for same parcel", async function () {
    const { landToken, dc } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc);
    await expect(mintDefault(landToken, dc)).to.be.revertedWithCustomError(
      landToken,
      "TokenAlreadyExists"
    );
  });

  it("Should REVERT if non-DC tries to mint", async function () {
    const { landToken, other } = await loadFixture(deployFixture);
    await expect(
      landToken.connect(other).mintLandCertificate(
        other.address,
        "QTA-2024-001",
        "5430155667788",
        "Khan Muhammad Baloch",
        "Quetta",
        1800,
        "Residential",
        "ipfs://QmTokenMetadata001"
      )
    ).to.be.revertedWithCustomError(landToken, "NotAuthorized");
  });

  it("Should increment totalMinted counter", async function () {
    const { landToken, dc } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc);
    expect(await landToken.totalMinted()).to.equal(1);
  });

  it("Should REVERT if toWallet is zero address", async function () {
    const { landToken, dc } = await loadFixture(deployFixture);
    await expect(
      landToken.connect(dc).mintLandCertificate(
        ethers.ZeroAddress,
        "QTA-2024-001",
        "5430155667788",
        "Khan Muhammad Baloch",
        "Quetta",
        1800,
        "Residential",
        "ipfs://QmTokenMetadata001"
      )
    ).to.be.revertedWith("LandToken: invalid wallet");
  });

  it("Should allow DC to transfer certificate to new owner", async function () {
    const { landToken, dc, ownerWallet, newOwnerWallet } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc, ownerWallet.address);

    await landToken
      .connect(dc)
      .transferLandCertificate("QTA-2024-001", newOwnerWallet.address, "5530100223344", "Abdul Rehman Mengal");

    expect(await landToken.ownerOf(1)).to.equal(newOwnerWallet.address);
  });

  it("Should update tokenMetadata ownerCNIC and ownerName", async function () {
    const { landToken, dc, ownerWallet, newOwnerWallet } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc, ownerWallet.address);

    await landToken
      .connect(dc)
      .transferLandCertificate("QTA-2024-001", newOwnerWallet.address, "5530100223344", "Abdul Rehman Mengal");

    const metadata = await landToken.getMetadata(1);
    expect(metadata.ownerCNIC).to.equal("5530100223344");
    expect(metadata.ownerName).to.equal("Abdul Rehman Mengal");
  });

  it("Should emit LandTokenTransferred event", async function () {
    const { landToken, dc, ownerWallet, newOwnerWallet } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc, ownerWallet.address);

    await expect(
      landToken
        .connect(dc)
        .transferLandCertificate("QTA-2024-001", newOwnerWallet.address, "5530100223344", "Abdul Rehman Mengal")
    )
      .to.emit(landToken, "LandTokenTransferred")
      .withArgs(1, "QTA-2024-001", ownerWallet.address, newOwnerWallet.address, anyValue);
  });

  it("Should REVERT if token for parcel does not exist", async function () {
    const { landToken, dc, newOwnerWallet } = await loadFixture(deployFixture);
    await expect(
      landToken
        .connect(dc)
        .transferLandCertificate("QTA-2024-001", newOwnerWallet.address, "5530100223344", "Abdul Rehman Mengal")
    ).to.be.revertedWithCustomError(landToken, "TokenNotFound");
  });

  it("Should REVERT if non-DC calls transfer", async function () {
    const { landToken, dc, other, ownerWallet, newOwnerWallet } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc, ownerWallet.address);

    await expect(
      landToken
        .connect(other)
        .transferLandCertificate("QTA-2024-001", newOwnerWallet.address, "5530100223344", "Abdul Rehman Mengal")
    ).to.be.revertedWithCustomError(landToken, "NotAuthorized");
  });

  it("getTokenByParcel should return correct tokenId", async function () {
    const { landToken, dc } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc);
    expect(await landToken.getTokenByParcel("QTA-2024-001")).to.equal(1);
  });

  it("getMetadata should return full metadata struct", async function () {
    const { landToken, dc } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc);
    const metadata = await landToken.getMetadata(1);
    expect(metadata.areaSqFt).to.equal(1800);
  });

  it("parcelHasToken should return true after mint", async function () {
    const { landToken, dc } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc);
    expect(await landToken.parcelHasToken("QTA-2024-001")).to.equal(true);
  });

  it("totalSupply should return minted - burned count", async function () {
    const { landToken, dc } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc);
    expect(await landToken.totalSupply()).to.equal(1);

    await landToken.connect(dc).burn(1);
    expect(await landToken.totalSupply()).to.equal(0);
  });

  it("ownerOf should return correct owner wallet", async function () {
    const { landToken, dc, ownerWallet } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc, ownerWallet.address);
    expect(await landToken.ownerOf(1)).to.equal(ownerWallet.address);
  });

  it("Should REVERT token transfer when contract is paused", async function () {
    const { landToken, admin, dc, ownerWallet, newOwnerWallet } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc, ownerWallet.address);
    await landToken.connect(admin).pause();

    await expect(
      landToken.connect(ownerWallet).transferFrom(ownerWallet.address, newOwnerWallet.address, 1)
    ).to.be.revertedWithCustomError(landToken, "EnforcedPause");
  });

  it("Should allow transfers after unpause", async function () {
    const { landToken, admin, dc, ownerWallet, newOwnerWallet } = await loadFixture(deployFixture);
    await mintDefault(landToken, dc, ownerWallet.address);
    await landToken.connect(admin).pause();
    await landToken.connect(admin).unpause();

    await landToken.connect(ownerWallet).transferFrom(ownerWallet.address, newOwnerWallet.address, 1);
    expect(await landToken.ownerOf(1)).to.equal(newOwnerWallet.address);
  });
});
