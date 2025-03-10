var switch_tab_panel = function(active, panels) {
    for (var i in panels) {
        if (panels[i] != active) {
            $("#tab-"+panels[i]).toggleClass("is-active", false);
            $("#"+panels[i]).hide();
        }
        else {
            $("#tab-"+panels[i]).toggleClass("is-active", true);
            $("#"+panels[i]).show();
        }
    }
};

editor = CodeMirror(document.querySelector('#editor'), {
    lineNumbers: true,
    tabSize: 4,
    value: "",
    theme: "idea"
});

var table = new Tabulator("#data-table", {
    height:"250px",

    rowHeader:{resizable: false, frozen: true, width:40, hozAlign:"center", formatter: "rownum", cssClass:"range-header-col", editor:false},
    
    selectableRange:true,
    selectableRangeColumns:false,
    selectableRangeRows:false,

    autoColumns:false,
    columnDefaults:{
        headerSort:false,
        headerHozAlign:"center",
        cellClick: function(e, cell) {load_unit(cell, PROJECT_ID)},
        resizable:"header",
        width:100, 
    },
    editorEmptyValue:undefined,

});

var build_url = function(project_id, entry) {
    return REQUEST_HOST+"projects/"+project_id+"/"+entry+"/";
};

var selected_row = null;
var selected_col = null;
var LOAD_UNIT_RUNNING = false;
var load_unit = function(cell, project_id) {
    LOAD_UNIT_RUNNING = true;

    $("#unit-data-indexer").toggleClass("skeleton-block", true);
    $("#unit-data-editor").toggleClass("skeleton-block", true);
    $("#unit-data-visual").toggleClass("skeleton-block", true);

    selected_row = cell.getRow().getPosition() - 1;
    selected_col = cell.getColumn().getField();
    url = build_url(project_id, "table");
    GET(load_unit_response, url, {'row': selected_row, 'col': selected_col});
};
var reload_unit = function(project_id) {
    url = build_url(project_id, "table");
    GET(load_unit_response, url, {'row': selected_row, 'col': selected_col});
};
var load_unit_response = function(status_code, body, header) {
    var data_ = JSON.parse(body);
    var value_ = data_["value"];
    var view_ = data_["view"];
    editor.getDoc().setValue(String(value_));
    $("#table-row").html(selected_row+1);
    $("#table-col").html(selected_col);
    $("#unit-view").html(view_);

    $("#unit-data-indexer").toggleClass("skeleton-block", false);
    $("#unit-data-editor").toggleClass("skeleton-block", false);
    $("#unit-data-visual").toggleClass("skeleton-block", false);

    LOAD_UNIT_RUNNING = false;
};

var table_columns_global = null;
var load_table_data = function(project_id) {
    url = build_url(project_id, "table");
    GET(load_table_data_response, url, {});
};
var load_table_data_response = function(status_code, body, header) {
    var data_ = JSON.parse(body);
    var table_ = data_["table"];
    var columns_ = data_["columns"];
    table_columns_global = columns_;
    table.setData(table_);
    _current_columns = table.getColumns();
    for (let i=0; i < _current_columns.length-1; i++) {
        _current_columns[i+1].delete();
    }
    for (var col in columns_) {
        table.addColumn({title:columns_[col], field:columns_[col]});
    }
    if (selected_col != null && selected_row != null) {reload_unit(PROJECT_ID);}
    load_ready_table_done = true;
};

var update_table_data = function(project_id) {
    url = build_url(project_id, "table");
    GET(update_table_data_response, url, {});
};
var update_table_data_response = function(status_code, body, header) {
    var data_ = JSON.parse(body);
    var table_ = data_["table"];
    var columns_ = data_["columns"];

    var _update_table = {};
    var _table_origin = table.getData()
    for (var row in table_) {
        for (var column in table_[row]) {
            if (_table_origin[row][column] != table_[row][column]) {
                if (row in _update_table == false) {_update_table[row] = {};}
                _update_table[row][column] = table_[row][column];
            }
        }
    }
    if (_update_table.length > 0) {
        console.log(_update_table);
        var _update_table_format = [];
        for (var i in _update_table) {
            _update_table[i]["id"] = i;
            _update_table_format.push(_update_table[i]);
        }
        table.updateData(_update_table_format);
    }
    _current_columns = table.getColumns();
    var _current_columns_names = [];
    for (var col in _current_columns) {
        col = _current_columns[col];
        _current_columns_names.push(col.getField());
    }
    for (var col in columns_) {
        if (col in _current_columns_names == false) {
            table.addColumn({title:columns_[col], field:columns_[col]});
            console.log(table.getColumns());
        }
    }
    if (selected_col != null && selected_row != null) {reload_unit(PROJECT_ID);}
};

var add_row = function() {
    $("#add-row-button").toggleClass("button is-loading is-ghost", true);
    url = build_url(PROJECT_ID, "table/row/add");
    POST(add_row_response, url, {"csrfmiddlewaretoken": CSRF_TOKEN});
};
var add_row_response = function(status_code, body, header) {
    load_table_data(PROJECT_ID);
    setTimeout(function(){$("#add-row-button").toggleClass("button is-loading is-ghost", false);}, 500);
};

