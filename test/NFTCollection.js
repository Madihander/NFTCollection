const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ManulMystique", function () {
  let contract;

  beforeEach(async function () {
    const ManulMystique = await ethers.getContractFactory("ManulMystique");
    contract = await ManulMystique.deploy();
    await contract.deployed();
  });

  it("Should mint tokens up to max supply", async function () {
    const [owner, user1] = await ethers.getSigners();

    for (let i = 0; i < 9; i++) {
      await expect(contract.connect(owner).safeMint(user1.address, { value: ethers.utils.parseEther("0.001") })).to.emit(contract, "Transfer");
    }

    await expect(contract.connect(owner).safeMint(user1.address, { value: ethers.utils.parseEther("0.001") })).to.be.revertedWith("You reached max supply");
  });

  it("Should mint a token and update contract balance", async function () {
    const [owner, user1] = await ethers.getSigners();

    const initialBalance = await ethers.provider.getBalance(contract.address);
    await expect(contract.connect(owner).safeMint(user1.address, { value: ethers.utils.parseEther("0.001") })).to.emit(contract, "Transfer");
    expect(await contract.balanceOf(user1.address)).to.equal(1);
    expect(await ethers.provider.getBalance(contract.address)).to.equal(initialBalance.add(ethers.utils.parseEther("0.001")));
  });

  it("Should return token URI", async function () {
    const [owner, user1] = await ethers.getSigners();

    await expect(contract.connect(owner).safeMint(user1.address, { value: ethers.utils.parseEther("0.001") })).to.emit(contract, "Transfer");
    const tokenURI = await contract.tokenURI(0);

    expect(tokenURI).to.not.be.empty;
  });

  it("Should change the base URI", async function () {
    const [owner] = await ethers.getSigners();
    const newBaseURI = "ipfs://QmSomeNewHash/";

    await expect(contract.connect(owner).changeBaseURI(newBaseURI)).to.emit(contract, "BaseURIChanged");
    expect(await contract.baseURI()).to.equal(newBaseURI);
  });

  it("Should not allow non-owners to change the base URI", async function () {
    const [owner, user1] = await ethers.getSigners();
    const newBaseURI = "ipfs://QmSomeNewHash/";

    await expect(contract.connect(user1).changeBaseURI(newBaseURI)).to.be.revertedWith("Ownable: caller is not the owner");
    expect(await contract.baseURI()).to.not.equal(newBaseURI);
  });

  it("Should not allow minting without valid amount of ether", async function () {
    const [owner, user1] = await ethers.getSigners();

    await expect(contract.connect(owner).safeMint(user1.address, { value: ethers.utils.parseEther("0.0001") })).to.be.revertedWith("Please add valid amount of ETH");
    expect(await contract.balanceOf(user1.address)).to.equal(0);
  });
});