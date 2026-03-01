export interface Employee {
  id: string;
  name: string;
  walletAddress: string; // Unlink address (unlink1...)
  salary: bigint; // Amount in smallest unit (wei for MON)
  frequency: "monthly" | "biweekly" | "weekly";
  active: boolean;
}

export interface PayrollRun {
  id: string;
  timestamp: number;
  employees: {
    employeeId: string;
    name: string;
    amount: bigint;
    status: "pending" | "sent" | "confirmed" | "failed";
    relayId?: string;
    txHash?: string;
  }[];
  totalAmount: bigint;
  status: "pending" | "processing" | "completed" | "failed";
}

export interface PayrollState {
  employees: Employee[];
  payrollHistory: PayrollRun[];
}