var add_col = function(name, meta, type_id) {
    url = build_url(PROJECT_ID, "table/col/add");
    POST(add_col_response, url, {"csrfmiddlewaretoken": CSRF_TOKEN, "name":name, "meta":meta, "type_id":type_id});
};
var add_col_response = function(status_code, body, header) {
    load_table_data(PROJECT_ID);
};

var del_row = function() {
    $("#del-row-button").toggleClass("button is-loading is-ghost is-small", true);
    url = build_url(PROJECT_ID, "table/row/del");
    if (selected_row != null) {
        POST(del_row_response, url, {"row":selected_row, "csrfmiddlewaretoken": CSRF_TOKEN});
    }
};
var del_row_response = function(status_code, body, header) {
    
    load_table_data(PROJECT_ID);
    setTimeout(function(){$("#del-row-button").toggleClass("button is-loading is-ghost", false);}, 500);
};

var dup_row = function() {
    $("#dup-row-button").toggleClass("button is-loading is-ghost is-small", true);
    url = build_url(PROJECT_ID, "table/row/dup");
    if (selected_row != null) {
        POST(dup_row_response, url, {"row":selected_row, "csrfmiddlewaretoken": CSRF_TOKEN});
    }
};
var dup_row_response = function(status_code, body, header) {
    
    load_table_data(PROJECT_ID);
    setTimeout(function(){$("#dup-row-button").toggleClass("button is-loading is-ghost", false);}, 500);
};

var edit_table_data = function() {
    url = build_url(PROJECT_ID, "table");
    $("#unit-data-editor").toggleClass("skeleton-block", true);
    $("#unit-data-visual").toggleClass("skeleton-block", true);
    POST(edit_table_data_response, url,
        {'row': selected_row,
        'col': selected_col,
        'value': editor.getValue(),
        "csrfmiddlewaretoken": CSRF_TOKEN});
};
var edit_table_data_response = function(status_code, body, header) {
    load_table_data(PROJECT_ID);
    $("#unit-data-editor").toggleClass("skeleton-block", false);
    $("#unit-data-visual").toggleClass("skeleton-block", false);
};

var upload_single_file = function(uploader) {
    var _props = $(`#${ uploader }`).prop('files');
    var _file=_props[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result;
        editor.getDoc().setValue(content);
        edit_table_data();
    };
    reader.onerror = function (e) { 
        alert('Failed to load file!')
    }
    reader.readAsText(_file);
};

var uploaded_files = {};
var upload_mutiple_file = function(uploader="batch-file-uploader") {
    var _props = $(`#${ uploader }`).prop('files');
    for (var _file of _props) {
        if (_file.name in uploaded_files == false) {
            uploaded_files[_file.name] = _file;
        }
    }
    load_uploaded_files_list();
};
var uploaded_files_list_offset = 0;
var uploaded_files_list_limit = 5;
var load_uploaded_files_list = function() {
    _file_names = Object.keys(uploaded_files)
    _selected_files = _file_names.slice(uploaded_files_list_offset, uploaded_files_list_offset+uploaded_files_list_limit);
    _total_pages = Math.ceil(_file_names.length / uploaded_files_list_limit);
    _current_page = Math.ceil(uploaded_files_list_offset / uploaded_files_list_limit) + 1;
    var _content = "";
    for (_file_name of _selected_files) {
        _content += `
            <a class="panel-block">
                <span class="panel-icon has-text-danger" onclick="delete_uploaded_file('${_file_name}');">
                    <i class="fa-solid fa-trash"></i>
                </span>
                ${_file_name}
            </a>
        `;
    }
    $("[id=uploaded-files-list]").html(_content);
    $("[id=uploaded-files-page]").html(`${_current_page}&nbsp;/&nbsp;${_total_pages}`);
    if (_file_names.length > 0) {
        $("#upload-mutiple-files-modal-upload-next").prop("disabled",false);
        $("#upload-mutiple-files-modal-upload-next").html("Continue");
    } else {
        $("#upload-mutiple-files-modal-upload-next").prop("disabled",true);
        $("#upload-mutiple-files-modal-upload-next").html("Upload File to Continue");
    }
};
var delete_uploaded_file = function(name) {
    if (name in uploaded_files) {delete uploaded_files[name];}
    load_uploaded_files_list();
};
var update_files_page = function(next) {
    if (next) {
        uploaded_files_list_offset += uploaded_files_list_limit;
        _total = Object.keys(uploaded_files).length;
        if (uploaded_files_list_offset >= _total) {uploaded_files_list_offset = _total - (_total % uploaded_files_list_limit)}
    } else {
        uploaded_files_list_offset -= uploaded_files_list_limit;
        if (uploaded_files_list_offset <= 0){ uploaded_files_list_offset = 0;}
    }
    load_uploaded_files_list();
};

var end_files_uploads = function() {
    $("#upload-mutiple-files-modal-upload").hide();
    $("#upload-mutiple-files-modal-files").hide();
    $("#upload-mutiple-files-modal-tables").hide();
    $("#upload-mutiple-files-modal-select").hide();
    $("#upload-mutiple-files-modal-uploadprogress").hide();
    $("#upload-mutiple-files-modal").toggleClass("is-active", false);
    uploaded_files = {};
    uploaded_files_list_offset = 0;
};

