class _DBConnector:
    _db = None
    _collection = None
    @classmethod
    def attach_collection(cls, database, collection):
        cls._db = database
        cls._collection = collection