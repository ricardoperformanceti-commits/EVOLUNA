// A soft segmentation is never permission to alter skin or the entire image.
// Require both solid enamel support and a conservative tooth-color test.
export function enamelPixel(r,g,b){
 const luminance=.2126*r+.7152*g+.0722*b;
 const redness=(r-g)/Math.max(12,r-b);
 return luminance>=85&&g>=r*.85&&b>=r*.55&&r-g<=35&&redness<.72&&b<=g*1.12+6;
}
export function validMouth(points,width,height){
 if(!Array.isArray(points)||points.length<8||points.length>32||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1))return false;
 let area=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];area+=a.x*b.y-b.x*a.y}
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys),ratio=h*height/(w*width);
 return Math.abs(area)/2>=.0002&&Math.abs(area)/2<.5&&w<.96&&h<.8&&ratio>.035&&ratio<1.05;
}
export function supportedWeight(soft,support,inside,r,g,b){
 if(!inside||support<160||soft<48||!enamelPixel(r,g,b))return 0;
 return Math.min(soft,support);
}
export function restoreOutsideEnamel(output,original,mask){
 if(output.length!==original.length||mask.length*4!==original.length)throw Error('Máscara incompatível com a foto.');
 for(let p=0;p<mask.length;p++){
  const i=p*4;
  if(!mask[p])for(let c=0;c<4;c++)output[i+c]=original[i+c];
  else output[i+3]=original[i+3];
 }
}
