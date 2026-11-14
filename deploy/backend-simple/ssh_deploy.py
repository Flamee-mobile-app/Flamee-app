"""Send the already tested backend image to a single EC2 host; no registry/AWS API."""
import os
from pathlib import Path
import re
import shlex
import subprocess
import tempfile


def main():
    root=Path(__file__).resolve().parents[2]
    host=os.environ['BACKEND_HOST'].strip()
    user=os.environ['BACKEND_USER'].strip()
    sha=os.environ['GITHUB_SHA']
    release=sha+'-'+os.environ['GITHUB_RUN_ID']+'-'+os.environ['GITHUB_RUN_ATTEMPT']
    if not re.fullmatch(r'[A-Za-z0-9.-]+',host) or not re.fullmatch(r'[a-z_][a-z0-9_-]*',user):
        raise ValueError('Invalid SSH host or user')
    if not re.fullmatch(r'[a-f0-9]{40}-[0-9]+-[0-9]+',release):
        raise ValueError('Invalid release ID')
    remote=f'/home/{user}/flamee/releases/{release}'
    destination=user+'@'+host
    with tempfile.TemporaryDirectory(prefix='flamee-backend-') as directory:
        temp=Path(directory)
        for name,value in [('key',os.environ['BACKEND_SSH_KEY']),('known_hosts',os.environ['BACKEND_KNOWN_HOSTS'])]:
            if not value.strip():raise ValueError('Missing SSH key or known host')
            path=temp/name
            path.write_text(value.replace('\r\n','\n').rstrip()+'\n',encoding='utf-8')
            path.chmod(0o600)
        options=['-i',str(temp/'key'),'-o','BatchMode=yes','-o','IdentitiesOnly=yes',
                 '-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+str(temp/'known_hosts'),
                 '-o','ConnectTimeout=20','-o','ServerAliveInterval=15']
        subprocess.run(['ssh',*options,destination,shlex.join(['mkdir','-p',remote])],check=True)
        for name in ('compose.yaml','deploy.sh'):
            (temp/name).write_bytes((root/'deploy/backend-simple'/name).read_bytes().replace(b'\r\n',b'\n'))
        subprocess.run(['scp',*options,str(temp/'compose.yaml'),str(temp/'deploy.sh'),
                        str(root/'backend-image.tar.gz'),destination+':'+remote+'/'],check=True)
        # Use a fixed remote filename independent of the local artifact filename.
        command=shlex.join(['mv',remote+'/backend-image.tar.gz',remote+'/image.tar.gz'])+' && '+shlex.join(
            ['bash',remote+'/deploy.sh','flamee-backend:'+sha])
        subprocess.run(['ssh',*options,destination,command],check=True)


if __name__=='__main__':main()
