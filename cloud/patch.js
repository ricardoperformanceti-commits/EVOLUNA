// Paths are arrays of literal keys, never executable expressions.
// Splice arrays around their common ends so inserting one document does not
// upload the unchanged photographs in every other document.
export function workspacePatch(before, after, path=[], out=[]){
 if(before===after)return out;
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 if(Array.isArray(before)&&Array.isArray(after)){
  let start=0,end=0;
  while(start<before.length&&start<after.length&&equal(before[start],after[start]))start++;
  while(end<before.length-start&&end<after.length-start&&equal(before[before.length-1-end],after[after.length-1-end]))end++;
  const oldCount=before.length-start-end,newCount=after.length-start-end;
  if(oldCount===newCount){for(let i=0;i<oldCount;i++)workspacePatch(before[start+i],after[start+i],[...path,String(start+i)],out)}
  else{
   for(let i=start+oldCount-1;i>=start;i--)out.push({op:'remove',path:[...path,String(i)]});
   for(let i=0;i<newCount;i++)out.push({op:'insert',path:[...path,String(start+i)],value:after[start+i]});
  }
 }else if(before&&after&&typeof before==='object'&&typeof after==='object'&&!Array.isArray(before)&&!Array.isArray(after)){
  for(const key of Object.keys(before))if(!Object.hasOwn(after,key))out.push({op:'remove',path:[...path,key]});
  for(const key of Object.keys(after)){
   if(!Object.hasOwn(before,key))out.push({op:'set',path:[...path,key],value:after[key]});
   else workspacePatch(before[key],after[key],[...path,key],out);
  }
 }else if(!equal(before,after))out.push({op:'set',path,value:after});
 return out;
}
