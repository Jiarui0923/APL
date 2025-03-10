from django.http import HttpResponse
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from utils import User

@login_required(login_url='login')
def del_resource(request, resource_id=None):
    _user_id = request.user.id
    _user = User(user_id=_user_id)
    _user.del_resource(resource_id)
    return redirect('resources')