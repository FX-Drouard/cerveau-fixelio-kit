export const endpoint='https://memoire.fixelio.fr/mcp';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createRpc({env=process.env,fetcher=fetch}={}){
 if(env.NODE_TLS_REJECT_UNAUTHORIZED==='0')throw Error('La vérification TLS doit rester activée.');
 if(env.FIXELIO_BRAIN_URL&&env.FIXELIO_BRAIN_URL!==endpoint)throw Error('Seul le point HTTPS officiel est accepté.');
 const token=env.FIXELIO_BRAIN_TOKEN,tenant=env.FIXELIO_BRAIN_TENANT_ID;
 if(!/^fm_[A-Za-z0-9_-]{40,}$/.test(token||'')||!uuid.test(tenant||''))throw Error('Clé privée et tenant attendu requis dans les variables FIXELIO_BRAIN_TOKEN et FIXELIO_BRAIN_TENANT_ID.');
 let checked=false,protocol='2025-03-26';
 async function send(message){
  let response;try{response=await fetcher(endpoint,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',Accept:'application/json, text/event-stream','MCP-Protocol-Version':protocol},body:JSON.stringify(message),signal:AbortSignal.timeout(45000),redirect:'error'});}catch{const error=Error('Connexion HTTPS indisponible ; aucun identifiant affiché.');error.retryable=true;throw error;}
  if(!response.ok){const error=Error('Accès Cerveau Fixelio refusé ou indisponible (HTTP '+response.status+').');error.status=response.status;error.retryable=response.status===429||response.status>=500;throw error;}
  if(response.status===202||response.status===204)return null;
  const raw=await response.text();if(raw.length>2097152)throw Error('Réponse trop volumineuse.');return JSON.parse(raw);
 }
 async function check(){
  const result=await send({jsonrpc:'2.0',id:'tenant-check',method:'tools/call',params:{name:'brain_context',arguments:{}}});
  if(result?.error||result?.result?.isError)throw Error('Impossible de vérifier le tenant autorisé.');
  const context=JSON.parse(result?.result?.content?.find(c=>c.type==='text')?.text||'null');
  if(context?.tenant_id!==tenant)throw Error('Le tenant de cette clé ne correspond pas au tenant attendu. Aucune opération effectuée.');checked=true;
 }
 return async message=>{
  if(message.method==='initialize'){
   const result=await send(message);if(result?.result?.protocolVersion)protocol=result.result.protocolVersion;
   if(!result?.error&&!checked)await check();return result;
  }
  if(!checked)await check();return send(message);
 };
}
