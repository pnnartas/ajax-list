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

var list_id = "ajax-list";
var $list = $(this);
var $element = $(this).parent();
var opts = {};
$.extend(opts, $.fn.ajaxList.defaults, determine_attribute_options(),
    options);
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
var last_url;
init_deep_linking();
read_url();

/*****************************************************************************
 Private API
 *****************************************************************************/

// Initialization /////////////////////////////////////////////////////////////

function determine_attribute_options() {
    var attr_opts = {};

    if ($list.attr("id")) list_id = $list.attr("id");

    // abilities are stored in ajax-list-able attribute
    var abilities = $list.attr("ajax-list-able");
    if (abilities) {
        if (abilities === "all")
            abilities = ["add", "edit", "delete", "details"];
        else abilities = abilities.split(",");
    } else abilities = [];

    // base url is stored in ajax-list-url attribute
    var url = $list.attr("ajax-list-url");
    if (url) {
        attr_opts.get_content_url = url.replace("*", "get_list");
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
    var data = $list.attr("ajax-list-data");
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
                    return false;
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
            $cancel_button.on("click", function() {
                $item_form.slideUp(100, hide_form);
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
        if ($add_button.length === 0 && $item_form.length > 0) {
            var button_html = '<a class="btn btn-primary add-item" href="#">' +
                '<i class="icon-plus icon-white"></i> Add entry</a>';
            $item_form_container.before(button_html);
            $add_button = $element.find(".add-item");
        }
        $add_button.click(function() {
            show_add_form();
            return false;
        });
    }

    function init_item_adding_headers_from_form() {
        if ($item_form.length > 0) {
            if (opts.item_add_header_text === null)
                opts.item_add_header_text =
                    $item_form.find(opts.item_form_header_selector).text();
            if (opts.item_add_submit_button_text === null)
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

function init_deep_linking() {
    $(window).on('hashchange', function() {
        read_url();
    })
}

// Basics /////////////////////////////////////////////////////////////////////

function clear_list() {
    $list.find(opts.content_selector + " > *").remove();
}

function update_list() {
    if (!opts.get_content_url) return;

    list_is_updating = true;
    show_container_spinner();

    // In case if the container is hidden by default (to not expose empty
    // table) we are showing it again.
    $element.removeClass("hidden");

    var data = {};
    if (current_page !== null) data.page = current_page;
    if (current_sort !== null) data.sort = current_sort;
    if (current_sort_dir !== null) data.sort_dir = current_sort_dir;
    $.extend(data, opts.additional_request_data);

    $.get(opts.get_content_url, data, function(data, status) {
        hide_container_spinner();
        clear_list();
        list_is_updating = false;

        if (!data) {
            display_empty_content();
            $items = null;
            return;
        } else {
            var $data = $(data);
            var $meta = $data.filter("[meta-item]");
            $data = $data.not("[meta-item]");
            $list.find(opts.content_selector).append($data);

            update_items_list();

            set_up_item_altering();
            set_up_item_details_interface();
            set_up_pagination($meta);
            set_up_item_actions_tooltip();
        }

        $list.trigger("ajaxListUpdate");
    }).error(check_request_error);

    update_current_sort_header();
    update_url();
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
    clear_list();

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
    if (current_page == "all") return;
    var item_count = $meta.attr("item-count");
    if (!item_count) return;
    if (item_count === $items.length) return;

    var items_per_page = $meta.attr("items-per-page") ?
        $meta.attr("items-per-page") : opts.items_per_page;
    var pages_num = Math.ceil(item_count / items_per_page);

    var html = opts.pagination_generator(current_page, pages_num,
        opts.allow_show_all);

    $pagination_container.append(html);
    rig_pagination_links();
}

function rig_pagination_links() {
    $pagination_container.find("a.prev-link").on("click", function() {
        if (list_is_updating) return false;
        update_list(current_page -= 1);
        return false;
    });
    $pagination_container.find("a.next-link").on("click", function() {
        if (list_is_updating) return false;
        update_list(current_page += 1);
        return false;
    });
    $pagination_container.find("a.show-all-link")
        .on("click", function() {
            if (list_is_updating) return false;
            current_page = "all";
            update_list(current_page);
            return false;
        });
}

// Sorting ////////////////////////////////////////////////////////////////////

function update_current_sort_header() {
    $list.find(".sort-marker").remove();
    var $th = $list.find("th[sort-name=" + current_sort + "]");
    var marker = current_sort_dir === "asc" ? "&#9652;" : "&#9662;";
    $th.append('<span class="sort-marker ' + current_sort_dir + '">' +
        marker + '</span>');
}

// Subcontainer ///////////////////////////////////////////////////////////////

function show_subcontainer($item) {
    var $subcontainer = opts.insert_subcontainer_function($list, $item, opts);
    $subcontainer.find(".subcontent").hide();
    //$subcontainer.find(".subcontent").slideDown();
    return $subcontainer;
}

function get_item_subcontainer($item) {
    return $item.next(".subcontainer");
}

function slide_up_subcontainer($item) {
    var $subcontainer = $list.find(".subcontainer");
    if ($item) $subcontainer = get_item_subcontainer($item);
    $subcontainer.find(".subcontent").slideUp(function() {
        remove_subcontainer($item);
    });
}

function remove_subcontainer($item) {
    var $subcontainer = $list.find(".subcontainer");
    if ($item) $subcontainer = get_item_subcontainer($item);
    if ($item_form.length > 0 && $subcontainer.has($item_form).length > 0)
        hide_form();
    $subcontainer.remove();
}

// Item Details ///////////////////////////////////////////////////////////////

function set_up_item_details_interface() {
    $items.find(opts.item_details_link_selector).click(function() {
        var $item = $(this).closest(opts.item_selector);
        if (get_item_subcontainer($item).length > 0)
            slide_up_subcontainer($item);
        else open_item_details($item);
        return false;
    });
}

function open_item_details($item) {
    if (!opts.get_item_details_url) return;

    var $item_details = show_subcontainer($item).find(".subcontent");
    $item_details.addClass("item-details");
    show_item_details_spinner($item_details);
    $item_details.slideDown(200);

    var data = { id: $item.attr(opts.item_id_attr_name) };
    $.extend(data, opts.additional_request_data);

    $.get(opts.get_item_details_url, data, function(data) {
        hide_item_details_spinner($item_details);

        $item_details.append(data);
        $item_details.slideDown(200);

        $list.trigger("itemDetailsShow");
    }).error(check_request_error);
}

function show_item_details_spinner($item_details) {
    var $spinner = $('<div class="spinner-container"><div class="spinner">' +
         '</div></div>');
    $item_details.append($spinner);
}

function hide_item_details_spinner($item_details) {
    $item_details.find(".spinner-container").remove();
}

// Item Form //////////////////////////////////////////////////////////////////

function hide_form() {
    $item_form.hide();
    $item_form_container.append($item_form);
    $add_button.fadeIn(200);
    remove_subcontainer();
}

function submit_form(data) {
    show_container_spinner();
    $.extend(data, opts.additional_request_data);
    $item_form.ajaxSubmit({
        url: opts.item_add_url,
        data: data,
        success: function(response) {
            if (response) show_error(response);
            $list.trigger("itemFormSubmit");
            update_list();
            remove_subcontainer();
        },
        error: function() {
            show_error("Form submission error.");
        }});
}

// Adding Items ///////////////////////////////////////////////////////////////

function show_add_form() {
    remove_subcontainer();

    $item_form.find('.omit-on-edit').show();
    $item_form.attr("action", opts.item_add_url);

    if (typeof $item_form.resetForm == "function") $item_form.resetForm();
    $item_form_container.append($item_form);

    $list.trigger('addFormShow');

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
        if (typeof $item_form.ajaxSubmit != "function") return true;
        submit_form();
        return false;
    });
}

// Editing Items //////////////////////////////////////////////////////////////

function edit_hovered_item() { show_edit_form($hovered_item); }

function show_edit_form($item) {
    remove_subcontainer();

    var $edit_form_container = show_subcontainer($item);
    var $subcontent = $edit_form_container.find(".subcontent");
    $subcontent.addClass("form");
    $subcontent.append($item_form);

    $list.trigger('editFormShow', [$item]);

    $item_form.find('.omitted_on_edit').hide();
    $item_form.attr("action", opts.item_update_url);

    if (typeof $item_form.resetForm == "function") $item_form.resetForm();
    var $fields = $item_form.find("input, textarea, select");
    var data = deserialize($item.attr("item-data"));
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

    $item_form.show();
    $edit_form_container.find(".subcontent").slideDown();

    // Rigging submit button
    $item_form.unbind('submit');
    $item_form.bind('submit', function() {
        if (typeof $item_form.ajaxSubmit != "function") return true;
        var d = {};
        if ($item.attr("item-id")) d.id = $item.attr("item-id");
        if (data.hasOwnProperty("id")) d.id = data["id"];
        submit_form(d);
        return false;
    });

    $("body").animate({ scrollTop: $item.offset().top }, 200);
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
    var data = deserialize($hovered_item.attr("item-data"));
    $.extend(data, opts.additional_request_data);
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

// Deep Linking ///////////////////////////////////////////////////////////////

function read_url() {

    var url = window.location.hash.substring(1);
    if (url == last_url) return;
    last_url = url;

    // parsing url
    url = url.split("&");
    var params = {};
    for (var u in url) {
        u = url[u].split("=");
        if (u.length > 0) params[u[0]] = u[1];
    }

    var id = list_id;

    if (params.hasOwnProperty(id + "-page")) {
        current_page = params[id + "-page"];
        if (current_page != "all") current_page = parseInt(current_page) - 1;
    }

    if (params.hasOwnProperty(id + "-sort")) {
        var s = params[id + "-sort"];
        s = s.split(".");
        current_sort = s[0];
        current_sort_dir = s[1];
    }

    update_list();
}

function update_url() {
    var id = list_id;
    var url = [];

    if (current_page) {
        if (current_page != "all")
            url.push(id + "-page=" + (current_page + 1));
        else url.push(id + "-page=" + current_page);
    }

    if (current_sort)
        url.push(id + "-sort=" + current_sort + "." + current_sort_dir);

    window.location.hash = url.join("&");
}

};

/*****************************************************************************
 Plugin Defaults
 *****************************************************************************/

$.fn.ajaxList.defaults = {
    // URL for retrieving content for current list state. Required.
    get_content_url: null,
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
    item_details_link_selector: ".details-link",
    // URL for retrieving HTML of item details. Required.
    get_item_details_url: null,

    // Selector for finding pagination block container
    pagination_container_selector: ".pagination-container",
    // Number of items on one page
    items_per_page: 50,
    // Should we display "Show all" link in pagination block.
    allow_show_all: true,
    // Function that will generate pagination links
    pagination_generator: generate_default_pagination_links,

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
 Generate Pagination Methods
 *****************************************************************************/

function generate_default_pagination_links(current_page, pages_num,
        allow_show_all) {

    var html = '<div class="pagination"><ul class="pull-left">';
    html += '<li>';
    if (current_page !== 0) html += '<a href="#" class="prev-link">«</a>';
    else html += '<span class="prev-link inactive">«</span>';
    html += '</li>';
    html += '<li><span>Page ' + (current_page + 1) + '/' + pages_num +
        '</span></li>';
    html += '<li>';
    if (current_page !== pages_num - 1)
        html += '<a href="#" class="next-link">»</a>';
    else html += '<span class="next-link inactive">»</span>';
    html += '</li>';
    html += '</ul>';
    if (allow_show_all) html += '<div class="pull-left"><a href="#" ' +
        'class="show-all-link">Show All</a></div>';
    html += '</div>';
    return html;
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