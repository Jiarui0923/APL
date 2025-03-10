from .database import _DBConnector
from .user_db import User
from .datatable_db import DataTableDB
from .workflow_db import WorkflowDB
from .resource_db import Resource
from .history_db import History
from caltable import CalLibIndex

from uuid import uuid4
from datetime import datetime
from datetime import timezone

class Project(_DBConnector, object):
    
    def __init__(self, project_id=None):
        if project_id is None: raise IndexError
        self.project_id = project_id
        
    def __repr__(self): return f'< Project:{self.name} ({self.create_time}) >'
    
    def delete(self): del self.project
    
    def _del_project(self):
        _projects = self._db[self._collection, {'id': self.project_id}] 
        if len(_projects) <= 0: raise IndexError
        _project = _projects[0]
        DataTableDB(id=_project['table']).delete()
        del self._db[self._collection, {'id': self.project_id}] 
        for _history in _project['histories']: del History(_history).history
        for _user in _project['access']: User(_user).del_project(self.project_id)
        
    def _get_project(self):
        _projects = self._db[self._collection, {'id': self.project_id}] 
        if len(_projects) <= 0: raise IndexError
        return _projects[0]
    def _set_project(self, values):
        _projects = self._db[self._collection, {'id': self.project_id}] 
        if len(_projects) <= 0: raise IndexError
        self._db[self._collection, {'id': self.project_id}] = values
    project = property(_get_project, _set_project, _del_project)
    
    def _get_name(self): return self.project['name']
    def _set_name(self, name): self.project = {'name': name}
    name = property(fget=_get_name, fset=_set_name)
    
    def _get_desc(self): return self.project['desc']
    def _set_desc(self, desc): self.project = {'desc': desc}
    desc = property(fget=_get_desc, fset=_set_desc)
    
    def add_resource(self, resource_id):
        _resources = self.project['resources']
        if resource_id not in _resources: _resources.append(resource_id)
        self.project = {'resources': _resources}
    def del_resource(self, resource_id):
        _resources = self.project['resources']
        if resource_id in _resources: del _resources[_resources.index(resource_id)]
        self.project = {'resources': _resources}
    @property
    def resources(self): return {_id:Resource(id=_id) for _id in self.project['resources']}
    @property
    def libindex(self):
        _libs, fails = [], 0
        for _id in self.project['resources']:
            try: _libs.append(Resource(id=_id).lib)
            except: fails += 1
        return CalLibIndex(*_libs)
        # return CalLibIndex(*[Resource(id=_id).lib for _id in self.project['resources']])
    
    def add_workflow(self, workflow_id):
        _workflows = self.project['workflows']
        if workflow_id not in _workflows: _workflows.append(workflow_id)
        self.project = {'workflows': _workflows}
    def del_workflow(self, workflow_id):
        _workflows = self.project['workflows']
        if workflow_id in _workflows: del _workflows[_workflows.index(workflow_id)]
        self.project = {'workflows': _workflows}
    @property
    def workflows(self): return {_id:WorkflowDB(id=_id) for _id in self.project['workflows']}
    
    def add_history(self, history_id):
        _histories = self.project['histories']
        if history_id not in _histories: _histories.append(history_id)
        self.project = {'histories': _histories}
    def del_history(self, history_id):
        _histories = self.project['histories']
        if history_id in _histories:
            del History(history_id).history
            del _histories[_histories.index(history_id)]
        self.project = {'histories': _histories}
    def del_history_ref(self, history_id):
        _histories = self.project['histories']
        if history_id in _histories:
            del _histories[_histories.index(history_id)]
        self.project = {'histories': _histories}
    @property
    def histories(self): return {_id:History(id=_id) for _id in self.project['histories']}
    
    @property
    def create_time(self): return self.project['create']
    
    @property
    def table(self): return DataTableDB(id=self.project['table'])
    
    @staticmethod
    def create_project(user_id, name='', desc=''):
        _user = User(user_id=user_id)
        _project = dict(
            id = str(uuid4()),
            name = name,
            desc = desc,
            create = datetime.now(timezone.utc),
            table = DataTableDB.create_table(user_id),
            workflows = [],
            histories = [],
            resources = list(_user.resources.keys()),
            access = [user_id]
        )
        _user.add_project(_project['id'])
        Project._db[Project._collection] = _project
        return _project['id']
    