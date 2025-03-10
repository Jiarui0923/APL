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

var build_url = function(workflow_id, entry) {
    return REQUEST_HOST+"workflows/"+workflow_id+"/"+entry+"/";
};
var build_project_url = function(project_id, entry) {
    return REQUEST_HOST+"projects/"+project_id+"/"+entry+"/";
};

var workflow_name = null;
var workflow_desc = null;
var load_workflow_info = function(workflow_id) {
    url = build_url(workflow_id, "info");
    GET(load_workflow_info_response, url, {});
};
var load_workflow_info_response = function(status_code, body, header) {
    var data_ = JSON.parse(body);
    workflow_name = data_["name"];
    workflow_desc = data_["desc"];
    $("[id=tool-name]").html(data_["name"]);
    $("#tool-desc").html(data_["desc"]);
};

var workflow_inputs_optional = [];
var workflow_inputs_required = [];
var workflow_outputs = [];
var workflow_blocks = [];
var load_workflow_table = function(workflow_id) {
    url = build_url(workflow_id, `blocks`);
    GET(load_workflow_table_response, url, {});

};
var load_workflow_table_response = function(status_code, body, header) {
    var data_ = JSON.parse(body);
    workflow_inputs_optional = data_["optional_inputs"];
    workflow_inputs_required = data_["required_inputs"];
    workflow_outputs = data_["outputs"];
    workflow_blocks = data_["blocks"];

    $("#algorithm-configs").html(render_workflow_blocks(workflow_blocks));
};
var render_workflow_block = function(order, name) {
    var _content = "";
    _content = `
    <span class="tag"><b>${ order }</b></span> ${ name }
    `;
    return _content
};
var render_workflow_blocks = function(blocks) {
    var _content = "";
    for (var order in blocks) {
        var _block = blocks[order];
        _content += `<li><a onclick="switch_optional_setting(${ order });">${render_workflow_block(order, _block["id"])}</a></li>`
    }  
    return _content;
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
    url = build_project_url(PROJECT_ID, "upload/files");
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
        url = build_project_url(PROJECT_ID, "upload/table");
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
    var _columns = table_columns;
    var _columns_names = [];
    var _options = "";
    for (var _col of _columns) {
        _col_name = _col;
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
    var _columns = table_columns;
    var _columns_names = [];
    var _options = "";
    for (var _col of _columns) {
        _col_name = _col;
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
    url = build_project_url(project_id, "info");
    GET(load_project_info_response, url, {});
};

var project_name = "Project";
var project_desc = "Project Description";
var load_project_info_response = function(status_code, body, header) {
    var data_ = JSON.parse(body);
    project_name = data_["name"];
    project_desc = data_["desc"];

    $("#settings-project-name").val(project_name);
    $("#settings-project-description").val(project_desc);
};

var update_project_info = function () {
    url = build_project_url(PROJECT_ID, "info");
    POST(update_project_info_response, url,
        {'name': $("#settings-project-name").val(),
        'desc': $("#settings-project-description").val(),
        "csrfmiddlewaretoken": CSRF_TOKEN});
};
var update_project_info_response = function(status_code, body, header) {
    load_project_info(PROJECT_ID);
};

var create_project_by_workflow = function (_name, _desc) {
    url = build_url(WORKFLOW_ID, "start/create");
    POST(create_project_by_workflow_response, url,
        {'name': $("#settings-project-name").val(),
        'desc': $("#settings-project-description").val(),
        "csrfmiddlewaretoken": CSRF_TOKEN});
};
var create_project_by_workflow_response = function(status_code, body, header) {
    var _data = JSON.parse(body);
    if("status" in _data) {
        $("#workflow-unavailable-info").html(_data["message"]);
        $("#load-project").toggleClass("is-active", false);
        $("#workflow-unavailable").toggleClass("is-active", true);
        return;
    }
    PROJECT_ID = _data["project"];
    $("#settings-project-next").toggleClass("is-loading", false);
    setTimeout(switch_required_parameters, 100);
};

var load_table_data = function(project_id) {
    url = build_project_url(project_id, "table");
    GET(load_table_data_response, url, {});
};
var table_data = null;
var table_columns = null;
var load_table_data_response = function(status_code, body, header) {
    var data_ = JSON.parse(body);
    var table_ = data_["table"];
    table_data = table_;
    var columns_ = data_["columns"];
    table_columns = columns_;
    var _column_content = `<th>id</th>`;
    for (var _column of columns_) {
        _column_content += `<td>${ _column }</td>`;
    }
    _column_content += `<th>Edit</th><th>Drop</th>`;
    _column_content = `<tr>${ _column_content }</tr>`
    $("#data-table-header").html(_column_content);
    var _table_content = ``;
    var incomplete = false;
    var incomplete_reason = "table";
    for (var id in table_) {
        var _row  = table_[id];
        var _unit_content = `<td> ${id} </td>`;
        for (var _column of columns_) {
            if (_column in _row) {
                _unit_content += `<td>${ _row[_column] }</td>`;
            } else {
                _unit_content += `<td></td>`;
                if (_column in workflow_inputs_required) {
                    incomplete = true;
                    incomplete_reason = _column;
                }
            }
        }
        _unit_content += `<td><abbr title="Edit this"><button class="button is-link is-outlined pl-2 pr-2" onclick="start_edit_row(${ id });"><i class="fa-solid fa-pen-to-square"></i></button></abbr></td>`;
        _unit_content += `<td><abbr title="Drop this"><button class="button is-danger is-outlined pl-2 pr-2" onclick="delete_row(${ id });"><i class="fa-solid fa-trash"></i></button></abbr></td>`;
        _table_content += `<tr> ${ _unit_content } </tr>`;
        $("#data-table-main").html(_table_content);
    }
    incomplete = (incomplete || table_.length <= 0);
    if (incomplete) {
        $("#card-required-paramters-next").prop("disabled",true);
        $("#card-required-paramters-next").html(`incomplete ${ incomplete_reason } &nbsp;<i class="fa-solid fa-triangle-exclamation"></i>`);
        $("#tab-card-start-computing").hide();
        $("#algorithm-configs-title").hide();
        $("#algorithm-configs").hide();
    } else {
        $("#card-required-paramters-next").prop("disabled",false);
        $("#card-required-paramters-next").html(`continue&nbsp;<i class="fa-solid fa-arrow-right"></i>`);
    }
};

var ends_edit_row = function () {
    $("#edit-row").toggleClass("is-active", false);
};
var edit_option = "edit";
var edit_row = null;
var edit_columns_list = [];
var start_edit_row = function (row=null) {
    if (row == null) {
        $("#edit-row-title").html("Add Row");
        var _context = "";
        var _id = 0;
        edit_columns_list = [];
        for (var key of table_columns) {
            _context += `
            <tr>
                <td>${_id}</td>
                <td>${key}</td>
                <td><input class="input" type="text" placeholder=""/></td>
            </tr>
            `;
            edit_columns_list.push(key);
        }
        $("#edit-row-table").html(_context);
        edit_option = "add";
        edit_row = row;
    }
    else {
        $("#edit-row-title").html(`Edit Row ${row}`);
        var _row_data = table_data[row];
        var _context = "";
        var _id = 0;
        for (var key in _row_data) {
            _id += 1;
            _context += `
            <tr>
                <td>${_id}</td>
                <td>${key}</td>
                <td><input class="input" type="text" placeholder="" value="${_row_data[key]}"/></td>
            </tr>
            `;
        }
        $("#edit-row-table").html(_context);
        edit_option = "edit";
        edit_row = row;
    }
    $("#edit-row").toggleClass("is-active", true);
};
var fetch_edit_table_data = function() {
    var _updated_data = $("#edit-row-table").find(":input").map(function(){return this.value}).get();
    var _id = 0;
    var _data = {};
    for (var key of edit_columns_list) {
        if (edit_row == null) { _data[key] = _updated_data[_id]; }
        else {
            if (table_data[edit_row][key] != _updated_data[_id]) {
                _data[key] = _updated_data[_id];
            }
        } 
        _id += 1;
    }
    return _data;
}
var update_table_row = function () {
    console.log(edit_option, edit_row);
    $("#edit-row-save").toggleClass("is-loading", true);
    var _data = fetch_edit_table_data();
    _data = JSON.stringify(_data);
    url = build_project_url(PROJECT_ID, "table");
    if (edit_row != null) {
        POST(update_table_row_response, url, {"row":edit_row, "dict":_data, "csrfmiddlewaretoken": CSRF_TOKEN});
    } else {
        POST(update_table_row_response, url, {"dict":_data, "csrfmiddlewaretoken": CSRF_TOKEN});
    }
};
var update_table_row_response = function (status_code, body, header) {

    load_table_data(PROJECT_ID);
    ends_edit_row();
    $("#edit-row-save").toggleClass("is-loading", false);
}

var delete_row = function (row) {
    url = build_project_url(PROJECT_ID, "table/row/del");
    if (row != null) {
        POST(del_row_response, url, {"row":row, "csrfmiddlewaretoken": CSRF_TOKEN});
    }
};
var del_row_response = function(status_code, body, header) {
    load_table_data(PROJECT_ID);
};

function extractOptions(regexString) {
    if (regexString == null) {return null;}
    // Validate input format: must contain either '|' or be enclosed in parentheses
    const isValidFormat = /^\(([\w\+\-]+(?:\|[\w\+\-]+)*)\)$|^[\w\+\-]+(?:\|[\w\+\-]+)*$/;
    if (!isValidFormat.test(regexString)) {
        return null; // Return null if input is not valid
    }
    const pattern = /\(([^)]+)\)|([^|()]+)/g; // Matches either groups in parentheses or standalone options
    let match;
    const options = [];
    
    while ((match = pattern.exec(regexString)) !== null) {
        if (match[1]) {
            // If matched a group in parentheses
            options.push(...match[1].split('|'));
        } else if (match[2]) {
            // If matched a standalone option
            options.push(match[2]);
        }
    }
    return options.length > 0 ? options : null; // Return null if no valid options were found
}

var selected_tool_name = null;
var selected_tool_desc = null;
var selected_tool_inputs = [];
var selected_tool_outputs = [];
var selected_tool_id = null;
var view_tool = function(tool_id) {
    url = build_url(WORKFLOW_ID, `tools/${ tool_id }`);
    GET(view_tool_response, url, {});
};
var optional_inputs_columns = [];
var view_tool_response = function(status_code, body, header) {
    var data_ = JSON.parse(body);
    selected_tool_name = data_["name"];
    selected_tool_desc = data_["desc"];
    selected_tool_id = data_["id"];
    selected_tool_inputs = data_["inputs"];
    selected_tool_outputs = data_["outputs"];
    $("#optional-setting-name").html(selected_tool_name);
    $("#optional-setting-desc").html(selected_tool_desc);
    var _content = "";
    var _optional_inputs = [];
    for (var input_name in selected_tool_inputs) {
        var input = selected_tool_inputs[input_name];
        if(input["optional"]) {
            _optional_inputs.push(input_name);
            var _val = input["default"];
            if (table_columns.indexOf(input_name) != -1) {_val = table_data[0][input_name]}
            if (input["meta"] == "string") {
                var _options = extractOptions(input["condition"]);
                if (_options == null) {
                    _content += `
                        <tr>
                            <th>${input_name}</th>
                            <td><span class="tag">${input["meta"]}</span><span class="tag is-success">${input["name"]}</span></td>
                            <td><input class="input" type="text" placeholder="${_val}"></td>
                            <td>${input["type_desc"]}. ${input["desc"]}</td>
                        </tr>
                        `;
                } else {
                    _option_content = `<option>${ _val }</option>`;
                    for (var option of _options) {
                        if (option != _val) {_option_content += `<option>${ option }</option>`;}
                    }
                    _content += `
                        <tr>
                            <th>${input_name}</th>
                            <td><span class="tag">${input["meta"]}</span><span class="tag is-success">${input["name"]}</span></td>
                            <td><span class="select"><select>${ _option_content }</select></span></td>
                            <td>${input["type_desc"]}. ${input["desc"]}</td>
                        </tr>
                    `;
                }
            } else {
                _content += `
                <tr>
                    <th>${input_name}</th>
                    <td><span class="tag">${input["meta"]}</span><span class="tag is-success">${input["name"]}</span></td>
                    <td><input class="input" type="text" placeholder="${_val}"></td>
                    <td>${input["type_desc"]}. ${input["desc"]}</td>
                </tr>
                `;
            }
            
        }
    }
    optional_inputs_columns = _optional_inputs;
    $("#optional-setting-params").html(_content);
    $("#card-optional-setting").slideDown();
};

var _update_data_cols = 0;
var _updated_col_count = 0;
var update_optional_settings = function () {
    var _values = $("#optional-param-table").find(":input").map(function(){
        return this.value;
    }).get();
    var _update_dict = {};
    for (var i in _values) {
        if (_values[i].length > 0) {
            _update_dict[optional_inputs_columns[i]] = _values[i];
        }
    }
    if (Object.keys(_update_dict).length > 0) {
        $("#optional-settings-update").toggleClass("is-loading", true);
        edit_table_data(_update_dict);
    }
};
var edit_table_data = function(_update_dict) {
    url = build_project_url(PROJECT_ID, "table");
    
    var edit_table_data_response = function(status_code, body, header) {
        _updated_col_count += 1;
        if (_updated_col_count >= _update_data_cols) {
            load_table_data(PROJECT_ID);
            view_tool(selected_tool_id);
            $("#optional-settings-update").toggleClass("is-loading", false);
        }
        
    };
    POST(edit_table_data_response, url,
        {'row': ":",
        'dict': JSON.stringify(_update_dict),
        "csrfmiddlewaretoken": CSRF_TOKEN});
};

var run_workflow = function() {
    var url = build_project_url(PROJECT_ID, "workflow");
    $("#task-submitting").toggleClass("is-active", true);
    POST(run_workflow_response, url,
        {"workflow": WORKFLOW_ID,
        "csrfmiddlewaretoken": CSRF_TOKEN});
};
var run_workflow_response = function(status_code, body, header) {
    setTimeout(() => {
        var _url = build_project_url(PROJECT_ID, '');
        window.location.href = _url.slice(0, _url.length-1);
    }, 2000);
};


var switch_card_intro = function(){
    $("#card-optional-setting").hide();
    switch_tab_panel("card-introduction", guide_panels);
};
var switch_project_set = function(){
    $("#card-optional-setting").hide();
    if (PROJECT_ID == null) {
        $("#settings-project-name").val(workflow_name);
        $("#settings-project-description").val(workflow_desc);
    }
    switch_tab_panel("card-project-set", guide_panels);
};
var switch_required_parameters = function(){
    $("#card-optional-setting").hide();
    if (PROJECT_ID != null) {
        $("#tab-card-required-paramters").slideDown();
        update_project_info(PROJECT_ID);
        load_table_data(PROJECT_ID);
        switch_tab_panel("card-required-paramters", guide_panels);
    } else {
        $("#settings-project-next").toggleClass("is-loading", true);
        var _name = $("#settings-project-name").val();
        var _desc = $("#settings-project-description").val();
        create_project_by_workflow(_name, _desc);
    }
};
var switch_start_computing = function(){
    $("#tab-card-start-computing").slideDown();
    $("#algorithm-configs-title").slideDown();
    $("#algorithm-configs").slideDown();
    switch_tab_panel("card-start-computing", guide_panels);
};
var switch_optional_setting = function(option_id) {
    $("#algorithm-configs a").toggleClass("is-active", false);
    $(`#algorithm-configs a:eq(${option_id})`).toggleClass("is-active", true);
    
    var _block = workflow_blocks[option_id];
    view_tool(_block["id"]);
};


$(document).ready(function(){
    $("#tab-card-required-paramters").hide();
    $("#tab-card-start-computing").hide();
    $("#algorithm-configs-title").hide();
    $("#algorithm-configs").hide();
    load_workflow_info(WORKFLOW_ID);
    load_workflow_table(WORKFLOW_ID);
    $('#batch-file-uploader').change(function(){upload_mutiple_file("batch-file-uploader");});

    guide_panels = ["card-introduction", "card-project-set", "card-required-paramters", "card-start-computing"];
    $("#tab-card-introduction").click(switch_card_intro);
    $("#tab-card-project-set").click(switch_project_set);
    $("#tab-card-required-paramters").click(switch_required_parameters);
    $("#tab-card-start-computing").click(switch_start_computing);
});