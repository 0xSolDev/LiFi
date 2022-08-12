// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "hardhat/console.sol";

contract CrowdFunding {
    string public title;
    string public description;
    uint256 public endTime;
    uint256 public durationTime;
    uint256 public goalAmount;
    uint256 public totallockedamount;
    uint256 internal constant daytime = 1 days;
    address payable public owner;
    bool public ended = false;
    
    mapping(address => uint256) public lockedFunds;
    
    event FundEnded(bool);
    event funded(address sender, uint256 amount);
    event FundRetrieved(address _sender, uint256 amount);

    modifier checkunended{
        require(!ended , "FundAlreadyEnded");
        require(block.timestamp < endTime , "ProjectFailed");
        _;
    }
    //constructor
    constructor(address projectcreator, string memory _title,string memory _description, uint256 _durationTime, uint256 _goalAmount) {
        owner = payable(projectcreator);
        title = _title; 
        description = _description;
        endTime = block.timestamp + _durationTime * daytime;
        durationTime = _durationTime;
        goalAmount = _goalAmount;
    }
    
    function Fund (address sender) checkunended external payable{
        totallockedamount += msg.value;
        lockedFunds[sender] += msg.value;

        emit funded(sender, msg.value);

        if(totallockedamount >= goalAmount)
        {
            ended = true;
            payable(owner).transfer(totallockedamount);
            totallockedamount = 0;
            emit FundEnded(ended);
        }
    }
    function retrieve(address sender)  external payable{
        require(!ended , "FundSuccessed");
        require(block.timestamp > endTime, "Wait to endTime");
        require(lockedFunds[sender] > 0, "Your fundedamount is 0");
        payable(sender).transfer(lockedFunds[sender]);
        emit FundRetrieved(sender, lockedFunds[sender]);
        lockedFunds[sender] = 0;
        totallockedamount -= lockedFunds[sender];
    }
}
contract ManageCrowdFunding{
    mapping (uint256 => CrowdFunding) public address_;
    uint256 id = 1;
    event CreateFundingProject(address);

    function CreateProjectGetAddress(
        string memory _title,
        string memory _description,
        uint _duringtime,
        uint256 _fundGoalAmount) public payable 
    {
        address_[id++] = new CrowdFunding(msg.sender, _title, _description, _duringtime, _fundGoalAmount);
        emit CreateFundingProject(msg.sender);
    }
    function ShowProject(uint256 id_) external view returns(CrowdFunding)
    {
        return address_[id_];
    }
}