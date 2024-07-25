//C.O.R.E ver:20240725;
const core = (() => {
    const template = document.createElement('template');
    const section  = document.getElementById('cr-data') || template.cloneNode(true);
    if(document.readyState === 'complete' ){
        setTimeout(()=>{core.init()});
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            core.init();
        });
    }
    return {
        get section() {
            return section;
        },
        get template() {
            return template;
        },
        init: () => {
            core.cr.initData();
            core.hp.addClickListeners();
            core.pk.getTemp();
            console.log('C.O.R.E started at ' + core.hp.date());
        },
        //backend functions
        be: (() => {
            return {
                getData: (dataRef, dataSrc) => {
                    const settings = core.be.preflight(dataRef, dataSrc, 'data');
                    fetch(settings.dataSrc)
                        .then((response) => {
                            return response.json()
                        }).then((dataObject) => {
                        dataObject = (core.be.postflight(settings.dataRef, dataObject, 'data') || dataObject);
                        core.cr.setData(settings.dataRef, dataObject);
                    }).catch((error) => {
                        console.error(error);
                    });
                },
                getTemp: (dataRef, dataSrc) => {
                    const settings = core.be.preflight(dataRef, dataSrc, 'temp');
                    fetch(settings.dataSrc)
                        .then((res) => {
                            return res.text()
                        }).then((dataString) => {
                        dataString = (core.be.postflight(settings.dataRef, (dataString || 'Not Found'), 'temp') || dataString);
                        core.cr.setTemp(settings.dataRef, dataString);
                    }).catch((error) => {
                        console.error(error);
                    });
                },
                preflight: (dataRef, dataSrc, type) => {
                    return {dataRef:dataRef, tempRef:dataRef, dataSrc:dataSrc, type:type};
                },
                postflight: (dataRef, dataObj, type) => {
                    switch(dataRef){
                        case 'prods':
                            dataObj = dataObj.products;
                            break;
                        case 'users':
                            dataObj = dataObj.users;
                            break;
                    }
                    return dataObj;
                },
            }
        })(),
        //callback functions
        cb: (() => {
            return {
                preflight: (dataRef, type) => {
                    //console.log('pre', dataRef, type);
                },
                postflight: (dataRef, type) => {
                    //console.log('post', dataRef, type);
                },
            }
        })(),
        //core functions
        cr: (() => {
            let storageType = 0; //TODO not in use
            return {
                set storageType(value) {
                    storageType = (+value || 0);
                },
                initData: () => {
                    let temps = section.querySelectorAll('template[name]') || [];
                    for (const temp of temps){
                        const tempName = temp.getAttribute('name');
                        core.cr.setTemp(tempName, core.cr.getTemp(tempName));
                    }
                },
                delData: (name, elem) => {
                    elem = (elem || section);
                    //DOM (Option A)
                    if(elem._customData && elem._customData.hasOwnProperty(name)){
                        delete elem._customData[name];
                    }
                    //STATIC (Option B)
                    if(elem.dataset.hasOwnProperty(name)){
                        delete elem.dataset[name];
                    }
                    //SESSION (Option C)
                    if(sessionStorage.getItem(name)){
                        sessionStorage.removeItem(name)
                    }
                },
                setData: (name, data, elem) => {
                    elem = (elem || section);
                    //delete previous data by name
                    core.cr.delData(name, elem);
                    //DOM (Option A)
                    elem._customData = {[name]:data};
                    //STATIC (Option B)
                    elem.dataset[name] = JSON.stringify(data);
                    //SESSION (Option C)
                    sessionStorage.setItem(name,JSON.stringify(data));

                    return core.cr.getData(name);
                },
                getData: (name, elem) => {
                    elem = (elem || section);
                    //DOM (Option A)
                    if(elem._customData && elem._customData.hasOwnProperty(name)){
                        return elem._customData[name];
                    }
                    //STATIC (Option B)
                    if(elem.dataset.hasOwnProperty(name)){
                        return JSON.parse(elem.dataset[name]);
                    }
                    //SESSION (Option C)
                    if(sessionStorage.getItem(name)){
                        return JSON.parse(sessionStorage.getItem(name));
                    }
                },
                delTemp: (name) => {
                    let temp = section.querySelector('[name=' + name + ']');
                    if(temp){
                        return temp.parentNode.removeChild(temp);
                    }
                },
                setTemp: (name, value) => {
                    //delete previous template by name
                    core.cr.delTemp(name);
                    //create new temp
                    let newTemp = template.cloneNode(true);
                    newTemp.setAttribute("name", name);
                    newTemp.textContent = escape(value);
                    //append new temp
                    section.appendChild(newTemp);
                },
                getTemp: (name) => {
                    let temp = section.querySelector('[name=' + name + ']') || template;
                    return String(unescape(temp.textContent || temp.innerHTML)).trim();
                },
            }
        })(),
        //helper functions
        hp: (() => {
            let prevSortKey;
            return {
                addClickListeners: () => {
                    let links = document.getElementsByTagName('a') || [];
                    for (const link of links){
                        core.hp.addClickListener(link);
                    }
                },
                addClickListener: (element) => {
                    const dataRef = element.dataset.pkTemplates;
                    const target  = (element.getAttribute('target') || 'main');
                    if(!dataRef) return;
                    //remove all listeners - replace element
                    const newElement = element.cloneNode(true);
                    element.parentNode.replaceChild(newElement, element);
                    //add listener to new element
                    newElement.addEventListener('click', (event) => {
                        event.preventDefault()
                        //set up the pocket
                        const pocket = document.createElement('div');
                        pocket.classList.add('pckt');
                        pocket.setAttribute('data-pk-templates', dataRef);
                        //determine the location
                        let section;
                        if (target.includes('#')) {
                            section = document.getElementById(target.replace('#', ''));
                        } else if (target.includes('.')) {
                            section = document.getElementsByClassName(target.replace('.', ''));
                        } else {
                            section = document.getElementsByTagName(target);
                        }
                        //empty the section
                        while(section.firstElementChild) {
                            section.firstElementChild.remove();
                        }
                        //add the pocket to DOM
                        section.append(pocket);
                        //fill pockets with templates
                        core.pk.getTemp();
                    });
                },
                date: (dateStr, format) => {
                    let date   = (dateStr || new Date().toLocaleString());
                    let output = (format || 'm/d/yy h:mm p').toUpperCase();

                    // Check Unix timestamp (numeric)
                    if (+date) {
                        date = date * 1000;
                    }

                    date = new Date(date);

                    //checks for valid date object
                    if(!Date.parse(date)){
                        return dateStr + '*';
                    }

                    switch (output){
                        case 'DATE':
                            output = 'M/D/YY';
                            break;
                        case 'TIME':
                            output = 'HH:MM'
                            break;
                    }

                    const D = date.getDate();
                    const M = date.getMonth() + 1;
                    const Y = date.getFullYear();
                    const h = date.getHours();
                    const H = (h % 12) || 12;
                    const m = date.getMinutes();
                    const s = date.getSeconds();
                    const p = (h >= 12 ? 'PM' : 'AM');
                    const t = String(Math.floor(date / 1000));

                    if(output === 'TS'){
                        return +t;
                    }

                    return output
                        .replace('HH', String(output.includes('P') ? H : h).padStart(2, '0'))
                        .replace('H', String(output.includes('P') ? H : h))
                        .replace(':MM', ':' + String(m).padStart(2, '0')) //above Month
                        .replace(':SS', ':' + String(s).padStart(2, '0'))
                        .replace('DD', String(D).padStart(2, '0'))
                        .replace('D', String(D))
                        .replace('MM', String(M).padStart(2, '0'))
                        .replace('M', String(M))
                        .replace('YYYY', String(Y))
                        .replace('YY', String(Y).substr(2))
                        .replace('P', p)
                        .replace('TS', t);
                },
                digData: (object, ref) => {
                    if(typeof ref === 'string'){
                        ref = ref.split(ref.includes(',') ? ',' : '.');
                    }
                    let member = ref.shift();
                    if(!isNaN(+member)){
                        member = +member; //try an index
                    }
                    if(object && object.hasOwnProperty(member)){
                        if(!ref.length){
                            return object[member];
                        }else{
                            return core.hp.digData(object[member], ref);
                        }
                    }
                },
                sortObj: (objects, key, type) => {
                    objects = objects || [{}];
                    type    = type || 'automatic';
                    let objType = typeof objects;

                    if(objType === 'object' && objects.length && objects[0].hasOwnProperty(key)){
                        //check if previous sort on same key
                        if(key === prevSortKey){
                            objects = objects.reverse();
                            return objects;
                        }
                        //check for dynamic sort type
                        if(type === 'automatic' && +objects[0][key] === objects[0][key]){
                            type = 'numeric';
                        }
                    }else{
                        console.error('Object does not contain key [' + key + ']')
                        return objects;
                    }

                    switch(type){
                        case "number":
                        case "numeric":
                            objects.sort(function (a, b) {
                                return a[key] - b[key];
                            });
                            break;
                        case "text":
                        case "string":
                        default:
                            objects.sort(function (a, b) {
                                let x = a[key].toLowerCase();
                                let y = b[key].toLowerCase();
                                if (x < y) { return -1; }
                                if (x > y) { return 1; }
                                return 0;
                            });
                            break;
                    }

                    prevSortKey = key;

                    return objects;
                },
                uuid: () => {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
                },
            }
        })(),
        //pocket functions
        pk: (() => {
            const temp  = template.cloneNode(true);
            let timeout = 2000;
            let dataList = [];
            let dataStart;
            let tempList = [];
            let tempStart;
            return {
                get timeout() {
                    return timeout;
                },
                set timeout(value) {
                    timeout = (+value || 2000);
                },
                getTemp: () => {
                    if(!tempStart){
                        tempStart = core.hp.date(null,'ts');
                    }

                    const requiredTempList = [];
                    const pass = [];

                    let pockets = document.getElementsByClassName('pckt');
                    for (const pocket of pockets){
                        //get the items
                        const temps = pocket.dataset.pkTemplates.split(',');
                        //fill the pockets w/items
                        for (const temp of temps){
                            requiredTempList.push(temp);
                            let hasTemp = core.cr.getTemp(temp);
                            //get data if not available
                            if(hasTemp){
                                pass.push(true);
                            }else if(!tempList.includes(temp)){
                                const dataSrc = pocket.dataset[temp + 'PkSource'];
                                tempList.push(temp);
                                core.be.getTemp(temp, (dataSrc || temp));
                            }
                        }
                    }

                    //check for complete objects or timeout
                    if(requiredTempList.length === pass.length || core.hp.date(null,'ts') - tempStart > pk_timeout){
                        //reset the checks
                        tempStart = null;
                        tempList  = [];
                        //add the data to the UX
                        core.pk.addTemp();
                    } else {
                        setTimeout(()=>{
                            core.pk.getTemp();
                        },250);
                    }
                },
                addTemp: () => {
                    //find the pocket elements
                    let pockets = document.getElementsByClassName('pckt');
                    for (const pocket of pockets){
                        //hide the pocket, shown when filled
                        pocket.style.display = 'none';
                        //get the items
                        const temps = pocket.dataset.pkTemplates.split(',')
                        //fill the pockets w/items
                        for (const temp of temps){
                            core.cb.preflight(temp, 'temp');
                            pocket.insertAdjacentHTML('beforeend', core.cr.getTemp(temp));
                            core.cb.postflight(temp, 'temp');
                        }
                        if(!pocket.getElementsByClassName('pk-clone').length){
                            pocket.style.display = '';
                        }
                    }
                    core.pk.getData();
                },
                getData: () => {
                    if(!dataStart){
                        dataStart = core.hp.date(null,'ts');
                    }
                    //find the clone elements
                    let clones = document.getElementsByClassName('pk-clone');
                    let pass   = [];

                    for (const clone of clones){
                        const dataRef = clone.dataset.pkData;
                        const dataSrc = clone.dataset.pkSource;
                        const records = core.cr.getData(dataRef);
                        //get data if not available
                        if(records){
                            pass.push(true);
                        }else if(!dataList.includes(dataRef)){
                            dataList.push(dataRef);
                            core.be.getData(dataRef, dataSrc);
                        }
                    }

                    //check for complete objects or timeout
                    if(clones.length === pass.length || core.hp.date(null,'ts') - dataStart > timeout){
                        //reset the checks
                        dataStart = null;
                        dataList  = [];
                        //add the data to the UX
                        core.pk.addData();
                    } else {
                        setTimeout(()=>{
                            core.pk.getData();
                        },250);
                    }
                },
                addData: () => {
                    //find the clone elements
                    let clones = document.getElementsByClassName('pk-clone');
                    for (const clone of clones){
                        const dataRef = clone.dataset.pkData;
                        const records = core.cr.getData(dataRef) || [];
                        const pattern = clone.cloneNode(true);
                        pattern.id = pattern.id || 'pk-' + (Math.random() + 1).toString(36).substring(7);
                        pattern.classList.remove("pk-clone");
                        pattern.classList.add("pk-cloned");
                        core.cb.preflight(dataRef, 'data');
                        clone.insertAdjacentHTML('beforebegin', core.pk.cloner(records, pattern.outerHTML));
                        core.cb.postflight(dataRef, 'data');
                    }
                    //remove the clone templates
                    while(clones[0]) {
                        //show the pocket, previously hidden
                        clones[0].closest('.pckt').style.display = '';
                        clones[0].remove();
                    }
                    let links = document.getElementsByTagName('a');
                    for (const link of links){
                        core.hp.addClickListener(link);
                    }
                },
                cloner: (records = [], tempName) => {
                    let newTempStr = '';
                    let ccount     = 0;
                    for (const record of records) {
                        let newString = tempName; //TODO should be able to use item reference name
                        //replace the placeholders {{rec:name}}
                        let placeholders = newString.match(/[^{\{]+(?=}\})/g) || [];
                        for(const placeholder of placeholders){
                            let [type, member, format, clue] = placeholder.split(':');
                            let value = record.hasOwnProperty(member) ? record[member] : null;
                            switch(type){
                                case 'aug':
                                    if(['index','i','count'].includes(member)) value = ccount + 1;
                                    break;
                                case 'rec':
                                default:
                                    //try digging for the value
                                    if(!value) value = core.hp.digData(record, member);
                                    break;
                            }
                            value = core.ux.modTemp(value, format, clue);
                            newString = newString.replaceAll('{{' + placeholder + '}}', value);
                        }
                        ccount++;
                        newTempStr = newTempStr + ' ' + newString;
                    }

                    return newTempStr;
                },
            }
        })(),
        //validation functions
        sb: (() => {
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
                },
            }
        })(),
        //user experience
        ux: (() => {
            return {
                modTemp: (value, formats, clue) => {
                    //value (mixed)
                    //formats (string) i.e., format*clue|format OR ['money*$','lower']
                    //clue (string)
                    formats = formats || [];
                    if(typeof formats === 'string') formats = formats.split('|');
                    for(const format of formats){
                        let [fformat, cclue] = format.split('*');
                        cclue = (cclue || clue);
                        switch(fformat){
                            case 'pk_cloner':
                                value = core.pk.cloner(value, core.cr.getTemp(clue) || 'not found');
                                break;
                            case 'upper':
                                value = value.toUpperCase();
                                break;
                            case 'upperfirst':
                                value = value.charAt(0).toUpperCase() + value.slice(1);
                                break;
                            case 'lower':
                                value = value.toLowerCase()
                                break;
                            case 'money':
                                value = (cclue === '$' ? cclue : '') + (+value).toFixed(2);
                                break;
                            case 'decimal':
                                value = (+value).toFixed(2) + (cclue || '');
                                break;
                            case 'date':
                                value = core.hp.date(value, cclue);
                                break;
                            case 'phone':
                                const check = String(value || "").replace(/[^0-9]/g, "");
                                if(value && check.length === 10){
                                    value = check.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
                                }
                                break;
                        }
                    }
                    return value;
                }
            }
        })(),
    }
})()