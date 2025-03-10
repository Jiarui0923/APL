
from uuid import uuid4
from .database import _DBConnector
from caltable import DataTable
from caltable import DataUnit
from caltable import Parameter
from caltable import meta_types

class DataTableDB(DataTable, _DBConnector):

    def __init__(self, id=None):
        self._id = id
        self._load()
        
    @staticmethod
    def create_table(user_id):
        _blank_table = {
            'id': str(uuid4()),
            'columns': {},
            'table': [],
            'access': [user_id]
        }
        DataTableDB._db[DataTableDB._collection] = _blank_table
        return _blank_table['id']
    
    def _load(self):
        _frame = self._db[self._collection, {'id': self._id}]
        if len(_frame) <= 0: raise IndexError
        _frame = _frame[0]
        _columns_dict = _frame['columns']
        self.columns = {_key:Parameter(**_param) for _key, _param in _columns_dict.items()}
        self._table = []
        for line in _frame['table']:
            self._table.append({key:DataUnit(value=val, parameter=self.columns[key]) for key, val in line.items()})
        self.access = _frame['access']
    
    def _store(self):
        _frame = self._db[self._collection, {'id': self._id}]
        if len(_frame) <= 0: raise IndexError
        _frame = _frame[0]
        _frame['columns'] = {param_:type_.to_dict() for param_, type_ in self.columns.items()}
        _frame['table'] = [{key:val.value for key, val in line.items()} for line in self._table]
        _frame['access'] = self.access
        self._db[self._collection, {'id': self._id}] = _frame
        
    def delete(self):
        _frame = self._db[self._collection, {'id': self._id}]
        if len(_frame) <= 0: raise IndexError
        del self._db[self._collection, {'id': self._id}]
        
    def __len__(self):
        self._load()
        return super().__len__()
    def _preview_table(self):
        self._load()
        return super()._preview_table()
    
    def _set_type(self, name, type_): self.columns[name] = type_
    def set_type(self, name, type_):
        self.columns[name] = type_
        self._store()
    def set_types(self, type_map):
        for key, val in type_map.items(): self._set_type(key, val)
        self._store()
    
    def __setitem__(self, keys, val):
        super().__setitem__(keys, val)   
        self._store()
    
    def add_row(self, num=1):
        if num < 1: raise ValueError
        for _ in range(num): self._table.append({})
        self._store()
        
    def del_row(self, row=0):
        self._load()
        if row < 0 or row >= len(self._table): raise IndexError
        else: del self._table[row]
        self._store()
    
    def add_col(self, name, meta, type_id=None):
        _meta_type = meta_types[meta]
        if type_id is not None: _meta_type.id = type_id
        self.columns[name] = Parameter(name=name, io_type=_meta_type, optional=True)
        self._store()
    
    def __getitem__(self, keys):
        self._load()
        return super().__getitem__(keys)
    
    @property
    def id(self): return self._id