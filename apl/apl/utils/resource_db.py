from .database import _DBConnector
from caltable import RemoteCalBlockLib
from uuid import uuid4

from .user_db import User

class Resource(_DBConnector, object):
    
    def __init__(self, id=None):
        if id is None: raise IndexError
        self.id = id
        
    def __repr__(self): return f'< Resource:{self.host} >'
    
    def delete(self): del self.resource
    
    def _del_resource(self):
        _resources = self._db[self._collection, {'id': self.id}] 
        if len(_resources) <= 0: raise IndexError
        _resource = _resources[0]
        del self._db[self._collection, {'id': self.id}] 
        for _user in _resource['access']: User(_user).del_resource(self.id)
    def _get_resource(self):
        _resources = self._db[self._collection, {'id': self.id}] 
        if len(_resources) <= 0: raise IndexError
        return _resources[0]
    def _set_resource(self, values):
        _resources = self._db[self._collection, {'id': self.id}] 
        if len(_resources) <= 0: raise IndexError
        self._db[self._collection, {'id': self.id}] = values
    resource = property(_get_resource, _set_resource, _del_resource)
    
    @property
    def host(self): return self.resource['host']
    @property
    def api_id(self): return self.resource['api_id']
    @property
    def api_key(self): return self.resource['api_key']
    
    @property
    def lib(self): return RemoteCalBlockLib(host=self.host, api_id=self.api_id, api_key=self.api_key)
    
    @staticmethod
    def create_resource(user_id, host='', api_id='', api_key=''):
        _resource = dict(
            id = str(uuid4()),
            host = host,
            api_id = api_id,
            api_key = api_key,
            access = [user_id]
        )
        User(user_id=user_id).add_resource(_resource['id'])
        Resource._db[Resource._collection] = _resource
        return _resource['id']
    