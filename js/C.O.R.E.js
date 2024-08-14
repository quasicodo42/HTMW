//C.O.R.E ver:20240812.0;
let core_be_count = 0;
let core_cr_count = 0;
let core_pk_count = 0;
const core = (() => {
    const template  = document.createElement('template');
    const section   = document.getElementById('cr-data') || template.cloneNode(true);
    let useDebugger = false; //user setting
    let useRouting  = false; //user setting
    if(document.readyState === 'complete') {
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
        get useDebugger() {
            return useDebugger;
        },
        set useDebugger(value) {
            useDebugger = Boolean(+value);
        },
        set useRouting(value) {
            useRouting = Boolean(+value);
        },
        init: () => {
            core.cr.init();
            core.hf.addClickListeners();
            core.pk.init();
            if(useDebugger) console.log('C.O.R.E loaded at ' + core.hf.date());
        },
        //backend functions
        be: (() => {
            let cacheCreateTs      = {data:{},template:{}};
            let cacheExpire        = {data:{},template:{}}; //user setting
            let cacheExpireDefault = 86400; //user setting, in seconds
            let fetchLogFIFO       = {data:{},template:{}};
            return {
                get cacheCreateTs() {
                    return cacheCreateTs;
                },
                set cacheExpire(obj) {
                    //type is either data or template
                    //format: {type:'data',name:'quote',seconds:5}
                    if(core.hf.digData(obj,'type') && core.hf.digData(obj,'name') && core.hf.digData(obj,'seconds')){
                        cacheExpire[obj.type][obj.name] = (+obj.seconds || 0);
                    }
                },
                get cacheExpire() {
                    return cacheExpire;
                },
                set cacheExpireDefault(value) {
                    cacheExpireDefault = (+value || 0);
                },
                get fetchLogFIFO() {
                    return fetchLogFIFO;
                },
                setCacheTs: (dataRef, type) => {
                    cacheCreateTs[type][dataRef] = core.hf.date(null,'ts');
                },
                checkCacheTs: (dataRef, type) => {
                    const cacheLife = cacheExpire[type][dataRef] || cacheExpireDefault;
                    return (cacheCreateTs[type][dataRef] || core.hf.date(null,'ts')) + cacheLife > core.hf.date(null,'ts');
                },
                setGetParams: (settings) => {
                    let fetchParams = {
                        method: (settings.method || 'GET'),        // *GET, POST, PUT, PATCH, DELETE, etc.
                        //mode: "no-cors",                         // *cors, no-cors, same-origin
                        cache: (settings.cache || "no-cache"),     // *default, no-cache, reload, force-cache, only-if-cached
                        //credentials: "same-origin",              // *same-origin, include, omit
                        redirect: (settings.redirect || "follow"), // manual, *follow, error
                        //referrerPolicy: "no-referrer",           // *no-referrer-when-downgrade, no-referrer, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                    }

                    //checking for an key/value object of header pairs
                    if('headers' in settings && settings.headers && Object.entries(settings.headers).length){
                        fetchParams.headers = settings.headers;
                    }

                    if('fetchParams' in settings && settings.fetchParams && Object.entries(settings.fetchParams).length){
                        fetchParams = {...fetchParams, ...settings.fetchParams};
                    }

                    //checking for data in user-defined settings; an object of name/value pairs to be posted
                    if('data' in settings && settings.data && Object.entries(settings.data).length){
                        fetchParams.method = ['GET'].includes(settings.method) ? 'POST' : settings.method.toUpperCase();
                        //checking for a body post or a form post
                        if('isFormData' in settings && settings.isFormData){
                            const formData = new FormData();
                            Object.entries(settings.data).forEach(function(pair){
                                formData.append(pair[0], String(pair[1]));
                            })
                            fetchParams.body = formData;
                        }else{
                            fetchParams.body = JSON.stringify(settings.data);
                        }
                    }

                    //log and return
                    settings.fetchParams = fetchParams;
                    fetchLogFIFO[settings.type][settings.dataRef] = settings;
                    return fetchParams;
                },
                getData: (dataRef, dataSrc, settings) => {
                    settings = {...core.be.preflight(dataRef, dataSrc, 'data'), ...settings};
                    core.be.setCacheTs(dataRef, 'data');
                    core_be_count++;
                    fetch(settings.dataSrc, core.be.setGetParams(settings))
                        .then((response) => {
                            core_be_count--;
                            return (response.ok ? response.json() : '{"error":true,"settings":' + JSON.stringify(settings) + '}');
                        }).then((dataObject) => {
                        dataObject = (core.be.postflight(settings.dataRef, dataObject, 'data') || dataObject);
                        core.cr.setData(settings.dataRef, dataObject);
                    }).catch((error) => {
                        core_be_count--;
                        console.error(error);
                    });
                },
                getTemplate: (dataRef, dataSrc, settings) => {
                    settings = {...core.be.preflight(dataRef, dataSrc, 'template'), ...settings};
                    core.be.setCacheTs(dataRef, 'template');
                    core_be_count++;
                    fetch(settings.dataSrc, core.be.setGetParams(settings))
                        .then((response) => {
                            core_be_count--;
                            return (response.ok ? response.text() : '{"error":true,"settings":' + JSON.stringify(settings) + '}');
                        }).then((dataString) => {
                        dataString = (core.be.postflight(settings.dataRef, (dataString || 'Not Found'), 'template') || dataString);
                        core.cr.setTemplate(settings.dataRef, dataString);
                    }).catch((error) => {
                        core_be_count--;
                        console.error(error);
                    });
                },
                preflight: (dataRef, dataSrc, type) => {
                    //settings: method, cache, redirect, headers, data, isFormData,...dataRef, dataSrc, type
                    let defaultSettings = {
                        dataRef: dataRef,
                        dataSrc: dataSrc,
                        type: type,
                        method: 'GET',
                        cache: 'no-cache',
                        redirect: 'follow',
                        headers: null,
                        data: null,
                        isFormData: false,
                    }
                    if(typeof core.be_preflight === "function"){
                        return {...defaultSettings, ...core.be_preflight(dataRef, dataSrc, type)};
                    }
                    return defaultSettings;
                },
                postflight: (dataRef, dataObj, type) => {
                    if(typeof core.be_postflight === "function"){
                        return core.be_postflight(dataRef, dataObj, type);
                    }
                    return dataObj;
                },
            }
        })(),
        //callback functions
        cb: (() => {
            return {
                preflight: (dataRef, dataObj, type) => {
                    if(typeof core.cb_preflight === "function"){
                        core.cb_preflight(dataRef, dataObj, type);
                    }
                },
                postflight: (dataRef, dataObj, type) => {
                    if(typeof core.cb_postflight === "function"){
                        core.cb_postflight(dataRef, dataObj, type);
                    }
                },
            }
        })(),
        //create functions
        cr: (() => {
            let storageIdDefault = 1;
            return {
                set storageIdDefault(value) {
                    storageIdDefault = (+value || 0);
                },
                init: () => {
                    let preloaded = [];
                    let templates = section.querySelectorAll('template[name]') || [];
                    for (const template of templates){
                        const templateName = template.getAttribute('name');
                        core.cr.setTemplate(templateName, core.cr.getTemplate(templateName));
                        preloaded.push(templateName);
                    }
                    //setup keyword templates
                    if(!preloaded.includes('EMPTY')){
                        core.cr.setTemplate('EMPTY', '');
                    }
                    if(!preloaded.includes('LOADING')){
                        core.cr.setTemplate('LOADING', '<marquee width="50%">loading...</marquee>');
                    }
                },
                delData: (name, elem, storageId) => {
                    elem      = (elem || section);
                    storageId = storageId || storageIdDefault;

                    if(storageId === 0 && elem._CORE_Data && elem._CORE_Data.hasOwnProperty(name)){
                        //DOM (Option A)
                        delete elem._CORE_Data[name];
                    }else if(storageId === 1 && elem.dataset.hasOwnProperty(name)){
                        //STATIC (Option B)
                        delete elem.dataset[name];
                    }else if(storageId === 2 && sessionStorage.getItem(name)){
                        //SESSION (Option C), elem is ignored
                        sessionStorage.removeItem(name)
                    }
                },
                setData: (name, data, elem, storageId) => {
                    elem      = (elem || section);
                    storageId = storageId || storageIdDefault;

                    //delete previous data by name
                    core.cr.delData(name, elem);

                    if(storageId === 0){
                        //DOM (Option A)
                        elem._CORE_Data = {[name]:data};
                    }else if(storageId === 1){
                        //STATIC (Option B)
                        elem.dataset[name] = JSON.stringify(data);
                    }else if(storageId === 2){
                        //SESSION (Option C), elem is ignored
                        sessionStorage.setItem(name, JSON.stringify(data));
                    }

                    return core.cr.getData(name, elem);
                },
                getData: (name, elem, storageId) => {
                    elem = (elem || section);
                    storageId = storageId || storageIdDefault;

                    if(core.be.checkCacheTs(name, 'data')){
                        if(storageId === 0 && elem._CORE_Data && elem._CORE_Data.hasOwnProperty(name)){
                            //DOM (Option A)
                            return elem._CORE_Data[name];
                        }else if(storageId === 1 && elem.dataset.hasOwnProperty(name)){
                            //STATIC (Option B)
                            return JSON.parse(elem.dataset[name]);
                        }else if(storageId === 2 && sessionStorage.getItem(name)){
                            //SESSION (Option C), elem is ignored
                            return JSON.parse(sessionStorage.getItem(name));
                        }
                    }else{
                        //TODO need to figure out how to restart the cache if expired
                        //core.cr.delData(name, elem, storageId);
                        if(useDebugger) console.log("C.O.R.E cache '" + name + "' has expired");
                    }
                },
                delTemplate: (name) => {
                    let template = section.querySelector('[name=' + name + ']');
                    if(template){
                        return template.parentNode.removeChild(template);
                    }
                },
                setTemplate: (name, value) => {
                    //delete previous template by name
                    core.cr.delTemplate(name);
                    //create new template
                    let newTemplate = template.cloneNode(true);
                    newTemplate.setAttribute("name", name);
                    newTemplate.textContent = escape(value);
                    //append new template
                    section.appendChild(newTemplate);
                },
                getTemplate: (name) => {
                    let newTemplate = (section.querySelector('[name=' + name + ']') || template);
                    return String(unescape(newTemplate.textContent || newTemplate.innerHTML)).trim();
                },
            }
        })(),
        //helper functions
        hf: (() => {
            let prevSortKey;
            return {
                addClickListeners: () => {
                    let links = document.getElementsByTagName('a') || [];
                    for (const link of links){
                        core.hf.addClickListener(link);
                    }
                },
                addClickListener: (element) => {
                    const dataRefs = element.dataset.coreTemplates;
                    const target  = (element.getAttribute('target') || 'main');
                    if(!dataRefs) return;
                    //check for data sources
                    let dataSources = [];
                    //pocket.dataset[template + 'CoreSource']
                    const templates = dataRefs.split(',').map(s => String(s).trim()).filter(Boolean);
                    for(const template of templates){
                        const source = element.dataset[template + 'CoreSource'];
                        if(source){
                            dataSources.push({name:template, url:source});
                        }
                    }
                    //remove all listeners - replace element
                    const newElement = element.cloneNode(true);
                    element.parentNode.replaceChild(newElement, element);
                    //add listener to new element
                    newElement.addEventListener('click', (event) => {
                        event.preventDefault()
                        //set up the pocket
                        core.ux.insertPocket(target, dataRefs, dataSources);
                    });
                },
                ccNumAuth: (ccNum) => {
                    // Remove spaces and non-digit characters
                    ccNum = String(ccNum).replace(/\D/g, "");

                    // Check if the number is empty or not a number
                    if (!ccNum || isNaN(ccNum)) {
                        return { isValid: false, type: "Invalid" };
                    }

                    // Luhn algorithm for validation
                    let sum = 0;
                    let alternate = false;
                    for (let i = ccNum.length - 1; i >= 0; i--) {
                        let digit = parseInt(ccNum.charAt(i), 10);
                        if (alternate) {
                            digit *= 2;
                            if (digit > 9) {
                                digit -= 9;
                            }
                        }
                        sum += digit;
                        alternate = !alternate;
                    }

                    const isValid = sum % 10 === 0;

                    // Check card type based on prefix and length
                    let type = "Unknown";
                    if (/^3[47]/.test(ccNum) && ccNum.length === 15) {
                        type = "American Express";
                    } else if (/^5[1-5]/.test(ccNum) && ccNum.length === 16) {
                        type = "MasterCard";
                    } else if (/^4/.test(ccNum) && [13, 16].includes(ccNum.length)) {
                        type = "Visa";
                    } else if (/^6011/.test(ccNum) && ccNum.length === 16) {
                        type = "Discover";
                    }

                    return {isValid,type};
                },
                copy: (text) => {
                    let successful = false;
                    let textarea   = document.createElement("textarea");
                    textarea.id               = 'copyarea';
                    textarea.value            = text;
                    textarea.style.top        = 0;
                    textarea.style.left       = 0;
                    textarea.style.width      = '2em';
                    textarea.style.height     = '2em';
                    textarea.style.border     = 'none';
                    textarea.style.padding    = 0;
                    textarea.style.outline    = 'none';
                    textarea.style.position   = 'fixed';
                    textarea.style.boxShadow  = 'none';
                    textarea.style.background = 'transparent';
                    document.body.appendChild(textarea);
                    textarea.select();
                    try {
                        successful = document.execCommand('copy');
                    } catch (err) {
                        if(useDebugger) console.log('C.O.R.E copy unsuccessful');
                    }
                    document.body.removeChild(textarea);
                    return successful;
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
                    }else if(output === 'PERF'){
                        return performance.now();
                    }

                    return output
                        .replace('HH', String(output.includes('P') ? H : h).padStart(2, '0'))
                        .replace('H', String(H))
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
                /**
                 * Digs through an object looking for a value using a dot delimited string as a reference
                 * Examples:
                 * addresses.billing.street RETURNS the street value of billing of the parent addresses
                 * news.categories.0 RETURNS the 0 index of the array categories of the parent news
                 * *OPTIONALLY news.categories.[n] will return the joined array, all indexes as a string
                 *
                 * @param {object} object - The target object to be searched.
                 * @param {string[]} ref - The string reference that will be used to dig through the object.
                 * @returns {mixed} The string value that if found or undefined.
                 */
                digData: (object, ref) => {
                    if(typeof ref === 'string'){
                        ref = ref.split(ref.includes(',') ? ',' : '.');
                    }
                    let member = (ref || []).shift();
                    if(!isNaN(+member)){
                        member = +member; //try an index
                    }else if(member === '[n]' && Array.isArray(object)){
                        return object.join(', ');
                    }
                    if(object && object.hasOwnProperty(member)){
                        if(!ref.length){
                            return object[member];
                        }else{
                            return core.hf.digData(object[member], ref);
                        }
                    }
                },
                getRoute: (which) => { //TODO
                    const urlObj = new URL(window.location.href);
                    return urlObj[which || 'href'];
                },
                setRoute: (base, title, append, info) => {
                    base  = base || core.hf.getRoute();
                    title = title || 'C.O.R.E';
                    const state  = { additionalInformation: (info || 'Updated bookmark location') };
                    if(append){
                        base+= append;
                    }
                    window.history.replaceState(state, title, base);
                },
                /**
                 * Sorts an array of objects by key.
                 *
                 * @param {array} objects - The array of objects to be sorted.
                 * @param {string} key - The key that will be used to sort.
                 * @returns {array} The sorted object.
                 */
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
                /**
                 * Creates a UUID
                 *
                 * @returns {string} The UUID
                 */
                uuid: () => {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                        let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
                },
                /**
                 * Hydrates HTML tag content by using the class attribute as directive
                 * Basic Syntax: <span class="h-user-name">Bobby</span> Result -> <span class>John</span>
                 * Default Examples: h-userId, h-user-name, h-user-billing.address1, element will be hydrated (appended) and the class removed
                 * Options: h--countdown; element will be newly hydrated each call to the function
                 *
                 * @returns {void}
                 */
                hydrateByClass: () => {
                    const elements = document.querySelectorAll('[class^="h-"],[class*=" h-"]');
                    for (const element of elements){
                        const hClasses = Array.from(element.classList).filter(function (n) {return n.startsWith('h-')});
                        for (const hClass of hClasses){
                            const [ref, cache, memberRef] = hClass.split('--').join('-').split('-');
                            const data     = (core.cr.getData(cache) || {[memberRef]: cache + '*'});
                            const tag      = element.tagName;
                            const value    = core.hf.digData(data, memberRef);
                            const delClass = !hClass.includes('h--');
                            if(value){
                                switch(tag) {
                                    case 'INPUT':
                                    case 'SELECT':
                                    case 'TEXTAREA':
                                        element.value = String(value);
                                        break;
                                    default:
                                        if(delClass){
                                            element.innerHTML+= String(value);
                                        }else{
                                            element.innerHTML = String(value);
                                        }
                                }
                                if(delClass){
                                    element.classList.remove(hClass);
                                }
                            }
                        }
                    }
                    if(useDebugger && elements.length) console.log('C.O.R.E hydrating ' + elements.length + ' elements');
                },
                /**
                 * Formats HTML tag content by using the class attribute as directive
                 * Basic Syntax: <span class="f-upper">john</span> Result -> <span class>JOHN</span>
                 * Default Examples: f-money, f-upper, f-date-time, this will be formatted once and the class removed
                 * Options: f--money, this will continue to be formatted each call to the function
                 * Advanced Syntax: <div class="f-money" data-f-default="0" data-f-clue="USD">
                 *
                 * @returns {void}
                 */
                formatByClass: () => {
                    const elements = document.querySelectorAll('[class^="f-"],[class*=" f-"]');
                    for (const element of elements){
                        const fClasses = Array.from(element.classList).filter(function (n) {return n.startsWith('f-')});
                        let value      = element.innerHTML;
                        //check for possible arguments
                        let fDefault = (element.dataset.fDefault || '');
                        let fClue    = (element.dataset.fClue || null);

                        //begin formatting
                        for (const fClass of fClasses){
                            const delClass = !fClass.includes('f--');
                            //take care of nulls/empties
                            if(value === 'null' || !value.length){
                                value = fDefault;
                            }

                            //change class to format; f-money -> money, f--left-pad -> leftpad
                            const format = fClass.split('f-').join('').split('-').join('').toLowerCase();
                            element.innerHTML = core.ux.formatValue(value, format, fClue);

                            if(delClass){
                                element.classList.remove(fClass);
                            }
                        }
                    }
                    if(useDebugger && elements.length) console.log('C.O.R.E formatting ' + elements.length + ' elements');
                },
            }
        })(),
        //pocket functions
        pk: (() => {
            let timeout  = 2000;
            let dataList = [];
            let dataStart;
            let dataEnd;
            let dataLapse;
            let timedOut = false;
            let templateList = [];
            let templateStart;
            let stackTs;
            let directive = [];
            return {
                get timeout() {
                    return timeout;
                },
                set timeout(value) {
                    timeout = (+value || 2000);
                },
                init: () => {
                    //check to use routing info for pocket setup
                    const hash = core.hf.getRoute('hash');
                    if(useRouting && hash && hash.includes(escape('"t"')) && hash.includes(escape('"l"')) && hash.includes(escape('"n"'))){
                        //build the UX according to the incoming hash directive
                        const directive = JSON.parse(unescape(core.hf.getRoute('hash').split('#').join('')));
                        for (const settings of directive){
                            let nameList    = [];
                            let dataSources = [];
                            for (const item of settings.l){
                                nameList.push(item.n);
                                if(item.hasOwnProperty('u')){
                                    dataSources.push({name:item.n,url:item.u});
                                }
                            }
                            const target   = settings.t;
                            const dataRefs = nameList.join(','); //string
                            core.ux.insertPocket(target, dataRefs, dataSources, false);
                        }
                    }
                    core.pk.soc();
                },
                /**
                 * End of Call
                 * The final running function of the DOM manipulation, cleanup
                 * Will call user-defined function: core.pk_eoc, if available
                 *
                 * @returns {void}
                 */
                eoc: () => {
                    if(!timedOut && (core_pk_count || core_be_count || core_cr_count)) {
                        if(useDebugger) console.log('C.O.R.E exception', {core_pk_count, core_be_count, core_cr_count, dataLapse});
                        core.pk.soc();
                        return;
                    }
                    core.hf.hydrateByClass();
                    core.hf.formatByClass();
                    //build the route directive from the DOM
                    let pockets = document.getElementsByClassName('core-pocket');
                    for (const pocket of pockets) {
                        //get the parent
                        const parent = pocket.parentNode;
                        const target = '#' + parent.id;
                        //get the items
                        const lists = [];
                        const templates = (pocket.dataset.coreTemplates || '').split(',').map(s => String(s).trim()).filter(Boolean);
                        for (const template of templates){
                            if(!template) continue;
                            let list = {n:template};
                            if(pocket.dataset[template + 'CoreSource']){
                                list.u = pocket.dataset[template + 'CoreSource'];
                            }
                            lists.push(list);
                        }
                        directive.push({t:target,l:lists})
                    }
                    //update the URL
                    if(useRouting) core.hf.setRoute(core.hf.getRoute('origin') + core.hf.getRoute('pathname') + core.hf.getRoute('search'), null, '#' + escape(JSON.stringify(directive)))
                    if(useDebugger) console.log('C.O.R.E completed in ' + (core.hf.date(null,'perf') - stackTs).toFixed(1) + 'ms');
                    //reset functional variables
                    stackTs   = 0;
                    directive = [];
                    if(typeof core.pk_eoc === "function"){
                        core.pk_eoc();
                    }
                },
                /**
                 * Start of Call
                 * The initial function of the DOM manipulation
                 * Will call user-defined function: core.pk_soc, if available
                 *
                 * @returns {void}
                 */
                soc: () => {
                    //don't continue until all preloaded backend data is loaded
                    if(core_be_count){
                        if(timedOut) {
                            core.pk.eoc();
                        }else{
                            setTimeout(()=>{
                                core.pk.soc();
                            },100);
                            if(useDebugger) console.log('C.O.R.E preloading requested data/templates(' + core_be_count + ').');
                        }
                        return;
                    }

                    //call user-defined start of function if declared
                    if(typeof core.pk_soc === "function"){
                        core.pk_soc();
                    }
                    core.pk.getTemplate();
                },
                getTemplate: () => {
                    core_pk_count++;

                    if(!stackTs){
                        stackTs = core.hf.date(null,'perf');
                    }

                    if(!templateStart){
                        templateStart = core.hf.date(null,'ts');
                    }

                    const requiredTempList = [];
                    const pass = [];

                    let pockets = document.getElementsByClassName('core-pocket');
                    for (const pocket of pockets){
                        //get the items
                        const templates = (pocket.dataset.coreTemplates || '').split(',').map(s => String(s).trim()).filter(Boolean);
                        for (const template of templates){
                            if(!template) continue;
                            //fill the pockets w/items
                            requiredTempList.push(template);
                            let hasTemplate = core.cr.getTemplate(template);
                            //get data if not available
                            if(hasTemplate || template === 'EMPTY'){
                                pass.push(true);
                            }else if(!templateList.includes(template)){
                                //add loading
                                pocket.insertAdjacentHTML('beforeend', core.cr.getTemplate('LOADING'));
                                const dataSrc = pocket.dataset[template + 'CoreSource'];
                                templateList.push(template);
                                core.be.getTemplate(template, (dataSrc || template));
                            }
                        }
                    }

                    core_pk_count--;

                    //check for complete objects or timeout
                    if(requiredTempList.length === pass.length || core.hf.date(null,'ts') - templateStart > core.pk.timeout){
                        //reset the checks
                        templateStart = null;
                        templateList  = [];
                        //add the data to the UX
                        core.pk.addTemplate();
                    } else {
                        setTimeout(()=>{
                            core.pk.getTemplate();
                        },100);
                        return;
                    }

                    //End of Call
                    core.pk.eoc();
                },
                addTemplate: () => {
                    core_pk_count++;
                    //find the pocket elements
                    let pockets = document.getElementsByClassName('core-pocket');
                    for (const pocket of pockets){
                        //empty the pocket
                        while (pocket.firstElementChild) {
                            pocket.firstElementChild.remove();
                        }
                        //hide the pocket, shown when filled
                        pocket.style.display = 'none';
                        //get the items
                        const templates = (pocket.dataset.coreTemplates || '').split(',').map(s => String(s).trim()).filter(Boolean);
                        for (const template of templates){
                            if(!template) continue;
                            //fill the pockets w/items
                            core.cb.preflight(template, null, 'template');
                            pocket.insertAdjacentHTML('beforeend', core.cr.getTemplate(template));
                            core.cb.postflight(template, null, 'template');
                        }
                        if(!pocket.getElementsByClassName('core-clone').length){
                            pocket.style.display = '';
                        }
                    }
                    core.pk.getData();
                    core_pk_count--;
                },
                getData: () => {
                    core_pk_count++;
                    if(!dataStart){
                        dataStart = core.hf.date(null,'perf');
                    }
                    //find the clone elements
                    let clones = document.getElementsByClassName('core-clone');
                    let pass   = [];

                    for (const clone of clones){
                        const dataRef = clone.dataset.coreData;
                        const dataSrc = clone.dataset.coreSource;
                        const records = core.cr.getData(dataRef);
                        //get data if not available
                        if(core.be.checkCacheTs(dataRef, 'data') && records){
                            dataList = dataList.filter(item => item !== dataRef);
                            pass.push(true);
                        }else if(!dataList.includes(dataRef)){
                            dataList.push(dataRef);
                            core.be.getData(dataRef, dataSrc);
                        }
                    }

                    //check for complete objects or timeout
                    dataEnd = core.hf.date(null,'perf');
                    if(clones.length === pass.length || (dataEnd - dataStart) > timeout){
                        dataLapse = (dataEnd - dataStart).toFixed(1);
                        if(dataLapse > timeout){
                            timedOut = true;
                            if(useDebugger) console.log('C.O.R.E timed out due to setting of ' + timeout + 'ms.');
                        }else{
                            if(useDebugger) console.log('C.O.R.E loaded data (' + dataList.length + ') in ' + dataLapse + 'ms.', clones.length, pass.length);
                        }
                        //reset the checks
                        dataStart = null;
                        dataList  = [];
                        //add the data to the UX
                        core.pk.addData();
                    } else {
                        setTimeout(()=>{
                            core.pk.getData();
                        },100);
                    }
                    core_pk_count--;
                },
                addData: () => {
                    core_pk_count++;
                    //find the clone elements
                    let clones = document.getElementsByClassName('core-clone');
                    for (const clone of clones){
                        const dataRef = clone.dataset.coreData;
                        const records = core.cr.getData(dataRef) || [];
                        const pattern = clone.cloneNode(true);
                        pattern.id = pattern.id || 'core-' + (Math.random() + 1).toString(36).substring(7);
                        pattern.classList.remove("core-clone");
                        pattern.classList.add("core-cloned");
                        core.cb.preflight(dataRef, records, 'data');
                        clone.insertAdjacentHTML('beforebegin', core.pk.cloner(records, pattern.outerHTML));
                        core.cb.postflight(dataRef, records, 'data');
                    }
                    //remove the clone templates
                    while(clones[0]) {
                        //show the pocket, previously hidden
                        clones[0].closest('.core-pocket').style.display = '';
                        clones[0].remove();
                    }
                    let links = document.getElementsByTagName('a');
                    for (const link of links){
                        core.hf.addClickListener(link);
                    }
                    core_pk_count--;
                },
                cloner: (records = [], templateRef) => {
                    core_pk_count++;
                    let newTemplateStr = '';
                    let count          = 0;
                    for (const record of records) {
                        let newString = templateRef; //TODO should be able to use item reference name
                        //replace the placeholders {{rec:name}}
                        let placeholders = newString.match(core.sv.regex.dblcurly) || [];
                        for (const placeholder of placeholders){
                            let [type, member, format, clue] = placeholder.split(':');
                            let value = record.hasOwnProperty(member) ? record[member] : null;
                            switch(type){
                                case 'aug': case '!':
                                    if(['i','index'].includes(member)) value = count;
                                    else if(['c','count'].includes(member)) value = count + 1;
                                    break;
                                case 'rec': case '#':
                                default:
                                    //try digging for the value
                                    if(!value) value = core.hf.digData(record, member);
                                    break;
                            }
                            value = core.ux.formatValue(value, format, clue);
                            newString = newString.replaceAll('{{' + placeholder + '}}', value);
                        }
                        count++;
                        newTemplateStr = newTemplateStr + ' ' + newString;
                    }
                    core_pk_count--;
                    return newTemplateStr;
                },
            }
        })(),
        //validation functions
        sv: (() => {
            let regex        = {};
            regex.email      = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            regex.phoneUS    = /(\d{3})(\d{3})(\d{4})/;
            regex.numbers    = /[^0-9]/g;
            regex.floats     = /[^0-9.]/g;
            regex.alpha      = /[^A-Za-z]/g;
            regex.alphasp    = /[^A-Za-z\s]/g;
            regex.alphanum   = /[^A-Za-z0-9]/g;
            regex.alphanumsp = /[^\w\s]/gi;
            regex.dblcurly   = /[^{\{]+(?=}\})/g;
            return{
                get regex() {
                    return regex;
                },
                format: function (value, formatStr, valueDefault) {
                    let [format, vDefault, clue] = String(formatStr || 'default').split('.');
                    let [clueCount, cluePad]     = String(clue || '4|0').split('|');
                    switch(format.toLowerCase()){
                        case 'alphaonly':
                            value = value.replace(regex.alpha, '');
                            break;
                        case 'array':
                            value = Object.values(value);
                            break;
                        case 'boolean':
                            value = (value && value !== "0" && String(value).toLowerCase() !== "false" ? true : false);
                            break;
                        case 'date':
                        case 'datetime':
                            value = core.hf.date(value, clue);
                            break;
                        case 'decimal':
                            value = (+value).toFixed(2) + (clue || '');
                            break
                        case 'encrypt':
                            value = value.split('').sort().reverse().join('');
                            break;
                        case 'float':
                            value = value.replace(regex.floats, '');
                            break;
                        case 'email':
                        case 'lower':
                            value = value.toLowerCase();
                            break;
                        case 'money':
                            if(clue === 'USD'){
                                clue = '$';
                            }
                            value = (clue === '$' ? clue : '') + (+value).toFixed(2);
                            break;
                        case 'nospace':
                            value = value.split(' ').join('');
                            break;
                        case 'null':
                            value = null;
                            break;
                        case 'number':
                            if (value !== null && value !== undefined && String(value).length) {
                                value = parseFloat(String(value).replace(regex.floats, "")) || null;
                            }else{
                                value = null;
                            }
                            break;
                        case 'numonly':
                            value = value.replace(regex.numbers, '');
                            break;
                        case 'object':
                            let result = {};
                            let keys = Object.keys(value);
                            let vals = Object.values(value);
                            keys.forEach((key, i) => result[key] = vals[i]);
                            value = result;
                            break;
                        case 'padleft':
                            value = String(value).padStart(+clueCount, cluePad);
                            break;
                        case 'padright':
                            value = String(value).padEnd(+clueCount, cluePad);
                            break;
                        case 'fax':
                        case 'phone':
                            let check = String(value || "").replace(regex.numbers, "");
                            if(value && check.length === 10){
                                value = check.replace(regex.phoneUS, "($1) $2-$3");
                            }
                            break;
                        case 'core_pk_attr':
                            value = ' ' + clue + '="' + value + '" ';
                            break
                        case 'core_pk_cloner': //TODO not working in recursion
                            value = core.pk.cloner(value, core.cr.getTemplate(clue) || 'not found');
                            break;
                        case 'removehtml':
                            let tempElem = document.createElement('DIV');
                            tempElem.innerHTML = value;
                            value = tempElem.textContent || tempElem.innerText || '';
                            break;
                        case 'string':
                            value = String(value);
                            break;
                        case 'tinyhash':
                            value = String(value).split("").map(v=>v.charCodeAt(0)).reduce((a,v)=>a+((a<<7)+(a<<3))^v).toString(16);
                            break;
                        case 'truncate':
                            value = value.length < +clue ? value : value.substring(0, +clue) + '...';
                            break;
                        case 'upper':
                            value = value.toUpperCase();
                            break;
                        case 'upperfirst':
                            value = value.charAt(0).toUpperCase() + value.slice(1);
                            break;
                    }
                    return value || (vDefault ? core.sv.format(vDefault,format) : value);
                },
                scrub: function (scrubArr) {
                    //[{name:"name",value:"John",scrubs:["req","lower"]}]
                    let resultObj = {success:true,scrubs:[],errors:{}};
                    scrubArr.forEach(function (scrubObj,i) {
                        scrubArr[i] = core.sv.scrubEach(scrubObj,scrubArr);
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
                        let [format, clue, other] = String(scrubs).split(":").map(s => String(s).trim()).filter(Boolean);
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
                            case "ccnum":
                                eachResult.success = core.hf.ccNumAuth(scrubObj.value).isValid;
                                eachResult.error = "A valid credit card number is required.";
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
                                eachResult.success = core.sv.scrubMatch(scrubArr,scrubObj,clue);
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
                                scrubObj.value = core.sv.format(scrubObj.value,"lower");
                                break;
                            default:
                                scrubObj.value = core.sv.format(scrubObj.value,format);
                        }

                        if(!eachResult.success){
                            scrubObj.errors.push(eachResult.error);
                            scrubObj.success = false;
                        }
                    });

                    return scrubObj;
                },
                scrubSimple: function (name,value,scrubs) {
                    return core.sv.scrubEach({name:name,value:value,scrubs:scrubs});
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
                /**
                 * Applies formatting to a string.
                 *
                 * @param {any} value - Usually a string, but some formats may require another type
                 * @param {any} formatList - An array of formats, a single format, or a pipe delimited list of formats, i.e., format*clue|format OR ['money*$','lower']
                 * @param {string} clue - A clue used as an argument in the formatting a string.
                 * @returns {string} The new value after formatting.
                 */
                formatValue: (value, formatList, clue) => {
                    formatList = formatList || [];
                    //check for pipe delimited string
                    if(typeof formatList === 'string') formatList = formatList.split('|');
                    for (const formatItem of formatList){
                        //checking for format*clue format
                        let [formatName, clueOverride] = formatItem.split('*');
                        let clueFinal = (clueOverride || clue);
                        if(formatName === 'core_pk_cloner'){
                            value = core.pk.cloner(value, core.cr.getTemplate(clueFinal) || 'not found');
                        }else{
                            value = core.sv.format(value, [formatName,'unavailable',clueFinal].join('.'),clueFinal)
                            if(typeof core.ux_modTemp === 'function'){
                                value = core.ux_modTemp(value, formatList, clue);
                            }
                        }
                    }
                    return value;
                },
                insertPocket: (target, dataRefs, dataSources = [], autoFill = true) => {
                    if(!dataRefs) return;
                    let isSilent = target.includes('core_be_get');
                    let isData   = target.includes('Data');
                    //set up the pocket
                    const pocket = document.createElement('div');
                    pocket.classList.add('core-pocket');
                    pocket.setAttribute('data-core-templates', dataRefs);
                    let ignoreTemplates = [];
                    if(dataSources.length){
                        for(const source of dataSources){
                            pocket.setAttribute('data-' + source.name + '-core-source', source.url);
                            if(isSilent){
                                ignoreTemplates.push(source.name);
                                if(isData){
                                    core.be.getData(source.name, source.url);
                                }else{
                                    core.be.getTemplate(source.name, source.url);
                                }
                            }
                        }
                    }
                    if(isSilent){
                        const templates = dataRefs.split(',').map(s => String(s).trim()).filter(Boolean);
                        for(const template of templates){
                            if(!templates.includes(template)){
                                if(isData){
                                    core.be.getData(template);
                                }else{
                                    core.be.getTemplate(template);
                                }
                            }
                        }
                        //delete pocket;
                        return;
                    }
                    //determine the location
                    let section;
                    if (target.includes('#')) {
                        section = document.getElementById(target.replace('#', ''));
                    } else if (target.includes('.')) {
                        section = document.getElementsByClassName(target.replace('.', ''))[0]; //first only
                    } else {
                        section = document.getElementsByTagName(target)[0]; //first only
                    }
                    if(section) {
                        //empty the section
                        while (section.firstElementChild) {
                            section.firstElementChild.remove();
                        }
                        //add the pocket to DOM
                        section.append(pocket);
                    }
                    //fill pockets with templates
                    if(autoFill) core.pk.soc();
                }
            }
        })(),
    }
})()