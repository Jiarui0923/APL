from ..database import Database

@Database.register
class DatabaseEngine(object):
    _engine_name = 'dict'
    def __init__(self):
        self._collections = {}
    def __repr__(self): return f'< Engine {self._engine_name}, {len(self)} Collections >'
    def __len__(self): return len(self._collections)
    def __delitem__(self, key):
        _col, _con, _ = self._index(key)
        self.delete(collection=_col, condition=_con)
    def __getitem__(self, key):
        _col, _con, _ind = self._index(key)
        return self.get(collection=_col, condition=_con, index=_ind)
    def __setitem__(self, key, value):
        _col, _con, _ = self._index(key)
        self.set(collection=_col, condition=_con, value=value)
    def search(self, collection=None, keys=None, limit=10, offset=0):
        if keys is None: return self._collections[collection][offset:offset+limit]
        else:
            _matched_items = []
            for item in self._collections[collection]:
                _match = True
                for key, val in keys:
                    if item.get(key) is None:
                        _match = False
                        break
                    elif isinstance(item[key], str):
                        if str(val) not in item[key]:
                            _match = False
                            break
                    elif isinstance(item[str], (list, tuple)):
                        if val not in item[key]:
                            _match = False
                            break
                    else:
                        if val != item[key]:
                            _match = False
                            break
                if (_match): _matched_items.append(item)
            return _matched_items[offset:offset+limit]
    
    def _index(self, key):
        _col, _con, _ind = None, {}, None
        if isinstance(key, str): _col = key
        elif isinstance(key, (tuple, list)):
            if len(key) > 2: _col, _con, _ind = key[0], key[1], key[2]
            elif len(key) > 1: _col, _con = key[0], key[1]
            else: _col = key
        else: raise IndexError
        return _col, _con, _ind
    
    @property
    def collections(self): return list(self._collections.keys())
    
    def get(self, collection, condition={}, index=None):
        if collection not in self._collections: self._collections[collection] = []
        _collection = self._collections[collection]
        if condition is None or len(condition) <= 0: _data = _collection
        else:
            _data = [item for item in _collection
                     if all([item.get(k_)==v_ for k_, v_ in condition.items()])]
        if index is None: return _data
        else: return _data[index]
    
    def set(self, collection, value={}, condition={}):
        if collection not in self._collections: self._collections[collection] = []
        if condition is None or len(condition) <= 0:
            if isinstance(value, dict): self._collections[collection].append(value)
            elif isinstance(value, (list, tuple)): self._collections[collection] += value
            else: raise TypeError
        else:
            if not isinstance(value, dict): raise TypeError
            _ids = [i for i, item in enumerate(self._collections[collection])
                    if all([item[k_]==v_ for k_, v_ in condition.items()])]
            for _id in _ids: self._collections[collection][_id].update(value)
            
    def delete(self, collection, condition={}):
        if condition is None or len(condition) <= 0: del self._collections[collection]
        else:
            _ids = [i for i, item in enumerate(self._collections[collection])
                    if all([item[k_]==v_ for k_, v_ in condition.items()])]
            for i in _ids: del self._collections[collection][i]
            