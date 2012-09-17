AJAX List
=========

Brings AJAX to your lists and tables. Paginate, sort and interact with collection of items without reloading the page.

Features
--------

* **Easy list pagination and sorting.**
  AJAX List will take the data returned from server and display pagination and sorting interface for it. It will send additional requests to the server depending on user actions.
* **Manipulating items: adding, deleting and editing.**
  AJAX List takes pre-designed form for entering item information and automatically uses it for adding and editing items, right in the list. It sends the form to server after user submits it and updates the list content accordingly.
* **Displaying additional information by click.**
  For large lists, it is not very practical to show every detail about every item right from the page loading. With AJAX List, detailed information can be requested and displayed after click on the item.
* **Row alternation.**
  CSS row alternation is not supported in IE. In modern browsers it tends to be buggy if the list gets manipulated dynamically. AJAX List solves this problem.
* **Saving state in URL.**
  When list is modified by the user, for example after change to the sorting order of items, URL is changed to reflect the current state. Because of that, any state of the list can be accessed by saving direct link to the page. Individual items have URLs too.
* **Smart defaults.**
  In 90% cases there is zero JS code needed to use the AJAX List. Just include the main JS file and add parameters to the HTML tags.
* **Developed as a JQuery plugin.**
  No other dependencies except JQuery. If JQuery Form plugin is loaded, it is automatically used for item adding and editing form.
* **Compatible with Twitter's Bootstrap.**
  LESS files are provided for hardcore Bootstrap users to compile as extension and be as DRY as possible. Everyone else can use stand-alone CSS to make lists look good without additional effort.
* **Tested in Chrome, Safari, Firefox, IE7+ and Opera.**
  Also tested on mobile devices.

Demo & Examples
---------------

On-line examples will be available after version 1.0.0 release. For now you can run them on your local computer.

To do this, clone the repository, go into directory `example` inside, and run `python server.py` (assuming you have Python 2.7 installed). Navigate your browser to [http://localhost:8000/](http://localhost:8000/) to see the list of available examples.

Example server script has been tested under Mac OS and Linux, but haven't been tested under Windows.

Installation
------------

Main file to include in your project is [ajax-list.js](https://raw.github.com/mitskevich/ajax-list/master/src/ajax-list.js). Download it and save in your project's static files.

Include it as any other JavaScript file:

```html
<script src="path-to-static-files/ajax-list/ajax-list.js"></script>
```

JavaScript file is not minified, you can [minify it yourself](http://jscompress.com/) if you need it.

Now for the CSS: there is no CSS embedded in the main JavaScript file, so if you want, you may write all styles from scratch.

Instead I recommend using [Twitter's Bootstrap](http://twitter.github.com/bootstrap/) for basic styling, it makes your tables and lists look nice by default. AJAX Table was build with Bootstrap in mind, but don't rely on it, skip few paragraphs if you don't use Bootstrap.

**If you are using Bootstrap**, you may want to include [ajax-list-bootstrap.css](https://raw.github.com/mitskevich/ajax-list/master/src/css/ajax-list-bootstrap.css) in your HTML:

```html
<link href="path-to-static-files/ajax-list/ajax-list-bootstrap.css" rel="stylesheet">
```

It contains different stylings, that are needed for AJAX List, like tooltip with item manipulation icons, form container, sorting direction markers, etc.

Don't forget to review CSS and change URL of your spinner (loading) animation. By default it's `/static/spinner.gif`

**If you are not using Bootstrap**, you can include [ajax-list.css](https://raw.github.com/mitskevich/ajax-list/master/src/css/ajax-list.css) similarily. It contains same stuff as Bootstrap one, but also has some basic lists & tables stylings. Again, don't forget to change the spinner URL.

Last option is to use LESS files instead of CSS. See [the section below](#using-less-files) for further details.

Quick Start
-----------

Pagination
----------

Sorting
-------

Detailed Information About Item
-------------------------------

Adding Items
------------

Editing Items
-------------

Deleting Items
-------------

Row Alteration
--------------

Options Reference
-----------------

Using LESS files
----------------

Copyright and License
---------------------