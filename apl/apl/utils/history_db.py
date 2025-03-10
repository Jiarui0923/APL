from .database import _DBConnector
from uuid import uuid4
from datetime import datetime, timezone

class History(_DBConnector, object):
    
    def __init__(self, id):
        self.id = id
    
    def _get_history(self):
        _histories = self._db[self._collection, {'id': self.id}] 
        if len(_histories) <= 0: raise IndexError
        return _histories[0]
    def _set_history(self, values):
        _histories = self._db[self._collection, {'id': self.id}] 
        if len(_histories) <= 0: raise IndexError
        self._db[self._collection, {'id': self.id}] = values
    def _del_history(self):
        _histories = self._db[self._collection, {'id': self.id}] 
        if len(_histories) <= 0: raise IndexError
        del self._db[self._collection, {'id': self.id}] 
    history = property(_get_history, _set_history, _del_history)
    
    def start(self):
        self.history = dict(
            start_time = datetime.now(timezone.utc),
            status = 'running',
            progress = 'running',
        )
    def finish(self):
        self.history = dict(
            end_time = datetime.now(timezone.utc),
            status = 'done',
            progress = 'done',
        )
    def cancel(self):
        self.history = dict(
            end_time = datetime.now(timezone.utc),
            status = 'cancel',
            progress = 'cancel',
        )
    def error(self, message):
        self.history = dict(
            end_time = datetime.now(timezone.utc),
            status = 'error',
            progress = message,
        )  
    
    @property
    def status(self): return self.history['status']
        
    def _get_progress(self):
        return self.history['progress']
    def _set_progress(self, progress):
        self.history = dict(
            status = 'running',
            progress = progress
        )
    progress = property(_get_progress, _set_progress)
    
    @property
    def create_time(self): return self.history['create_time']
    @property
    def start_time(self): return self.history['start_time']
    @property
    def end_time(self): return self.history['end_time']
    @property
    def workflow_id(self): return self.history['workflow_id']
    
    @staticmethod
    def create_history(project_id, workflow_id, user_id):
        from .project_db import Project
        _project = Project(project_id=project_id)
        _history = dict(
            id = str(uuid4()),
            create_time = datetime.now(timezone.utc),
            start_time = None,
            end_time = None,
            project_id = project_id,
            workflow_id = workflow_id,
            status = 'initialized',
            progress = 'initialized',
            access = [user_id],
        )
        _project.add_history(_history['id'])
        History._db[History._collection] = _history
        return _history['id']