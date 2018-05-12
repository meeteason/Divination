var HttpRequest = require("nebulas").HttpRequest;
var Neb = require("nebulas").Neb;
var Account = require("nebulas").Account;
var Transaction = require("nebulas").Transaction;
var Unit = require("nebulas").Unit;
var myneb = new Neb();
var NebPay = require("nebpay");
var nebPay = new NebPay();


// ****Testnet****//
myneb.setRequest(new HttpRequest("https://testnet.nebulas.io"));
var dapp_address = "n1vQPkkyf84MLCWzSZLpnbFqp3FvhCj4PEh";


// ****Maintnet****//
// myneb.setRequest(new HttpRequest("https://mainnet.nebulas.io"));
// var dapp_address = "n1rLwYTJQgLbzv8JTCvcjXnffwqpD1bwowK";


// if(typeof(webExtensionWallet) === "undefined") {
//     alert('星云钱包环境未运行，请安装钱包插件或开启');
// }else{
//     console.log('星云钱包环境运行成功');
// }

$(function () {
    checkWallet();
    $('#txtExpire').datepicker({
        format: "yyyy-mm-dd 23:59:59",
        startDate: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        forceParse: false,
        todayHighlight: true
    });
    // //提交写入
    // $("#saveWrite").click(function () {
    //     var date = dayjs($('#txtExpire').val()),
    //         content = $("#txtContent").val();
    //     var alertError = $("#modalWrite .alert-danger"),
    //         alertSuccess = $("#modalWrite .alert-success")

    //     if (!content) {
    //         alertError.text("信件内容不能为空！请对自己的未来负责").show();
    //         setTimeout(function () {
    //             alertError.hide()
    //         }, 2000);
    //         return
    //     }

    //     if (!date.isValid()) {
    //         alertError.text("时间格式错误，请重新输入！").show();
    //         setTimeout(function () {
    //             alertError.hide()
    //         }, 2000);
    //         return
    //     }

    //     var expire = date.diff(dayjs())
    //     if (expire > 0) {
    //         var cover = $("#coverData").prop("checked")
    //         showLoading();
    //         write($("#txtContent").val(), expire, cover, function (data) {

    //             hideLoading();

    //             if (data.code == 0) {
    //                 console.log("wirte success,and then get your content...")
    //                 alertSuccess.text("您的信发送成功！").show()
    //                 setTimeout(function () {
    //                     alertSuccess.hide()
    //                 }, 2000);

    //                 localStorage.setItem("yourAddress", data.data.from)
    //                 $("#txtAddress").val(data.data.from)
    //                 getYours(data.data.from).then(function (rep) {
    //                     console.log("get yours success", rep)
    //                 })

    //             } else {
    //                 console.error(data)
    //             }
    //         })
    //     } else {
    //         // The date time wrong
    //         //TODO
    //         alertError.text("时间格式错误，请重新输入！").show();
    //         setTimeout(function () {
    //             alertError.hide()
    //         }, 2000);
    //     }

    // });

    $("#btnGetWrite").click(function () {
        var _address = $("#txtAddress").val()
        if (!!_address && _address.length == 35 && _address.startsWith("n1")) {
            showLoading()
            getYours(_address).then(function (rep) {
                hideLoading();
                var data = JSON.parse(rep.result)
                // showYourCentent(data)
                if (data.status != 0) {
                    write(function (data) {
                        hideLoading();
                        if (data.code == 0) {
                            getYours(_address);
                        } else {
                            console.error(data)
                        }
                    })
                } else {
                    showYourCentent(data)
                }
            })
        } else {
            //the address wrong format
            //TODO
            alert("请输入正确的钱包地址！")
        }
    });

    var yourAddress = localStorage.getItem("yourAddress")
    if (!!yourAddress) {
        // getYours(yourAddress)
        $("#txtAddress").val(yourAddress)
    }
})

function showYourCentent(data) {
    if (data.status == 0) {
        $("#result").html(_divination[parseInt(data.random)]).show("fade")
        $(".input-group,#button-group").hide("fade")

    } else if (data.status == -2) {
        console.log("未写入任何信息")
        var letterShow = $("#nolettershow1")

        letterShow.show()

        setTimeout(function () {
            letterShow.hide("slow")
        }, 3000);
    }
}

function getCount() {
    return myneb.api.call({
        from: dapp_address,
        to: dapp_address,
        value: 0,
        contract: {
            function: "getCount",
            args: "[]"
        },
        gasPrice: 1000000,
        gasLimit: 2000000,
    })
}

function getDate() {
    return myneb.api.call({
        from: dapp_address,
        to: dapp_address,
        value: 0,
        contract: {
            function: "getDate",
            args: "[]"
        },
        gasPrice: 1000000,
        gasLimit: 2000000,
    });
}

function getYours(yourAddress) {
    var _from = yourAddress || dapp_address
    return myneb.api.call({
        from: _from,
        to: dapp_address,
        value: 0,
        contract: {
            function: "getYours",
            args: "[]"
        },
        gasPrice: 1000000,
        gasLimit: 2000000,
    });
}

function write(callback) {
    var _call = callback || $.noop;
    var callArgs = JSON.stringify([]);

    var _loopCall = null;
    var _listener = function (rep) {
        //   debugger;
        console.log(rep)
        if (typeof rep == "string" && rep.indexOf("Error") != -1) {
            clearTimeout(_loopCall)
        }
    }

    var serialNumber = nebPay.call(dapp_address, 0, "getDivination", callArgs, {
        qrcode: {
            showQRCode: false,
            container: undefined
        },
        goods: {
            name: "wirte",
            desc: "Wirte something for your futrue"
        },
        listener: _listener
    });
    // debugger;
    var _loopFunc = function () {
        console.log(serialNumber)
        nebPay.queryPayInfo(serialNumber).then(function (rep) {
            var data = JSON.parse(rep)
            if (data.code == 0) {
                _call.call(this, data)
            } else {
                _loopCall = setTimeout(_loopFunc, 1000)
            }
        }).catch(function (error) {
            console.error("run write error", error)
            _loopCall = setTimeout(_loopFunc, 1000)
        })
    }
    _loopCall = setTimeout(_loopFunc, 1000)


}

function checkWallet() {
    if (typeof (webExtensionWallet) === "undefined") {
        $("#nolettershow").show("fade")
    } else {
        console.log('星云钱包环境运行成功');
    }
}

function showLoading() {
    $("#modalLoading").modal("show")
}

function hideLoading() {
    $("#modalLoading").modal("hide")
}