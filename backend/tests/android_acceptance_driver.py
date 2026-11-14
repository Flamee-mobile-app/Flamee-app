"""Opt-in real Android acceptance driver. Credentials live only in this process.

Run from backend with FLAMEE_TEST_LIVE_ANDROID=1 after the private AVD boots.
JSON commands on stdin allow inspecting/interacting with real Android UI while
checking the companion account against the real development API. No fixtures,
response replacement, password files, or clearing application data.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys
import xml.etree.ElementTree as ET

import httpx

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'backend'))
from app.config import settings


def main():
    assert os.getenv('FLAMEE_TEST_LIVE_ANDROID') == '1' and settings.debug, 'Explicit development opt-in required'
    serial = os.getenv('FLAMEE_ANDROID_SERIAL', 'emulator-5554')
    assert re.fullmatch(r'emulator-\d+', serial), 'Emulator only'
    adb_path = ROOT / '.local-tools/android-sdk/platform-tools/adb.exe'
    run = 'android-' + secrets.token_hex(5)
    output = ROOT / 'docs/progress/2026-11-10-native-and-moments' / run
    output.mkdir(parents=True)
    report = {'run_id': run, 'checks': [], 'complete': False}
    actors = []
    restarted = False
    password = secrets.token_urlsafe(24) + 'Aa1'

    def adb(*args):
        result = subprocess.run([str(adb_path), '-s', serial, *map(str, args)], capture_output=True, timeout=45,
            creationflags=subprocess.CREATE_NO_WINDOW)
        assert result.returncode == 0, 'ADB command failed'
        return result.stdout

    def nodes():
        adb('shell', 'uiautomator', 'dump', '/sdcard/flamee-acceptance.xml')
        tree = ET.fromstring(adb('exec-out', 'cat', '/sdcard/flamee-acceptance.xml'))
        return list(tree.iter('node'))

    def tap_node(node):
        coords = [int(value) for value in re.findall(r'\d+', node.attrib['bounds'])]
        assert len(coords) == 4 and coords[2] > coords[0] and coords[3] > coords[1], 'UI node has no tap area'
        adb('shell', 'input', 'tap', (coords[0]+coords[2])//2, (coords[1]+coords[3])//2)

    def tap_text(text):
        found = [node for node in nodes() if text in (node.get('text'), node.get('content-desc'), node.get('resource-id'))]
        clickable = [node for node in found if node.get('clickable') == 'true']
        assert found, 'UI target not found'
        tap_node(clickable[0] if clickable else found[-1])

    def persist():
        (output / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')

    assert adb('emu', 'avd', 'name').decode(errors='replace').splitlines()[0].strip() == 'Flamee_API36', 'Unexpected emulator'
    try:
        with httpx.Client(base_url='http://127.0.0.1:8000/api/v1', timeout=45) as api:
            def call(method, path, actor=None, expected=200, **kwargs):
                headers = {'Authorization': 'Bearer '+actor['access_token']} if actor else {}
                response = api.request(method, path, headers=headers, **kwargs)
                assert response.status_code == expected, f'API {path}: HTTP {response.status_code}'
                return response.json()['data'] if response.status_code != 204 else None

            print(json.dumps({'ready': True, 'run_id': run}), flush=True)
            for line in sys.stdin:
                try:
                    command = json.loads(line)
                    name = command['command']
                    result = None
                    if name == 'setup':
                        assert not actors, 'Accounts already created'
                        for index in range(2):
                            actor = call('POST', '/auth/register', expected=201, json={
                                'email': f'{run}-{index}@example.com', 'password': password,
                                'full_name': f'Flamee Android {run[-5:]} {index+1}'})
                            actors.append(actor)
                            prefs = call('GET', '/users/me/preferences', actor)
                            call('PUT', '/users/me/preferences', actor, json={
                                'revision': prefs['revision'], 'timezone': 'Asia/Ho_Chi_Minh', 'locale': 'vi',
                                'care_preferences': [], 'care_note': '', 'partner_nickname': '',
                                'relationship_type': 'same_city', 'complete_onboarding': True})
                        invitation = call('POST', '/couple/invite-code', actors[0], 201)
                        pair = call('POST', '/couple/accept-invite', actors[1], json={'code': invitation['code']})
                        report['couple_id'] = pair['id']
                        report['accounts'] = [{key: actor['user'][key] for key in ('id', 'email', 'full_name')} for actor in actors]
                        report['checks'].append('two real development accounts/preferences/active couple')
                        result = report['accounts']
                    elif name == 'dump':
                        result = [{key: ('[password]' if key == 'text' and (node.get('password') == 'true' or node.get('text') == password) else node.get(key))
                            for key in ('text', 'content-desc', 'resource-id', 'class', 'bounds', 'clickable')}
                            for node in nodes() if node.get('text') or node.get('content-desc') or node.get('class') == 'android.widget.EditText']
                    elif name == 'credentials':
                        assert actors, 'Set up accounts first'
                        fields = [node for node in nodes() if node.get('class') == 'android.widget.EditText']
                        assert len(fields) == 2, 'Expected the email/password login screen'
                        for field, value in zip(fields, [actors[0]['user']['email'], password]):
                            tap_node(field)
                            adb('shell', 'input', 'keyevent', '123', *(['67']*80))
                            adb('shell', 'input', 'text', value)
                        result = 'Test credentials entered; never returned or saved'
                    elif name == 'tap':
                        if 'text' in command:
                            tap_text(command['text'])
                        else:
                            adb('shell', 'input', 'tap', int(command['x']), int(command['y']))
                    elif name == 'input':
                        value = command['text']
                        assert re.fullmatch(r'[A-Za-z0-9 _@.\-]+', value), 'Use ASCII test content'
                        adb('shell', 'input', 'text', value.replace(' ', '%s'))
                    elif name == 'back':
                        adb('shell', 'input', 'keyevent', '4')
                    elif name == 'swipe':
                        adb('shell', 'input', 'swipe', *[int(command[key]) for key in ('x1', 'y1', 'x2', 'y2')], 400)
                    elif name == 'screenshot':
                        label = command['label']
                        assert re.fullmatch(r'[A-Za-z0-9_-]{1,60}', label), 'Invalid screenshot label'
                        (output / (label+'.png')).write_bytes(adb('exec-out', 'screencap', '-p'))
                        result = str(output / (label+'.png'))
                    elif name == 'check_identity':
                        assert any(actors[0]['user']['full_name'] in (node.get('text'), node.get('content-desc')) for node in nodes()), 'Native identity not visible'
                        report['checks'].append('native UI renders the authenticated development account')
                        if restarted:
                            report['checks'].append('native process restart restores the authenticated account through protected credentials')
                            restarted = False
                    elif name == 'verify_moment':
                        content = command['text']
                        rows = call('GET', '/tiny-moments', actors[1])
                        matched = [row for row in rows if row['sender_id'] == actors[0]['user']['id'] and row['content'] == content]
                        assert len(matched) == 1, 'Expected exactly one server-confirmed native Moment'
                        report['checks'].append('native composer sends one real Moment readable by companion API')
                        result = {'moment_id': matched[0]['id']}
                    elif name == 'restart':
                        adb('shell', 'am', 'force-stop', 'com.flamee.mobile')
                        adb('shell', 'monkey', '-p', 'com.flamee.mobile', '-c', 'android.intent.category.LAUNCHER', '1')
                        restarted = True
                    elif name == 'finish':
                        assert {'two real development accounts/preferences/active couple',
                            'native UI renders the authenticated development account',
                            'native composer sends one real Moment readable by companion API'}.issubset(set(report['checks'])), 'Acceptance checks incomplete'
                        report['complete'] = True
                        persist()
                        print(json.dumps({'finished': True, 'report': str(output/'report.json')}), flush=True)
                        break
                    else:
                        raise ValueError('Unknown command')
                    persist()
                    print(json.dumps({'ok': True, 'result': result}, ensure_ascii=True), flush=True)
                except Exception as error:
                    # Do not print tracebacks/locals: account credentials stay private.
                    print(json.dumps({'ok': False, 'error_type': type(error).__name__}), flush=True)
    finally:
        persist()


if __name__ == '__main__':
    main()
