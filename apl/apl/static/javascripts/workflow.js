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

var load_workflow_info = function(workflow_id) {
    url = build_url(workflow_id, "info");
    GET(load_workflow_info_response, url, {});
};
var load_workflow_info_response = function(status_code, body, header) {
    var data_ = JSON.parse(body);
    $("#workflow-title").html(data_["name"]);
    $("#workflow-settings-name").val(data_["name"]);
    $("#workflow-settings-desc").val(data_["desc"]);
};

var update_workflow_info = function() {
    url = build_url(WORKFLOW_ID, "info");
    POST(update_workflow_info_response, url, {
        "csrfmiddlewaretoken": CSRF_TOKEN,
        "name": $("#workflow-settings-name").val(),
        "desc": $("#workflow-settings-desc").val()
    });
};
var update_workflow_info_response = function(status_code, body, header) {
    load_workflow_info(WORKFLOW_ID);
};

var toolkits = [];
var toolkits_offset = 0;
var toolkits_limit = 5;
var load_toolkits = function(workflow_id) {
    url = build_url(workflow_id, "toolkits");
    GET(load_toolkits_response, url, {});
};
var load_toolkits_response = function(status_code, body, header) {
    var data_ = JSON.parse(body);
    toolkits = data_["algorithms"];
    set_toolkits();
};
var set_toolkits = function() {
    var _current_page = Math.ceil(toolkits_offset/toolkits_limit)+1;
    var _total_page = Math.ceil(toolkits.length/toolkits_limit);
    var content = "";
    for (var tool_id = toolkits_offset; tool_id < toolkits_offset+toolkits_limit && tool_id < toolkits.length; tool_id++) {
        content += `
        <a class="panel-block" onclick="view_tool(${ tool_id });">
            <span class="panel-icon">
                <i class="fa-brands fa-hive"></i>
            </span>
            &nbsp;${ toolkits[tool_id] }
        </a>
        `
    }
    $("#tools-list").html(content);
    $("#toolkits-current-page").html(`${ _current_page }/${ _total_page }`)
};
var next_toolkits_page = function (next=true) {
    if (next) {
        toolkits_offset += toolkits_limit;
        if (toolkits_offset >= toolkits.length) {toolkits_offset = toolkits.length - (toolkits.length % toolkits_limit)}
    } else {
        toolkits_offset -= toolkits_limit;
        if (toolkits_offset <= 0){ toolkits_offset = 0;}
    }
    set_toolkits();
};

var selected_tool_name = null;
var selected_tool_desc = null;
var selected_tool_inputs = [];
var selected_tool_outputs = [];
var selected_tool_id = null;
var view_tool = function(tool_id) {
    $("#tool-details").hide();
    url = build_url(WORKFLOW_ID, `tools/${ toolkits[tool_id] }`);
    GET(view_tool_response, url, {});
};
var view_tool_response = function(status_code, body, header) {
    var data_ = JSON.parse(body);
    selected_tool_name = data_["name"];
    selected_tool_desc = data_["desc"];
    selected_tool_id = data_["id"];
    selected_tool_inputs = data_["inputs"];
    selected_tool_outputs = data_["outputs"];
    $("#tool-details-id").html(selected_tool_id);
    $("#tool-details-desc").html(selected_tool_desc);
    $("#tool-details-name").html(selected_tool_name);
    $("#tool-details-inputs").html(build_io_blocks(data_["inputs"], "input"));
    $("#tool-details-outputs").html(build_io_blocks(data_["outputs"], "output"));
    
    $("#tool-details").slideDown();
};

var build_io_block = function(io_name, io_info, type="input") {
    var context = "";
    context += `<a class="panel-block">`;
    context += `<div class="content">`;
    // context += `<span class="icon"><i class="fa-brands fa-unity"></i></span>`;
    if (io_info["optional"]) {context += `<span class="tag">optional</span>`;}
    else {
        if (type == "input") {
            context += `<span class="tag is-warning">required</span>`;
        } else {
            context += `<span class="tag is-success">output</span>`;
        }
    }
    context += `&nbsp;<b>${ io_name }</b>`;
    context += `<br>`;
    context += `<span class="tag">${ io_info["meta"] }</span>&nbsp;${ io_info["name"] }`;
    context += `<p>`;
    if (io_info["optional"]) {context += `= ${ io_info["default"] }<br>`;}
    context += `${ io_info["desc"] }`;
    context += `</p></div></a>`;
    return context;
};
var build_io_blocks = function(ios, type="input") {
    var context = "";
    for (var io_name in ios) {
        context += build_io_block(io_name, ios[io_name], type);
    }
    return context;
};

