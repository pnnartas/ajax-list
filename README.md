AJAX List
=========

Brings AJAX to your lists and tables. Paginate, sort and interact with collection of items without reloading the page.

Features
--------

* **Easy list pagination and sorting.*
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

On-line examples will be available after version 1.0.0 release. For now, you can see them on your local computer.

To do this, clone the repository, go into directory `example` in it, and run `python server.py` (assuming you have Python 2.7 installed). Navigate your browser to http://localhost:8000/ to see the list of available examples.

Installation
------------

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

Copyright and License
---------------------