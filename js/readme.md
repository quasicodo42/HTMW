# `<items>` (recommended)
### data-soft-cache-items (optional)
a comma delimted list of names that will be stored in memory, by default the result of an item request is stored in the HTML item tag or hard cache

this can also be set using `strg.set('softCacheItems',['array','of','names'])`
### data-no-cache-items (optional)
(is not implemented) use an asterisk to disable caching completely or a comma delimited list of item names that should not be cached

this can also be set using `strg.set('noCacheItems',['array','of','names'])`

###EXAMPLE

```html
<!-- normally placed just before the closing body tag -->
<items data-soft-cache-items="header" data-no-cache-items="main"></items>
```

# `<item>` (recommended)

### data-callback (optional)

an item can have a callback and is triggered by the data request or the HTML request

the data callback will run when the item is called and filled from the request

the data callback is passed the name (request URL) of the value of the id attribute

the HTML callback will run after the html is requested and placed in the pocket

the HTML callback is passed the id attribute of the item, no object will be passed

the callback is the name of the function to be called

###EXAMPLE

```html
<items>
    <item id="sample" data-callback="cleanup">Some text</item>
</items>
```
a callback named `pckt.callback(name,object)` will run after each item has been returned at the end of the process

a user defined function call also be created for one or more completed requests, i.e., `pckt.cleanup(name,object)`

###CODE SAMPLE

```javascript
//create this function for a global callback when the process is completed
pckt.callback = function(name,obj){
    //do stuff
    console.log({name,obj});
}

//optionally, create a user defined funtion for a specific callback
pckt.cleanup = function(name,obj){
    //do stuff
    console.log({name,obj});
}
```

###EXAMPLE
```html
<items data-soft-cache-items="demo,democlone" data-no-cache-items="main">
    <item id="endpoint-display">
        <!-- This item will be added to the pocket and filled with data from the dataSource -->
        <div class="clone" data-data-source="/Collections/dataPull?name=zzzap.io&key=formatting">
            {{rec:name}} {{rec:nameLast}}
        </div>
    </item>
    <item id="product-display">
        <!-- This item will be added to the pocket and filled with data from the dataSource, using the {{rec:}} method -->
        <div class="clone" data-data-source="https://api.com/products" data-data-source-name="products" data-postflight="product_cleanup">
            <div class="card">
                {{rec:id}} {{rec:name}}
                <hr>
                {{rec:desc}}
            </div>
        </div>
    </item>
    <item id="user">
        <!-- This item will be added to the pocket and filled with data from the dataSource (using the <span> method) -->
        <div class="clone" data-data-source="https://api.com/users" data-data-source-name="users" data-preflight="api_cleanup" data-postflight="api_cleanup">
            <div class="card">
                <span data-member="id" data-in="true"></span>
                <!-- the data attribute data-in is optional when "true" -->
                <span data-member="name"></span>
                <hr>
                <span data-member="desc" data-in="true" data-up="true" data-on="true"></span>
            </div>
        </div>
    </item>
</items>
```

######OVERRIDE (html)

### data-override-{name} (optional)
can be used in *.pocket* and will override the default endpoint behavior when requesting HTML

###EXAMPLE
```html
<!-- HTML will be placed inside using the override endpoint -->
<div class="pocket" data-items="demo" data-override-demo="/html/demo.html"></div>
```

# `.pocket`

### data-items (required)
is used with *.pocket* and is a comma delimited list of names that refer to an `<item id="name">`

all the items will be brought into the pocket

if the item is not available within the `<items>` (hard cache or soft cache) an attempt will be made to get it from the backend by sending the reference to `pckt.getHtml(name)`

###EXAMPLE
```html
<div class="pocket" name="someName" data-items="sample,footer"></div>
<items>
    <item id="sample">Some sample text<item>
    <item id="footer">Copyright Info<item>
</items>
```

######OVERRIDE (html)

an override can be made by using **data-override-{name}** 

###EXAMPLE

```html
<div class="pocket" data-items="sample" data-override-sample="/Forms/login"></div>
```
######OVERRIDE (data)

### data-data-source (optional)
can also be used to override the *.clone* **data-data-source**, this allows for reuse of the HTML object with different data sources (1 clone = many endpoints)

###EXAMPLE
```html
<!-- Item will be placed inside and filled with data from this dataSource -->
<div class="pocket" data-data-source="/Collections/dataPull?name=zzzap.io&key=formatting"></div>
```

# `.clone`

### data-data-source (required)
a required attribute of the element *.clone*

the value of **data-data-source** is the endpoint used to request data per clone HTML object, 1 clone = 1 endpoint

the endpoint can be local /backend/products.json or external https://api.com/products

each *.clone* within the parent *.pocket* will be automatically filled with the request data

###EXAMPLE
```html
<div class="clone" data-data-source="https://api.com/products">
    <div>{{rec:name}}</div>
</div>
```
*the value of **data-data-source** is used as the name of the `strg` object and available through `strg.get(name);`

### data-preflight (optional)
is used for running a function before the call where global settings can be set or prelogic can run

a corresponding `pckt` function must be available, i.e., using `data-preflight="api_setup"` would call the custom function `pckt.api_setup(name,obj)` prior to cloning

### data-postflight (optional)
is used for passing the response data through a data normalizing function creating data that can be used by `pckt`, i.e., {response:[{...}]}

a corresponding `pckt` function must be available, i.e., using `data-postflight="product_cleanup"` would call the custom function `pckt.product_cleanup(name,obj)` prior to cloning

###EXAMPLE
```html
<div class="clone" data-data-source="https://api.com/products" data-preflight="checkAuth" data-postflight="releaseAuth">
    <div>{{rec:name}}</div>
</div>
```

### data-data-source-name (optional)
can be used to overwrite the default name for the data object

*the value of **data-data-source-name** is then used as the name of the `strg` object and available through `strg.get(name);`

# dev

CORS Help

https://stackoverflow.com/questions/10752055/cross-origin-requests-are-only-supported-for-http-error-when-loading-a-local

https://stackoverflow.com/questions/18586921/how-to-launch-html-using-chrome-at-allow-file-access-from-files-mode

# bugs

if the clone innerHtml has a comment as the first item cloning will not work, the first item has to be the html to be cloned.