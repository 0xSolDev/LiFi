import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const eTHs = (value:number) => ethers.utils.parseEther(value.toString());

const daytime = 24*60*60;

const timeTravel = async (days: number) => {
    await ethers.provider.send("evm_increaseTime", [days * daytime]);
    await ethers.provider.send("evm_mine", []);
};

const projectinterface = [
    "function title() view returns (string)",
    "function description() view returns (string)",
    "function endTime() view returns (uint256)",
    "function durationTime() view returns (uint256)",
    "function goalAmount() view returns (uint256)",
    "function ended() view returns(bool)",
    "function totallockedamount() view returns (uint256)",
    "function Fund(address) public payable",
    "function retrieve(address) public payable",
    "event FundEnded(bool)",
    "event funded(address , uint256 )",
    "event FundRetrieved(address , uint256 )"
];
describe("CrowdFunding ",() => {
    let projectCreater1 : SignerWithAddress;
    let projectCreater2 : SignerWithAddress;
    let projectCreater3 : SignerWithAddress;
    let funder1 : SignerWithAddress;
    let funder2 : SignerWithAddress;
    let funder3 : SignerWithAddress;
    let CrowdFunding :Contract;
    let fishfarmingproject :Contract;
    let stockraisingproject :Contract;
    let buildingproject :Contract;
    before (async() => {
        [, 
            projectCreater1, 
            projectCreater2, 
            projectCreater3, 
            funder1, 
            funder2, 
            funder3 
        ] = await ethers.getSigners();
        const CrowdFundingContract = await ethers.getContractFactory("ManageCrowdFunding");
        CrowdFunding = await CrowdFundingContract.deploy();
        await CrowdFunding.deployed();
    });

    it("Able to start a project", async() => {
        //able to start fishingfarmingproject && able to start stockraisingproject
        expect(await CrowdFunding.connect(projectCreater1).CreateProjectGetAddress("fishfarming","For EndFundAmount",2,eTHs(100))).to.emit(CrowdFunding, "CreateFundingProject").withArgs(projectCreater1.address);
        expect(await CrowdFunding.connect(projectCreater2).CreateProjectGetAddress("stockraising","It is very important",3,eTHs(150))).to.emit(CrowdFunding, "CreateFundingProject").withArgs(projectCreater2.address);
        expect(await CrowdFunding.connect(projectCreater3).CreateProjectGetAddress("building","For the EndTime",5,eTHs(100))).to.emit(CrowdFunding, "CreateFundingProject").withArgs(projectCreater3.address);
    });
    it("Able to view this project", async() => {
        //view fishfarming project
        let add1 = await CrowdFunding.connect(funder1).ShowProject(1);
        fishfarmingproject = new ethers.Contract(add1, projectinterface, ethers.provider);
        expect(await fishfarmingproject.title()).to.be.equal("fishfarming");
        expect(await fishfarmingproject.description()).to.be.equal("For EndFundAmount");
        expect(await fishfarmingproject.durationTime()).to.be.equal("2");
        expect(await fishfarmingproject.goalAmount()).to.be.equal(eTHs(100));
        //view stockraisingproject
        add1 = await CrowdFunding.connect(funder1).ShowProject(2);
        stockraisingproject = new ethers.Contract(add1, projectinterface, ethers.provider);
        expect(await stockraisingproject.title()).to.be.equal("stockraising");
        expect(await stockraisingproject.description()).to.be.equal("It is very important");
        expect(await stockraisingproject.durationTime()).to.be.equal("3");
        expect(await stockraisingproject.goalAmount()).to.be.equal(eTHs(150));
        //view buildingproject
        add1 = await CrowdFunding.connect(funder1).ShowProject(3);
        buildingproject = new ethers.Contract(add1, projectinterface, ethers.provider);
        expect(await buildingproject.title()).to.be.equal("building");
        expect(await buildingproject.description()).to.be.equal("For the EndTime");
        expect(await buildingproject.durationTime()).to.be.equal("5");
        expect(await buildingproject.goalAmount()).to.be.equal(eTHs(100));

    });
    it("Able to fund this project", async() => {
        await expect(buildingproject.connect(funder1).Fund(funder1.address, {value: eTHs(10),})).to.emit(buildingproject, "funded").withArgs(funder1.address,eTHs(10));

        await expect(stockraisingproject.connect(funder1).Fund(funder1.address, {value: eTHs(200),})).to.emit(stockraisingproject,"funded").withArgs(funder1.address, eTHs(200));
        await expect(stockraisingproject.connect(funder2).Fund(funder2.address, {value: eTHs(10),})).to.be.revertedWith("FundAlreadyEnded");

        await expect(fishfarmingproject.connect(funder1).Fund(funder1.address, {value: eTHs(10),})).to.emit(fishfarmingproject, "funded").withArgs(funder1.address , eTHs(10));
        await timeTravel(3);
        await expect(fishfarmingproject.connect(funder2).Fund(funder2.address, {value: eTHs(10),})).to.be.revertedWith("ProjectFailed");

    });
    it("Able to retrieve this project", async()=> {
        await expect(stockraisingproject.connect(funder2).retrieve(funder2.address)).to.be.revertedWith("FundSuccessed");
        await expect(buildingproject.connect(funder1).retrieve(funder1.address)).to.be.revertedWith("Wait to endTime");
        await expect(fishfarmingproject.connect(funder3).retrieve(funder3.address)).to.be.revertedWith("Your fundedamount is 0");

        await expect(fishfarmingproject.connect(funder1).retrieve(funder1.address)).to.emit(fishfarmingproject, "FundRetrieved").withArgs(funder1.address, eTHs(10));
    });
});