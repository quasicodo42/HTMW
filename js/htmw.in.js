$(function() {
    pckt.fillPockets();
});

let strg = (function () {
    let repo = {};

    function isSupported(storage, test) {
        try {
            const key = Math.random().toString(36).substring(3);
            storage.setItem(key, test || key);
            storage.removeItem(key);
            return true;
        } catch (e) {
            return false;
        }
    }

    function isJSON(value) {
        if(value === undefined){
            return value;
        }else if(value === "true" || value === true || value === "false" || value === false || value === "null" || value === null || (value.length && !isNaN(value) && (value.trim() === value))){
            return JSON.parse(value);
        }else if(typeof value === "object"){
            return undefined;
        }else if(value.trim().charAt(0) === '{' || value.trim().charAt(0) === '['){
            try {
                var json = JSON.parse(value);
            } catch (e) {
                return undefined;
            }
            return json;
        }
        return undefined;
    }

    let internalStorage = (function(){
        function getItem(key){
            return repo[key]
        }
        function setItem(key,value){
            repo[key] = value;
        }
        function removeItem(key){
            delete repo[key];
        }
        function clear() {
            repo = {};
        }
        return {
            getItem,
            setItem,
            removeItem,
            clear
        }
    })();

    let strgType  = null;
    let typeOpts  = [sessionStorage,localStorage,internalStorage];
    let typeNames = ["session","local","internal"];
    let typeIndex = null;

    for(var i = 0; i < typeOpts.length; i++){
        if(isSupported(typeOpts[i])){
            typeIndex = i;
            strgType  = typeOpts[i];
            break;
        }
    }

    return{
        get: function (name) {
            let val = strgType.getItem(name) || undefined;
            return isJSON(val) || val;
        },
        set: function (name,value) {
            if(typeIndex !== 2 && typeof value === "object"){
                value = JSON.stringify(value);
            }

            if(value === null) {
                value = "null";
            }else if(value === undefined) {
                value = "undefined";
            }

            strgType.setItem(name,value);
            return strg.get(name);
        },
        del: function (names) {
            let vals = [];
            names = (typeof names === "object" ? names : names.split(","));
            names.forEach(function (name) {
                vals.push(strg.get(name));
                strgType.removeItem(name);
            });
            return vals;
        },
        clear: function(){
            strgType.clear();
        },
        iAdd: function (name,value) {
            let val = strg.get(name) || [];
            val.push(value);
            return strg.set(name,val);
        },
        iDel: function (name,value) {
            let val = strg.get(name).filter(item => item !== value);
            return strg.set(name,val);
        },
        mAdd: function (name,key,value) {
            let val = strg.get(name) || {};
            val[key] = value;
            return strg.set(name,val);
        },
        mDel: function (name,key) {
            let val = strg.get(name);
            delete val[key];
            return strg.set(name,val);
        },
        log: function (name,value,max,queueType) {
            queueType = queueType || "fifo";
            let temp = strg.iAdd(name,value);
            while(temp.length > max){
                if(queueType === "fifo")
                    temp.shift();
                else
                    temp.pop();
            }
            return strg.set(name,temp);
        },
        has: function (name) {
            return typeof strg.get(name) !== "undefined";
        },
        status: function () {
            return {strgName:typeNames[typeIndex],strgType:strgType,strgIndex:typeIndex};
        }
    }
})();

