pragma solidity 0.5.8;


// For testing purposes.
contract TokenMock {
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed from, address indexed spender, uint256 value);

    mapping(address => uint) public balanceOf;

    // Owner of account approves the transfer of an amount to another account
    mapping(address => mapping (address => uint256)) allowed;

    uint public fee;
    bool public feeFromPayer;
    bool public approvalMode;
    bool public maintenanceMode;

    function mint(address _to, uint _value) public {
        balanceOf[_to] += _value;
    }

    function enableApproval() public {
        approvalMode = true;
    }

    function disableApproval() public {
        approvalMode = false;
    }

    function enableMaintenance() public {
        maintenanceMode = true;
    }

    function disableMaintenance() public {
        maintenanceMode = false;
    }

    function approve(address _spender, uint256 _amount) public returns (bool success) {
        allowed[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }

    modifier maintenance() {
        if (maintenanceMode) {
            return;
        }
        _;
    }

    modifier enoughCoins(address _spender, uint _value) {
        if (balanceOf[_spender] < (feeFromPayer ? _value + fee : _value)) {
            return ;
        }
        _;
    }

    function transfer(address _to, uint256 _value) public
        maintenance()
        enoughCoins(msg.sender, _value)
    returns(bool) {
        balanceOf[msg.sender] -= feeFromPayer ? _value + fee : _value;
        balanceOf[_to] += feeFromPayer ? _value : _value - fee;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint _value) public
        maintenance()
        enoughCoins(_from, _value)
    returns(bool) {
        if (!approvalMode) {
            balanceOf[_from] -= feeFromPayer ? _value + fee : _value;
            balanceOf[_to] += feeFromPayer ? _value : _value - fee;
            return true;
        } else {
            if (allowed[_from][msg.sender] >= (feeFromPayer ? _value + fee : _value)) {
                balanceOf[_from] -= feeFromPayer ? _value + fee : _value;
                allowed[_from][msg.sender] -= feeFromPayer ? _value + fee : _value;
                balanceOf[_to] += feeFromPayer ? _value : _value - fee;
                return true;
            }
        }
    }

    function setFee(uint _value) public {
        fee = _value;
    }

    function setFeeFromPayer() public{
        feeFromPayer = true;
    }
}
