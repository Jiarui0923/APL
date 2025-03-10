
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
import math  

from utils import User
from utils import Project
from utils import WorkflowDB
from utils import Resource

def index(request):
    return render(request, 'index.html')

def _build_project_list(_user):
    _projects = _user.projects
    _project_info = [
       {'name':   _project.name,
        'desc':   _project.desc,
        'create': _project.create_time,
        'id':     _project_id,}
       for _project_id, _project in _projects.items()
    ]
    return _project_info

@login_required(login_url='login')
def private_projects(request):
    _user_id = request.user.id
    _user = User(_user_id)
    _project_info = list(reversed(_build_project_list(_user)))
    return render(request, 'dashboards/private_projects.html',
                  context=dict(
                      page = 'private-projects',
                      projects = _project_info,
                      add_project = False
                  ))

@login_required(login_url='login')
def create_project(request):
    _user_id = request.user.id
    if request.method == 'POST':
        _name, _desc = request.POST.get('name'), request.POST.get('desc')
        Project.create_project(_user_id, name=_name, desc=_desc)
        return redirect('projects')
    else:
        _user = User(_user_id)
        _project_info = _build_project_list(_user)
        return render(request, 'dashboards/private_projects.html',
                        context=dict(
                            page = 'private-projects',
                            projects = _project_info,
                            add_project = True
                        ))
        
@login_required(login_url='login')
def copy_project(request, project_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    _project = _user.projects[project_id]
    _project.copy(_user_id)
    return redirect('projects')
        
def _build_workflow_list(_user):
    _workflows = _user.workflows
    _project_info = [
       {'name':   _workflow.name,
        'desc':   _workflow.desc,
        'numblock': len(_workflow.blocks),
        'id':     _workflow_id,}
       for _workflow_id, _workflow in _workflows.items()
    ]
    return _project_info

@login_required(login_url='login')
def private_workflows(request):
    _user_id = request.user.id
    _user = User(_user_id)
    _workflow_info = list(reversed(_build_workflow_list(_user)))
    return render(request, 'dashboards/private_workflows.html',
                  context=dict(
                      page = 'private-workflows',
                      workflows = _workflow_info
                  ))
    
@login_required(login_url='login')
def create_workflow(request):
    _user_id = request.user.id
    if request.method == 'POST':
        _name, _desc = request.POST.get('name'), request.POST.get('desc')
        WorkflowDB.create_workflow(_user_id, name=_name, desc=_desc)
        return redirect('workflows')
    else:
        _user = User(_user_id)
        _workflow_info = _build_workflow_list(_user)
        return render(request, 'dashboards/private_workflows.html',
                    context=dict(
                        page = 'private-workflows',
                        workflows = _workflow_info,
                        add_workflow = True
                    ))
        
@login_required(login_url='login')
def private_resources(request):
    _user_id = request.user.id
    _user = User(_user_id)
    _resource_info = []
    for _resource_id, _resource in _user.resources.items():
        try:
            _server_name = _resource.lib.host.get("server")
            _status = True
        except:
            _server_name = 'N/A'
            _status = False
        _resource_info.append(dict(
            name = _server_name,
            id = _resource_id,
            api_id = _resource.api_id,
            host = _resource.host,
            status = _status
        ))
    return render(request, 'dashboards/private_resources.html',
                  context=dict(
                      page = 'private-resources',
                      resources = _resource_info
                  ))
    
@login_required(login_url='login')
def create_resource(request):
    _user_id = request.user.id
    _user = User(_user_id)
    if request.method == 'POST':
        _host = request.POST.get('host')
        _api_id = request.POST.get('api_id')
        _api_key = request.POST.get('api_key')
        Resource.create_resource(_user_id, _host, _api_id, _api_key)
        return redirect('resources')
    else:
        _resource_info = []
        for _resource_id, _resource in _user.resources.items():
            _resource_info.append(dict(
                name = _resource.lib.host.get("server"),
                id = _resource_id,
                api_id = _resource.api_id,
                host = _resource.host,
            ))
        return render(request, 'dashboards/private_resources.html',
                    context=dict(
                        page = 'private-resources',
                        workflows = _resource_info,
                        add_resource = True
                    ))
        

@login_required(login_url='login')
def public_workflows(request):
    _user_id = request.user.id
    
    if request.method == 'GET':
        search = request.GET.get('search')
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 6))
        _workflow_info, _workflow_len = WorkflowDB.public_workflows(search=search, offset=offset, limit=limit)
        _workflow_info = [{'name':item['name'], 'desc':item['desc'], 'id':item['id'], 'numblock':len(item['blocks'])}
                          for item in _workflow_info]
        search_info = "No matched tool." if _workflow_len <= 0 else f"{_workflow_len} tools matched."
        page_num_total = math.ceil(_workflow_len / limit)
        current_page = 0 if _workflow_len <= 0 else ((offset // limit) + 1)
        next_offset = offset + limit
        next_offset = next_offset if next_offset < _workflow_len else None
        previous_offset = offset - limit
        previous_offset = previous_offset if previous_offset >= 0 else None
        return render(request, 'shares/public_workflows.html',
                    context=dict(
                        page = 'public-workflows',
                        workflows = _workflow_info,
                        search_key = '' if search is None else search,
                        search_info = search_info,
                        total_page = page_num_total,
                        current_page = current_page,
                        next_offset = next_offset,
                        previous_offset = previous_offset,
                    ))
        
@login_required(login_url='login')
def accept_share_workflow(request, workflow_id=None):
    _user_id = request.user.id
    
    if request.method == 'GET':
        _workflow = WorkflowDB(id=workflow_id)
        _workflow_id = _workflow.accept_share(_user_id)
        return redirect("workflow-edit", workflow_id=_workflow_id)