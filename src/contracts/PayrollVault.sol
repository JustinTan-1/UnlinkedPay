// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PayrollVault
 * @notice Manages payroll manifests onchain. Actual salary payments are
 *         handled via Unlink's privacy layer (shielded transfers).
 *         This contract stores the organizational structure and tracks
 *         payroll execution events.
 */
contract PayrollVault {
    struct Employee {
        address payable wallet;     // EOA for reference (withdrawals go here)
        string unlinkAddress;       // Unlink shielded address (unlink1...)
        uint256 salary;             // Salary amount per period
        bool active;
    }

    address public owner;
    string public companyName;
    
    mapping(uint256 => Employee) public employees;
    uint256 public employeeCount;
    uint256 public payrollRunCount;

    event EmployeeAdded(uint256 indexed id, string unlinkAddress, uint256 salary);
    event EmployeeRemoved(uint256 indexed id);
    event EmployeeUpdated(uint256 indexed id, uint256 newSalary);
    event PayrollExecuted(uint256 indexed runId, uint256 totalAmount, uint256 employeesPaid);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(string memory _companyName) {
        owner = msg.sender;
        companyName = _companyName;
    }

    function addEmployee(
        address payable _wallet,
        string calldata _unlinkAddress,
        uint256 _salary
    ) external onlyOwner returns (uint256) {
        uint256 id = employeeCount++;
        employees[id] = Employee({
            wallet: _wallet,
            unlinkAddress: _unlinkAddress,
            salary: _salary,
            active: true
        });
        emit EmployeeAdded(id, _unlinkAddress, _salary);
        return id;
    }

    function removeEmployee(uint256 _id) external onlyOwner {
        require(_id < employeeCount, "Invalid employee");
        employees[_id].active = false;
        emit EmployeeRemoved(_id);
    }

    function updateSalary(uint256 _id, uint256 _newSalary) external onlyOwner {
        require(_id < employeeCount, "Invalid employee");
        require(employees[_id].active, "Employee inactive");
        employees[_id].salary = _newSalary;
        emit EmployeeUpdated(_id, _newSalary);
    }

    function recordPayrollExecution(uint256 _totalAmount, uint256 _employeesPaid) external onlyOwner {
        uint256 runId = payrollRunCount++;
        emit PayrollExecuted(runId, _totalAmount, _employeesPaid);
    }

    function getEmployee(uint256 _id) external view returns (Employee memory) {
        require(_id < employeeCount, "Invalid employee");
        return employees[_id];
    }

    function getActiveEmployees() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < employeeCount; i++) {
            if (employees[i].active) activeCount++;
        }
        uint256[] memory ids = new uint256[](activeCount);
        uint256 j = 0;
        for (uint256 i = 0; i < employeeCount; i++) {
            if (employees[i].active) {
                ids[j++] = i;
            }
        }
        return ids;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // Accept MON deposits for gas fees
    receive() external payable {}
}
