from .database import _DBConnector
from .user_db import User
from caltable import Workflow
from uuid import uuid4

class WorkflowTrack(Workflow):
    def __init__(self, *args, name=None, desc=None):
        super().__init__(*args, name=name, desc=desc)
        self.tracker = None
    def set_track(self, func):
        self.tracker = func
    def forward_table(self, table):
        for _block in self._blocks:
            if self.tracker is not None:
                self.tracker(_block.name)
            table = _block(table)
        return table
class WorkflowDB(_DBConnector, object):
    def __init__(self, id=None):
        if id is None: raise IndexError
        self.id = id
        
    def _del_workflow(self):
        _workflows = self._db[self._collection, {'id': self.id}] 
        if len(_workflows) <= 0: raise IndexError
        _workflow = _workflows[0]
        del self._db[self._collection, {'id': self.id}] 
        for _user in _workflow['access']: User(_user).del_workflow(self.id)
    def _get_workflow(self):
        _workflows = self._db[self._collection, {'id': self.id}] 
        if len(_workflows) <= 0: raise IndexError
        return _workflows[0]
    def _set_workflow(self, values):
        _workflows = self._db[self._collection, {'id': self.id}] 
        if len(_workflows) <= 0: raise IndexError
        self._db[self._collection, {'id': self.id}] = values
    workflow = property(_get_workflow, _set_workflow, _del_workflow)
    
    @classmethod
    def public_workflows(cls, search=None, limit=10, offset=0):
        _workflows = cls._db[cls._collection, {'access': 'public'}] 
        if search is None: return _workflows[offset:limit+offset], len(_workflows)
        else:
            _matched_workflows = [_workflow for _workflow in _workflows
                                  if search in _workflow['name'] or search in _workflow['desc']]
            return _matched_workflows[offset:limit+offset], len(_matched_workflows)
    
    def _get_name(self): return self.workflow['name']
    def _set_name(self, name): self.workflow = {'name': name}
    name = property(_get_name, _set_name)
    
    def _get_desc(self): return self.workflow['desc']
    def _set_desc(self, name): self.workflow = {'desc': name}
    desc = property(_get_desc, _set_desc)
    
    @property
    def blocks(self): return self.workflow['blocks']
    def add_block(self, algorithm_id, **kwargs):
        _blocks = self.workflow['blocks']
        _blocks.append([algorithm_id, kwargs])
        self.workflow = {'blocks': _blocks}
    def insert_block(self, idx, algorithm_id, **kwargs):
        _blocks = self.workflow['blocks']
        if idx > len(_blocks): raise IndexError
        else: _blocks.insert(idx, [algorithm_id, kwargs])
        self.workflow = {'blocks': _blocks}
    def del_block(self, idx):
        _blocks = self.workflow['blocks']
        if idx >= len(_blocks): raise IndexError
        del _blocks[idx]
        self.workflow = {'blocks': _blocks}
    def update_block(self, idx, algorithm_id, **kwargs):
        _blocks = self.workflow['blocks']
        if idx >= len(_blocks): raise IndexError
        _blocks[idx] = [algorithm_id, kwargs]
        self.workflow = {'blocks': _blocks}
    
    def build_workflow(self, index):
        _frame = self.workflow
        _config = {'name': _frame['name'], 'desc': _frame['desc'], 'workflow':_frame['blocks']}
        return WorkflowTrack.load(_config, index)
    
    @staticmethod
    def create_workflow(user_id, name='', desc=''):
        _workflow = dict(
            id = str(uuid4()),
            name = name,
            desc = desc,
            blocks = [],
            access = [user_id],
        )
        WorkflowDB._db[WorkflowDB._collection] = _workflow
        User(user_id=user_id).add_workflow(_workflow['id'])
        return _workflow['id']
    
    def share(self):
        _workflow = dict(
            id = str(uuid4()),
            name = self.name,
            desc = self.desc,
            blocks = self.blocks,
            access = 'public',
        )
        WorkflowDB._db[WorkflowDB._collection] = _workflow
        return _workflow['id']
    
    def accept_share(self, user_id):
        _workflow = dict(
            id = str(uuid4()),
            name = self.name,
            desc = self.desc,
            blocks = self.blocks,
            access = [user_id],
        )
        WorkflowDB._db[WorkflowDB._collection] = _workflow
        User(user_id=user_id).add_workflow(_workflow['id'])
        return _workflow['id']
