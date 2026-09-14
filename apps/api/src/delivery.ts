export type VerificationMessage = { email: string; token: string };
export type DeliveryReceipt = { providerMessageId?: string };
export interface VerificationDelivery { sendVerification(message: VerificationMessage): Promise<DeliveryReceipt> }
export interface EmailDelivery extends VerificationDelivery { sendPasswordReset(message: VerificationMessage): Promise<DeliveryReceipt> }

export class EmailDeliveryError extends Error {
  constructor(public readonly status: number, public readonly category: "configuration" | "transient" | "rejected") {
    super(`Email delivery failed (${status}; ${category})`);
  }
}

export const deliverVerification = (message: VerificationMessage, delivery: VerificationDelivery) => delivery.sendVerification(message);

export function resendDelivery(config:{apiKey:string;from:string;frontendUrl:string;fetch?:typeof fetch}):EmailDelivery {
  const send=async(email:string,subject:string,path:string,token:string):Promise<DeliveryReceipt>=>{
    const link=`${config.frontendUrl}${path}?token=${encodeURIComponent(token)}`;
    const response=await (config.fetch??fetch)("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${config.apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({from:config.from,to:[email],subject,html:`<p>${subject}</p><p><a href="${link}">${link}</a></p>`})});
    if(!response.ok) {
      const category=response.status===401||response.status===403||response.status===422?"configuration":response.status===429||response.status>=500?"transient":"rejected";
      console.error(JSON.stringify({event:"email_delivery_rejected",provider:"resend",status:response.status,category}));
      throw new EmailDeliveryError(response.status,category);
    }
    const body=await response.json().catch(()=>({} as {id?:string}));
    const providerMessageId=typeof body?.id==="string"?body.id:undefined;
    console.info(JSON.stringify({event:"email_delivery_accepted",provider:"resend",providerMessageId}));
    return {providerMessageId};
  };
  return {sendVerification:m=>send(m.email,"Verify your FitDiary email","/verify-email",m.token),sendPasswordReset:m=>send(m.email,"Reset your FitDiary password","/reset-password",m.token)};
}
