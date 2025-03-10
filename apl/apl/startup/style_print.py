
hello_template = '''
****************************************************
****************************************************
**                                                **
**                 Welcome to                     **
**   Antigen Processing Likelihood (APL) Suite    **
**                                                **
****************************************************
****************************************************
'''
def hello_page():
    print(hello_template)
    

bye_template = '''
----------------------------------
|                                |
|    Thank you for using APL.    |
|    Wish to meet you again.     |
|    If you have any issue or    |
|    suggestion, welcome to      |
|    contact us for support.     |
|    Have a good day. :)         |
|                                |
----------------------------------
'''
def good_bye():
    print(bye_template)
    
    
def status_print(status, info):
    print(f'[ {status} ] {info}')