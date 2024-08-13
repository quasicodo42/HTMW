#C.O.R.E

## `<section>`
## `<template>`

##custom functions
###core.cb_preflight()
###core.cb_postflight()

###core.be_preflight()
###core.be_postflight()

###core.pk_eol()

##DATA REFERENCING
```javascript
{{type:object-member:format-ref:clue}}
```

####BASIC - record examples
```javascript
{{rec:name_first:upper}}
{{rec:amount:money:$}}
```

####SPECIAL - deep cloning
```javascript
{{type:list-of-objects:keyword:template-name}}
{{rec:items:core_pk_cloner:item}}
```

####SPECIAL - HTML inline attributes
```javascript
{{type:object-member:keyword:tag-attribute}}
{{rec:thumbnail:core_pk_attr:src}}
```

####SAMPLE - minimum usage
```javascript
{{rec:name_first}}
```

####SAMPLE - maximum usage
```javascript
{{rec:name_first:lower,upperfirst}}
```

####AUGMENTED - UX examples
```javascript
{{aug:index}} {{aug:i}}
{{aug:count}} {{aug:c}}
```

####KEYWORDS
```javascript
core_be_getData - 'used as an anchor target for silent data calls'
core_be_getTemplate - 'used as an anchor target for silent template calls'
```