var workflow_inputs_optional = [];
var workflow_inputs_required = [];
var workflow_outputs = [];
var workflow_blocks = [];
var workflow_columns = [];
var load_workflow_table = function(workflow_id) {
    url = build_url(workflow_id, `blocks`);
    GET(load_workflow_table_response, url, {});

};
var load_workflow_table_response = function(status_code, body, header) {
    var data_ = JSON.parse(body);
    if ('status' in data_) {
        $("#workflow-unavailable-info").html(data_["message"]);
        $("#load-project").toggleClass("is-active", false);
        $("#workflow-unavailable").toggleClass("is-active", true);
        return;
    }
    workflow_inputs_optional = data_["optional_inputs"];
    workflow_inputs_required = data_["required_inputs"];
    workflow_outputs = data_["outputs"];
    workflow_blocks = data_["blocks"];
    
    if (workflow_blocks.length <= 0) {
        $("#blocks-table").hide();
        $("#blocks-table-empty").show();
    } else {
        workflow_columns = build_workflow_columns(workflow_inputs_optional, workflow_inputs_required, workflow_outputs);
        $("#blocks-header").html(render_workflow_columns(workflow_columns));
        $("#blocks-io").html(render_workflow_inputs(workflow_columns, workflow_inputs_required) + render_workflow_outputs(workflow_columns, workflow_outputs));
        $("#blocks-body").html(render_workflow_blocks(workflow_blocks));
        $("#blocks-table").show();
        $("#blocks-table-empty").hide();
    }
    if (workflow_table_loaded == false) {
        workflow_table_loaded = true;
        setTimeout(function(){$("#load-project").toggleClass("is-active", false);}, 500);
    }
};
var build_workflow_columns = function(inputs_optional, inputs_required, outputs) {
    var _columns = [];
    for (var key in inputs_required) {
        if (_columns.indexOf(inputs_required[key]) == -1) {_columns.push(inputs_required[key]);};
    }
    for (var key in inputs_optional) {
        if (_columns.indexOf(inputs_optional[key]) == -1) {_columns.push(inputs_optional[key]);};
    }
    for (var key in outputs) {
        if (_columns.indexOf(outputs[key]) == -1) {_columns.push(outputs[key]);};
    }
    return _columns;
};
var render_workflow_columns = function(columns) {
    var _content = "";
    for (var column of columns) {
        _content += `<td>${column}</td>`;
    }
    return `
    <tr>
        <th>Order</th>
        <th>Method</th>
        ${ _content }
        <th>edit</th>
        <th>drop</th>
    </tr>
    `;
};
var render_workflow_inputs = function(columns, inputs) {
    var _content = "";
    for (var column of columns) {
        if (inputs.indexOf(column) != -1){
            _content += `<td><span class="tag is-warning"><b>${column}</b></span></td>`;
        } else {
            _content += `<td></td>`;
        }
    }
    return `
    <tr>
        <th colspan="2"><span class="tag">required inputs</span></th>
        ${ _content }
        <th></th>
        <th></th>
    </tr>
    `;
};
var render_workflow_outputs = function(columns, outputs) {
    var _content = "";
    for (var column of columns) {
        if (outputs.indexOf(column) != -1){
            _content += `<td><span class="tag is-success"><b>${column}</b></span></td>`;
        } else {
            _content += `<td></td>`;
        }
    }
    return `
    <tr>
        <th colspan="2"><span class="tag">outputs</span></th>
        ${ _content }
        <th></th>
        <th></th>
    </tr>
    `;
};
var reverse_dict = function (dict) {
    var _r_dict = {};
    for (var key in dict) {
        _r_dict[dict[key]] = key;
    }
    return _r_dict;
};
var render_workflow_block = function(order, name, required_inputs, optional_inputs, outputs) {
    var _content = "";
    var _r_required_inputs = reverse_dict(required_inputs);
    var _r_optional_inputs = reverse_dict(optional_inputs);
    for (var column of workflow_columns) {
        _cell = [];
        if (column in required_inputs){
            _cell.push(`<span class="tag is-warning">${required_inputs[column]}</span>`);
        } else if (column in _r_required_inputs) {
            _cell.push(`<span class="tag is-warning">${_r_required_inputs[column]}</span>`);
        }
        if (column in optional_inputs){
            _cell.push(`<span class="tag">${optional_inputs[column]}</span>`);
        } else if (column in _r_optional_inputs) {
            _cell.push(`<span class="tag is-warning">${_r_optional_inputs[column]}</span>`);
        }
        if (column in outputs){
            _cell.push(`<span class="tag is-success">${outputs[column]}</span>`);
        }
        if (_cell.length <= 0) {
            _cell.push(``);
        }
        _content += `<td>${ _cell.join("<br>") }</td>`
    }
    _content = `
    <th>${ order }</th>
    <th>${ name }</th>
    ${ _content }
    <td><abbr title="Edit this"><button class="button is-link is-outlined pl-2 pr-2" onclick="edit_block(${ order });"><i class="fa-solid fa-pen-to-square"></i></button></abbr></td>
    <td><abbr title="Drop this"><button class="button is-danger is-outlined pl-2 pr-2" onclick="drop_block(${ order });"><i class="fa-solid fa-trash"></i></button></abbr></td>
    `;
    return _content
};
var render_workflow_blocks = function(blocks) {
    var _content = "";
    for (var order in blocks) {
        var _block = blocks[order];
        _content += `<tr onclick="select_block_table_item(${ order });"> ${render_workflow_block(order, _block["id"], _block["required_inputs"], _block["optional_inputs"], _block["outputs"])} </tr>`
    }  
    return _content;
};
var selected_block_id = null;
var select_block_table_item = function(id) {
    selected_block_id = id;
    $("#blocks-body tr").toggleClass("is-selected", false);
    $(`#blocks-body tr:eq(${ id })`).toggleClass("is-selected", true);
};

