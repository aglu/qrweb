const PARAM_SHOW_MODE = "passid";
var phoneTemp;

function timeMsToFormatDate(datems) {
    var date = new Date(datems);
    var dateString = formatingDateComponent(date.getDate(), true) + '.'
        + formatingDateComponent(date.getMonth(), true) + '.'
        + date.getFullYear() + ' '
        + formatingDateComponent(date.getHours(), false) + ':'
        + formatingDateComponent(date.getMinutes(), false);
    return dateString;
}

function formatingDateComponent(component, inc) {
    var modComponent = (inc ? component + 1 : component);
    if (modComponent > 9) {
        return modComponent
    } else {
        return "0" + modComponent;
    }
}

function checkShow() {
    var showMode = false;
    var passId;
    var params = window.location.search.substr(1).split("&");
    $.each(params, function (index, value) {
        var param = value.split("=");
        if (param[0] === PARAM_SHOW_MODE) {
            showMode = true;
            passId = param[1];
        }
    });
    if (showMode) {
        showPassDiv(passId);
    } else {
        var params = {
            "action": "check_session"
        };
        ajaxApi(params, function () {
            initProfilePage();
        }, true, function () {
        })
    }
}

function ajaxApi(params, func, isCheckSession, funcError) {
    var ajaxData = JSON.stringify(params);
    popupClose();
    infoShow("Пожалуйста, подождите");
    hideAllForm();
    $.ajax({
        url: "/api/web",
        data: ajaxData,
        type: "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data) {
            if (data.success) {
                func(data.data);
                infoClose();
            } else {
                infoClose();
                if (isCheckSession) {
                    initLoginPage();
                } else {
                    popupShow(data.error);
                    funcError();
                }
            }
        },
        error: function () {
            infoClose();
            popupShow("Произошла ошибка. Повторите запрос позднее");
        }
    });
}

function popupShow(text) {
    $("#errordiv").html(text);
    $("#errordiv").show();
}

function popupClose() {
    $("#errordiv").hide();
}

function infoShow(text) {
    $("#infodiv").html(text);
    $("#infodiv").show();
}

function infoClose() {
    $("#infodiv").hide();
}


function showPassDiv(passId) {
    var params = {
        "action": "data_pass",
        "passId": passId
    };

    ajaxApi(params, function (data) {
        $("#show_qrimg").attr("src", data.urlQr);
        $("#show_lastname").val(data.userAttributes.last_name);
        $("#show_firstname").val(data.userAttributes.first_name);
        $("#show_middlename").val(data.userAttributes.middle_name);
        $("#show_datestart").val(timeMsToFormatDate(data.startDate));
        $("#show_dateend").val(timeMsToFormatDate(data.endDate));
        $("#show_type").val(data.typeName);
        $("#show_docnum").val(data.userAttributes.doc_number);
        $("#passdiv").show();
    }, false, function () {
    });

}

function initProfilePage() {
    var params = {
        "action": "user_data"
    };
    ajaxApi(params, function (data) {
        $("#profile_lastname").val(data.userAttributes.last_name);
        $("#profile_firstname").val(data.userAttributes.first_name);
        $("#profile_middlename").val(data.userAttributes.middle_name);
        $("#profile_docnum").val(data.userAttributes.doc_number);

        var options = "<option>Не выбрано</option>";
        for (var i = 0; i < data.passType.length; i++) {
            options += `<option value=${data.passType[i].id}>${data.passType[i].name}</option>`;//<--string
        }
        var table;
        if (data.pass.length > 0) {
            table = "<table class=\"table\">\n" +
                "  <thead>\n" +
                "    <tr>\n" +
                "      <th scope=\"col\">#</th>\n" +
                "      <th scope=\"col\">Тип</th>\n" +
                "      <th scope=\"col\">Время</th>\n" +
                "    </tr>\n" +
                "  </thead>" +
                "  <tbody>";
            for (var i = 0; i < data.pass.length; i++) {
                var id = '<a href="/?passid=' + data.pass[i].id + '" target="_blank">' + data.pass[i].id + '</a>';
                var type = data.passType.filter(function (el) {
                    return el.id == data.pass[i].passTypeId
                })[0].name;
                var date = timeMsToFormatDate(data.pass[i].startDate);
                table += "<tr>\n" +
                    '      <th scope=\"row\">' + id + '</th>\n' +
                    '      <td>' + type + '</td>\n' +
                    '      <td>' + date + '</td>\n' +
                    "    </tr>";
            }
            table += "</tbody></table>";
        } else {
            table = '<div class="alert alert-dark" role="alert" id="infodiv"><span>Данные о пропусках не найдены</span></div>'
        }
        $("#passuser").html(table);
        $("#profile_passtype").html(options);
        $("#profilediv").show();
    }, true, function () {
    })

}