var start_files_uploads = function() {
    $("#upload-files-button").toggleClass("button is-loading is-ghost", true);
    load_uploaded_files_list();
    $("#upload-mutiple-files-modal").toggleClass("is-active", true);
    $("#upload-mutiple-files-modal-upload").slideDown();
    $("#upload-mutiple-files-modal-files").hide();
    $("#upload-mutiple-files-modal-tables").hide();
    $("#upload-mutiple-files-modal-select").hide();
};

var table_filetype_ends = ['xlsx', 'csv', 'tsv'];
var check_files_types = function() {
    var _all_table_files = true;
    for (var _file_name in uploaded_files) {
        _file_name_comps = _file_name.split('.');
        _file_ends = _file_name_comps[_file_name_comps.length - 1];
        if (table_filetype_ends.indexOf(_file_ends.toLowerCase()) == -1) {
            _all_table_files = false;
            break;
        }
    }
    if (_all_table_files) {
        if (Object.keys(uploaded_files).length > 1) {
            align_mutiple_files();
            $("#upload-mutiple-files-modal-upload").hide();
            $("#upload-mutiple-files-modal-files").slideDown();
        } else {
            $("#upload-mutiple-files-modal-upload").hide();
            $("#upload-mutiple-files-modal-select").slideDown();
        }
    } else {
        align_mutiple_files();
        $("#upload-mutiple-files-modal-upload").hide();
        $("#upload-mutiple-files-modal-files").slideDown();
    }
};

var from_select_to_mutiple_files = function () {
    align_mutiple_files();
    $("#upload-mutiple-files-modal-select").hide();
    $("#upload-mutiple-files-modal-files").slideDown();
};
var from_select_to_stack_tables = function () {
    align_table_file();
    $("#upload-mutiple-files-modal-select").hide();
    $("#upload-mutiple-files-modal-tables").slideDown();
};



var submit_mutiple_files = function () {
    _index_col = $("#file-uploads-index-column-select").find(":selected").val();
    _output_col = $("#file-uploads-output-column-select").find(":selected").val();
    var _index_col_new = $("#file-uploads-index-column-new").val();
    if (_index_col_new != null && String(_index_col_new).length > 0) {
        _index_col = _index_col_new;
    }
    var _output_col_new = $("#file-uploads-output-column-new").val();
    if (_output_col_new != null && String(_output_col_new).length > 0) {
        _output_col = _output_col_new;
    }
    $("#upload-mutiple-files-modal-files").hide();
    $("#upload-mutiple-files-modal-uploadprogress").slideDown();
    current_submit_id = 0;
    $("#upload-mutiple-files-modal-uploadprogress-progress").val(0);
    read_and_submit_file(_index_col, _output_col);
};
var current_submit_id = 0;
var read_and_submit_file = function (index_col, output_col) {
    _file_names = Object.keys(uploaded_files);
    if (current_submit_id < _file_names.length) {
        _file_name = _file_names[current_submit_id];
        _file = uploaded_files[_file_name];
        _file_name_no_ends = _file_name.split('.');
        _file_name_no_ends = _file_name_no_ends.slice(0, _file_name_no_ends.length - 1).join('.');
        $("#upload-mutiple-files-modal-uploadprogress-file").html(_file_name);
        var _reader = new FileReader();
        _reader.onload = function (e) {
            var _content = e.target.result;
            submit_file_auto_aligment(index_col, output_col, _file_name_no_ends, _content);
        };
        _reader.readAsText(_file);
    } else {
        load_table_data(PROJECT_ID);
        end_files_uploads();
    }
}
var submit_file_auto_aligment = function (index_col, output_col, file_name, file) {
    url = build_url(PROJECT_ID, "upload/files");
    var submit_file_auto_aligment_response = function(status_code, body, header) {
        current_submit_id += 1;
        $("#upload-mutiple-files-modal-uploadprogress-progress").val(current_submit_id / Object.keys(uploaded_files).length * 100);
        read_and_submit_file(index_col, output_col);
    };
    POST(submit_file_auto_aligment_response, url,
        {'index': index_col,
        'data': output_col,
        'file_name': file_name,
        'file': file,
        "csrfmiddlewaretoken": CSRF_TOKEN});
};

var read_submit_table = function () {
    var _index_col = $("#table-uploads-index-column-select").find(":selected").val();
    var _index_col_new = $("#table-uploads-index-column-new").val();
    if (_index_col_new != null && String(_index_col_new).length > 0) {
        _index_col = _index_col_new;
    }
    _file_names = Object.keys(uploaded_files);
    _file = uploaded_files[_file_names[0]];
    $("#upload-mutiple-files-modal-tables").hide();
    $("#upload-mutiple-files-modal-uploadprogress").slideDown();
    $("#upload-mutiple-files-modal-uploadprogress-progress").val(0);
    $("#upload-mutiple-files-modal-uploadprogress-file").html(_file_names[0]);
    var _reader = new FileReader();
    _reader.onload = function (e) {
        url = build_url(PROJECT_ID, "upload/table");
        var _content = e.target.result;
        var read_submit_table_response = function(status_code, body, header) {
            load_table_data(PROJECT_ID);
            $("#upload-mutiple-files-modal-uploadprogress").hide();
            end_files_uploads();
        };
        if (_index_col == null) {
            POST(read_submit_table_response, url,
                {'type': _file_names[0].split(".")[_file_names[0].split(".").length - 1],
                'file': _content,
                "csrfmiddlewaretoken": CSRF_TOKEN});
        } else {
            POST(read_submit_table_response, url,
                {'index': _index_col,
                'type': _file_names[0].split(".")[_file_names[0].split(".").length - 1],
                'file': _content,
                "csrfmiddlewaretoken": CSRF_TOKEN});
        }
    };
    _reader.readAsText(_file);
};


