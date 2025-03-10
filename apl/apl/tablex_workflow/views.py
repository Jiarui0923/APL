from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from utils import User, WorkflowDB, Resource, Project
from caltable import CalLibIndex
from tablex.settings import URL_PREFIX
import json

# Create your views here.
@login_required(login_url='login')
def workflow(request, workflow_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if workflow_id is None: return redirect('workflows')
    else:
        return render(request, 'workflow/workflow.html',
                      context=dict(
                          workflow_id = workflow_id,
                          host = '/'+URL_PREFIX,
                      ))

@login_required(login_url='login')
def del_workflow(request, workflow_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    if request.method == 'POST':
        _workflow = WorkflowDB(id=workflow_id)
        _user.del_workflow(workflow_id)
        del _workflow.workflow
        return redirect("workflows")
  
@login_required(login_url='login')
def workflow_info(request, workflow_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'GET':
        _workflow = WorkflowDB(id=workflow_id)
        _name = _workflow.name
        _desc = _workflow.desc
        return JsonResponse({
            'name': _name,
            'desc': _desc,
        })
    elif request.method == 'POST':
        _workflow = WorkflowDB(id=workflow_id)
        _name = request.POST.get('name')
        _desc = request.POST.get('desc')
        if _name is not None: _workflow.name = _name
        if _desc is not None: _workflow.desc = _desc
        return HttpResponse('Updated')

@login_required(login_url='login')
def toolkits_list(request, workflow_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'GET':
        _all_algorithms, fails = [], 0
        for resource in _user.resources.values():
            try:
                _lib = resource.lib
                _all_algorithms += _lib.algorithms
            except: fails += 1
        return JsonResponse({
            'algorithms': list(set(_all_algorithms))
        })
def _build_index(resources):
    _libs, fails = [], 0
    for _id in resources:
        try: _libs.append(Resource(id=_id).lib)
        except: fails += 1
    _index = CalLibIndex(*_libs)
    return _index
        
@login_required(login_url='login')
def tool(request, workflow_id=None, tool_name=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'GET':
        try:
            _index = _build_index(_user.resources)
            # _index = CalLibIndex(*[Resource(id=_id).lib for _id in _user.resources])
            _algorithm = _index[tool_name]()
        except Exception as e:
            return JsonResponse(dict(
                status = 'failed',
                message = str(e),
            ))
        _inputs = {param: {
                        'meta': io_obj.iotype.meta,
                        'name': io_obj.iotype.name,
                        'optional': io_obj.optional,
                        'default': io_obj.default,
                        'desc': io_obj.desc,
                        'condition': io_obj.iotype.condition,
                        'type_desc': io_obj.iotype.doc,
                        'type_id': io_obj.iotype.id,
                   }
                   for param, io_obj in _algorithm.inputs.items()}
        _outputs = {param: {
                        'meta': io_obj.iotype.meta,
                        'name': io_obj.iotype.name,
                        'optional': io_obj.optional,
                        'default': io_obj.default,
                        'desc': io_obj.desc,
                        'condition': io_obj.iotype.condition,
                        'type_desc': io_obj.iotype.doc,
                        'type_id': io_obj.iotype.id,
                   }
                   for param, io_obj in _algorithm.outputs.items()}
        return JsonResponse({
            'name': _algorithm.name,
            'desc': _algorithm.desc,
            'inputs': _inputs,
            'outputs': _outputs,
            'id': tool_name,
        })
        
@login_required(login_url='login')
def blocks(request, workflow_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'GET':
        _workflow = WorkflowDB(id=workflow_id)
        blocks = []
        if len(_workflow.blocks) > 0:
            try:
                _index = _index = _build_index(_user.resources)
                _workflow_inst = _workflow.build_workflow(_index)
            except Exception as e:
                return JsonResponse(dict(
                    status = 'failed',
                    message = str(e),
                ))
            required_inputs = [_param_name for (_param_name, _param) in _workflow_inst.inputs.items() if not _param.optional]
            optional_inputs = [_param_name for (_param_name, _param) in _workflow_inst.inputs.items() if _param.optional]
            outputs = [_param_name for (_param_name, _) in  _workflow_inst.outputs.items()]
            for (_algo_id, _mapping) in _workflow.blocks:
                _algo = _index[_algo_id]()
                _inputs, _outputs = _algo.inputs, _algo.outputs
                _optional_inputs = {_param_name:_mapping.get(_param_name,_param_name) for (_param_name, _param) in _inputs.items() if _param.optional}
                _required_inputs = {_param_name:_mapping.get(_param_name,_param_name) for (_param_name, _param) in _inputs.items() if not _param.optional}
                _outputs = {_param_name:_mapping.get(_param_name,_param_name) for (_param_name, _) in _outputs.items()}
                blocks.append(dict(id=_algo_id,
                                optional_inputs=_optional_inputs,
                                required_inputs=_required_inputs,
                                outputs=_outputs))
        else:
            optional_inputs = []
            required_inputs = []
            outputs = []
        return JsonResponse(dict(
            id = workflow_id,
            optional_inputs=optional_inputs,
            required_inputs=required_inputs,
            outputs=outputs,
            blocks = blocks,
        ))

@login_required(login_url='login')
def add_block(request, workflow_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'POST':
        _algo_id = request.POST.get('id')
        _mapping = request.POST.get('mapping')
        _workflow = WorkflowDB(id=workflow_id)
        _workflow.add_block(_algo_id, **json.loads(_mapping))
        return HttpResponse('Added')

@login_required(login_url='login')
def insert_block(request, workflow_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'POST':
        _algo_id = request.POST.get('id')
        _mapping = request.POST.get('mapping')
        _where   = request.POST.get('where')
        _workflow = WorkflowDB(id=workflow_id)
        _workflow.insert_block(int(_where), _algo_id, **json.loads(_mapping))
        return HttpResponse('Inserted')

@login_required(login_url='login')
def del_block(request, workflow_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'POST':
        _where   = request.POST.get('where')
        _workflow = WorkflowDB(id=workflow_id)
        _workflow.del_block(int(_where))
        return HttpResponse('Deleted')
    
@login_required(login_url='login')
def update_block(request, workflow_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'POST':
        _where   = request.POST.get('where')
        _algo_id = request.POST.get('id')
        _mapping = request.POST.get('mapping')
        _workflow = WorkflowDB(id=workflow_id)
        _workflow.update_block(int(_where), _algo_id, **json.loads(_mapping))
        return HttpResponse('Updated')

@login_required(login_url='login')
def quickstart(request, workflow_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if workflow_id is None: return redirect('workflows')
    else:
        return render(request, 'workflow/quickstart.html',
                      context=dict(
                          workflow_id = workflow_id,
                          host = '/'+URL_PREFIX,
                      ))

@login_required(login_url='login')
def create_project_by_workflow(request, workflow_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'POST':
        _name   = request.POST.get('name', '')
        _desc = request.POST.get('desc', '')
        _project_id = Project.create_project(_user_id, _name, _desc)
        _project = Project(project_id=_project_id)
        _project.add_workflow(workflow_id)
        _workflow = WorkflowDB(id=workflow_id)
        _index = _build_index(_user.resources)
        # _index = CalLibIndex(*[Resource(id=_id).lib for _id in _user.resources])
        try:
            _workflow_inst = _workflow.build_workflow(_index)
        except Exception as e:
            _user.del_project(_project_id)
            return JsonResponse(dict(
                status = 'failed',
                message = str(e),
            ))
        required_inputs = {_param_name:_param for (_param_name, _param) in _workflow_inst.inputs.items() if not _param.optional}
        _project.table.set_types(required_inputs)
        return JsonResponse({
            'project': _project_id
        })
        
@login_required(login_url='login')
def share_workflow(request, workflow_id=None):
    _user_id = request.user.id
    
    if request.method == 'POST':
        _workflow = WorkflowDB(id=workflow_id)
        _shared_id = _workflow.share()
        return HttpResponse(_shared_id)