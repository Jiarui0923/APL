import multiprocessing
import subprocess
import webbrowser
import time
from .style_print import status_print

def start_progress(name, *args):
    try:
        status_print('SERV', f'{name} is being prepared.')
        process = subprocess.run(args)
    except KeyboardInterrupt:
        status_print('STOP', f'{name} is terminated.')  
    
def run_mutiple_progresses(applications):
    processes = [
        multiprocessing.Process(target=start_progress, args=(name, *args))
        for name, args in applications.items()
    ]
    for process in processes:
        process.start()
    return processes


def delay_open_webbrower_(url, delay):
    try:
        time.sleep(1)
        status_print('SERV', f'Service is preparing, wait for a moment.')
        time.sleep(delay)
        try:
            if webbrowser.open_new(url): status_print('LINK', f'{url} is opened in browser.')
            else: status_print('FAIL', f'Fail to open {url} in browser, please manully open it.')
        except:
            status_print('FAIL', f'Fail to open {url} in browser, please manully open it.')
        status_print('INFO', f'Press CTRL-C to stop.')
    except KeyboardInterrupt:
        status_print('STOP', f'Pull up service is terminated.')  
    
def delay_open_webbrower(url, delay=10):
    process = multiprocessing.Process(target=delay_open_webbrower_, args=(url, delay))
    process.start()
    return process
    