import {loadProfile} from './credentials.mjs';
import {createRpc} from './transport.mjs';
import {createOutbox} from './outbox.mjs';
import {reliableRpc} from './reliable.mjs';
let rpc;
const commands={context:'brain_context','context-packet':'context_packet','record-action':'record_action','action-history':'action_history',search:'search_memory',get:'get_memory','write-continuity':'write_continuity','vault-list':'list_vault','vault-read':'read_vault_secret','vault-create':'create_vault_secret','vault-update':'update_vault_secret'};
async function run(){if(process.argv.length!==5||process.argv[2]!=='--profile')throw Error();const command=process.argv[4];const{config,record,dir}=await loadProfile(process.argv[3]);rpc=reliableRpc(createRpc({env:{...process.env,FIXELIO_BRAIN_TOKEN:record.token,FIXELIO_BRAIN_TENANT_ID:config.tenant_id}}),createOutbox({dir,tenant:config.tenant_id,key:record.queue_key,token:record.token}));
 if(!commands[command]&&command!=='tools')throw Error();let raw='';if(!process.stdin.isTTY)for await(const chunk of process.stdin){raw+=chunk;if(Buffer.byteLength(raw)>131072)throw Error();}const args=raw.trim()?JSON.parse(raw):{};
 if(command==='vault-read'&&!['authorized_operation','explicit_user_request'].includes(args.purpose))throw Error();
 if(['vault-create','vault-update'].includes(command)&&args.purpose!=='explicit_user_request')throw Error();
 const result=await rpc({jsonrpc:'2.0',id:1,method:command==='tools'?'tools/list':'tools/call',params:command==='tools'?{}:{name:commands[command],arguments:args}});if(result?.error||result?.result?.isError)throw Error();
 if(command==='tools')return console.log(JSON.stringify(result.result));const body=result?.result?.content?.find(c=>c.type==='text')?.text;if(!body)throw Error();
 if(['vault-create','vault-update'].includes(command)){const d=JSON.parse(body);if(typeof d.id!=='string'||d.reference!=='vault:'+d.id||!Number.isSafeInteger(d.version)||!['created','updated'].includes(d.operation))throw Error();console.log(JSON.stringify({id:d.id,reference:d.reference,version:d.version,operation:d.operation,replayed:d.replayed===true}));}else console.log(body);
}
run().catch(()=>{console.error('Opération non confirmée : vérifier commande, droits et paramètres. Pour le coffre, transmettre le JSON par entrée standard, jamais les valeurs en arguments. Aucun secret affiché.');process.exitCode=1;});
