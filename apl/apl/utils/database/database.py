class Database(object):
    _database_engines = {}
    def __init__(self, engine='dict', *args, **kwargs):
        self._engine = self._database_engines[engine](*args, **kwargs)
    def __getitem__(self, keys): return self._engine[keys]
    def __setitem__(self, keys, value): self._engine[keys] = value
    def __delitem__(self, keys): del self._engine[keys]
    def __len__(self): return len(self._engine)
    def __repr__(self): return f'< Database (engine:{self._engine._engine_name}) {len(self)} Collections >'
    @property
    def collections(self): return self._engine.collections
    @staticmethod
    def register_engine(engine_name, engine):
        Database._database_engines[engine_name] = engine
    @staticmethod
    def register(engine):
        Database.register_engine(engine._engine_name, engine)
        return engine