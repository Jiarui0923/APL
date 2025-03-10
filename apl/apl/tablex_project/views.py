from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse, FileResponse
from django.contrib.auth.decorators import login_required
from utils import User, WorkflowDB, History
from itertools import islice
from tablex.settings import URL_PREFIX
from concurrent.futures import ThreadPoolExecutor
import pandas as pd
import json
import tempfile
import io
import os
import asyncio

def _convert_time(dt):
    if dt is None: return None
    else: return dt.strftime('%m-%d-%Y %H:%M:%S')

@login_required(login_url='login')
def project(request, project_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if project_id is None: return redirect('projects')
    else:
        return render(request, 'project/project.html',
                      context=dict(
                          project_id = project_id,
                          host = '/'+URL_PREFIX,
                      ))
        
@login_required(login_url='login')
def table(request, project_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'GET':
        _row, _col = request.GET.get('row'), request.GET.get('col')
        _project = _user.projects[project_id]
        _table = _project.table
        
        if _row is None or _col is None:
            _data = [{key:val.preview for key, val in line.items()} for line in _table._table]
            _columns = list(_table.columns.keys())
            
            return JsonResponse(dict(
                table=_data, columns=_columns
            ))
        else:
            _data = _table[int(_row), _col]
            if _data is not None:
                _value = _data.value
                _type = _data.iotype.meta
                _view = _data.view_html()
            else:
                _value, _type, _view = '', None, ''
            return JsonResponse(dict(
                value=_value, type=_type, view=_view
            ))
    if request.method == 'POST':
        _row, _col = request.POST.get('row'), request.POST.get('col')
        _val = request.POST.get('value')
        _dict = request.POST.get('dict')
        _project = _user.projects[project_id]
        _table = _project.table
        if _dict is None:
            if _row == ':':
                _table[:, _col] = _val
            else:
                _table[int(_row), _col] = _val
            return HttpResponse('Updated')
        else:
            if _row is None:
                _table.add_row(1)
                _row = len(_table) - 1
            _dict = json.loads(_dict)
            for _col, _val in _dict.items():
                if _row == ':':
                    _table[:, _col] = _val
                else:
                    _table[int(_row), _col] = _val
            return HttpResponse('Updated')
            
            
@login_required(login_url='login')
def project_infomation(request, project_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    
    if request.method == 'GET':
        _project = _user.projects[project_id]
        return JsonResponse(dict(
            name=_project.name,
            desc=_project.desc,
            create=_convert_time(_project.create_time),
            workflows = {_id:_workflow.name for _id, _workflow in _project.workflows.items()},
            resources = [{'id':res_id, 'host':resource.host, 'access':resource.api_id} for res_id, resource in _project.resources.items()],
        ))
    elif request.method == 'POST':
        _project = _user.projects[project_id]
        _name = request.POST.get('name', _project.name)
        _desc = request.POST.get('desc', _project.desc)
        _project.name = _name
        _project.desc = _desc
        return HttpResponse('Updated')
    
@login_required(login_url='login')
def get_resources(request, project_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'GET':
        _resource = _user.resources
        return JsonResponse(dict(
            resources = [{'id':res_id, 'host':resource.host, 'access':resource.api_id} for res_id, resource in _resource.items()],
        ))
        
@login_required(login_url='login')
def add_resources(request, project_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'POST':
        _resource_id = request.POST.get('resource')
        _project = _user.projects[project_id]
        _project.add_resource(_resource_id)
        return HttpResponse('Added')

@login_required(login_url='login')
def del_resources(request, project_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'POST':
        _resource_id = request.POST.get('resource')
        _project = _user.projects[project_id]
        _project.del_resource(_resource_id)
        return HttpResponse('Deleted')
        
        
@login_required(login_url='login')       
def workflow(request, project_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'GET':
        _workflow_id = request.GET.get('workflow_id')
        _project = _user.projects[project_id]
        _workflow = _project.workflows[_workflow_id]
        try:
            _inst_workflow = _workflow.build_workflow(_project.libindex)
        except Exception as e:
            return JsonResponse(dict(
                status = 'failed',
                message = str(e),
            ))
        else:
            _blocks = [_block.name for _block in _inst_workflow._blocks]
            _inputs = {_inst_workflow.column_map.get(param, param): {
                            'meta': io_obj.iotype.meta,
                            'name': io_obj.iotype.name,
                            'optional': io_obj.optional,
                            'default': io_obj.default,
                            'desc': io_obj.desc,
                            'condition': io_obj.iotype.condition,
                            'type_desc': io_obj.iotype.doc,
                            'type_id': io_obj.iotype.id,
                            'condition': io_obj.iotype.condition,
                    }
                    for param, io_obj in _inst_workflow.inputs.items()}
            _outputs = {_inst_workflow.column_map.get(param, param): {
                            'meta': io_obj.iotype.meta,
                            'name': io_obj.iotype.name,
                            'optional': io_obj.optional,
                            'default': io_obj.default,
                            'desc': io_obj.desc,
                            'condition': io_obj.iotype.condition,
                            'type_desc': io_obj.iotype.doc,
                            'type_id': io_obj.iotype.id,
                    }
                    for param, io_obj in _inst_workflow.outputs.items()}
            return JsonResponse(dict(
                id=_workflow_id,
                name=_workflow.name,
                desc=_workflow.desc,
                inputs = _inputs,
                outputs = _outputs,
                blocks = _blocks,
            ))
        
    elif request.method == 'POST':
        _workflow_id = request.POST.get('workflow')
        _history_id = History.create_history(project_id, _workflow_id, _user_id)
        run_task(_user_id, project_id, _history_id, _workflow_id)
        return HttpResponse(_history_id)

executor = ThreadPoolExecutor()
def _run_task(_user_id, project_id, _history_id, _workflow_id):
        _user = User(_user_id)
        _project = _user.projects[project_id]
        _history = History(id=_history_id)
        _history.start()
        _project = _user.projects[project_id]
        _table = _project.table
        _workflow = _user.workflows[_workflow_id]
        _inst_workflow = _workflow.build_workflow(_project.libindex)
        def _update_progress(progress):
            _history.history = dict(status ='running', progress=progress)
        _inst_workflow.set_track(_update_progress)
        try: _inst_workflow(_table)
        except Exception as e:
            _history.error(str(e))
        else: _history.finish()
def run_task(_user_id, project_id, _history_id, _workflow_id):
    
    executor.submit(_run_task, _user_id, project_id, _history_id, _workflow_id)
    
@login_required(login_url='login')
def add_row(request, project_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'POST':
        _project = _user.projects[project_id]
        _table = _project.table
        
        _table.add_row(num=1)
        return HttpResponse('Added')
    
@login_required(login_url='login')
def dup_row(request, project_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'POST':
        _row = int(request.POST.get('row'))
        _project = _user.projects[project_id]
        _table = _project.table
        
        _table.dup_row(row=_row)
        return HttpResponse(f'Row {_row} duplicated')
    
@login_required(login_url='login')
def del_row(request, project_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'POST':
        _row = int(request.POST.get('row'))
        _project = _user.projects[project_id]
        _table = _project.table
        
        _table.del_row(row=_row)
        return HttpResponse('Deleted')
    
@login_required(login_url='login')
def add_col(request, project_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'POST':
        _meta, _type_id, _name = request.POST.get('meta'), request.POST.get('type_id'), request.POST.get('name')
        _project = _user.projects[project_id]
        _table = _project.table
        _table.add_col(_name, _meta, _type_id)
        return HttpResponse('Added')
    
@login_required(login_url='login')
def history(request, project_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    
    if request.method == 'GET':
        _project = _user.projects[project_id]
        _limit = int(request.GET.get('limit', 5))
        _offset = int(request.GET.get('offset', 0))
        _histories = _project.histories
        
        _histories_selected = {}
        for _history_id, _history in islice(reversed(_histories.items()), _offset, _limit+_offset):
            try:
                _histories_selected[_history_id] = {
                    'status': _history.status,
                    'progress': _history.progress,
                    'id': _history_id,
                    'create_time': _convert_time(_history.create_time),
                    'start_time': _convert_time(_history.start_time),
                    'end_time': _convert_time(_history.end_time),
                    'workflow': WorkflowDB(_history.workflow_id).name
                }
            except: _project.del_history_ref(_history_id)
            
        _running = False
        for _history_id, _history in _histories.items():
            try:
                if _history.status in ('running', 'initialized'):
                    _running = True
                    break
            except: _project.del_history_ref(_history_id)
        return JsonResponse({
            'history': _histories_selected,
            'total': len(_project.histories),
            'offset': _offset,
            'limit': _limit,
            'running': _running
        })
        
@login_required(login_url='login')
def del_history(request, project_id=None, history_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    if request.method == 'POST':
        _project = _user.projects[project_id]
        _project.del_history(history_id)
        return HttpResponse('History Deleted')
    
@login_required(login_url='login')
def upload_file(request, project_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    if request.method == 'POST':
        _file_name = request.POST.get('file_name')
        _file_data = request.POST.get('file')
        _col_index = request.POST.get('index')
        _col_data = request.POST.get('data')
        
        _project = _user.projects[project_id]
        _index_rows = _project.table[:, _col_index]
        _index_match = None
        if (len(_index_rows) > 0):
            if not isinstance(_index_rows, list):
                _index_rows = [_index_rows]
            for i, _col in enumerate(_index_rows):
                if _col.value == _file_name: _index_match = i
        if _index_match is None:
            _project.table.add_row()
            _index_match = len(_index_rows)
        _project.table[_index_match, _col_data] = _file_data
        _project.table[_index_match, _col_index] = _file_name
        return JsonResponse({'status': 'added', 'row': _index_match, 'column': _col_data})

_table_decoder = {
    'csv':  lambda data: pd.read_csv(data),
    'xlsx': lambda data: pd.read_excel(data),
}

@login_required(login_url='login')
def upload_table(request, project_id=None):
    _user_id = request.user.id
    _user = User(_user_id)
    if request.method == 'POST':
        _file_type = request.POST.get('type')
        _file_data = request.POST.get('file')
        _col_index = request.POST.get('index')
        if _file_type not in _table_decoder: return JsonResponse({'status': 'failed', 'message': 'file not supported'})
        _table = _table_decoder[_file_type](io.StringIO(_file_data))
        if _col_index is None:
            _dict = _table.T.to_dict()
            _project = _user.projects[project_id]
            for key,vals in _dict.items():
                if pd.isnull(key): continue
                _project.table.add_row(1)
                _row = len(_project.table) - 1
                for k, v in vals.items():
                    if not pd.isnull(v): _project.table[_row, k] = v
        else:
            _dict = _table.set_index(_col_index).T.to_dict()
            _project = _user.projects[project_id]
            _index_rows = _project.table[:, _col_index]
            for key, vals in _dict.items():
                if pd.isnull(key): continue
                if isinstance(_index_rows, DataUnit) and _index_rows.value == key: _row = 0
                elif isinstance(_index_rows, (list, tuple)) and key in _index_rows: _row = _index_rows.index(key)
                else:
                    _project.table.add_row(1)
                    _row = len(_project.table) - 1
                for k, v in vals.items():
                    if not pd.isnull(v): _project.table[_row, k] = v
                _project.table[_row, _col_index] = key
        return JsonResponse({'status': 'added'})
                
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
def all_workflows(request, project_id):
    _user_id = request.user.id
    _user = User(_user_id)
    if request.method == 'GET':
        _workflow_info = _build_workflow_list(_user)
        _limit = int(request.GET.get('limit', 6))
        _offset = int(request.GET.get('offset', 0))
        return JsonResponse(dict(
            total = len(_workflow_info),
            workflows = _workflow_info[_offset:_offset+_limit],
            offset = _offset,
            limit = _limit
        ))
        
@login_required(login_url='login')
def add_workflow(request, project_id):
    _user_id = request.user.id
    _user = User(_user_id)
    if request.method == 'POST':
        _workflow_id = request.POST.get('workflow')
        _project = _user.projects[project_id]
        _project.add_workflow(_workflow_id)
        return HttpResponse("Added")
    
@login_required(login_url='login')
def del_workflow(request, project_id):
    _user_id = request.user.id
    _user = User(_user_id)
    if request.method == 'POST':
        _workflow_id = request.POST.get('workflow')
        _project = _user.projects[project_id]
        _project.del_workflow(_workflow_id)
        return HttpResponse("Deleted")
    
@login_required(login_url='login')
def del_project(request, project_id):
    _user_id = request.user.id
    _user = User(_user_id)
    if request.method == 'POST':
        _project = _user.projects[project_id]
        _project.delete()
        return redirect("projects")
    
@login_required(login_url='login')
def download_data(request, project_id):
    _user_id = request.user.id
    _user = User(_user_id)
    if request.method == 'GET':
        _project = _user.projects[project_id]
        _name = request.GET.get('name')
        _index = request.GET.get('index')
        if _index is not None and len(_index) <= 0: _index = None
        if _name is None or len(_name) <= 0: _name = str(_project.name)
        with tempfile.TemporaryDirectory() as temp_dir:
            _project.table.export(path=temp_dir, file_name=_name, index_col=_index)
            buffer = io.BytesIO()
            with open(os.path.join(temp_dir, f'{_name}.zip'), 'rb') as f:
                buffer.write(f.read())
            buffer.seek(0)
            return FileResponse(buffer, as_attachment=True, filename=f'{_name}.zip')

@login_required(login_url='login')
def download_report(request, project_id):
    _user_id = request.user.id
    _user = User(_user_id)
    if request.method == 'GET':
        _project = _user.projects[project_id]
        _name = request.GET.get('name')
        _index = request.GET.get('index')
        if _index is not None and len(_index) <= 0: _index = None
        if _name is None or len(_name) <= 0: _name = str(_project.name)
        with tempfile.TemporaryDirectory() as temp_dir:
            _report = _project.table.report(title=_name, index_col=_index)
            _report.save(os.path.join(temp_dir, f'{_name}.html'), format='html')
            with open(os.path.join(temp_dir, f'{_name}.html'), 'r', encoding='utf-8') as f:
                response = HttpResponse(f.read(), content_type='text/html')
                response['Content-Disposition'] = f'attachment; filename={_name}.html'
                return response