import {spawn} from 'node:child_process';
import {mkdir,lstat,open,chmod,writeFile} from 'node:fs/promises';
import {constants} from 'node:fs';
import {homedir} from 'node:os';
import path from 'node:path';
export const endpoint='https://memoire.fixelio.fr/mcp';
export function validProfile(profile){if(!/^[a-z0-9][a-z0-9_-]{0,47}$/.test(profile||''))throw Error('Profil attendu : lettres minuscules, chiffres, tirets ou underscores.');return profile;}
export const profileDir=(profile,root=process.env.FIXELIO_BRAIN_HOME||path.join(homedir(),'.config','fixelio-brain-kit'))=>path.join(root,validProfile(profile));
export async function privateDirectory(dir){await mkdir(dir,{recursive:true,mode:0o700});const stat=await lstat(dir);if(!stat.isDirectory()||stat.isSymbolicLink()||process.getuid&&stat.uid!==process.getuid())throw Error('Dossier privé invalide.');if(process.platform!=='win32')await chmod(dir,0o700);}
export async function readPrivate(file){const fd=await open(file,constants.O_RDONLY|(constants.O_NOFOLLOW||0));try{const stat=await fd.stat();if(!stat.isFile()||stat.size>65536||process.getuid&&(stat.uid!==process.getuid()||(stat.mode&0o077)))throw Error('Fichier de profil non privé.');return await fd.readFile('utf8');}finally{await fd.close();}}
export function runPrivate(command,args,input='',extraEnv={}){return new Promise((resolve,reject)=>{const child=spawn(command,args,{stdio:['pipe','pipe','pipe'],windowsHide:true,env:{...process.env,...extraEnv}});let out='',bytes=0;const timer=setTimeout(()=>child.kill(),60000);const fail=()=>{clearTimeout(timer);reject(Error('Le coffre du système est indisponible ou l’accès a été refusé.'));};child.on('error',fail);child.stdout.on('data',chunk=>{bytes+=chunk.length;if(bytes>65536)child.kill();else out+=chunk.toString('utf8');});child.stderr.resume();child.on('close',code=>{clearTimeout(timer);if(code!==0||bytes>65536)fail();else resolve(out.trim());});child.stdin.on('error',()=>{});child.stdin.end(input);});}
const service='fr.fixelio.cerveau';
const powershell=()=>path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
export async function storeCredential(profile,record,{dir=profileDir(profile),platform=process.platform,runner=runPrivate}={}){
 validProfile(profile);const packed=Buffer.from(JSON.stringify(record)).toString('base64');
 if(platform==='darwin'){await runner('/usr/bin/security',['-i'],`add-generic-password -U -a "${profile}" -s "${service}" -w "${packed}"\n`);return 'keychain';}
 if(platform==='linux'){await runner('secret-tool',['store','--label=Cerveau Fixelio '+profile,'service',service,'profile',profile],packed+'\n');return 'secret-service';}
 if(platform==='win32'){const encrypted=await runner(powershell(),['-NoProfile','-NonInteractive','-Command',"$value=[Console]::In.ReadToEnd(); $secure=ConvertTo-SecureString -String $value -AsPlainText -Force; [Console]::Out.Write((ConvertFrom-SecureString -SecureString $secure))"],packed);await writeFile(path.join(dir,'credential.dpapi'),encrypted,{mode:0o600});return 'dpapi';}
 throw Error('Coffre de système non pris en charge ; aucun secret enregistré.');
}
export async function loadCredential(profile,{dir=profileDir(profile),platform=process.platform,runner=runPrivate}={}){
 validProfile(profile);let packed;
 if(platform==='darwin')packed=await runner('/usr/bin/security',['find-generic-password','-a',profile,'-s',service,'-w']);
 else if(platform==='linux')packed=await runner('secret-tool',['lookup','service',service,'profile',profile]);
 else if(platform==='win32'){const encrypted=await readPrivate(path.join(dir,'credential.dpapi'));packed=await runner(powershell(),['-NoProfile','-NonInteractive','-Command',"$secure=ConvertTo-SecureString -String $env:FIXELIO_DPAPI_BLOB; $cred=New-Object System.Net.NetworkCredential('', $secure); [Console]::Out.Write($cred.Password)"],'',{FIXELIO_DPAPI_BLOB:encrypted});}
 else throw Error('Coffre système indisponible.');
 let record;try{record=JSON.parse(Buffer.from(packed,'base64').toString('utf8'));}catch{throw Error('Identifiant privé invalide.');}if(!/^fm_[A-Za-z0-9_-]{40,}$/.test(record.token||'')||Buffer.from(record.queue_key||'','base64').length!==32)throw Error('Identifiant privé invalide.');return record;
}
export async function loadProfile(profile,{dir=profileDir(profile)}={}){const config=JSON.parse(await readPrivate(path.join(dir,'profile.json')));if(config.profile!==validProfile(profile)||config.url!==endpoint||!/^[0-9a-f-]{36}$/i.test(config.tenant_id||''))throw Error('Profil de connexion invalide.');return{config,record:await loadCredential(profile,{dir}),dir};}
