pragma solidity ^0.4.10;

import "./Owned.sol";
import "./Property.sol";
import "./ComissionCalc.sol";
import "./ERC20.sol";
import "./PropertyManager.sol";

contract Deed is Owned {

  enum Status {
    reserve,
    sellerInvited,
    agentInvited,
    verifed,
    purchaseAgreement,
    payment,
    paymentDone,
    titleDeedAppoved,
    titleTransferDone,
    withdrawalDone
  }

  enum TitleTransferStatus{
    notRegistered,
    approved,
    rejected
  }

  modifier onlySuperUsers() {
    if (contractOwner == msg.sender || deedCreatorAddress == msg.sender) _;
  }

  address deedCreatorAddress;


  bool public invitedSeller;
  bool public invitedEscrowAgent;

  bool public buyerSigned;
  bool public sellerSigned;
  bool public brokerSigned;

  address public selledId;
  address public buyerId;
  address public brokerId;
  address public agentId;
  address public inspectorId;
  address public propertyId;

  address propyContractAddress;
  ERC20 propyToken;
  ComissionCalc comissionCalc;
  address propyCompanyWallet;
  address propyNetworkGrowthPoolWallet;

  address public seller_wallet;
  address public buyer_wallet;

  Status public status;
  TitleTransferStatus public titleTransferStatus;

  string public notaryActionDate;
  string public distributed;

  string public metaAC; // hash of Agent Contract
  string public metaPA; // hash of Purchase Agreement
  string public metaTD; // hash of Title Deed
  string public metaTDLocal; // hash of Title Deed Local

  uint public createdAt;
  uint public updatedAt;

  uint public price;

  mapping (address => uint) public pendingWithdrawals;

  string public rejectDescription;

  event PaymentReceived(uint value, address from);
  event StatusUpdate(Status stat);
  event PropyComission(address indexed deed, uint256 companyComission, uint256 networkGrowthComission);
  event SellerWalletChanged(address addr);
  event BuyerWalletChanged(address addr);






  // ---------------------------------------------------------------------------
  // Constuctor
  // Initialize Deed metadata
  function Deed(address _propertyId, address _brokerId, address _buyerId, address _buyer_wallet,
     address _agentId, address _selledId, address _seller_wallet, uint _price, address _propyToken,
      address _comissionCalc, address _propyCompanyWallet, address _propyNetworkGrowthPoolWallet,
      address _deedCreatorAddress) {
    propyContractAddress=msg.sender;
    deedCreatorAddress=_deedCreatorAddress;
    propyToken = ERC20(_propyToken);
    comissionCalc=ComissionCalc(_comissionCalc);
    propyCompanyWallet=_propyCompanyWallet;
    propyNetworkGrowthPoolWallet=_propyNetworkGrowthPoolWallet;
    propertyId = _propertyId;
    brokerId = _brokerId;
    buyerId = _buyerId;
    selledId = _selledId;
    seller_wallet = _seller_wallet;
    buyer_wallet = _buyer_wallet;
    agentId = _agentId;
    price = _price;
    assert (price > 0);
    assert (seller_wallet>0);
    status = Status.reserve;
    createdAt = now;
    status = Status.purchaseAgreement;

  }

  function changeSellerWallet(address new_address) onlySuperUsers(){
    require(status != Status.withdrawalDone);
    uint withdrawalLimit=pendingWithdrawals[seller_wallet];
    pendingWithdrawals[seller_wallet]=0;
    pendingWithdrawals[new_address]=withdrawalLimit;
    seller_wallet = new_address;
    SellerWalletChanged(seller_wallet);
  }

  function changeBuyerWallet(address new_address) onlySuperUsers(){
    require(status != Status.withdrawalDone);
    uint withdrawalLimit=pendingWithdrawals[buyer_wallet];
    pendingWithdrawals[buyer_wallet]=0;
    pendingWithdrawals[new_address]=withdrawalLimit;
    buyer_wallet = new_address;
    BuyerWalletChanged(buyer_wallet);
  }


  //Fallback to receive Ether from any wallet as a payment
  function () payable {
    require (msg.sender == buyer_wallet);
    require (status == Status.payment);
    PaymentReceived(msg.value, msg.sender);
    if(this.balance>=price){
      status = Status.paymentDone;
      StatusUpdate(status);
    }
  }

  function notaryActionReject(string _date, string _rejectDescription){
    require (agentId == msg.sender);
    require (status == Status.paymentDone);
    notaryActionDate = _date;
    rejectDescription=_rejectDescription;
    titleTransferStatus=TitleTransferStatus.rejected;
    //cancel pending state for propertyAddress
    Property prop = Property(propertyId);
    prop.rejectOwnershipTransfer();
    //release money for buyer's account
    pendingWithdrawals[buyer_wallet] += this.balance;
    status=Status.titleTransferDone;
    StatusUpdate(status);
  }


  function documentSaveTitleDeedLocal(string _date, string _localHash) {
    notaryActionApprove(_date, _localHash);
  }

  function notaryActionApprove(string _date, string _localHash) {
    require (agentId == msg.sender);
    require (status == Status.paymentDone);
    notaryActionDate = _date;
    metaTDLocal = _localHash;
    titleTransferStatus=TitleTransferStatus.approved;
    //**********
    //transfer 100 PRO tokens comission
    uint256 companyComission=comissionCalc.getCompanyComission(price);
    uint256 networkGrowthComission=comissionCalc.getNetworkGrowthComission(price);
    require(propyToken.balanceOf(buyerId)>=companyComission+networkGrowthComission);
    assert (propyToken.transferFrom(buyerId, propyCompanyWallet, companyComission));
    assert (propyToken.transferFrom(buyerId, propyNetworkGrowthPoolWallet, networkGrowthComission));
    PropyComission(address(this),companyComission,networkGrowthComission);
    //updates the owner of the property
    Property prop = Property(propertyId);
    prop.approveOwnershipTransfer(buyerId);
    status=Status.titleDeedAppoved;
    StatusUpdate(status);
    // release contract money to seller
    pendingWithdrawals[seller_wallet] += this.balance;
    status=Status.titleTransferDone;
    StatusUpdate(status);
  }

  function withdraw() {
        uint amount = pendingWithdrawals[msg.sender];
        // Remember to zero the pending refund before
        // sending to prevent re-entrancy attacks
        pendingWithdrawals[msg.sender] = 0;
        msg.sender.transfer(amount);
        status = Status.withdrawalDone;
        StatusUpdate(status);
  }

  // sign PA
  function sign(string _hash) returns (bool) {
    if (selledId == msg.sender)
      sellerSigned = true;
    if (buyerId == msg.sender)
      buyerSigned = true;
    if (brokerId == msg.sender)
        brokerSigned = true;

    if (sellerSigned && buyerSigned && brokerSigned){
      //save PA Signed Hash
      metaPA = _hash;
      status = Status.payment;
      StatusUpdate(status);

      PropertyManager proeprtyManager = PropertyManager(propyContractAddress);
      assert(proeprtyManager.setPropertyToPendingState(propertyId));

    }
    updatedAt = now;
    return true;
  }

  // Kill contract
  function kill() onlySuperUsers() {
   if (msg.sender == contractOwner || msg.sender == deedCreatorAddress){
      suicide(msg.sender);
    }
  }

}
