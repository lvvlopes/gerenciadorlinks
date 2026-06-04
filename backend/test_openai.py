import os
import urllib.request
import traceback
import time

key = os.environ.get('OPENAI_API_KEY', '')
print('KEY length:', len(key))
print('KEY start:', key[:20])

try:
    req = urllib.request.Request(
        'https://api.openai.com/v1/models',
        headers={'Authorization': 'Bearer ' + key}
    )
    res = urllib.request.urlopen(req, timeout=10)
    print('OPENAI_OK:', res.status)
except Exception as e:
    traceback.print_exc()
    print('ERRO:', str(e))

time.sleep(30)