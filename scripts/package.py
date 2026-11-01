#!/usr/bin/env python3
"""Package tracked public sources, never a workspace or credential directory."""
import hashlib,json,os,re,stat,subprocess,zipfile
from pathlib import Path,PurePosixPath
root=Path(__file__).resolve().parent.parent
version=json.loads((root/'package.json').read_text())['version']
if not re.fullmatch(r'\d+\.\d+\.\d+',version):raise SystemExit('Invalid package version')
tracked=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0')
allowed_files={'README.md','package.json','.gitignore'}
allowed_dirs=('scripts/','skills/','examples/','test/','.github/workflows/')
if subprocess.run(['git','diff','--quiet','HEAD','--'],cwd=root).returncode:raise SystemExit('Commit source changes before packaging')
files=[]
for name in sorted(filter(None,tracked)):
 path=PurePosixPath(name)
 if path.is_absolute() or '..' in path.parts or '\\' in name:raise SystemExit('Unsafe source path')
 if name not in allowed_files and not name.startswith(allowed_dirs):raise SystemExit('Unapproved tracked file; review packaging allowlist')
 if path.name.startswith('.env') or path.name in {'profile.json','credentials.json','private.json'} or (path.suffix not in {'.mjs','.js','.py','.md','.yaml','.yml','.json','.toml'} and name!='.gitignore'):raise SystemExit('Unapproved source extension or private filename')
 if any(part in {'.git','node_modules','.secrets','outbox','dist','__pycache__'} for part in path.parts) or name.endswith(('.zip','.pyc','.dpapi','.log')):raise SystemExit('Private or generated path refused')
 file=root/name
 if not stat.S_ISREG(file.lstat().st_mode):raise SystemExit('Only regular source files may be packaged')
 data=file.read_bytes()
 if re.search(rb'-----BEGIN [A-Z ]*PRIVATE KEY-----|\bfm_[A-Za-z0-9_-]{40,}\b|\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}\b',data):raise SystemExit('Credential signature detected; no content printed')
 files.append((name,data))
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root).decode().strip()
manifest=json.dumps({'version':version,'commit':commit,'files':{name:hashlib.sha256(data).hexdigest() for name,data in files}},indent=2).encode()+b'\n'
dist=root/'dist';dist.mkdir(exist_ok=True)
archive=dist/f'Cerveau-Fixelio-kit-{version}.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as out:
 for name,data in files+[('MANIFEST.json',manifest)]:
  info=zipfile.ZipInfo('cerveau-fixelio-kit/'+name,date_time=(2020,1,1,0,0,0));info.external_attr=0o100644<<16;info.compress_type=zipfile.ZIP_DEFLATED;out.writestr(info,data)
with zipfile.ZipFile(archive) as check:
 if check.testzip() is not None:raise SystemExit('ZIP integrity check failed')
archive.with_suffix('.zip.sha256').write_text(hashlib.sha256(archive.read_bytes()).hexdigest()+'  '+archive.name+'\n')
print(json.dumps({'archive':archive.name,'files':len(files)+1,'commit':commit}))
