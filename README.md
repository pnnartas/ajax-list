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

**TL;DR:** include [ajax-list.js](https://raw.github.com/mitskevich/ajax-list/master/src/ajax-list.js) and [ajax-list.css](https://raw.github.com/mitskevich/ajax-list/master/src/css/ajax-list.css) in your HTML.

* * *

Main file to include in your project is [ajax-list.js](https://raw.github.com/mitskevich/ajax-list/master/src/ajax-list.js). Download it and save in your project's static files.

Include it as any other JavaScript file:

```html
<script src="/path-to-static-files/ajax-list/ajax-list.js"></script>
```

JavaScript file is not minified, you can [minify it yourself](http://jscompress.com/) if you need it.

* * *

There is no CSS embedded in the main JavaScript file, so if you wish, you may write all styles from scratch.

Instead I recommend using [Twitter's Bootstrap](http://twitter.github.com/bootstrap/) for basic styling, it makes your tables and lists look nice by default. AJAX Table was built with Bootstrap in mind but doesn't depend on it. Skip a few paragraphs if you don't use Bootstrap.

**If you are using Bootstrap**, you may want to include [ajax-list-bootstrap.css](https://raw.github.com/mitskevich/ajax-list/master/src/css/ajax-list-bootstrap.css) in your HTML:

```html
<link href="/path-to-static-files/ajax-list/ajax-list-bootstrap.css" rel="stylesheet">
```

It contains different stylings, that are needed for AJAX List, like tooltip with item manipulation icons, form container, sorting direction markers, etc.

Don't forget to review CSS and change URL of your spinner (loading) animation. By default it's `/static/spinner.gif`

**If you are not using Bootstrap**, you can include [ajax-list.css](https://raw.github.com/mitskevich/ajax-list/master/src/css/ajax-list.css) similarily. It contains same stuff as Bootstrap one, but also has some basic lists & tables stylings. Again, don't forget to change the spinner URL.

Last option is to use LESS files instead of CSS. See [the section below](#using-less-files) for further details.

Quick Start
-----------

This is a quick walkthrough on how to work with AJAX List, for detailed reference consult further sections.

Let's assume we have following list:

```html
<h1>My TODO List:</h1>
<ul>
    <li>Item</li>
    <li>Some other item</li>
    ...A zillion other items...
</ul>
```

Instead of `<ul>` this may be `<ol>` list, bunch of `<div>` tags, or even `<table>`, but for the sake of brevity we will assume we have unordered list here.

Basic way to improve it is to create AJAX pagination. It will take less space on the screen and users won't have to load all information at once. Also they won't have to wait while whole HTML page will reload after going to the next list page (as oposed to non-AJAX solution).

With AJAX List you can do that (and much more) without JavaScript knowledge at all. Don't worry: if you're a JS guru, you can [tweak AJAX List same way as any JQuery Plugin](#tweaking-with-js).

First, [include AJAX List's JavaScript file in your project](#installation) if it's not there.

Now add those two parameters to the `<ul>` tag: `data-display="ajax-list"` and `ajax-list-url="/todo_get_list"`. Like this:

```html
<ul data-display="ajax-list" ajax-list-url="/todo_get_list">
```

`data-display` is simply telling AJAX List to treat this list as an AJAX List. `ajax-list-url` is specifying URL that will be used to retrieve a requested page of content.

Now you have to create a server-side script that will be serving content of a requested page. Obviously, you can change the URL of this script to anything you want by modifying `ajax-list-url` parameter.

The script in question will receive `page` variable (integer, starting from 1) and should generate list of items that the requested page contains. Output should look like this:

```html
<li meta-item="meta-item" item-count="100000" items-per-page="30"></li>
<li>Item</li>
<li>Some other item</li>
...28 other items...
```

Item that contains `meta-item` parameter is a special one. It will be removed by AJAX List and will not be displayed to user. Its purpose is to tell AJAX List how many items there are overall (the `item-count` parameter) and how many items should be on one page (`items-per-page` parameter). Based on that information, AJAX List will generate page navigation.

If that "meta" item is absent, AJAX List will assume that whole list is fitting on this page and there is no need for navigation. That may seem pointless, but it has its purpose: loading list with AJAX (instead of embedding it into HTML direclty) allows your page to load first and be accessible while the long list is catching up.

Navigation will be placed in the container element with the class `pagination-container`, so you have to prepare it too.

Also, now you can remove content of your list from HTML, because AJAX List will load the first page right after HTML will be loaded in browser. Otherwise, you may leave the content (for example if you want your site working without JS enabled), it will be simply replaced by AJAX List as soon as page will load.

Let's assume, we removed the list content and created page navigation container, so our list is looking like that now:

```html
<h1>My TODO List:</h1>
<div class="pagination-container"></div>
<ul data-display="ajax-list" ajax-list-url="/todo_get_list"></ul>
```

*When the site will load, AJAX List will take this `<ul>` and automatically request content of the first page from the `/todo_get_list` URL. While it will be loading, spinner animation will be shown (assuming that you have correctly provided its URL in CSS) and when content will be ready, it will be placed right into `<ul>` tag (replacing everything in it), with page navigation on the top in its own container.*

If you need more information, consult reference topics:
* [List Initalization](#list-initialization), on what other options you have to create the AJAX List instance and details about how it happens.
* [Pagination](#pagination), on how to manipulate the pagination so it will suit your site better.
* [Sorting](#sorting), on methods to allow users sort your list by any parameter you provide.
* [Deep Linking](#deep-linking), on details about how list navigation affects URL and browser history.

Let's continue with list items manipulation.

* * *

List Initialization
-------------------

Pagination
----------

Sorting
-------

Deep Linking
------------

Adding Items
------------

Editing Items
-------------

Deleting Items
--------------

Detailed Information About Item
-------------------------------

Row Alteration
--------------

Tweaking With JS
----------------

Options Reference
-----------------

Using LESS files
----------------

Copyright and License
---------------------