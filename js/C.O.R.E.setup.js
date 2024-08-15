//-------C.O.R.E-------//
//C.O.R.E settings
core.ud.init = () => {
    core.useRouting  = false;
    core.useDebugger = core.hf.getRoute().includes('localhost');
}
//END C.O.R.E settings

//C.O.R.E callback pre/post UX template insertions
core.ud.prepaint = (dataRef, dataObj, type) => {}
core.ud.postpaint = (dataRef, dataObj, type) => {
    if(type === 'data'){
        //TODO
    }else if(type === 'template'){
        //TODO
    }
    if(core.useDebugger) console.log('cb_postflight',{dataRef, dataObj, type});
}
//END C.O.R.E callback pre/post UX template insertions

//C.O.R.E backend pre/post data/template request
core.ud.preflight = (dataRef, dataSrc, type) => {
    let settings = {dataRef:dataRef, dataSrc:dataSrc, type:type};
    if(type === 'data'){
        //TODO
    }else if(type === 'template'){
        //TODO
    }
    if(core.useDebugger) console.log('be_preflight',{dataRef, dataSrc, type});
    return settings;
}
core.ud.postflight = (dataRef, dataObj, type) => {
    if(type === 'data'){
        //TODO
    }else if(type === 'template'){
        //TODO
    }
    if(core.useDebugger) console.log('be_postflight',{dataRef, dataObj, type});
    return dataObj;
}
//END C.O.R.E backend pre/post data/template request

//C.O.R.E Start/End Of Call
core.ud.soc = () => {
    //TODO
}
core.ud.eoc = () => {
    //TODO
}
//END C.O.R.E Start/End Of Call

//C.O.R.E Modify/Format a value
core.ud.formatValue = (value, formatList, clue) => {
    //TODO
    return value;
}