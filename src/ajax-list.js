/*jshint jquery:true, browser:true, maxerr:50 */

(function($) {

"use strict";

$.fn.ajaxList = function(options) {

/*****************************************************************************
 Public API
 *****************************************************************************/

this.ajaxList = {
    update: update_list
};

/*****************************************************************************
 Initialization
 *****************************************************************************/

var $element = this;
var opts = $.extend($.fn.ajaxList.defaults, determine_attribute_options(),
    options);
var $list = $element.find(opts.list_selector);
var $items = null;
var list_is_updating = false;

init_element();
var $pagination_container, current_page;
init_pagination();
var current_sort, current_sort_dir;
init_sorting();
var $item_form, $item_form_container;
init_item_form();
var $add_button;
init_adding_items();
var $item_actions, $hovered_item;
init_item_actions_tooltip();
update_list();

/*****************************************************************************
 Private API
 *****************************************************************************/

// Initialization /////////////////////////////////////////////////////////////

function determine_attribute_options() {
    var attr_opts = {};

    // abilities are stored in ajax-list-able attribute
    var abilities = $element.attr("ajax-list-able");
    if (abilities) {
        if (abilities === "all")
            abilities = ["add", "edit", "delete", "details"];
        else abilities = abilities.split(",");
    } else abilities = [];

    // base url is stored in ajax-list-url attribute
    var url = $element.attr("ajax-list-url");
    if (url) {
        attr_opts.get_content_url = url.replace("*", "get_content");
        if ($.inArray("add", abilities) != -1)
            attr_opts.item_add_url = url.replace("*", "save");
        if ($.inArray("edit", abilities) != -1)
            attr_opts.item_update_url = url.replace("*", "save");
        if ($.inArray("delete", abilities) != -1)
            attr_opts.item_delete_url = url.replace("*", "delete");
        if ($.inArray("details", abilities) != -1)
            attr_opts.get_item_details_url = url.replace("*", "get_details");
    }

    // additional request data is stored in ajax-list-data attribute
    var data = $element.attr("ajax-list-data");
    if (data) attr_opts.additional_request_data = deserialize(data);

    return attr_opts;
}

function init_element() {
    // We have to set up a position of our container to relative, so the item
    // actions tooltip would be positioned properly.
    if ($element.css("position") != "absolute")
        $element.css("position", "relative");
}

function init_pagination() {
    if (!opts.pagination_container_selector) return;
    $pagination_container =
        $element.find(opts.pagination_container_selector);
    current_page = 0;
    rig_pagination_links();

    function rig_pagination_links() {
        $pagination_container.find("a.prev-link").live("click", function() {
            if (list_is_updating) return false;
            update_list(current_page -= 1);
            return false;
        });
        $pagination_container.find("a.next-link").live("click", function() {
            if (list_is_updating) return false;
            update_list(current_page += 1);
            return false;
        });
        $pagination_container.find("a.show-all-link")
            .live("click", function() {
                if (list_is_updating) return false;
                current_page = "all";
                update_list(current_page);
                return false;
            });
    }
}

function init_sorting() {
    current_sort = null;
    current_sort_dir = null;
    if (opts.default_sorting) {
        current_sort = opts.default_sort.split(" ")[0];
        current_sort_dir = opts.default_sort.split(" ").length > 1 ?
            opts.default_sort.split(" ")[0] : "asc";
    }
    set_up_sorting();

    function set_up_sorting() {
        $list.find("th").each(function() {
            var $th = $(this);
            var srt = $th.attr("sort-name");
            if (typeof srt !== "undefined") {
                $th.click(function() {
                    if (current_sort === srt)
                        current_sort_dir = current_sort_dir === "asc" ?
                            "desc" : "asc";
                    else {
                        current_sort = srt;
                        current_sort_dir = "asc";
                    }
                    update_list();
                    update_current_sort_header();
                    return;
                });
            }
        });
    }
}

function init_item_form() {
    $item_form = $element.find(opts.item_form_selector);
    put_item_form_in_container();
    rig_item_form_cancel_button();

    function put_item_form_in_container() {
        if ($item_form.length > 0) {
            $item_form.after('<div class="form_container"></div>');
            $item_form_container = $item_form.next();
            $item_form_container.append($item_form);
            $item_form.hide();
        }
    }

    function rig_item_form_cancel_button() {
        if ($item_form.length > 0) {
            var $cancel_button = $item_form.find(".cancel-button");
            $cancel_button.live("click", function() {
                slide_up_form();
                return false;
            });
        }
    }
}

function init_adding_items() {
    init_add_button();
    init_item_adding_headers_from_form();

    function init_add_button() {
        if (!opts.item_add_url) return;
        $add_button = $element.find(opts.add_button_selector);
        if ($add_button.length === 0) {
            $element.append(
                '<a class="btn btn-primary add-item" href="#">' +
                '<i class="icon-plus icon-white"></i> Add entry</a>');
            $add_button = $element.find(".add-item");
        }
        $add_button.click(function() {
            show_add_form();
            return false;
        });
    }

    function init_item_adding_headers_from_form() {
        if ($item_form.length > 0) {
            if (opts.item_add_header_text !== null)
                opts.item_add_header_text =
                    $item_form.find(opts.item_form_header_selector).text();
            if (opts.item_add_submit_button_text !== null)
                opts.item_add_submit_button_text =
                    $item_form.find("button[type=submit]").text();
        }
    }
}

function init_item_actions_tooltip() {
    if (opts.item_update_url || opts.item_delete_url) {
        $element.append('<div class="action-tooltip"></div>');
        $item_actions = $element.find(".action-tooltip");
        if (opts.item_update_url) {
            $item_actions.append(
                '<a class="edit-item" href="#">' +
                '<i class="icon-pencil icon-white"></i></a> ');
            $item_actions.find(".edit-item").click(function() {
                edit_hovered_item();
                return false;
            });
        }
        if (opts.item_delete_url) {
            $item_actions.append(
                '<a class="delete-item" href="#">' +
                '<i class="icon-trash icon-white"></i></a> ');
            $item_actions.find(".delete-item").click(function() {
                delete_hovered_item();
                return false;
            });
        }
        $item_actions.hide();
    }
}

// Basics /////////////////////////////////////////////////////////////////////

function update_list() {
    if (!opts.get_content_url) return;

    list_is_updating = true;
    show_list_spinner();

    // In case if the container is hidden by default (to not expose empty
    // table) we are showing it again.
    $element.removeClass("hidden");

    var data = {};
    if (current_page !== null) data.page = current_page;
    if (current_sort !== null) data.sort = current_sort;
    if (current_sort_dir !== null) data.sort_dir = current_sort_dir;
    data = $.extend(opts.additional_request_data, data);

    $.get(opts.get_content_url, data, function(data, status) {
        hide_list_spinner();
        list_is_updating = false;

        if (!data) {
            display_empty_content();
            $items = null;
            return;
        } else {
            var $data = $(data);
            var $meta = $data.filter("meta").remove();
            $list.find(opts.content_selector).append($data);

            update_items_list();

            set_up_item_altering();
            set_up_item_details_interface();
            set_up_pagination($meta);
            set_up_item_actions_tooltip();
        }

        $element.trigger("ajaxListUpdate");
    }).error(check_request_error);
}

function update_items_list() {
    $items = $list.find(opts.content_selector)
        .find(opts.item_selector);
}

function show_error(text) {
    hide_list_spinner();
    hide_container_spinner();
    $element.children().remove();
    $element.append('<div class="alert alert-error">' + text + '</div>');
}

function check_request_error(data, status) {
    if (data.status === 404) show_error("Can't retrieve data. " +
        "Invalid URL provided.");
    else if (data.status === 500)
        show_error("Can't retrieve data. Server error.");
    else show_error("Can't retrieve data.");
}

function display_empty_content() {
    $list.after('<div class="alert alert-notice">No data.</div>');
    $list.remove();
}

// General Spinners ///////////////////////////////////////////////////////////

function show_list_spinner() {
    $list.hide();
    $list.find(opts.content_selector + " > *").remove();

    var $spinner = $('<div class="spinner-container"><div class="spinner">' +
         '</div></div>');
    $list.after($spinner);
}

function hide_list_spinner() {
    $list.show();
    $element.find(".spinner-container").remove();
}

function show_container_spinner() {
    var w = $element.outerWidth();
    var h = $element.outerHeight();
    $element.prepend('<div class="spinner-container" style="width: ' + w +
        'px; height: ' + h + 'px; position: absolute; left: 0; top: 0; ' +
        'background-color: #fff; opacity: 0.8; filter: alpha(opacity=80); ' +
        'z-index: 1;"><div class="spinner" style="position: absolute; left: ' +
        Math.round(w / 2 - 12) + 'px; top: ' + Math.round(h / 2 - 12) +
        'px;" /></div>');
}

function hide_container_spinner() {
    $element.find(".spinner-container")
        .remove();
}

// Item Altering //////////////////////////////////////////////////////////////

function set_up_item_altering() {
    if (!opts.set_item_altering) return;

    if ($items.filter(".even, .odd").length > 0)
        $items.removeClass("even odd");

    var i = 0;
    $items.each(function() {
        i += 1;
        $(this).addClass(i % 2 ? "odd" : "even");
    });
}

// Pagination /////////////////////////////////////////////////////////////////

function set_up_pagination($meta) {
    $pagination_container.children().remove();
    var item_count = $meta.attr("item-count");
    if (!item_count) return;
    if (item_count === $items.length) return;

    var pages_num = Math.ceil(item_count / opts.items_on_page);

    var html = '<div class="current-page">Page ' + (current_page + 1) + "/" +
        pages_num + "</div>";
    html += '<div class="page-navigation">';
    if (current_page !== 0)
        html += '<a href="#" class="prev-link">Previous</a>';
    else html += '<span class="prev-link inactive">Previous</span>';
    html += ' / ';
    if (current_page !== pages_num - 1)
        html += '<a href="#" class="next-link">Next</a>';
    else html += '<span class="next-link inactive">Next</span>';
    if (opts.allow_show_all)
        html += '<a href="#" class="show-all-link">Show all</a>';
    html += "</div>";

    $pagination_container.append(html);
}

// Sorting ////////////////////////////////////////////////////////////////////

function update_current_sort_header() {
    $list.find(".sort_marker").remove();
    var $th = $list.find("th[sort-name=" + current_sort + "]");
    var marker = current_sort_dir === "asc" ? "&#9652;" : "&#9662;";
    $th.append('<span class="sort-marker ' + current_sort_dir + '">' +
        marker + '</span>');
}

// Item Details ///////////////////////////////////////////////////////////////

function set_up_item_details_interface() {
    $items.find(opts.item_details_link_selector).click(function() {
    var $item = $(this).closest(opts.item_selector);
        if (get_item_details($item).length > 0) close_item_details($item);
        else open_item_details($item);
        return false;
    });
}

function open_item_details($item) {
    if (!opts.get_item_details_url) return;

    var $item_details = opts.insert_subcontainer_function($list, $item, opts);
    show_item_details_spinner($item_details);

    var data = { id: $item.attr(opts.item_id_attr_name) };
    data = $.extend(opts.additional_request_data, data);

    $.get(opts.get_item_details_url, data, function(data) {
        hide_item_details_spinner($item_details);

        var $info = $item_details.find(".info");
        $info.hide();
        $info.append(data);
        $info.slideDown(200);

        $element.trigger("itemDetailsShow");
    });
}

function close_item_details($item) {
    var $item_details = get_item_details($item);
    $item_details.find(".info").slideUp(200, function() {
        $item_details.remove();
    });
}

function get_item_details($item) { return $item.next(".details"); }

function show_item_details_spinner($item_details) {
    var $spinner = $('<div class="spinner-container"><div class="spinner">' +
         '</div></div>');
    $item_details.find(".info").append($spinner);
}

function hide_item_details_spinner($item_details) {
    $item_details.find(".info .spinner-container")
        .remove();
}

// Item Form //////////////////////////////////////////////////////////////////

function slide_up_form() {
    $item_form.slideUp(200, function() {
        hide_form();
    });
}

function hide_form() {
    $item_form.hide();
    $item_form_container.append($item_form);
    $add_button.fadeIn(200);
    $list.find(".subcontainer").remove();
}

function submit_form(data) {
    show_container_spinner();
    $item_form.ajaxSubmit({
        url: opts.item_add_url,
        data: $.extend(opts.additional_request_data, data),
        success: function(response) {
            if (response) show_error(response);
            $element.trigger("itemFormSubmit");
            update_list();
            hide_form();
        },
        error: function() {
            show_error("Form submission error.");
        }});
}

// Adding Items ///////////////////////////////////////////////////////////////

function show_add_form() {
    hide_form();

    $item_form.find('.omit-on-edit').show();

    $item_form.resetForm();
    $item_form_container.append($item_form);

    // Invoking form fields change event
    var $fields = $item_form.find("input, textarea, select");
    $fields.change();
    $item_form.find("textarea").val(""); // Hack to clear CKeditor input

    // Resetting form texts
    if (opts.item_add_header_text)
        $item_form.find(opts.item_form_header_selector)
            .text(opts.item_add_header_text);
    if (opts.item_add_submit_button_text)
        $item_form.find("button[type=submit]")
            .text(opts.item_add_submit_button_text);

    $add_button.fadeOut(50);
    $item_form.slideDown(200);

    // Rigging submit button
    $item_form.unbind('submit');
    $item_form.bind('submit', function() {
        submit_form();
        return false;
    });
}

// Editing Items //////////////////////////////////////////////////////////////

function edit_hovered_item() { show_edit_form($hovered_item); }

function show_edit_form($item) {
    hide_form();

    var $edit_form_container =
        opts.insert_subcontainer_function($list, $hovered_item, opts);
    $edit_form_container.find(".subcontent").append($item_form);

    $element.trigger('editFormShow', [$item]);

    $item_form.find('.omitted_on_edit').hide();

    $item_form.resetForm();
    var $fields = $item_form.find("input, textarea, select");
    var data = deserialize($item.attr("data-item"));
    for (var k in data) {
        if (data.hasOwnProperty(k)) {
            $fields.filter("[name=" + k + "]").val(data[k]);
        }
    }
    $fields.change();

    // Resetting form texts
    if (opts.item_edit_header_text !== null)
        $item_form.find(opts.item_form_header_selector)
            .text(opts.item_edit_header_text);
    if (opts.item_edit_submit_button_text)
        $item_form.find("button[type=submit]")
            .text(opts.item_edit_submit_button_text);

    $item_form.slideDown();

    // Rigging submit button
    $item_form.unbind('submit');
    $item_form.bind('submit', function() {
        var d = {}; if (data.id) d.id = data.id;
        submit_form(d);
        return false;
    });
}

// Item Actions ///////////////////////////////////////////////////////////////

function set_up_item_actions_tooltip() {
    if (!$item_actions) return;
    $items.hover(function() {
        $hovered_item = $(this);
        $item_actions.show();
        $item_actions.position({my: "left", at: "right", of: $hovered_item,
            collision: "fit"});
    }, function(e) {
        if ($(e.toElement).hasClass("action-tooltip")) return;
        hide_item_action();
    });
    $item_actions.hover(null, hide_item_action);
}

function hide_item_action() {
    $item_actions.hide();
    $hovered_item = null;
}

// Deleting Items /////////////////////////////////////////////////////////////

function delete_hovered_item() {
    if (!window.confirm("Do you want to delete this?")) return false;
    var data = deserialize($hovered_item.attr("data-item"));
    data = $.extend(opts.additional_request_data, data);
    $.post(opts.item_delete_url, data, function(response) {
        if (response) show_error(response);
    }).error(check_request_error);
    $hovered_item.fadeOut(200, function() {
        $(this).remove();
        update_items_list();
        set_up_item_altering();
    });
    hide_item_action();
}

};

/*****************************************************************************
 Plugin Defaults
 *****************************************************************************/

$.fn.ajaxList.defaults = {
    // URL for retrieving content for current list state. Required.
    get_content_url: null,
    // Selector for finding list.
    list_selector: "table",
    // Selector for finding content of list.
    content_selector: "tbody",

    // This data will be posted to server with every request.
    additional_request_data: {},

    // Selector for finding list items
    item_selector: "tr",
    // Attribute name that contains item ID.
    item_id_attr_name: "item-id",
    // If the even/odd altering classes should be assigned to the items.
    set_item_altering: true,
    // Selector for finding link that opens item details
    item_details_link_selector: ".name",
    // URL for retrieving HTML of item details. Required.
    get_item_details_url: null,

    // Selector for finding pagination block container
    pagination_container_selector: ".pagination",
    // Number of items on one page
    items_on_page: 50,
    // Should we display "Show all" link in pagination block.
    allow_show_all: true,

    // Default sorting. Format: "field_name asc/desc"
    default_sorting: "",

    // Selector for finding container of the add/edit item form
    item_form_selector: ".item-form",
    // Selector for finding form header to change its text contextually
    item_form_header_selector: "h3",

    // Selector for finding add new item button
    add_button_selector: ".add-item",
    // URL for adding item. null - disable item creation.
    item_add_url: null,
    // Adding new item form header. null - leave default.
    item_add_header_text: null,
    // Text on the button in item creation form.
    item_add_submit_button_text: "Add",

    // Selector for finding edit item links
    edit_link_selector: ".edit-item-link",
    // URL for updating (editing) item. null - no item updating.
    item_update_url: null,
    // Editing list item form header. null - leave default.
    item_edit_header_text: "",
    // Text on the button in edit item form.
    item_edit_submit_button_text: "Save changes",

    // Function that is used to insert the containter for item edit form or
    // item details into the list.
    insert_subcontainer_function: insert_subcontainer_in_table,

    // Selector for finding delete item links
    delete_link_selector: ".delete-item-link",
    // URL for deleting item. null - no item deletion.
    item_delete_url: null
};

/*****************************************************************************
 Utilitary Functions
 *****************************************************************************/

function deserialize(params) {
    var data = params.split("&");
    var i = data.length;
    var result  = {};
    while (i--) {
        var pair = decodeURIComponent(data[i]).split("=");
        var key = pair[0];
        var val = pair[1];
        result[key] = val;
    }
    return result;
}

/*****************************************************************************
 Insert Subcontainer Methods
 *****************************************************************************/

function insert_subcontainer_in_table($list, $after_item, opts) {
    var colspan = $after_item.find("td").length;
    var item_alteration;
    if (opts.set_item_altering)
        item_alteration = $after_item.hasClass("odd") ? "odd" : "even";
    $after_item.after('<tr class="subcontainer ' + item_alteration +
        '"><td colspan="' + colspan + '"><div class="subcontent"></div>' +
        '</td></tr>');
    var $subcontainer = $after_item.next();
    return $subcontainer;
}

/*****************************************************************************
 Data-API
 *****************************************************************************/

$(function() {
    $("[data-display=ajax-list]").each(function() {
        $(this).ajaxList();
    });
});

})($);