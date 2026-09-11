export type VerificationMessage = { email: string; token: string };
export interface VerificationDelivery { sendVerification(message: VerificationMessage): Promise<void> }
export interface EmailDelivery extends VerificationDelivery { sendPasswordReset(message: VerificationMessage): Promise<void> }

export const deliverVerification = (message: VerificationMessage, delivery: VerificationDelivery) => delivery.sendVerification(message);

export function resendDelivery(config:{apiKey:string;from:string;frontendUrl:string;fetch?:typeof fetch}):EmailDelivery {
  const send=async(email:string,subject:string,path:string,token:string)=>{
    const link=`${config.frontendUrl}${path}?token=${encodeURIComponent(token)}`;
    const response=await (config.fetch??fetch)("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${config.apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({from:config.from,to:[email],subject,html:`<p>${subject}</p><p><a href="${link}">${link}</a></p>`})});
    if(!response.ok) throw new Error(`Email delivery failed (${response.status})`);
  };
  return {sendVerification:m=>send(m.email,"Verify your FitDiary email","/verify-email",m.token),sendPasswordReset:m=>send(m.email,"Reset your FitDiary password","/reset-password",m.token)};
}