var build_block_operation_table = function(io, tag=`<span class="tag is-warning">required</span>`) {
    var _content = "";
    for (var key in io) {
        if (key != io[key]) {_content += `
            <tr>
                <td>${ tag }</td>
                <th>${ key }</th>
                <td>
                    <input class="input" type="text" placeholder="${ key }" value="${ io[key] }"/>
                </td>
            </tr>
        `;}
        else {_content += `
            <tr>
                <td>${ tag }</td>
                <th>${ key }</th>
                <td>
                    <input class="input" type="text" placeholder="${ key }"/>
                </td>
            </tr>
        `;}
    }
    return _content;
}
var block_operation_start = function (name, required_inputs, optional_inputs, outputs, button_name="add", next) {
    $("#edit-block-name").html(name);
    $("#edit-block-next").html(button_name);
    $("#edit-block-next").toggleClass("is-loading", false);
    var _content = "";
    _content += build_block_operation_table(required_inputs, `<span class="tag is-warning">required</span>`);
    _content += build_block_operation_table(optional_inputs, `<span class="tag">optional</span>`);
    _content += build_block_operation_table(outputs, `<span class="tag is-success">output</span>`);
    $("#edit-block-table-body").html(_content);
    $('#edit-block-next').off('click').on('click', function(){$("#edit-block-next").toggleClass("is-loading", true);next();});
    $("#edit-block").toggleClass("is-active", true);
};
var block_operation_end = function () {
    $("#edit-block").toggleClass("is-active", false);
};
var block_operation_get_mapping = function () {
    _item_num = $("#edit-block-table-body tr").length;
    var _mapping = {};
    for (var i=0; i < _item_num; i++) {
        var _val = $(`#edit-block-table-body input:eq(${i})`).val();
        if (_val != null && String(_val).length > 0) {
            _mapping[$(`#edit-block-table-body tr:eq(${i}) th:eq(0)`).text()] = _val;
        }
    }
    return _mapping;
};
var edit_block = function (id) {
    var _block = workflow_blocks[id];
    var update_block = function () {
        var _mapping = block_operation_get_mapping();
        url = build_url(WORKFLOW_ID, "blocks/update");
        var update_block_response = function (status_code, body, header) {
            load_workflow_table(WORKFLOW_ID);
            block_operation_end();
        };
        POST(update_block_response, url, {
            "csrfmiddlewaretoken": CSRF_TOKEN,
            "where": id,
            "id": workflow_blocks[id]["id"],
            "mapping": JSON.stringify(_mapping),
        });
        
    };
    block_operation_start(_block["id"], _block["required_inputs"], _block["optional_inputs"], _block["outputs"], "update", update_block);
};

