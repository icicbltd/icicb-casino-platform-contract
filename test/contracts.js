const { expect } = require("chai");
const { ethers } = require("hardhat");
const stakingPoolABI = require("../artifacts/contracts/staking.sol/StakingPool.json").abi;
const treasuryABI = require("../artifacts/contracts/router.sol/Treasury.json").abi;

const {delay, fromBigNum, toBigNum} = require("./utils.js")

var owner;
var userWallet;

var atariToken;
var stakingRouter;
var treasury;
var stakingPools = [];

describe("Create UserWallet", function () {
    it("Create account", async function () {
        [owner] = await ethers.getSigners();

        userWallet = ethers.Wallet.createRandom();
        userWallet = userWallet.connect(ethers.provider);
        var tx = await owner.sendTransaction({
            to: userWallet.address, 
            value:ethers.utils.parseUnits("100",18)
        });
        await tx.wait();	
    });
});

describe("Staking factory deploy", function () {
    
    it("atariToken deploy", async function () {
        const AtariToken = await ethers.getContractFactory("ERC20");
        atariToken = await AtariToken.deploy("ATARI","ATRI","0","100000000000000");
        await atariToken.deployed();
    });

    it("Router deploy", async function () {
        const Router = await ethers.getContractFactory("StakingRouter");
        stakingRouter = await Router.deploy(owner.address, atariToken.address);
        await stakingRouter.deployed();
        
        var treasuryAddress = await stakingRouter.treasury();
        treasury = new ethers.Contract(treasuryAddress, treasuryABI, owner);
    });

    it("pools1 deploy", async function () {
        var gameInfo = {
            gameOwner:userWallet.address,
            feeRate:"10000",
            gameName:"TEST"           
        }

        var tx = await stakingRouter.create(gameInfo);
        var res = await tx.wait();
        let sumEvent = res.events.pop();
        let stakingPoolAddress = sumEvent.args[0];
        console.log(stakingPoolAddress)

        var stakingPool = new ethers.Contract(stakingPoolAddress, stakingPoolABI, owner);
        stakingPools.push(stakingPool);
    });

    it("pools2 deploy", async function () {
        var gameInfo = {
            gameOwner:userWallet.address,
            feeRate:"10000",
            gameName:"TEST2"        
        }

        var tx = await stakingRouter.create(gameInfo);
        var res = await tx.wait();
        let sumEvent = res.events.pop();
        let stakingPoolAddress = sumEvent.args[0];
        console.log(stakingPoolAddress)

        var stakingPool = new ethers.Contract(stakingPoolAddress, stakingPoolABI, owner);
        stakingPools.push(stakingPool);
    });
  
});

describe("pools test", function () {
    it("stake test", async function () {
        var stakingPool = stakingPools[0];

        var tx = await  atariToken.approve(stakingPool.address,"10000000000000");
        await tx.wait();

        var atariAddress = await stakingPool.atariAddress();
        console.log(atariAddress);
        tx = await stakingPool.stake("1000000");
        await tx.wait();

        var stakingPoolAmount = await stakingPool.totalSupply();
        var poolAmount = await atariToken.balanceOf(stakingPool.address);
        var adminAmount = await atariToken.balanceOf(userWallet.address);

        // 1000000 * 99% , 1000000 * 0.05%
        expect(stakingPoolAmount).to.equal(toBigNum("990000",0));
        expect(poolAmount).to.equal(toBigNum("990000",0));
        expect(adminAmount).to.equal(toBigNum("5000",0));

        console.log("step 1")
        tx = await stakingPool.stake("1000000");
        await tx.wait();

        var stakingPoolAmount = await stakingPool.totalSupply();
        var poolAmount = await atariToken.balanceOf(stakingPool.address);
        var adminAmount = await atariToken.balanceOf(userWallet.address);
        // 2000000 * 99% , 2000000 * 0.05%
        expect(stakingPoolAmount).to.equal(toBigNum("1980000",0));
        expect(poolAmount).to.equal(toBigNum("1980000",0));
        expect(adminAmount).to.equal(toBigNum("10000",0));
    });
    
    it("deposit test", async function () {
        var tx = await  atariToken.approve(treasury.address,"10000000000000");
        await tx.wait();

        tx = await treasury.deposit("1000000");
        await tx.wait();

        var treasuryAmount = await atariToken.balanceOf(treasury.address);

        // 1000000 
        expect(treasuryAmount).to.equal(toBigNum("1000000",0));
    });

});
/*
describe("game test", function () {
    it("win lose test", async function () {
        
        var stakingPool = stakingPools[0];
        
        var tx = await stakingRouter.gameWin(0,"500000");
        await tx.wait();

        tx = await stakingRouter.gameLose(0,"400000");
        await tx.wait();

        var poolAmount = await atariToken.balanceOf(stakingPool.address);
        
        //990000 + 100000
        expect(poolAmount).to.equal(toBigNum("1090000",0));
    });
});

describe("withdraw test", function () {
    it("staking withdraw test", async function () {
        
        var stakingPool = stakingPools[0];
        
        var stakeAmount = await stakingPool.balanceOf(owner.address);
        var poolAmount = await atariToken.balanceOf(stakingPool.address);
        
        console.log(fromBigNum(stakeAmount,0),fromBigNum(poolAmount,0));

        var tx = await stakingPool.unstake("500000");
        await tx.wait();

        poolAmount = await atariToken.balanceOf(stakingPool.address);
        
        //990000 + 100000
        expect(poolAmount).to.equal(toBigNum("545000",0));
    });

    it("player withdraw test", async function () {
        
        var poolAmount = await atariToken.balanceOf(treasury.address);
        
        console.log(fromBigNum(poolAmount,0));

        var tx = await stakingRouter.withdraw(owner.address, "500000");
        await tx.wait();

        poolAmount = await atariToken.balanceOf(treasury.address);
        
        //990000 + 100000
        expect(poolAmount).to.equal(toBigNum("400000",0));
    });
});

*/