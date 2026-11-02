const validId=/^radix-[a-f0-9]{32}$/;
const validKey=/^[a-f0-9]{64}$/;
export function newInvitation(){return {room:'radix-'+crypto.randomUUID().replaceAll('-',''),key:Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join(''),expires:Date.now()+4*60*60*1000}}
export function validateInvitation(invitation){return !!invitation&&validId.test(invitation.room)&&validKey.test(invitation.key)&&Number.isSafeInteger(invitation.expires)&&invitation.expires>Date.now()&&invitation.expires<=Date.now()+4*60*60*1000+60000}
export function inviteURL(invitation){const url=new URL('/teleconsulta.html',location.origin);url.hash=new URLSearchParams({room:invitation.room,key:invitation.key,expires:String(invitation.expires)}).toString();return url.href}
export function parseInvitation(hash=location.hash){const p=new URLSearchParams(hash.replace(/^#/,'')),invitation={room:p.get('room'),key:p.get('key'),expires:Number(p.get('expires'))};if(!validateInvitation(invitation))throw Error('Este convite é inválido ou expirou. Peça um novo link ao profissional.');return invitation}