function initLoginPage() {
    $("#logindiv").show();

}

function initRegisterPage() {
    $("#registerdiv").show();
}

function initAuthPage() {
    $("#authdiv").show();
}

function hideAllForm() {
    $("#logindiv").hide();
    $("#authdiv").hide();
    $("#registerdiv").hide();
    $("#passdiv").hide();
    $("#profilediv").hide();
}

function sendCode() {
    var params = {
        "action": "request_code",
        "phone": phoneTemp
    };
    ajaxApi(params, function (data) {
        initAuthPage()
        alert("Код придёт как бы по SMS: " + data.authCode);
        $("#loginform").trigger("reset");
    }, false, function () {
        initLoginPage();
    })
}

$(document).ready(function () {
    $("#register").bind("click", function () {
        hideAllForm();
        $("#reg_phone").val($("#login_phone").val());
        $("#loginform").trigger("reset");
        initRegisterPage()
    })
    $("#loginPhone").bind("click", function () {
        hideAllForm();
        phoneTemp = $("#login_phone").val();
        sendCode();
    })
    $("#retryconfrimcode").bind("click", function () {
        sendCode();
    })

    $("#confrimaction").bind("click", function () {
        hideAllForm();
        var params = {
            "action": "authorize_user",
            "phone": phoneTemp,
            "code": $("#confrimcode").val()
        };
        ajaxApi(params, function (data) {
            phoneTemp = "";
            initProfilePage();
            $("#authform").trigger("reset");
        }, false, function () {
            initAuthPage();
        })
    })
    $("#backconfrimcode").bind("click", function () {
        hideAllForm();
        $("#authform").trigger("reset");
        phoneTemp = '';
        initLoginPage();
    })
    $("#backreg").bind("click", function () {
        hideAllForm();
        $("#registerform").trigger("reset");
        initLoginPage();
    })
    $("#cleanreg").bind("click", function () {
        $("#registerform").trigger("reset");
    })
    $("#registeraction").bind("click", function () {
        hideAllForm();
        var params = {
            "action": "registration_user",
            "phone": $("#reg_phone").val(),
            "firstName": $("#reg_firstname").val(),
            "lastName": $("#reg_lastname").val(),
            "middleName": $("#reg_middlename").val(),
            "docNumber": $("#reg_phone").val()
        };
        ajaxApi(params, function (data) {
            hideAllForm();
            phoneTemp = $("#reg_phone").val();
            $("#registerform").trigger("reset");
            sendCode();
        }, false, function () {
            initRegisterPage();
        })
    })
    $("#profile_logout").bind("click", function () {
        var params = {
            "action": "logout"
        };
        ajaxApi(params, function (data) {
            hideAllForm();
            $("#profileform").trigger("reset");
            initLoginPage();
        }, false, function () {
            initProfilePage();
        })


    })
    $("#profile_createpass").bind("click", function () {
        hideAllForm();
        var params = {
            "action": "create_pass",
            "datePass": $("#profile_datestart").val(),
            "passType": $("#profile_passtype").val()
        };
        ajaxApi(params, function (data) {
            hideAllForm();
            $("#profilediv").trigger("reset");
            initProfilePage()
        }, false, function () {
            $("#profilediv").show();
        })
    })

    checkShow();
});

