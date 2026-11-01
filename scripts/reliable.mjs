export function confirmed(result,expected){if(result?.error||result?.result?.isError)return false;try{const data=JSON.parse(result.result.content.find(c=>c.type==='text').text);return typeof data.id==='string'&&typeof data.action_id==='string'&&(!expected||data.action_id===expected);}catch{return false;}}
export function reliableRpc(rpc,box){return async message=>{
 if(message.method==='tools/call'&&message.params?.name==='record_action'){
  const receipt=await box.enqueue(message.params.arguments);try{const result=await rpc(message);if(confirmed(result,message.params.arguments.action_id))await box.ack(receipt);return result;}catch(e){if(!e.retryable)throw e;return{jsonrpc:'2.0',id:message.id,result:{content:[{type:'text',text:JSON.stringify({queued:true,synced:false,receipt,message:'Étape conservée chiffrée localement ; synchronisation non confirmée.'})}]}};}
 }
 const result=await rpc(message);if(message.method==='initialize'||message.params?.name==='brain_context'){try{await box.flush(rpc,{limit:5});}catch{ /* keep pending until a subsequent explicit connection */ }}return result;
};}
