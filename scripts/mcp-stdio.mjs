import {createRpc} from './transport.mjs';
import {loadProfile} from './credentials.mjs';
import {createOutbox} from './outbox.mjs';
import {reliableRpc} from './reliable.mjs';
let rpc;try{const index=process.argv.indexOf('--profile');if(index>=0){const {config,record,dir}=await loadProfile(process.argv[index+1]);const base=createRpc({env:{...process.env,FIXELIO_BRAIN_TOKEN:record.token,FIXELIO_BRAIN_TENANT_ID:config.tenant_id}});rpc=reliableRpc(base,createOutbox({dir,tenant:config.tenant_id,key:record.queue_key,token:record.token}));}else rpc=createRpc();}catch{process.stderr.write('Cerveau Fixelio : configuration privée manquante ou HTTPS/TLS invalide.\n');process.exit(1);}
process.stdin.setEncoding('utf8');
let pending='';
for await(const chunk of process.stdin){
 pending+=chunk;if(Buffer.byteLength(pending)>1048576){process.stderr.write('Message MCP trop volumineux.\n');process.exitCode=1;break;}
 let end;while((end=pending.indexOf('\n'))>=0){const line=pending.slice(0,end);pending=pending.slice(end+1);if(!line.trim())continue;
 let message;try{message=JSON.parse(line);const result=await rpc(message);if(result&&Object.hasOwn(message,'id'))process.stdout.write(JSON.stringify(result)+'\n');}
 catch{if(message&&Object.hasOwn(message,'id'))process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:message.id,error:{code:-32000,message:'Accès Cerveau Fixelio refusé, tenant incorrect ou service indisponible.'}})+'\n');}
 }
}
