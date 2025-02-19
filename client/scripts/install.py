from subprocess import call
import platform
import sys

isNt = True

if platform.system() == 'Linux' or platform.system() == 'Darwin':
    isNt = False

try:
    code = call(['npm', 'install', '-g', 'serverless@3.0.0'], shell=False)
    if code > 0:
        raise Exception('Severless installation error')

    code = call(['npm', 'install'], shell=isNt)
    if code > 0:
        raise Exception('Dependencies installation error')

except Exception as err:
    print(err)
    sys.exit(1)
