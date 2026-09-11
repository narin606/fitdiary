export type VerificationMessage = { email: string; token: string };
export interface VerificationDelivery {
  sendVerification(message: VerificationMessage): Promise<void>;
}

export const deliverVerification = (message: VerificationMessage, delivery: VerificationDelivery) =>
  delivery.sendVerification(message);
