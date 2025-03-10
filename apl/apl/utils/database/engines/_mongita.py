from ..database import Database
from ._engine import DatabaseEngine
from mongita import MongitaClientDisk

@Database.register
class DatabaseEngineMongita(DatabaseEngine):
    _engine_name = 'mongita'
    def __init__(self, path='.mongita', database=''):
        self._path = path
        self._database = database
        self._handle_all = None
        self._connect()
    
    def _connect(self):
        if self._handle_all is not None: self._handle_all.close()
        self._handle_all = MongitaClientDisk(self._path)
        self._handle = self._handle_all[self._database]
        
    def __len__(self): return len(self._handle.list_collection_names())
    
    @property
    def collections(self): return self._handle.list_collection_names()
    
    def get(self, collection, condition={}, index=None):
        _collection = self._handle[collection]
        if condition is None or len(condition) <= 0: _data = list(_collection.find({}))
        else: _data = list(_collection.find(condition))
        if index is None: return _data
        else: return _data[index]
    
    def set(self, collection, value={}, condition={}):
        if condition is None or len(condition) <= 0:
            if isinstance(value, dict): self._handle[collection].insert_one(value)
            elif isinstance(value, (list, tuple)): self._handle[collection].insert_many(list(value))
            else: raise TypeError
        else:
            if not isinstance(value, dict): raise TypeError
            self._handle[collection].update_many(condition, {'$set':value})
            
    def delete(self, collection, condition={}):
        if condition is None or len(condition) <= 0: self._handle[collection].drop()
        else: self._handle[collection].delete_many(condition)
        
    def search(self, collection=None, keys=None, limit=10, offset=0):
        self._connect()
        if keys is None: return list(self._collections[collection].find({}))[offset:offset+limit]
        else:
            _query = {"$or": [{key:{ "$regex": val, "$options": "i" }} for key, val in keys.items()]}
            _data = self._handle[collection].find(_query)
            _data = list(_data)
            return _data[offset:offset+limit]
            
            