var align_mutiple_files = function () {
    var _columns = table.getColumns();
    var _columns_names = [];
    var _options = "";
    for (var _col of _columns) {
        _col_name = _col.getField();
        if (_col_name != null) {
            _columns_names.push(_col_name);
            _options += `<option>${ _col_name }</option>`;
        }
    }
    $("#file-uploads-index-column-select").html(_options);
    $("#file-uploads-output-column-select").html(_options);
    if (_columns.length <= 0) {
        $("#file-uploads-index-column-select").hide();
        $("#file-uploads-output-column-select").hide();
    } else {
        $("#file-uploads-index-column-select").show();
        $("#file-uploads-output-column-select").show();
    }
};

var align_table_file = function () {
    var _columns = table.getColumns();
    var _columns_names = [];
    var _options = "";
    for (var _col of _columns) {
        _col_name = _col.getField();
        if (_col_name != null) {
            _columns_names.push(_col_name);
            _options += `<option>${ _col_name }</option>`;
        }
    }
    $("#table-uploads-index-column-select").html(_options);
    if (_columns.length <= 0) {
        $("#table-uploads-index-column-select").hide();
    } else {
        $("#table-uploads-index-column-select").show();
    }
};

switch_table_index_select = true;
var switch_table_index = function() {
    if (switch_table_index_select) {
        $("#table-uploads-index-column-new").val($("#table-uploads-index-column-select").val());
        $("#table-uploads-index-column-select-control").hide();
        $("#table-uploads-index-column-new-control").show(); 
        switch_table_index_select = false;
    } else {
        $("#table-uploads-index-column-select").val($("#table-uploads-index-column-new").val());
        $("#table-uploads-index-column-select-control").show();
        $("#table-uploads-index-column-new-control").hide(); 
        switch_table_index_select = true;
    }
};


switch_file_index_select = false;
var switch_file_index = function() {
    if (switch_file_index_select) {
        $("#file-uploads-index-column-new").val($("#file-uploads-index-column-select").val());
        $("#file-uploads-index-column-select-control").hide();
        $("#file-uploads-index-column-new-control").show(); 
        switch_file_index_select = false;
    } else {
        $("#file-uploads-index-column-select").val($("#file-uploads-index-column-new").val());
        $("#file-uploads-index-column-select-control").show();
        $("#file-uploads-index-column-new-control").hide(); 
        switch_file_index_select = true;
    }
};

switch_file_output_select = true;
var switch_file_output = function () {
    if (switch_file_output_select) {
        $("#file-uploads-output-column-new").val($("#file-uploads-output-column-select").val());
        $("#file-uploads-output-column-select-control").hide();
        $("#file-uploads-output-column-new-control").show(); 
        switch_file_output_select = false;
    } else {
        $("#file-uploads-output-column-select").val($("#file-uploads-output-column-new").val());
        $("#file-uploads-output-column-select-control").show();
        $("#file-uploads-output-column-new-control").hide(); 
        switch_file_output_select = true;
    }
};

var load_project_info = function(project_id) {
    url = build_url(project_id, "info");
    GET(load_project_info_response, url, {});
};

var apply_resource = function() {
    var content = "";
    for(var resource of project_resources) {
        content += `
        <tr>
            <th>${ resource["host"] }</th>
            <td>${ resource["access"] }</td>
            <td><button class="button is-danger" onclick="del_one_resource( '${ resource["id"] }' );"><i class="fa-solid fa-trash"></i></button></td>
        </tr>
        `;
    }
    $("#resource-list").html(content)
};

var project_name = "Project";
var project_desc = "Project Description";
var project_create = "TIME"
var project_workflows = [];
var project_resources = [];
var load_project_info_response = function(status_code, body, header) {
    var data_ = JSON.parse(body);
    project_name = data_["name"];
    project_desc = data_["desc"];
    project_create = data_["create"];
    project_workflows = data_["workflows"];
    project_resources = data_["resources"];

    $("#project-title").html(project_name);
    $("#project-create").html(project_create);

    $("#settings-project-name").val(project_name);
    $("#settings-project-description").val(project_desc);

    apply_workflows(project_workflows);
    apply_resource();
    if (add_all_tools_opened) {
        load_all_tools(PROJECT_ID);
    }
    load_project_info_done = true;
};

var update_project_info = function () {
    url = build_url(PROJECT_ID, "info");
    POST(update_project_info_response, url,
        {'name': $("#settings-project-name").val(),
        'desc': $("#settings-project-description").val(),
        "csrfmiddlewaretoken": CSRF_TOKEN});
};
var update_project_info_response = function(status_code, body, header) {
    load_project_info(PROJECT_ID);
};

