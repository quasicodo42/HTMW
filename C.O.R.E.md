#C.O.R.E

## `<section>`
## `<template>`

##custom functions
###core.ud.prepaint()
###core.ud.postpaint()

###core.ud.preflight()
###core.ud.postflight()

###core.pk_eol()

##DATA REFERENCING
```javascript
{{type:object-member:format-ref:clue}}
```

####BASIC - record examples
```javascript
{{rec:name_first:upper}} //execution
{{rec:amount:money:$}} //execution
```

####SPECIAL - deep cloning
```javascript
{{type:list-of-objects:keyword:template-name}} //definition
{{rec:items:core_pk_cloner:item}} //execution
```

####SPECIAL - HTML inline attributes
```javascript
{{type:object-member:keyword:tag-attribute}} //definition
{{rec:thumbnail:core_pk_attr:src}} //execution
```

####SAMPLE - minimum usage
```javascript
{{rec:name_first}} //execution
```

####SAMPLE - maximum usage
```javascript
{{rec:name_first:lower,upperfirst}} //execution
```

####AUGMENTED - UX examples
```javascript
{{aug:index}} //execution, alias: {{!:i}}
{{aug:count}} //execution, alias: {{!:c}}
```
```html
<!-- execution -->
<span>{{aug:count}}</span>
```

####KEYWORDS
```javascript
core_be_getData //used as an anchor target for silent data calls
core_be_getTemplate //used as an anchor target for silent template calls
```
```html
<!-- definitions -->
<a href="#" target="core_be_getData" data-core-data="{name}" data-core-source="{source url}">More info</a>
<a href="#" target="core_be_getTemplate" data-core-templates="{name1},{name2}" data-{name1}-core-source="{source url}">More info</a>
```
```javascript
//'coreRecord' will contain the data object used to clone the records into the template
core.cr.getData('coreRecord', {clonedElement}, 0) //definition
```

```html
<!-- before cloning, definition -->
<div>
    <div class="core-clone" data-core-data="{name}" data-core-source="{source url}">{{rec:nav.name}}</div>
</div>

<!-- after cloning, example {name} = nav -->
<div>
    <div class="core-cloned-nav">Home</div>
    <div class="core-cloned-nav">About Us</div>
    <div class="core-cloned-nav">FAQ</div>
</div>
```
