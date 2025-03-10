var request_last_request = {"method": "", 
                            "url": "",
                            "params": {},
                            "headers": {}};
var GET = function(response, url, params, headers) {
    var HttpRequest = new XMLHttpRequest();
    request_last_request["method"] = "GET";
    request_last_request["url"] = url;
    request_last_request["params"] = params;
    request_last_request["headers"] = headers;
    HttpRequest.onreadystatechange = function () {
        if (HttpRequest.readyState == 4) {
            response(HttpRequest.status, HttpRequest.response, HttpRequest.getAllResponseHeaders());
        }
    }
    var params_ = "";
    if (Object.keys(params).length > 0) {
        params_ = "?";
        for(var param in params){
            params_ += (param + "=" + params[param] + "&");
        }
    }
    HttpRequest.open("GET", url+params_, true);
    for(var header in headers) {
        HttpRequest.setRequestHeader(header, headers[header]);
    }
    HttpRequest.withCredentials = true;
    HttpRequest.send(params_);
};

var POST = function(response, url, params, headers) {
    request_last_request["method"] = "POST";
    request_last_request["url"] = url;
    request_last_request["params"] = params;
    request_last_request["headers"] = headers;
    var HttpRequest = new XMLHttpRequest();
    HttpRequest.onreadystatechange = function () {
        if (HttpRequest.readyState == 4) {
            response(HttpRequest.status, HttpRequest.response, HttpRequest.getAllResponseHeaders());
        }
    }
    HttpRequest.open("POST", url, true);
    for(var header in headers) {
        HttpRequest.setRequestHeader(header, headers[header]);
    }
    var params_ = new FormData();
    for(var param in params){
        params_.set(param, params[param]);
    }
    HttpRequest.withCredentials = true;
    HttpRequest.send(params_);
};

var PUT = function(response, url, params, headers) {
    request_last_request["method"] = "PUT";
    request_last_request["url"] = url;
    request_last_request["params"] = params;
    request_last_request["headers"] = headers;
    var HttpRequest = new XMLHttpRequest();
    HttpRequest.onreadystatechange = function () {
        if (HttpRequest.readyState == 4) {
            response(HttpRequest.status, HttpRequest.response, HttpRequest.getAllResponseHeaders());
        }
    }
    HttpRequest.open("POST", url, true);
    for(var header in headers) {
        HttpRequest.setRequestHeader(header, headers[header]);
    }
    var params_ = new FormData();
    for(var param in params){
        params_.set(param, params[param]);
    }
    params_.set("_method", "PUT");
    HttpRequest.withCredentials = true;
    HttpRequest.send(params_);
};

var DELETE = function(response, url, params, headers) {
    request_last_request["method"] = "DELETE";
    request_last_request["url"] = url;
    request_last_request["params"] = params;
    request_last_request["headers"] = headers;
    var HttpRequest = new XMLHttpRequest();
    HttpRequest.onreadystatechange = function () {
        if (HttpRequest.readyState == 4) {
            response(HttpRequest.status, HttpRequest.response, HttpRequest.getAllResponseHeaders());
        }
    }
    HttpRequest.open("POST", url, true);
    for(var header in headers) {
        HttpRequest.setRequestHeader(header, headers[header]);
    }
    var params_ = new FormData();
    for(var param in params){
        params_.set(param, params[param]);
    }
    params_.set("_method", "DELETE");
    HttpRequest.withCredentials = true;
    HttpRequest.send(params_);
};

var log_response = function(status_code, body, header) {
    console.log("Status Code: " + String(status_code));
    console.log(JSON.parse(body));
    console.log(header);
};