var _map_array_to_dict = function (item) {
    var _dict = {};
    for (var i of item) {
        _dict[i] = i;
    }
    return _dict;
}
var add_block = function () {
    var append_block = function () {
        var _mapping = block_operation_get_mapping();
        url = build_url(WORKFLOW_ID, "blocks/add");
        var append_block_response = function (status_code, body, header) {
            load_workflow_table(WORKFLOW_ID);
            block_operation_end();
        };
        POST(append_block_response, url, {
            "csrfmiddlewaretoken": CSRF_TOKEN,
            "id": selected_tool_id,
            "mapping": JSON.stringify(_mapping),
        });
        
    };
    var insert_block = function () {
        var _mapping = block_operation_get_mapping();
        url = build_url(WORKFLOW_ID, "blocks/insert");
        var insert_block_response = function (status_code, body, header) {
            load_workflow_table(WORKFLOW_ID);
            block_operation_end();
        };
        POST(insert_block_response, url, {
            "csrfmiddlewaretoken": CSRF_TOKEN,
            "where": selected_block_id + 1,
            "id": selected_tool_id,
            "mapping": JSON.stringify(_mapping),
        });
        
    };
    var _inputs_required = [];
    var _inputs_optional = [];
    for (var key in selected_tool_inputs) {
        if (selected_tool_inputs[key][["optional"]]) {_inputs_optional.push(key);}
        else {_inputs_required.push(key);}
    }
    _inputs_required = _map_array_to_dict(_inputs_required);
    _inputs_optional = _map_array_to_dict(_inputs_optional);
    var _outputs = _map_array_to_dict(Object.keys(selected_tool_outputs));
    if (selected_block_id == null || selected_block_id >= workflow_blocks.length) {
        block_operation_start(selected_tool_name, _inputs_required, _inputs_optional, _outputs, "add", append_block);
    } else {
        block_operation_start(selected_tool_name, _inputs_required, _inputs_optional, _outputs,
            `insert after ${workflow_blocks[selected_block_id]["id"]}`, insert_block);
    }
    
};

var drop_block = function(id) {
    url = build_url(WORKFLOW_ID, "blocks/del");
    var drop_block_response = function (status_code, body, header) {
        load_workflow_table(WORKFLOW_ID);
    };
    POST(drop_block_response, url, {
        "csrfmiddlewaretoken": CSRF_TOKEN,
        "where": id
    });
};

var start_del_workflow = function() {
    $("#del-workflow").toggleClass("is-active", true);
};
var ends_del_workflow = function() {
    $("#del-workflow").toggleClass("is-active", false);
};

var share_workflow = function() {
    console.log('share', WORKFLOW_ID);
    $("#share-button").toggleClass("is-loading", true);
    url = build_url(WORKFLOW_ID, "share");
    POST(share_workflow_response, url, {
        "csrfmiddlewaretoken": CSRF_TOKEN
    });
};
var share_workflow_response = function (status_code, body, header) {
    setTimeout(function(){$("#share-button").toggleClass("is-loading", false);}, 1000);
};

var workflow_table_loaded = false;
$(document).ready(function(){
    load_workflow_info(WORKFLOW_ID);
    load_toolkits(WORKFLOW_ID);
    load_workflow_table(WORKFLOW_ID);

    workflow_panels = ["tool-details-intro", "tool-details-inputs", "tool-details-outputs"];
    $("#tab-tool-details-intro").click(function(){switch_tab_panel("tool-details-intro", workflow_panels)});
    $("#tab-tool-details-inputs").click(function(){switch_tab_panel("tool-details-inputs", workflow_panels)});
    $("#tab-tool-details-outputs").click(function(){switch_tab_panel("tool-details-outputs", workflow_panels)});
});