let scrb = (function () {
    let regex        = {};
    regex.email      = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    regex.numbers    = /[^0-9]/g;
    regex.floats     = /[^0-9.]/g;
    regex.alpha      = /[^A-Za-z]/g;
    regex.alphasp    = /[^A-Za-z\s]/g;
    regex.alphanum   = /[^A-Za-z0-9]/g;
    regex.alphanumsp = /[^\w\s]/gi;
    regex.dblcurly   = /[^{\{]+(?=}\})/g;

    return{
        format: function (value,formatStr,valueDefault) {
            let parts  = (formatStr || "default").split(".");
            let format = parts.shift().trim().toLowerCase();
            let param1 = parts.shift() || valueDefault; //default value
            let param2 = parts.shift(); //unused
            switch(format.toLowerCase()){
                case "string":
                    value = String(value);
                    break;
                case "number":
                    if (value !== null && value !== undefined && String(value).length) {
                        value = parseFloat(String(value).replace(/[^0-9.]/g, "")) || null;
                    }else{
                        value = null;
                    }
                    break;
                case "tinyhash":
                    value = String(value).split("").map(v=>v.charCodeAt(0)).reduce((a,v)=>a+((a<<7)+(a<<3))^v).toString(16);
                    break;
                case "object":
                    var result = {};
                    var keys = Object.keys(value);
                    var vals = Object.values(value);
                    keys.forEach((key, i) => result[key] = vals[i]);
                    value = result;
                    break;
                case "array":
                    value = Object.values(value);
                    break;
                case "boolean":
                    value = (value && value !== "0" && String(value).toLowerCase() !== "false" ? true : false);
                    break;
                case "null":
                    value = null;
                    break;
                case "nospace":
                    value = value.split(' ').join('');
                    break;
                case "alphaonly":
                    value = value.replace(regex.alpha, '');
                    break;
                case "numonly":
                    value = value.replace(regex.numbers, '');
                    break;
                case "float":
                    value = value.replace(regex.floats, '');
                    break;
                case "encrypt":
                    value = value.split('').sort().reverse().join('');
                    break;
                case "lower":
                    value = value.toLowerCase();
                    break;
                case "upper":
                    value = value.toUpperCase();
                    break;
                case "fax":
                case "phone":
                    var check = (value || "").replace(/[^0-9]/g, "");
                    if(value && check.length === 10){
                        value = check.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
                    }
                    break;
            }
            return value || (param1 ? scrb.format(param1,format) : value);
        },
        scrub: function (scrubArr) {
            //[{name:"name",value:"John",scrubs:["req","lower"]}]
            let resultObj = {success:true,scrubs:[],errors:{}};
            scrubArr.forEach(function (scrubObj,i) {
                scrubArr[i] = scrb.scrubEach(scrubObj,scrubArr);
                if(!scrubArr[i].success){
                    resultObj.success = false;
                    resultObj.errors[scrubArr[i].name] = scrubArr[i].errors;
                }
            });
            resultObj.scrubs = scrubArr;
            return resultObj;
        },
        scrubEach: function (scrubObj,scrubArr) {
            //scrubObj sample: {name:"name",value:"John",scrubs:["req","lower","max:15"]}
            //scrubArr sample: [{name:"name",value:"John",scrubs:["req","lower","max:15"]},...]
            scrubObj.delta   = scrubObj.value;
            scrubObj.errors  = [];
            scrubObj.success = true;

            scrubObj.scrubs.forEach(function (scrubs) {
                let parts  = scrubs.split(":");
                let format = parts.shift().trim().toLowerCase();
                let clue   = parts.shift();
                let param2 = parts.shift(); //unused

                let eachResult  = {success:true,error:null};
                switch(format){
                    case "fail":
                    case "failclient":
                        eachResult.success = false;
                        eachResult.error = "Intentional frontend failure (" + format + ").";
                        break;
                    case "num":
                        eachResult.success = !isNaN(+scrubObj.value);
                        eachResult.error = "Only numbers are allowed.";
                        break;
                    case "alpha":
                        eachResult.success = (scrubObj.value === scrubObj.value.replace(regex.alpha));
                        eachResult.error = "Only letters are allowed.";
                        break;
                    case "alphaspace":
                        eachResult.success = (scrubObj.value === scrubObj.value.replace(regex.alphasp));
                        eachResult.error = "Only letters/space are allowed.";
                        break;
                    case "alphanum":
                        eachResult.success = (scrubObj.value === scrubObj.value.replace(regex.alphanum));
                        eachResult.error = "Only letters/numbers are allowed.";
                        break;
                    case "alphanumspace":
                        eachResult.success = (scrubObj.value === scrubObj.value.replace(regex.alphanumsp));
                        eachResult.error = "Only letters/numbers/space are allowed.";
                        break;
                    case "nospace":
                        eachResult.success = (scrubObj.value === scrubObj.value.split(" ").join(""));
                        eachResult.error = "Value cannot contain spaces.";
                        break;
                    case "req":
                    case "required":
                        eachResult.success = (String(scrubObj.value).length ? true : false);
                        if(clue){
                            eachResult.success = (String(scrubObj.value) === String(clue));
                        }
                        eachResult.error = "Value " + (clue ? "(" + clue + ") " : "") + "is required.";
                        break;
                    case "max":
                    case "maxlen":
                        eachResult.success = !(String(scrubObj.value).length > +clue);
                        eachResult.error = "Max length is " + clue + ".";
                        break;
                    case "min":
                    case "minlen":
                        eachResult.success = String(scrubObj.value).length >= +clue;
                        eachResult.error = "Minimum length is " + clue + ".";
                        break;
                    case "set":
                    case "setlen":
                        eachResult.success = String(scrubObj.value).length === +clue;
                        eachResult.error = "Required value length is " + clue + ".";
                        break;
                    case "disallow":
                        eachResult.success = !scrubObj.value.includes(clue);
                        eachResult.error = "Value must not contain " + clue + ".";
                        break;
                    case "expect":
                        eachResult.success = scrubObj.value.includes(clue);
                        eachResult.error = "Value must contain " + clue + ".";
                        break;
                    case "match":
                        eachResult.success = scrb.scrubMatch(scrubArr,scrubObj,clue);
                        eachResult.error = "Values must match (" + clue + ").";
                        break;
                    case "gte":
                        eachResult.success = +scrubObj.value >= +clue;
                        eachResult.error = "Required value must have a length of " + clue + " or more.";
                        break;
                    case "lte":
                        eachResult.success = +scrubObj.value <= +clue;
                        eachResult.error = "Required value must have a length of " + clue + " or less.";
                        break;
                    case "email":
                        eachResult.success = (String(scrubObj.value).length ? regex.email.test(scrubObj.value) : true);
                        eachResult.error = "Only valid emails are allowed.";
                        scrubObj.value = scrb.format(scrubObj.value,"lower");
                        break;
                    default:
                        scrubObj.value = scrb.format(scrubObj.value,format);
                }

                if(!eachResult.success){
                    scrubObj.errors.push(eachResult.error);
                    scrubObj.success = false;
                }
            });

            return scrubObj;
        },
        scrubSimple: function (name,value,scrubs) {
            return scrb.scrubEach({name:name,value:value,scrubs:scrubs});
        },
        scrubMatch: function (scrubArr,scrubMatch,valueMatch) {
            let match = false;
            scrubArr.forEach(function (scrubObj) {
                if(scrubMatch.value === scrubObj.value && scrubObj.name === valueMatch){
                    match = true;
                }
            });
            return match;
        }
    }
})();

