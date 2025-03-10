from .database import _DBConnector
from uuid import uuid4

class User(_DBConnector, object):
    
    def __init__(self, user_id=None):
        if user_id is None: raise IndexError
        self.user_id = user_id
    
    def __repr__(self): return f'< User:{self.user_id} {self.email} >'
    
    def _get_user(self):
        _users = self._db[self._collection, {'id': self.user_id}] 
        if len(_users) <= 0:
            User.create_user(self.user_id)
            _users = self._db[self._collection, {'id': self.user_id}] 
        return _users[0]
    def _set_user(self, values):
        _users = self._db[self._collection, {'id': self.user_id}] 
        if len(_users) <= 0: raise IndexError
        self._db[self._collection, {'id': self.user_id}] = values
    user = property(_get_user, _set_user)
        
    def _get_email(self): return self.user['email']
    def _set_email(self, mail): self.user = {'email':mail}
    email = property(fget=_get_email, fset=_set_email)
    
    def add_project(self, project_id):
        _projects = self.user['projects']
        if project_id not in _projects: _projects.append(project_id)
        self.user = {'projects': _projects}
    def del_project(self, project_id):
        _projects = self.user['projects']
        if project_id in _projects: del _projects[_projects.index(project_id)]
        self.user = {'projects': _projects}
    @property
    def projects(self):
        from .project_db import Project
        return {_id:Project(project_id=_id) for _id in self.user['projects']}
    
    def add_resource(self, resource_id):
        _resources = self.user['resources']
        if resource_id not in _resources: _resources.append(resource_id)
        self.user = {'resources': _resources}
    def del_resource(self, resource_id):
        _resources = self.user['resources']
        if resource_id in _resources: del _resources[_resources.index(resource_id)]
        self.user = {'resources': _resources}
    @property
    def resources(self):
        from .resource_db import Resource
        return {_id:Resource(id=_id) for _id in self.user['resources']}
    
    def add_workflow(self, workflow_id):
        _workflows = self.user['workflows']
        if workflow_id not in _workflows: _workflows.append(workflow_id)
        self.user = {'workflows': _workflows}
    def del_workflow(self, workflow_id):
        _workflows = self.user['workflows']
        if workflow_id in _workflows: del _workflows[_workflows.index(workflow_id)]
        self.user = {'workflows': _workflows}
    @property
    def workflows(self):
        from .workflow_db import WorkflowDB
        return {_id:WorkflowDB(id=_id) for _id in self.user['workflows']}
            
    @staticmethod
    def create_user(user_id=None, email=''):
        if user_id is None: user_id == str(uuid4())
        _user = dict(
            id = user_id,
            email = email,
            projects = [],
            workflows = [],
            resources = []
        )
        User._db[User._collection] = _user
        return user_id
