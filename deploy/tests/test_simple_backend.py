"""Validate simple deployment gates without touching an actual EC2 or database."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


class SimpleBackendDeploy(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)
        self.release=self.root/'releases'/'test-release'
        self.release.mkdir(parents=True)
        (self.root/'backend.env').write_text('FLAMEE_DEBUG=false\n')
        self.archive=self.release/'image.tar.gz'
        self.archive.write_bytes(b'test transport archive')
        self.script=self.release/'deploy.sh'
        self.script.write_text(Path('/checks/deploy/backend-simple/deploy.sh').read_text())
        binary=self.root/'bin'
        binary.mkdir()
        docker=binary/'docker'
        docker.write_text('''#!/bin/bash
set -eu
echo "$*" >> "$TEST_ROOT/calls"
if [[ "$1" == run && "$TEST_MODE" == preflight-fail ]]; then exit 1; fi
if [[ "$1" == compose && "$TEST_MODE" == replace-fail ]]; then exit 1; fi
''')
        docker.chmod(0o700)
        curl=binary/'curl'
        curl.write_text('#!/bin/bash\necho "{\"status\":\"ok\"}"\n')
        curl.chmod(0o700)
        self.environment=dict(os.environ,PATH=str(binary)+':'+os.environ['PATH'],TEST_ROOT=str(self.root))

    def deploy(self,mode):
        return subprocess.run(['bash',str(self.script),'flamee-backend:'+'a'*40],
                              env=dict(self.environment,TEST_MODE=mode),capture_output=True,text=True)

    def test_schema_failure_keeps_existing_app_and_archive(self):
        self.assertNotEqual(self.deploy('preflight-fail').returncode,0)
        self.assertNotIn('compose', (self.root/'calls').read_text())
        self.assertFalse((self.root/'current-release').exists())
        self.assertTrue(self.archive.exists())

    def test_container_failure_does_not_claim_release_success(self):
        self.assertNotEqual(self.deploy('replace-fail').returncode,0)
        self.assertFalse((self.root/'current-release').exists())
        self.assertTrue(self.archive.exists())

    def test_success_records_release_and_removes_only_transfer_archive(self):
        response=self.deploy('success')
        self.assertEqual(response.returncode,0,response.stderr)
        self.assertEqual((self.root/'current-release').read_text().strip(),str(self.release))
        self.assertFalse(self.archive.exists())
        self.assertTrue((self.root/'backend.env').exists())


if __name__=='__main__':unittest.main()
