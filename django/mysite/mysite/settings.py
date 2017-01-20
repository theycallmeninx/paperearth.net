from base_settings import *

from os import environ

if environ.get('NAME', None) == 'TAILS': #dev settings
    from dev_settings import *
else:
    from prod_settings import *
