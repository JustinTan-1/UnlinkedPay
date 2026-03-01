// ABI for the PayrollVault contract
export const PAYROLL_VAULT_ABI = [
  {
    inputs: [{ name: "_companyName", type: "string" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      { name: "_wallet", type: "address" },
      { name: "_unlinkAddress", type: "string" },
      { name: "_salary", type: "uint256" },
    ],
    name: "addEmployee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_id", type: "uint256" }],
    name: "removeEmployee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "_id", type: "uint256" },
      { name: "_newSalary", type: "uint256" },
    ],
    name: "updateSalary",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "_totalAmount", type: "uint256" },
      { name: "_employeesPaid", type: "uint256" },
    ],
    name: "recordPayrollExecution",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_id", type: "uint256" }],
    name: "getEmployee",
    outputs: [
      {
        components: [
          { name: "wallet", type: "address" },
          { name: "unlinkAddress", type: "string" },
          { name: "salary", type: "uint256" },
          { name: "active", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveEmployees",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "companyName",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "employeeCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "payrollRunCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: false, name: "unlinkAddress", type: "string" },
      { indexed: false, name: "salary", type: "uint256" },
    ],
    name: "EmployeeAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "id", type: "uint256" }],
    name: "EmployeeRemoved",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: false, name: "newSalary", type: "uint256" },
    ],
    name: "EmployeeUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "runId", type: "uint256" },
      { indexed: false, name: "totalAmount", type: "uint256" },
      { indexed: false, name: "employeesPaid", type: "uint256" },
    ],
    name: "PayrollExecuted",
    type: "event",
  },
  { stateMutability: "payable", type: "receive" },
] as const;