var build_workflow_breif = function(id, name) {
    var context = "";
    context += `<a class="panel-block" onclick="view_workflow('${id}', '${name}');">`;
    context += `<span class="panel-icon">`;
    context += `<i class="fas fa-code-branch" aria-hidden="true"></i>`;
    context += `</span>`;
    context += `&nbsp;${name}`;
    context += `</a>`;
    return context;
};
PAGE_SIZE_WORKFLOW = 4
var apply_workflows = function(workflows) {
    context = "";
    for (var workflow_id in workflows) {
        context += build_workflow_breif(workflow_id, workflows[workflow_id]);
    }
    $("#workflow-list").html(context);
};

var selected_workflow_name = null;
var selected_workflow_desc = null;
var selected_workflow_inputs = [];
var selected_workflow_outputs = [];
var selected_workflow_steps = [];
var selected_workflow_id = null;
var view_workflow = function(workflow_id, workflow_name) {
    $("#workflow-details-main").hide();
    var _abbr_workflow_name = workflow_name;
    if (_abbr_workflow_name.length > 10) {
        _abbr_workflow_name = _abbr_workflow_name.slice(0, 12)+"...";
    }
    $("#workflow-details-name").html(_abbr_workflow_name);
    $("#workflow-details-run").prop("disabled", false);
    $("#workflow-details-run").toggleClass("is-loading is-rounded is-dark p-0", true);
    $("#workflow-details-run").toggleClass("has-text-primary-dark is-success", false);
    $("#workflow-details").slideDown();
    url = build_url(PROJECT_ID, "workflow");
    GET(view_workflow_response, url, {"workflow_id":workflow_id});
};
var view_workflow_response = function(status_code, body, header) {
    var data_ = JSON.parse(body);
    if ('status' in data_) {
        $("#workflow-details-desc").html(`<span class="tag is-danger">Unavaliable</span><br>${ data_['message'] }`);
        $("#workflow-details-inputs").html(`<a class="panel-block"><span class="tag">Unavaliable</span></a>`);
        $("#workflow-details-outputs").html(`<a class="panel-block"><span class="tag">Unavaliable</span></a>`);
        $("#workflow-details-steps").html(`<a class="panel-block"><span class="tag">Unavaliable</span></a>`);
        $("#workflow-details-main").slideDown();
        $("#workflow-details-run").toggleClass("is-loading is-rounded is-dark p-0", false);
        $("#workflow-details-run").prop("disabled", true);
        return;
    }
    selected_workflow_name = data_["name"];
    selected_workflow_desc = data_["desc"];
    selected_workflow_id = data_["id"];
    selected_workflow_inputs = data_["inputs"];
    selected_workflow_outputs = data_["outputs"];
    selected_workflow_steps = data_["blocks"];

    $("#workflow-details-desc").html(selected_workflow_desc);
    var _abbr_workflow_name = selected_workflow_name;
    if (_abbr_workflow_name.length > 10) {
        _abbr_workflow_name = _abbr_workflow_name.slice(0, 12)+"...";
    }
    $("#workflow-details-name").html(_abbr_workflow_name);
    $("#workflow-details-steps").html(build_steps(selected_workflow_steps));
    $("#workflow-details-inputs").html(build_io_blocks(selected_workflow_inputs));
    $("#workflow-details-outputs").html(build_io_blocks(selected_workflow_outputs));
    
    $("#workflow-details-main").slideDown();
    $("#workflow-details-run").toggleClass("is-loading is-rounded is-dark p-0", false);
    $("#workflow-details-run").toggleClass("has-text-primary-dark is-success", true);
    $("#workflow-details-run").prop("disabled", false);
};
var get_columns = function() {
    var column_names = [];
    for (let col in table.getColumns()) {
        column_names.push(table.getColumns()[col].getField());
    }
    return column_names
}
var build_io_block = function(io_name, io_info, _columns) {
    var context = "";
    context += `<a class="panel-block">`;
    context += `<div class="content">`;
    if (!_columns.includes(io_name)) {
        context += `<button class="button is-small is-rounded is-link" onclick="add_col('${io_name}', '${io_info["meta"]}', '${io_info["type_id"]}');"><span class="icon is-small"><i class="fa-solid fa-plus"></i></span></button> &nbsp`;
    }
    else {context += `<span class="icon is-small has-text-success"><i class="fa-solid fa-check"></i></span> &nbsp;`;}
    // context += `<span class="icon"><i class="fa-brands fa-unity"></i></span>`;
    if (io_info["optional"]) {context += `<span class="tag is-rounded">Optional</span>`;}
    else {context += `<span class="tag is-rounded is-success">Required</span>`;}
    context += `&nbsp;<b>${ io_name }</b>`;
    context += `<br>`;
    context += `<span class="tag">${ io_info["meta"] }</span>&nbsp;${ io_info["name"] }`;
    context += `<p>`;
    if (io_info["optional"]) {context += `= ${ io_info["default"] }<br>`;}
    context += `[${ io_info["type_desc"] }] ${ io_info["desc"] }`;
    context += `</p></div></a>`;
    return context;
};
var build_io_blocks = function(ios) {
    var _columns = get_columns();
    var context = "";
    for (var io_name in ios) {
        context += build_io_block(io_name, ios[io_name], _columns);
    }
    return context;
};
var build_step = function(step_name) {
    context = "";
    context += `<a class="panel-block">`;
    context += `<span class="icon"><i class="fa-solid fa-bars-progress"></i></span>&nbsp`;
    context += step_name
    context += `</a>`;
    return context;
};
var build_steps = function(steps) {
    context = "";
    for (var i in steps) {
        context += build_step(steps[i]);
    }
    return context
};
var TASK_SUBMITTING = false;
var run_workflow = function() {
    if (TASK_SUBMITTING == false){
        url = build_url(PROJECT_ID, "workflow");
        $("#workflow-details-run").toggleClass("is-loading is-ghost", true);
        TASK_SUBMITTING = true;
        POST(run_workflow_response, url,
            {"workflow": selected_workflow_id,
            "csrfmiddlewaretoken": CSRF_TOKEN});
    }
};
var run_workflow_response = function(status_code, body, header) {
    load_history(PROJECT_ID);
    setTimeout(() => {
        $("#workflow-details-run").toggleClass("is-loading is-ghost", false);
        TASK_SUBMITTING = false;
    }, 2000);
};

