from ..database import Database
from ._engine import DatabaseEngine

@Database.register
class DatabaseEngineMongoDB(DatabaseEngine):
    _engine_name = 'mongodb'
    def __init__(self, host='mongodb://localhost', database=''):
        from pymongo import MongoClient
        self._host = host
        self._database = database
        self._handle = MongoClient('mongodb://localhost')[database]
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
        if keys is None: return list(self._collections[collection].find({}))[offset:offset+limit]
        else:
            _query = {"$or": [{key:{ "$regex": val, "$options": "i" }} for key, val in keys.items()]}
            _data = self._handle[collection].find(_query)
            _data = list(_data)
            return _data[offset:offset+limit]
            
            