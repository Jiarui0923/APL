
from pathlib import Path
import os
import json
import random
import string
import sys
from startup.package_install import install_package
from startup.process_starter import run_mutiple_progresses, delay_open_webbrower
from startup.analytics_agreement import analytics_agreement
from startup.style_print import status_print, hello_page, good_bye
    
def build_queues():
    cpu_count = os.cpu_count()
    if cpu_count > 1:
        queues = [
            {'cpu': 1, 'cuda': 0},
            {'cpu': cpu_count - 1, 'cuda': 0},
        ]
    else:
        queues = [
            {'cpu': 1, 'cuda': 0},
        ]
    return queues

def random_seq(k=12):
    return ''.join(random.sample(string.digits+string.ascii_letters, k=k))
def create_credentials():
    return {
        random_seq(6): {
            "key": random_seq(24),
            "access": ["*"]
        }
    }
def build_credentials(host):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tablex.settings")
    
    import django
    django.setup()
    from django.contrib.auth.models import User as UserModel
    try:
        user = UserModel.objects.get(username="guest") 
    except:
        user = UserModel.objects.create_user("guest")
    from tablex.settings import User, Resource, Project
    uid = user.id
    user = User(uid)
    _credentials = create_credentials()
    _id = list(_credentials.keys())[0]
    _key = _credentials[_id]['key']
    for _rid in user.resources.keys(): user.del_resource(_rid)
    if len(user.resources) == 0:
        _rid = Resource.create_resource(uid, host=host, api_id=_id, api_key=_key)
        for _proj in user.projects:
            _proj = Project(_proj)
            for k in _proj.resources.keys(): _proj.del_resource(k)
            _proj.add_resource(_rid)
    return _credentials

def build_database(path):
    from tablex.settings import _database
    import pickle
    with open(os.path.join(path, 'user.obj'), 'rb') as obj_f:
        _database['user'] = pickle.load(obj_f)
    with open(os.path.join(path, 'projects.obj'), 'rb') as obj_f:
        _database['projects'] = pickle.load(obj_f)
    with open(os.path.join(path, 'datatables.obj'), 'rb') as obj_f:
        _database['datatables'] = pickle.load(obj_f)
    with open(os.path.join(path, 'workflows.obj'), 'rb') as obj_f:
        _database['workflows'] = pickle.load(obj_f)

def is_initialized(path='config.json'):
    with open(path, 'r') as _f_conf:
        _config = json.load(_f_conf)
        _initialized = _config.get('initialized', False)
        return _initialized
    
def initialize(path='config.json', api_host='http://localhost:8001/'):
    
    _config = {}
    with open(path, 'r') as _f_conf:
        _config = json.load(_f_conf)
    analytics_agreement('janalytics.json')
    _config['initialized'] = True
    _config['task_queue'] = {}
    status_print("INIT", "Deploy Task Queue.")
    _config['task_queue']['layouts'] = build_queues()
    status_print("INIT", "Build Local Database.")
    build_database('data')
    status_print("INIT", "Append Credentials And API Server.")
    _config['authenticator']['credentials'] = build_credentials(api_host)
    
    with open(path, 'w') as _f_conf:
        json.dump(_config, _f_conf, indent=4)
  

    
def _main():
    hello_page()
    BASE_DIR = str(Path(__file__).parent.resolve().absolute())
    os.chdir(BASE_DIR)
    host = 'localhost'
    web_port = '8000'
    api_port = '8001'
    config_path = 'config.json'
    if not is_initialized(config_path):
        initialize(config_path, f'http://{host}:{api_port}/')
    applications = {
        'web-service': ['python', 'manage.py', 'runserver', f'{host}:{web_port}'],
        # 'task-queue': ['python', 'manage.py', 'process_tasks'],
        'easyapi': ['uvicorn', 'easyapi:app', '--host', f'{host}', '--port', '8001'],
    }
    # install_package('django', 'django', None)
    # install_package('mongita', 'mongita', None)
    processes = run_mutiple_progresses(applications)
    processes.append(delay_open_webbrower(f'http://{host}:{web_port}', 10))
    for process in processes:
        process.join()

def main():
    try:
        _main()
    except KeyboardInterrupt:
        status_print('STOP', 'All services are terminated.')
        good_bye()
        sys.exit(1)
        
if __name__ == '__main__':
    main()