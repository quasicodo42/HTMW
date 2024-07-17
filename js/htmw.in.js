document.addEventListener("DOMContentLoaded", function() {
    //init
    const itemsData = $("items").data() || {};
    if(!strg.get("softCacheItems") && itemsData.hasOwnProperty("softCacheItems")){
        strg.set("softCacheItems",itemsData.softCacheItems.split(','));
    }
    if(!strg.get("noCacheItems") && itemsData.hasOwnProperty("noCacheItems")){
        strg.set("noCacheItems",itemsData.noCacheItems.split(','));
    }

    pckt.fillPockets();
});

const strg = (function () {
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

const scrb = (function () {
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

const pckt = (function(id) {
    let loading     = {html:[],data:[],ts:Date.now()};
    let queued      = {html:[],data:[],ts:Date.now()};
    let callbacks   = {html:{},data:{},ts:Date.now()};
    let maxLoadTime = 2000; //milliseconds
    let dataDir     = ''; // "/app.lists/json/";
    let htmlDir     = '/html/'; // "/html/";
    let prefix      = 'pa-';
    let recordsAt   = 'response';
    let udSettings  = {};
    return{
        get udSettings() {
            return udSettings;
        },
        set udSettings(value) {
            udSettings[value.name] = value.value;
        },
        get maxLoadTime() {
            return maxLoadTime;
        },
        set maxLoadTime(value) {
            maxLoadTime = (+value || 2000);
        },
        get dataDir() {
            return dataDir;
        },
        set dataDir(value) {
            dataDir = value;
        },
        get htmlDir() {
            return htmlDir;
        },
        set htmlDir(value) {
            htmlDir = value;
        },
        get prefix() {
            return prefix;
        },
        set prefix(value) {
            prefix = value;
        },
        get recordsAt() {
            return recordsAt;
        },
        set recordsAt(value) {
            recordsAt = value;
        },
        getData: function(name, post, callback){
            //if queued do nothing
            if(queued.data.includes(name)){
                return;
            }

            let fullPocket = $('<div>');
            if($("[data-data-source='" + name + "']")){
                fullPocket = $("[data-data-source='" + name + "']").not($('items').find("[data-data-source='" + name + "']"));
            }
            const fullPocketData = $(fullPocket).data();
            const hasPreflight   = (fullPocketData && fullPocketData.hasOwnProperty('preflight') && typeof pckt[fullPocketData.preflight] === "function");
            const hasPostflight  = (fullPocketData && fullPocketData.hasOwnProperty('postflight') && typeof pckt[fullPocketData.postflight] === "function");
            const hasAltName     = (fullPocketData && fullPocketData.hasOwnProperty('dataSourceName'));
            const altName        = (hasAltName ? fullPocketData.dataSourceName : null);

            if(hasPreflight){
                dataObj = pckt[fullPocketData.preflight]((altName || name));
            }else if(typeof pckt.preflight === "function"){
                pckt.preflight((altName || name));
            }

            //add to queue and delete
            strg.del(name);
            queued.data.push(name);
            if(hasAltName){
                queued.data.push(altName);
                strg.del(altName);
            }

            const settings = prefetch(true,(dataDir ? dataDir + name + ".json" : name), (post || {}));

            fetch(settings.url,settings.fetchParams)
                .then(response => response.json())
                .then(dataObj => {
                    if(hasPostflight){
                        dataObj = pckt[fullPocketData.postflight]((altName || name), dataObj) || dataObj;
                    }else if(typeof pckt.postflight === "function"){
                        dataObj = pckt.postflight((altName || name), dataObj) || dataObj;
                    }

                    dataObj = dataObj || {};

                    //remove from queue and set
                    queued.data = queued.data.filter(item => item !== name);
                    strg.set(name,dataObj);
                    if(hasAltName){
                        queued.data = queued.data.filter(item => item !== altName);
                        strg.set(fullPocketData.dataSourceName,dataObj);
                    }

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
                        pckt.emptyPockets($("[data-data-source='" + name + "']").not($('items').find("[data-data-source='" + name + "']")).closest(".pocket").attr("name"),1);
                    }
                    // finalize call
                    callbacks.data[name] = dataObj;
                    if(callback && typeof pckt[callback] === "function"){
                        setTimeout(function (){
                            pckt[callback](dataObj);
                        })
                    }
                    pckt.isFinished();
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        getHtml: function(name, pocketData, callback){
            $("#" + name).remove();
            //only try once check queue todo
            if(queued.html.includes(name)){
                return;
            }
            let endpoint = pckt.htmlDir + name + ".html";
            let override = "override" + name.charAt(0).toUpperCase() + name.slice(1);
            if(pocketData.hasOwnProperty(override)){
                endpoint = pocketData[override];
            }
            queued.html.push(name);

            const settings = prefetch(false, endpoint);

            fetch(settings.url, settings.fetchParams)
                .then(response => response.text())
                .then(htmlStr => {
                    queued.html = queued.html.filter(item => item !== name);
                    let item = $("<item id='" + name + "'>").html(htmlStr);
                    if((strg.get("softCacheItems") || []).includes(name) || $(item).find('[id]').length || !$('items').length) {
                        //softCacheItems
                        strg.mAdd("items",name,item[0].outerHTML);
                    }else{
                        //hardCacheItems
                        $("items").append(item);
                    }
                    //finalize call
                    callbacks.html[name] = htmlStr;
                    if(callback && typeof pckt[callback] === "function"){
                        setTimeout(function (){
                            pckt[callback](htmlStr);
                        })
                    }
                    pckt.isFinished();
                })
                .catch((error) => {
                    console.error(error);
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
                let defaultContents = $("items").find("item#default").html() || 'Loading...';
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
                let item     = (strg.get("items") ? (strg.get("items")[itemId] || $("items").find("item#" + itemId)) : $("items").find("item#" + itemId));
                let itemData = $(item).data();
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
                    item = $("items").find("item#default").length ? $("items").find("item#default") : $('<item>').text('Loading...');
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
            if(obj && obj.hasOwnProperty(member)){
                if(!digList.length){
                    return obj[member];
                }else{
                    return pckt.objectDig(obj[member], digList);
                }
            }
            return undefined;
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
                }else if(!obj || typeof obj === 'string'){
                    //no/bad data, abort
                    return;
                }

                var cloned = $($(clone)[0].outerHTML).empty().data({object:obj,cleanName:cleanName}).toggleClass("clone clone-container " +  cleanName).attr("data-ts",Date.now());
                if(obj.hasOwnProperty('recordsHeader') && obj.recordsHeader.length && obj.hasOwnProperty('records') && obj.records.length){
                    obj.records.forEach(function (record,i) {
                        let cloneHtml = $($(clone)[0].innerHTML);
                        if(!cloneHtml) return;
                        const recObj  = Object.fromEntries(obj.recordsHeader.map((_, i) => [obj.recordsHeader[i], record[i]]));
                        let cloneData = {index:i,record:record,recordHeader:obj.recordsHeader,rec:recObj,report:null,objectName:data.dataSource,cleanName:cleanName};
                        let report    = {notFound:[],nulls:[]};
                        record.forEach(function (delta,ii) {
                            let name  = obj.recordsHeader[ii];
                            let find  = '{{rec:' + name + '}}';
                            cloneHtml = $(($(cloneHtml)[0].outerHTML).split(find).join(delta))
                                //span all-in-one 
                                .find("span[data-member=" + name + "]").each(function () {
                                    const data = $(this).data();
                                    if(data.on){ //as a data attribute
                                        $(this).parent().attr('data-' + name.match(/[A-Z]?[a-z]+|[0-9]+|[A-Z]+(?![a-z])/g).join('-'), delta);
                                        cloneData[name] = delta;
                                    }
                                    if(data.up){ //as an element attribute
                                        $(this).parent().attr(name, delta);
                                    }
                                    if(data.hasOwnProperty('in') && data.in === false){
                                        $(this).remove();
                                    }else{
                                        $(this).html(delta);
                                    }
                                }).end()
                                //legacy functionality, deprecated as of 20240513, use <span>
                                //in = add delta to UI
                                .find("in[name=" + name + "]").each(function () {
                                    //get what's in there + $(this).html()
                                    let span = $("<span>").html(delta);
                                    $(this).replaceWith(span);
                                }).end()
                                //up = add delta as attribute on parent
                                .find("up[name=" + name + "]").each(function () {
                                    $(this).parent().attr(name, delta).end().remove();
                                }).end()
                                //on = add delta as data on parent
                                .find("on[name=" + name + "]").each(function () {
                                    $(this).parent().attr('data-' + name.match(/[A-Z]?[a-z]+|[0-9]+|[A-Z]+(?![a-z])/g).join('-'), delta).end().remove();
                                    cloneData[name] = delta;
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
                            }else if(value === null){
                                report.nulls.push(name);
                                value = '';
                            }else if(typeof value === 'object'){
                                value = JSON.stringify(value);
                            }
                            cloneHtml = $(($(cloneHtml)[0].outerHTML).split(find).join(value));
                        });
                        cloneData.report = report;
                        $(cloneHtml).toggleClass('cloned').data(cloneData);
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
})(41);

const strc = (function () {
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

function prefetch(isJson = true, url = '', data = {}, headers = {}, asBody = false) {
    // Defaults marked with *
    let fetchParams = {
        method: 'GET' , // *GET, POST, PUT, DELETE, etc.
        //mode: "no-cors", // *cors, no-cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        //credentials: "same-origin", // *same-origin, include, omit
        redirect: "follow", // manual, *follow, error
        //referrerPolicy: "no-referrer", // *no-referrer-when-downgrade, no-referrer, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url   
    }

    //override using pckt.udSettings
    if('fetchParams' in pckt.udSettings){
        fetchParams = pckt.udSettings.fetchParams;
        pckt.udSettings = {name:'fetchParams',value:undefined};
    }else{
        if('data' in pckt.udSettings){
            data = pckt.udSettings.data;
            pckt.udSettings = {name:'data',value:undefined};
        }
        if('headers' in pckt.udSettings){
            headers = pckt.udSettings.headers;
            pckt.udSettings = {name:'data',value:undefined};
        }
    }
    if('isJson' in pckt.udSettings){
        isJson = pckt.udSettings.isJson;
        pckt.udSettings = {name:'isJson',value:undefined};
    }
    if('url' in pckt.udSettings){
        url = pckt.udSettings.url;
        pckt.udSettings = {name:'url',value:undefined};
    }
    if('asBody' in pckt.udSettings){
        asBody = pckt.udSettings.asBody;
        pckt.udSettings = {name:'asBody',value:undefined};
    }

    if(Object.entries(data).length){
        fetchParams.method = 'POST';
        if(asBody){
            fetchParams.body = JSON.stringify(data);
        }else{
            const formData = new FormData();
            Object.entries(data).forEach(function(pair){
                formData.append(pair[0], String(pair[1]));
            })
            fetchParams.body = formData;
        }
    }

    if(Object.entries(headers).length){
        fetchParams.header = headers;
    }

    return {url:url,fetchParams:fetchParams};
}