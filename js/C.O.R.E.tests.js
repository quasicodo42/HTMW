console.log(
    '\n','FORMATTING',
    '\n','date',core.ux.formatValue(null,'date','YYYYMMDD'),
    '\n','date',core.ux.formatValue(null,'datetime','YYMMDD'),
    '\n','datetime',core.ux.formatValue(null,'datetime','YYYYMMDD hh:mm:ss'),
    '\n','datetime',core.ux.formatValue(null,'datetime','YYYYMMDD h:mm:ss'),
    '\n','datetime',core.ux.formatValue(null,'datetime','ts'),
    '\n','datetime',core.ux.formatValue(null,'datetime','perf'),
    '\n','decimal',core.ux.formatValue('45.6','decimal','append'),
    '\n','decimal',core.ux.formatValue(78.9,'decimal','°F'),
    '\n','core_pk_cloner',core.ux.formatValue([{msg:'hello'}],'core_pk_cloner','append'),
    '\n','core_pk_attr',core.ux.formatValue('blue','core_pk_attr','data-color'),
    '\n','email',core.ux.formatValue('JAKe@HERe.coM','email',null),
    '\n','lower',core.ux.formatValue('THING','lower',null),
    '\n','money',core.ux.formatValue('12.2','money','USD'),
    '\n','money',core.ux.formatValue(23.3,'money',null),
    '\n','phone',core.ux.formatValue('9876543214','phone',null),
    '\n','phone',core.ux.formatValue(2343454567,'phone',null),
    '\n','fax',core.ux.formatValue(6549873124,'fax',null),
    '\n','upper',core.ux.formatValue('snake','upper',null),
    '\n','padleft',core.ux.formatValue('O','padleft','5|X'),
    '\n','padleft',core.ux.formatValue('ps','padleft',null),
    '\n','padright',core.ux.formatValue('X','padright','12|I'),
    '\n','padright',core.ux.formatValue('b','padright',null),
    '\n','removehtml',core.ux.formatValue('<p>Hello!</p>','removehtml',null),
    '\n','truncate',core.ux.formatValue('1234567890','truncate',5),
    '\n','upperfirst',core.ux.formatValue('mr.','upperfirst',null),
    //'\n','',core.ux.formatValue(value,formatList,clue),
    '\n','SCRUBBING',
    '\n','ccnum',core.sv.scrubEach({name:'test',value:4111111111111111,scrubs:['ccnum']}).success,
    '\n','ccnum',core.sv.scrubEach({name:'test',value:3216549879875487,scrubs:['ccnum']}).success,
    //'\n','',core.sv.scrubEach({name:'',value:'',scrubs:''}).success,
)