var update_history_page = function(next) {
    if (next) {
        history_page_offset += history_page_limit;
        if (history_page_offset >= total_history_items) {history_page_offset = total_history_items - (total_history_items % history_page_limit)}
        console.log(history_page_offset)
    } else {
        history_page_offset -= history_page_limit;
        if (history_page_offset <= 0){ history_page_offset = 0;}
    }
    load_history(PROJECT_ID);
}

var history_page_offset = 0;
var history_page_limit = 5;
var LOAD_HISTORY_RUNNING = false;
var load_history = function(project_id) {
    LOAD_HISTORY_RUNNING = true;
    url = build_url(project_id, "history");
    GET(load_history_response, url, {offset:history_page_offset, limit:history_page_limit});
    
};
var HAS_TASK_RUNNING = false;
var total_history_items = 0;
var load_history_response = function(status_code, body, header) {
    var data = JSON.parse(body);
    var histories_ = data['history'];
    var content = "";
    total_history_items = data['total'];
    _need_reload_table = ((HAS_TASK_RUNNING == true) && (data['running'] == false))
    HAS_TASK_RUNNING = data['running'];
    _current_page = Math.ceil(history_page_offset/history_page_limit)+1;
    _total_page = Math.ceil(total_history_items/history_page_limit);
    $("#history-current-page").html(`${ _current_page }&nbsp;/&nbsp;${ _total_page }`);
    for (var history_id in histories_) {
        var history_ = histories_[history_id];
        var status_content = "";
        var delete_button = "";
        if (history_["status"] == "done") {
            status_content = `
                <span class="panel-icon has-text-success">
                    <i class="fa-solid fa-check"></i>
                </span>
            `;
            delete_button = `
            <button class="button is-danger is-small has-text-danger-light" onclick="delete_history('${ history_["id"] }');">
                <i class="fa-solid fa-trash"></i>
            </button> 
            `;
        } else if (history_["status"] == "running") {
            status_content = `
                <span class="panel-icon has-text-warning">
                    <i class="fa-solid fa-person-running"></i>
                </span>
            `;
            delete_button = `
            <button class="button is-warning is-small has-text-warning-light" onclick="delete_history('${ history_["id"] }');">
                <i class="fa-solid fa-stop"></i>
            </button> 
            `;
        } else if (history_["status"] == "initialized") {
            status_content = `
                <span class="panel-icon has-text-grey">
                    <i class="fa-regular fa-hourglass-half"></i>
                </span>
            `;
            delete_button = `
            <button class="button is-warning is-small has-text-warning-light" onclick="delete_history('${ history_["id"] }');">
                <i class="fa-solid fa-stop"></i>
            </button> 
            `;
        }
        else {
            status_content = `
                <span class="panel-icon has-text-danger">
                    <i class="fa-solid fa-ban"></i>
                </span>
            `;
            delete_button = `
            <button class="button is-danger is-small has-text-danger-light" onclick="delete_history('${ history_["id"] }');">
                <i class="fa-solid fa-trash"></i>
            </button> 
            `;
        }
        content += `
        <a class="panel-block">
            ${ status_content }
            <div class="content">
                <b>${ history_["workflow"] }</b> <br>
                ${ delete_button }
                ${ history_["progress"] } <br>
                <span class="has-text-grey">${ history_["create_time"] } </span>
                
            </div>
        </a>
        `;
    }
    if (HAS_TASK_RUNNING) {
        $("#history-details-run").toggleClass("is-loading is-warning", true);
        $("#history-details-run").toggleClass("is-success", false);
    } else {
        $("#history-details-run").toggleClass("is-loading is-warning", false);
        $("#history-details-run").toggleClass("is-success", true);
    }
    $("#history-details-main").html(content);
    LOAD_HISTORY_RUNNING = false;
    if (_need_reload_table) {load_table_data(PROJECT_ID);}
    load_history_done = true;
};

var delete_history = function(history_id) {
    var url = build_url(PROJECT_ID, `history/${history_id}/del`);
    POST(delete_history_response, url,
        {"csrfmiddlewaretoken": CSRF_TOKEN});
};
var delete_history_response = function(status_code, body, header) {
    load_history(PROJECT_ID);
};

var start_manage_resource = function() {
    load_all_resources(PROJECT_ID);
    $("#add-resource").toggleClass("is-active", true);
};
var end_manage_resource = function() {
    $("#add-resource").toggleClass("is-active", false);
};

