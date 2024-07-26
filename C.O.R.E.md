C.O.R.E

custom functions
core.cb_preflight()
core.cb_postflight()

core.be_preflight()
core.be_postflight()

core.pk_eol()

data referencing

{{type:object-member:format-ref:clue}}
record examples
{{rec:name_first:upper}}
{{rec:amount:money:$}}

special deep cloning
{{type:list-of-objects:keyword:template-name}}
{{rec:items:pk_cloner:item}}

special inline attributes
{{type:object-member:keyword:tag-attribute}}
{{rec:thumbnail:pk_attr:src}}

minimum usage
{{rec:name_first}}
maximum usage
{{rec:name_first:lower,upperfirst}}

augmented UX examples
{{aug:index}}