/**
 *
 * @type {{loadingTs, getData, getHtml, emptyPockets, fillPockets, addItems, cloneRecords, status, id}}
 */
let pckt = (function(id) {
    let loading     = {html:[],data:[],ts:Date.now()};
    let queued      = {html:[],data:[],ts:Date.now()};
    let callbacks   = {html:{},data:{},ts:Date.now()};
    let maxLoadTime = 2000; //milliseconds
    let jsonDir     = ""; //"/app.lists/json/";
    let prefix      = "pa-";
    let recordsAt   = "response";
    return{
        getData: function(name, post, callback){
            //if queued do nothing
            if(queued.data.includes(name)){
                return;
            }
            let request;
            //let nname = scrb.format(name,"alphaonly"); //TODO compare and alert, use clean
            strg.del(name);
            queued.data.push(name);
            if(post){
                request = $.post((jsonDir ? jsonDir + name + ".json" : name), post || {}, function(dataObj){},"json")
            }else{
                request = $.get((jsonDir ? jsonDir + name + ".json" : name), {}, function(dataObj){},"json")
            }
            request.done(function (dataObj) {
                let fullPocket = $("[data-data-source='" + name + "']");
                queued.data = queued.data.filter(item => item !== name);
                strg.set(name,dataObj);
                //is it a modal report popup OR assigned to a pocket on the backend OR to be newly filled
                if(dataObj.hasOwnProperty("config") && dataObj.config.hasOwnProperty("pocket")){
                    $(".pocket[name=" + dataObj.config.pocket + "]").data("items",(dataObj.config.item || name));
                    pckt.emptyPockets(dataObj.config.pocket,1);
                }else if(dataObj.hasOwnProperty("config") && dataObj.config.hasOwnProperty("isModalPopup") && dataObj.config.isModalPopup){
                    $("#modalReport").remove();
                    var item = $("<item id='modalReport'>").html(pckt.buildItem("tabular",name));
                    $("items").append(item);
                    $(".pocket[name=modal]").data("items","modalReport");
                    pckt.emptyPockets("modal",1);
                }else if($(fullPocket).length){
                    pckt.emptyPockets($(fullPocket).closest(".pocket").attr("name"),1);
                }
            }).fail(function (error) {
                //error
                console.log(error);
            }).always(function (obj) {
                callbacks.data[name] = obj;
                if(callback && typeof pckt[callback] === "function"){
                    setTimeout(function (){
                        pckt[callback](obj);
                    })
                }
                pckt.isFinished();
            });
        },
        getHtml: function(name, pocketData, callback){
            $("#" + name).remove();
            //only try once check queue todo
            if(queued.html.includes(name)){
                return;
            }
            let endpoint = "/html/" + name + ".html";
            let override = "override" + name.charAt(0).toUpperCase() + name.slice(1);
            if(pocketData.hasOwnProperty(override)){
                endpoint = pocketData[override];
            }
            queued.html.push(name);
            $.get(endpoint, {}, function(htmlStr){
            }).done(function (htmlStr) {
                queued.html = queued.html.filter(item => item !== name);
                var item = $("<item id='" + name + "'>").html(htmlStr);
                $("items").append(item);
            }).fail(function (error) {
                //error
            }).always(function (obj) {
                callbacks.html[name] = obj;
                if(callback && typeof pckt[callback] === "function"){
                    setTimeout(function (){
                        pckt[callback](obj);
                    })
                }
                pckt.isFinished();
            });
        },
        emptyPockets: function (pocketNames,defaultFillFlag) {
            (pocketNames || "").split(",").forEach(function (pocketName){
                $(".pocket[name=" + (pocketName || "none") + "]").empty();
            });
            if(defaultFillFlag){
                loading = {html:[],data:[],ts:Date.now()};
                pckt.fillPockets();
            }
        },
        fillPockets: function () {
            $(".pocket").each(function () {
                let contents        = $(this)[0].innerHTML.trim();
                let defaultContents = $("items").find("item#default").html();
                let toBeCloned      = $(this).find(".clone").length;
                let beenCloned      = $(this).find(".cloned").length;
                if(!beenCloned && (!contents || contents === defaultContents || toBeCloned)){
                    var data = $(this).data();
                    var name = ($(this).attr("name") || "pocket-" + Math.floor(Math.random() * 1000000));
                    $(this).attr("name", name);
                    pckt.addItems(data.items || data.itemsDefault || "default", name);
                }
            });
            pckt.isFinished("fillPockets");
        },
        isFinished: function(caller){
            caller = caller || "isFinished";
            if(loading.html.length || loading.data.length){
                //recursion until load complete/timeout
                if(Date.now() - loading.ts < maxLoadTime){
                    setTimeout(function () {
                        if(loading.html.length || loading.data.length && caller === "fillPockets"){
                            pckt[caller]();
                        }
                    },500)
                }else{
                    pckt.cleanupCall();
                    console.log("Stop loading!",loading);
                    loading = {html:[],data:[],ts:Date.now()};
                }
            }else{
                pckt.cleanupCall();
                console.log("Done loading in " + (Date.now() - loading.ts) + " milliseconds!");
                loading.ts = Date.now();
            }
        },
        addItems: function (itemIds, pocketName) {
            var pocket     = $(".pocket[name=" + pocketName + "]") || $(".pocket[name=main]");
            var pocketData = $(pocket).data();
            let defaultContents = $("items").find("item#default").html();
            let itemIdsArr      = String(itemIds).split(",");
            if(itemIdsArr.length === 1){
                pckt.emptyPockets(pocketName);
            }
            itemIdsArr.forEach(function (itemId) {
                var item     = $("items").find("item#" + itemId);
                var itemData = $(item).data();
                //add to loading - html
                if(!(loading.html.includes(itemId))){
                    loading.html.push(itemId);
                }
                if($(item).length){
                    //remove from loading - html
                    //this is item HTML i.e., <item> element has callback reference
                    //i.e., <item data-callback="cleanData"> === var cleanData = function(itemIds,pocketName){};
                    //OR i.e., <item data-callback="cleanData"> === pckt.cleanData = function(itemIds,pocketName){};
                    loading.html = loading.html.filter(item => item !== itemId);
                    if(itemData.hasOwnProperty("callback") && typeof window[itemData.callback] === "function"){
                        setTimeout(function () {
                            window[itemData.callback](itemIds,pocketName);
                        })
                    }else if(typeof pckt[itemData.callback] === "function"){
                        setTimeout(function (){
                            pckt[itemData.callback](itemIds,pocketName);
                        })
                    }
                }else{
                    //loading...
                    item = $("items").find("item#default");
                    //grab the missing item (html)
                    pckt.getHtml(itemId,pocketData);
                }
                $(pocket).append($(item)[0].innerHTML.replace(defaultContents,''));
                callbacks.html[itemId] = null;
            });

            //clone all record data
            pckt.cloneRecords();

            //continue until all pockets are filled.
            setTimeout(function () {
                if($(".pocket").is(":empty")){
                    //pckt.fillPockets();
                }
            })
        },
        buildItem: function(itemId,dataSource,callback){
            let dataObj = strg.get(dataSource);
            let item    = $($("items").find("item#" + itemId))[0].innerHTML;
            switch (itemId) {
                case "tabular":
                    let thead = "";
                    let tbody = "";
                    let useUi = dataObj.hasOwnProperty("recordsHeaderUi");
                    dataObj.recordsHeader.forEach(function (header,i) {
                        let headerUi = (useUi ? (dataObj.recordsHeaderUi[i] || header) : header);
                        thead += "<th>" + headerUi + "</th>";
                        tbody+= "<td>{{rec:" + header + "}}</td>";
                    });
                    item = item.split("<thead></thead>").join("<thead><tr>" + thead + "</tr></thead>")
                        .split("<tbody></tbody>").join("<tbody class='clone' data-callback='" + (callback || "") + "' data-data-source='" + dataSource + "'><tr>" + tbody + "</tr></tbody>");
                    break;
            }

            return item;
        },
        objectDig: function (obj,digList) {
            if(typeof digList === 'string'){
                digList = digList.split(digList.includes(',') ? ',' : '.');
            }
            let member = digList.shift();
            if(!isNaN(+member)){
                member = +member; //try an index
            }
            if(!digList.length){
                return (obj.hasOwnProperty(member) ? obj[member] : undefined);
            }else{
                return pckt.objectDig(obj[member],digList);
            }
        },
        cloneRecords: function () {
            $(".pocket").find(".clone").each(function () {
                var clone  = $(this);
                var data   = $(this).data();
                let pdata  = $(this).closest(".pocket").data();
                data.dataSource = pdata.dataSource || data.dataSource;
                var obj    = strg.get(data.dataSource) || {records:[],recordsHeader:[]};
                let name   = data.dataSource;
                let cleanName = scrb.format(data.dataSource,"alphaonly");
                //add to loading - data
                if(!(loading.data.includes(data.dataSource))){
                    loading.data.push(data.dataSource);
                }
                if(strg.has(data.dataSource)){
                    loading.data = loading.data.filter(item => item !== data.dataSource);
                }else{
                    //grab the missing item (data)
                    pckt.getData(data.dataSource);
                }

                //grabs OR creates records/recordsHeader if they are not standardized
                if(obj.hasOwnProperty(recordsAt)){
                    obj = obj[recordsAt];
                    //expects an 'array' of objects or an 'object' that contains members; records & recordsHeader
                    if(Array.isArray(obj) && !obj.length){
                        return;
                    }
                    if(obj && typeof obj === "object" && ((Array.isArray(obj) && obj.length) || (!obj.hasOwnProperty("records") && !obj.hasOwnProperty("recordsHeader")))){
                        let newRecs = [];
                        obj.forEach(function(rec){
                            newRecs.push(Object.values(rec));
                        })
                        obj = {records:newRecs,recordsHeader:Object.keys(obj[0])};
                    }else{
                        //data is not recognized, abort
                        return;
                    }
                }

                var cloned = $($(clone)[0].outerHTML).empty().data({object:obj,cleanName:cleanName}).toggleClass("clone clone-container " +  cleanName).attr("data-ts",Date.now());
                if(obj.recordsHeader.length && obj.records.length){
                    obj.records.forEach(function (record,i) {
                        const recObj  = Object.fromEntries(obj.recordsHeader.map((_, i) => [obj.recordsHeader[i], record[i]]));
                        let cloneHtml = $($(clone)[0].innerHTML);
                        if(!cloneHtml) return;
                        let report = {notFound:[],nulls:[]};
                        record.forEach(function (delta,ii) {
                            let name  = obj.recordsHeader[ii];
                            let find  = '{{rec:' + name + '}}';
                            cloneHtml = $(($(cloneHtml)[0].outerHTML).split(find).join(delta))
                                //in = add delta to UI
                                .find("in[name=" + name + "]").each(function () {
                                    //get what's in there + $(this).html()
                                    let span = $("<span>").html(delta).data({name:name,value:delta,delta:delta});
                                    $(this).replaceWith(span);
                                }).end()
                                //up = add delta as attribute on parent
                                .find("up[name=" + name + "]").each(function () {
                                    $(this).parent().attr(name,delta).end().remove();
                                }).end()
                                //on = add delta as data on parent
                                .find("on[name=" + name + "]").each(function () {
                                    $(this).parent().data(name,delta).end().remove();
                                }).end();
                        });
                        ($(cloneHtml)[0].outerHTML.match(/[^{\{]+(?=}\})/g) || []).forEach(function(placeholder){
                            let find   = '{{' + placeholder + '}}';
                            let parts  = placeholder.split(":");
                            if(parts.length <= 1) return;
                            let type   = parts.shift();
                            let name   = parts.shift();
                            let clue   = parts.shift();
                            let value;
                            switch(type){
                                case 'rec': //record child data
                                    value = pckt.objectDig(recObj,name);
                                    break;
                                case 'aug': //logical augmented data
                                    switch(name){
                                        case 'index':
                                            value = i + 1;
                                        default:
                                        //ignore
                                    }
                                    break;
                            }
                            if(value === undefined){
                                report.notFound.push(name);
                                value = '';
                            }
                            if(value === null){
                                report.nulls.push(name);
                                value = '';
                            }
                            cloneHtml = $(($(cloneHtml)[0].outerHTML).split(find).join(value));
                        });
                        $(cloneHtml).toggleClass('cloned').data({index:i,record:record,recordHeader:obj.recordsHeader,rec:recObj,report:report,objectName:data.dataSource,cleanName:cleanName});
                        cloned = $(cloned).append(cloneHtml);
                    })
                    callbacks.data[name] = obj;
                }else{
                    cloned = $(clone)[0].outerHTML;
                }
                $(clone).after($(cloned));
                $(clone).remove();
            })
        },
        cleanupCall: function(obj,name,isData){
            Object.keys(callbacks).forEach(function(type){
                if(callbacks.hasOwnProperty(type)){
                    Object.keys(callbacks[type]).forEach(function (name){
                        if(callbacks[type].hasOwnProperty(name)){
                            let obj = callbacks[type][name];
                            if(!name){
                                if(obj.hasOwnProperty("callback") && obj.callback.length && typeof window[obj.callback] === "function"){
                                    //callback based on response data, i.e.; response.callback:"fixreport" === var fixreport = function(name,obj){};
                                    setTimeout(function(){
                                        window[obj.callback](name,obj);
                                    })
                                }else if(typeof pckt[obj.callback] === "function"){
                                    //or create the appropriate pckt extended function, i.e., pckt.fixreport = function(name,obj){};
                                    setTimeout(function () {
                                        pckt[obj.callback](name, obj);
                                    });
                                }
                            }else{
                                //callback based on data-data-source value, i.e., data-data-source="/Get/report" === var Getreport = function(name,obj){};
                                //OR callback based on data-data-source value, i.e., data-data-source="report" === var report = function(name,obj){};
                                let funcName = name;
                                if(type === "data"){
                                    funcName = scrb.format(name,"alphaonly");
                                }
                                if(typeof window[funcName] === "function"){
                                    setTimeout(function () {
                                        window[funcName](name, obj);
                                    });
                                }else if(typeof pckt.callback === "function"){
                                    //This is a user defined function to handle general callbacks when once defined in the codebase
                                    setTimeout(function () {
                                        pckt.callback(name, obj);
                                    });
                                }
                            }
                        }
                    })
                }
            })
            callbacks = {html:{},data:{},ts:Date.now()};
        },
        loadingTs: function(){
            loading.ts = Date.now();
        },
        status: function(){
            return {loading:loading,queued:queued,callbacks:callbacks};
        },
        id: function() {
            return id;
        }
    }
})(0);


let strc = (function () {
    return {
        sortObj: function (object,key,type) {
            object = object || [{}];
            type   = type || 'default';

            switch(type){
                case "numeric":
                    object.sort(function (a, b) {
                        return a[key] - b[key];
                    });
                    break;
                case "string":
                default:
                    object.sort(function (a, b) {
                        let x = a[key].toLowerCase();
                        let y = b[key].toLowerCase();
                        if (x < y) { return -1; }
                        if (x > y) { return 1; }
                        return 0;
                    });
                    break;
            }
            return object;
        },
        uuid: function(){
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    }
})();
//ok