var all_resources_data = [];
var all_resources_total = 0;
var all_resources_limit = 4;
var all_resources_offset = 0;
var load_all_resources = function(project_id) {
    var url = build_url(project_id, `resources`);
    GET(load_all_resources_response, url, {});
};
var load_all_resources_response = function(status_code, body, header) {
    var data = JSON.parse(body);
    all_resources_data = data["resources"];
    all_resources_total = all_resources_data.length;
    update_all_resources_page();
};
var add_one_resource = function(resource_id) {
    url = build_url(PROJECT_ID, 'resources/add');
    POST(add_one_resource_response, url,
        {"resource": resource_id,
        "csrfmiddlewaretoken": CSRF_TOKEN});
};
var add_one_resource_response = function(status_code, body, header) {
    load_project_info(PROJECT_ID);
    setTimeout(function(){
        load_all_resources(PROJECT_ID);
    }, 100);
};
var del_one_resource = function(resource_id) {
    $("#workflow-details").hide();
    url = build_url(PROJECT_ID, 'resources/del');
    POST(del_one_resource_response, url,
        {"resource": resource_id,
        "csrfmiddlewaretoken": CSRF_TOKEN});
};
var del_one_resource_response = function(status_code, body, header) {
    load_project_info(PROJECT_ID);
    setTimeout(function(){
        load_all_resources(PROJECT_ID);
    }, 100);
};
var switch_resource_page = function(next=true) {
    if (next) {
        all_resources_offset += all_resources_limit;
        if (all_resources_offset >= all_resources_total) {all_resources_offset = all_resources_total - (all_resources_total % all_resources_limit)}
    } else {
        all_resources_offset -= all_resources_limit;
        if (all_resources_offset <= 0){ all_resources_offset = 0;}
    }
}
var update_all_resources_page = function() {
    var content = "";
    var added_resources = [];
    for (var resource of project_resources) {
        added_resources.push(resource["id"]);
    }
    var frag_resource_data = all_resources_data.slice(all_resources_offset, all_resources_offset+all_resources_limit);
    for (var resource of frag_resource_data) {
        var _button = "";
        if (added_resources.indexOf(resource["id"]) == -1) {
            _button = `<button class="button pl-2 pr-2 has-text-primary-dark" onclick="add_one_resource('${ resource["id"] }');"><i class="fa-solid fa-square-plus"></i></button>`
        } else {
            _button = `<button class="button pl-2 pr-2 has-text-danger" onclick="del_one_resource('${ resource["id"] }');"><i class="fa-solid fa-square-minus"></i></button>`
        }
        content += `
        <div class="cell">
            <div class="card">
                <div class="card-content">
                    <div class="content">
                        <p class="title is-6">
                        <i class="fa-solid fa-server"></i>
                        ${ resource["host"] }
                        </p>
                        <p>
                            ${ resource["access"] }
                        </p>
                        ${ _button }
                    </div>
                </div>
            </div>
        </div>
        `
    }
    $("#add-resource-list").html(content);
    _current_page = Math.ceil(all_resources_offset/all_resources_limit)+1;
    _total_page = Math.ceil(all_resources_total/all_resources_limit);
    $("#all-resource-page").html(`${ _current_page }/${ _total_page }`);
};

var all_tool_total = 0;
var all_tool_limit = 4;
var all_tool_offset = 0;
var all_tool_data = [];
var load_all_tools = function(project_id) {
    url = build_url(project_id, `workflow/all`);
    GET(load_all_tools_response, url,
        {"limit": all_tool_limit,
         "offset": all_tool_offset
        });
};
var load_all_tools_response = function(status_code, body, header) {
    var data = JSON.parse(body);
    all_tool_total = data["total"];
    all_tool_data = data["workflows"];
    content = "";
    for (var tool of all_tool_data) {
        var _button = "";
        if (tool["id"] in project_workflows == false) {
            _button = `<button class="button pl-2 pr-2 has-text-primary-dark" onclick="add_one_tool('${ tool["id"] }');"><i class="fa-solid fa-square-plus"></i></button>`
        } else {
            _button = `<button class="button pl-2 pr-2 has-text-danger" onclick="del_one_tool('${ tool["id"] }');"><i class="fa-solid fa-square-minus"></i></button>`
        }
        content += `
        <div class="cell">
            <div class="card">
                <div class="card-content">
                    <div class="content">
                        <p class="title is-6">
                        <i class="fas fa-code-branch"></i>
                        ${ tool["name"] }
                        </p>
                        <p>
                            ${ tool["desc"] }
                        </p>
                        ${ _button }
                    </div>
                </div>
            </div>
        </div>
        `
    }
    $("#add-tool-list").html(content);
    _current_page = Math.ceil(all_tool_offset/all_tool_limit)+1;
    _total_page = Math.ceil(all_tool_total/all_tool_limit);
    $("#all-tools-current-page").html(`${ _current_page }/${ _total_page }`);
};
var update_all_tools_page = function(next) {
    if (next) {
        all_tool_offset += all_tool_limit;
        if (all_tool_offset >= all_tool_total) {all_tool_offset = all_tool_total - (all_tool_total % all_tool_limit)}
    } else {
        all_tool_offset -= all_tool_limit;
        if (all_tool_offset <= 0){ all_tool_offset = 0;}
    }
    load_all_tools(PROJECT_ID);
};
var add_all_tools_opened = false;
var start_add_all_tools = function() {
    $("#add-tool").toggleClass("is-active", true);
    add_all_tools_opened = true;
    load_all_tools(PROJECT_ID);
};
var end_add_all_tools = function() {
    $("#add-tool").toggleClass("is-active", false);
    add_all_tools_opened = false;
};

