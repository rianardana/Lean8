declare module "web-push" {
  export interface PushSubscriptionKeys {
    p256dh: string;
    auth: string;
  }
  export interface PushSubscription {
    endpoint: string;
    keys: PushSubscriptionKeys;
    expirationTime?: number | null;
  }
  export interface SendResult {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }
  export interface RequestOptions {
    TTL?: number;
    urgency?: "very-low" | "low" | "normal" | "high";
    topic?: string;
    headers?: Record<string, string>;
  }
  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  export function sendNotification(
    subscription: PushSubscription,
    payload?: string | Buffer | null,
    options?: RequestOptions
  ): Promise<SendResult>;
  export function generateVAPIDKeys(): { publicKey: string; privateKey: string };
  const webpush: {
    setVapidDetails: typeof setVapidDetails;
    sendNotification: typeof sendNotification;
    generateVAPIDKeys: typeof generateVAPIDKeys;
  };
  export default webpush;
}
