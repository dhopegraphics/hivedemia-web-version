interface DirectDebitConfig {
  merchantId: string;
  callbackUrl: string;
  clientId: string;
  clientSecret: string;
}

interface PreapprovalResponse {
  message: string;
  responseCode: string;
  data: {
    hubtelPreApprovalId: string;
    clientReferenceId: string;
    verificationType: "USSD" | "OTP";
    otpPrefix: string | null;
    preapprovalStatus: "APPROVED" | "REJECTED" | "PENDING";
  };
}

export class HubtelDirectDebitService {
  private config: DirectDebitConfig;
  private baseUrl =
    "https://hubtel-status-checker-proxy-server.onrender.com/v1/preapproval";
  constructor(config: DirectDebitConfig) {
    this.config = config;
  }

  private generateClientReference(): string {
    return `hivedemia_dd_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  /**
   * Initiates the direct debit preapproval process
   */
  async initiatePreapproval(
    customerPhone: string
  ): Promise<PreapprovalResponse> {
    try {
      const clientReference = this.generateClientReference();
      const response = await fetch(
        `${this.baseUrl}/merchant/${this.config.merchantId}/preapproval/initiate`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${this.config.clientId}:${this.config.clientSecret}`
            ).toString("base64")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientReferenceId: clientReference,
            CustomerMsisdn: customerPhone,
            channel: "mtn-gh-direct-debit",
            callbackUrl: this.config.callbackUrl,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to initiate preapproval: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to initiate direct debit preapproval:", error);
      throw error;
    }
  }

  /**
   * Verifies OTP for direct debit preapproval
   */
  async verifyOTP(
    customerPhone: string,
    hubtelPreApprovalId: string,
    clientReference: string,
    otpCode: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/merchant/${this.config.merchantId}/preapproval/verifyotp`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${this.config.clientId}:${this.config.clientSecret}`
            ).toString("base64")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerMsisdn: customerPhone,
            hubtelPreApprovalId,
            clientReferenceId: clientReference,
            otpCode,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to verify OTP: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to verify OTP:", error);
      throw error;
    }
  }

  /**
   * Checks the status of a preapproval request
   */
  async checkPreapprovalStatus(clientReference: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/merchant/${this.config.merchantId}/preapproval/${clientReference}/status`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${this.config.clientId}:${this.config.clientSecret}`
            ).toString("base64")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to check preapproval status: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to check preapproval status:", error);
      throw error;
    }
  }

  /**
   * Charges an approved direct debit
   */
  async chargeDirectDebit(
    customerPhone: string,
    amount: number,
    description: string
  ): Promise<any> {
    try {
      const clientReference = this.generateClientReference();
      const response = await fetch(
        `${this.baseUrl}/merchant/${this.config.merchantId}/charge/directdebit`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${this.config.clientId}:${this.config.clientSecret}`
            ).toString("base64")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerMsisdn: customerPhone,
            amount,
            clientReference,
            description,
            callbackUrl: this.config.callbackUrl,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to charge direct debit: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to charge direct debit:", error);
      throw error;
    }
  }
}
