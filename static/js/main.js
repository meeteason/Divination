var HttpRequest = require("nebulas").HttpRequest;
var Neb = require("nebulas").Neb;
var Account = require("nebulas").Account;
var Transaction = require("nebulas").Transaction;
var Unit = require("nebulas").Unit;
var Utils = require("nebulas").Utils;
var myneb = new Neb();
var NebPay = require("nebpay");
var nebPay = new NebPay();


// ****Testnet****//
myneb.setRequest(new HttpRequest("https://testnet.nebulas.io"));
var dapp_address = "n1wuL1fizZvsmLo1u7BiszgiEyHCS8RiWAQ";


// ****Maintnet****//
// myneb.setRequest(new HttpRequest("https://mainnet.nebulas.io"));
// var dapp_address = "n1gjS5bBMWfeYmFM57FSsJchDQHGKZiR2cd";


// if(typeof(webExtensionWallet) === "undefined") {
//     alert('星云钱包环境未运行，请安装钱包插件或开启');
// }else{
//     console.log('星云钱包环境运行成功');
// }

// var isGetAccount = false;

var nasApi = myneb.api;
var address = ""
var balance = 0;
$(function () {
    checkWallet();
    // $('#txtExpire').datepicker({
    //     format: "yyyy-mm-dd 23:59:59",
    //     startDate: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    //     forceParse: false,
    //     todayHighlight: true
    // });

    $("#btnGetWrite").click(function () {
        var _address = $("#txtAddress").val()
        if (!!_address && _address.length == 35 && _address.startsWith("n1")) {
            showLoading()
            zhanbu();
        } else {
            //the address wrong format
            //TODO
            alert("未获得钱包地址，请正确安装NAS钱包！")
        }
    });

    // var yourAddress = localStorage.getItem("yourAddress")
    // if (!!yourAddress) {
    //     // getYours(yourAddress)
    //     $("#txtAddress").val(yourAddress)
    // }
})

var countDown = 0

function zhanbu() {
    if (countDown < 10) {
        $("#modalCountdown p span").html(10 - countDown);
        $("#modalCountdown").modal("show")
        countDown++;
        setTimeout(zhanbu, 1000)
    } else {
        var _address = $("#txtAddress").val()
        $("#modalCountdown").modal("hide")
        showLoading()
        write(function (data) {
            hideLoading();
            if (data.status == 0) {
                showYourCentent(data)
            } else {
                console.error(data)
            }
        })
    }
}

function showYourCentent(data) {
    if (data.status == 0) {

        $.get("static/data/" + data.random + ".txt").then(function (data) {
            debugger
            $("#result").html(data).show("fade")
            $("#result font").html(dayjs().format("公元YYYY年MM月DD日"))
            $(".input-group,#button-group").hide("fade")
        })

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
    var _loopCount = 0;
    var _listener = function (rep) {
        // debugger;
        console.log(rep)
        _loopCount++;
        if (typeof rep == "string" && rep.indexOf("Error") != -1) {
            clearTimeout(_loopCall)
        } else {
            nasApi.getTransactionReceipt({
                hash: rep.txhash
            }).then(function (receipt) {
                if (receipt.status === 1) {
                    // 交易成功
                    _call.call(this, JSON.parse(receipt.execute_result))
                } else {
                    if (_loopCount >= 60) {
                        alert("交易失败，请刷新后重试")
                    } else {
                        _loopCall = setTimeout(function(){
                            _listener(rep)
                        }, 1000)
                    }
                }
            });
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
    // // debugger;
    // var _loopFunc = function () {
    //     console.log(serialNumber)
    //     nebPay.queryPayInfo(serialNumber).then(function (rep) {
    //         var data = JSON.parse(rep)
    //         if (data.code == 0) {
    //             _call.call(this, data)
    //         } else {
    //             _loopCall = setTimeout(_loopFunc, 1000)
    //         }
    //     }).catch(function (error) {
    //         console.error("run write error", error)
    //         _loopCall = setTimeout(_loopFunc, 1000)
    //         hideLoading();
    //         alert("生成失败！")
    //     })
    // }
    // _loopCall = setTimeout(_loopFunc, 1000)


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


window.postMessage({
    "target": "contentscript",
    "data": {},
    "method": "getAccount",
}, "*");

window.addEventListener('message', function (e) {
    if (e.data && e.data.data) {
        if (e.data.data.account) {
            // debugger
            address = e.data.data.account
            $("#txtAddress").val(address)
            getAccountState();

            // Unit.fromBasic(Utils.toBigNumber(resp.balance), "nas").toNumber()
            // app.updateUserInfo()
        }
    }
})

function getAccountState() {
    nasApi.getAccountState({
        address: address
    }).then(function (resp) {
        if (resp.error) {
            this.$message.error(resp.error)
        }
        balance = Unit.fromBasic(Utils.toBigNumber(resp.balance), "nas").toNumber()
        $("#btnGetWrite").prop("disabled", false)
        getYours(address).then(function (rep) {
            // debugger
            // hideLoading();
            var data = JSON.parse(rep.result)
            // localStorage.setItem("yourAddress", data.from)
            // showYourCentent(data)
            if (data.status != 0) {
                // showLoading()
                // zhanbu();
            } else {
                showYourCentent(data)
            }
        })
    })
}