var add_one_tool = function(tool_id) {
    url = build_url(PROJECT_ID, "workflow/add");
    POST(add_one_tool_response, url,
        {"workflow": tool_id,
        "csrfmiddlewaretoken": CSRF_TOKEN});
};
var add_one_tool_response = function(status_code, body, header) {
    load_project_info(PROJECT_ID);
};

var del_one_tool = function(tool_id) {
    url = build_url(PROJECT_ID, "workflow/del");
    POST(del_one_tool_response, url,
        {"workflow": tool_id,
        "csrfmiddlewaretoken": CSRF_TOKEN});
};
var del_one_tool_response = function(status_code, body, header) {
    load_project_info(PROJECT_ID);
    
};

var start_del_project = function() {
    $("#del-project").toggleClass("is-active", true);
};
var ends_del_project = function() {
    $("#del-project").toggleClass("is-active", false);
};

var refresh_table = function () {
    $("#refresh-table-button").toggleClass("button is-loading is-ghost", true);
    load_table_data(PROJECT_ID);
    load_project_info(PROJECT_ID);
    setTimeout(function(){$("#refresh-table-button").toggleClass("button is-loading is-ghost", false);}, 1000);
};

var start_download = function () {
    $("#download-button").toggleClass("button is-loading", true);
    var _options = '<option></option>';
    for (var col of table_columns_global){
        _options += `<option>${ col }</option>`;
    }
    $("#download-name").val(project_name);
    $("#download-col-index").html(_options);
    $("#download-project").toggleClass("is-active", true);
};
var end_download = function () {
    $("#download-project").toggleClass("is-active", false);
    $("#download-button").toggleClass("button is-loading", false);
}

var back_to_dashboard = function () {
    var _url = REQUEST_HOST+"projects/";
    window.location.href = _url.slice(0, _url.length-1);
};

var page_updater = function() {
    if (HAS_TASK_RUNNING==false && LOAD_UNIT_RUNNING==false && LOAD_HISTORY_RUNNING==false) {
        $("#table-status-text").html("ready");
        $("#table-status-icon").toggleClass("has-text-link", false);
        $("#table-status-icon").toggleClass("has-text-success", true);
        $("#table-status-icon").html(`<i class="fa-regular fa-circle-check"></i>`);
    } else {
        load_history(PROJECT_ID);
        $("#table-status-text").html("working");
        $("#table-status-icon").toggleClass("has-text-link", true);
        $("#table-status-icon").toggleClass("has-text-success", false);
        $("#table-status-icon").html(`<i class="fa-solid fa-sync fa-spin"></i>`);
    }
    if (load_ready_table_done && load_project_info_done && load_history_done) {
        $("#load-project").toggleClass("is-active", false);
    }
    if (load_ready_table_done) {$("#load-table-data").toggleClass("is-success", true);}
    if (load_project_info_done) {$("#load-proj-info").toggleClass("is-success", true);}
    if (load_history_done) {$("#load-jobs-history").toggleClass("is-success", true);}

    if (selected_col == null || selected_row == null) {
        $('#data-unit-update-button').prop('disabled', true);
        $('#data-unit-uploader').prop('disabled', true);
        $('#editor').prop('disabled', true);
    } else {
        $('#data-unit-update-button').prop('disabled', false);
        $('#data-unit-uploader').prop('disabled', false);
        $('#editor').prop('disabled', false);
    }
};

var load_ready_table_done = false;
var load_project_info_done = false;
var load_history_done = false;
$(document).ready(function(){
   
    main_panels = ["main-table", "main-settings"];
    $("#tab-main-table").click(function(){switch_tab_panel("main-table", main_panels)});
    $("#tab-main-settings").click(function(){switch_tab_panel("main-settings", main_panels)});

    workflow_panels = ["workflow-details-intro", "workflow-details-inputs", "workflow-details-outputs"];
    $("#tab-workflow-details-intro").click(function(){switch_tab_panel("workflow-details-intro", workflow_panels)});
    $("#tab-workflow-details-inputs").click(function(){switch_tab_panel("workflow-details-inputs", workflow_panels)});
    $("#tab-workflow-details-outputs").click(function(){switch_tab_panel("workflow-details-outputs", workflow_panels)});

    unit_data_panels = ["unit-data-editor", "unit-data-visual"];
    $("#tab-unit-data-editor").click(function(){switch_tab_panel("unit-data-editor", unit_data_panels)});
    $("#tab-unit-data-visual").click(function(){switch_tab_panel("unit-data-visual", unit_data_panels)});

    load_table_data(PROJECT_ID);
    load_project_info(PROJECT_ID);
    load_history(PROJECT_ID);

    $('#data-unit-uploader').change(function(){upload_single_file("data-unit-uploader");});
    $('#batch-file-uploader').change(function(){upload_mutiple_file("batch-file-uploader");});

    setInterval(page_updater, 1000);
});