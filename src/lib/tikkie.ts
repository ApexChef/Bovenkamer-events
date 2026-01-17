/**
 * Tikkie API Integration
 *
 * Documentation: https://developer.abnamro.com/api-products/tikkie
 *
 * This service handles:
 * - Creating payment requests
 * - Fetching payment status
 * - Processing webhooks
 */

const TIKKIE_API_URL = process.env.TIKKIE_SANDBOX === 'true'
  ? 'https://api.abnamro.com/v2/tikkie/sandbox'
  : 'https://api.abnamro.com/v2/tikkie';

interface TikkiePaymentRequest {
  amountInCents: number;
  description: string;
  expiryDate?: string; // YYYY-MM-DD
  referenceId?: string;
}

interface TikkiePaymentResponse {
  paymentRequestToken: string;
  url: string;
  amountInCents: number;
  description: string;
  createdDateTime: string;
  expiryDate: string;
  status: 'OPEN' | 'CLOSED' | 'EXPIRED';
  numberOfPayments: number;
  totalAmountPaidInCents: number;
}

interface TikkieError {
  errors: Array<{
    code: string;
    message: string;
    reference: string;
    status: number;
  }>;
}

class TikkieService {
  private apiKey: string;
  private appToken: string;

  constructor() {
    this.apiKey = process.env.TIKKIE_API_KEY || '';
    this.appToken = process.env.TIKKIE_APP_TOKEN || '';
  }

  private async getAccessToken(): Promise<string> {
    // In production, implement OAuth2 flow
    // For sandbox, API key is used directly
    return this.apiKey;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${TIKKIE_API_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'API-Key': this.apiKey,
        'X-App-Token': this.appToken,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error: TikkieError = await response.json();
      throw new Error(
        error.errors?.[0]?.message || `Tikkie API error: ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Create a new payment request
   */
  async createPaymentRequest(
    params: TikkiePaymentRequest
  ): Promise<TikkiePaymentResponse> {
    return this.request<TikkiePaymentResponse>('POST', '/paymentrequests', {
      amountInCents: params.amountInCents,
      description: params.description,
      expiryDate: params.expiryDate,
      referenceId: params.referenceId,
    });
  }

  /**
   * Get payment request status
   */
  async getPaymentRequest(token: string): Promise<TikkiePaymentResponse> {
    return this.request<TikkiePaymentResponse>(
      'GET',
      `/paymentrequests/${token}`
    );
  }

  /**
   * List all payment requests
   */
  async listPaymentRequests(params?: {
    pageNumber?: number;
    pageSize?: number;
    fromDateTime?: string;
    toDateTime?: string;
  }): Promise<{ paymentRequests: TikkiePaymentResponse[]; totalElementCount: number }> {
    const queryParams = new URLSearchParams();
    if (params?.pageNumber) queryParams.set('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    if (params?.fromDateTime) queryParams.set('fromDateTime', params.fromDateTime);
    if (params?.toDateTime) queryParams.set('toDateTime', params.toDateTime);

    const query = queryParams.toString();
    return this.request<{ paymentRequests: TikkiePaymentResponse[]; totalElementCount: number }>(
      'GET',
      `/paymentrequests${query ? `?${query}` : ''}`
    );
  }

  /**
   * Check if Tikkie is configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.appToken);
  }
}

// Singleton instance
export const tikkie = new TikkieService();

// Helper to format cents to euros
export function formatCentsToEuros(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

// Helper to calculate amount including partner
export function calculateTotalAmount(
  baseCents: number,
  partnerCents: number,
  hasPartner: boolean
): number {
  return hasPartner ? baseCents + partnerCents : baseCents;
}
