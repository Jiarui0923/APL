import subprocess
from .style_print import status_print

def install_package(package_import_name, package_index, version=None):
    try:
        __import__(package_import_name)
        status_print('PACK', f'{package_index} has been installed.')
    except:
        status_print('PACK', f'{package_index} doesn\'t exist, start to install.')
        command = ['pip', 'install']
        if version is not None: command += [f'{package_index}=={version}']
        else: command += [f'{package_index}']
        subprocess.run(command, stderr=subprocess.PIPE, stdout=subprocess.PIPE, encoding='utf-8')
        status_print('PACK', f'{package_index} has been installed.')