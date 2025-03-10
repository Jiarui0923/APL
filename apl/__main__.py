import os
import sys
from pathlib import Path

def main():
    BASE_DIR = str(Path(__file__).parent.resolve().absolute())
    os.chdir(BASE_DIR)
    os.system('python apl')