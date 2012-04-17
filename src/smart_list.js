(function($) { $.fn.smartList = function(options) {

var defaults = {
    // Selector for finding table.
    table_selector: "table",
    // Selector for finding content of table.
    table_content_selector: "tbody",
    // URL for retrieving content for current table state. Required.
    get_table_content_url: null,

    // This data will be posted to server with every request.
    additional_request_data: {},

    // Selector for finding table items
    table_item_selector: ".item",
    // Attribute name that contains item ID.
    item_id_attr_name: "item_id",
    // If the even/odd altering classes should be assigned to the items.
    set_item_altering: true,
    // Selector for finding link that opens item details
    item_details_link_selector: ".name",
    // URL for retrieving HTML of item details. Required.
    get_item_info_url: null,

    // Selector for finding pagination block container
    pagination_container_selector: ".pagination",
    // Number of items on one page
    items_on_page: 50,
    // Should we display "Show all" link in pagination block.
    allow_show_all: true,

    // Selector for finding container of the add/edit item form
    form_container_selector: ".form_container",

    // Selector for finding add new item button
    add_button_selector: ".add_button",
    // URL for adding table item. null - disable item creation.
    item_add_url: null,
    // Adding new table item form header. null - leave default.
    item_add_header_text: null,
    // Text on the button in item creation form.
    item_add_submit_button_text: "Add",

    // Selector for finding edit item links
    edit_link_selector: ".edit_item_link",
    // URL for updating (editing) table item. null - no item updating.
    item_update_url: null,
    // Editing table item form header. null - leave default.
    item_edit_header_text: null,
    // Text on the button in edit item form.
    item_edit_submit_button_text: "Save changes",

    // Selector for finding delete item links
    delete_link_selector: ".delete_item_link",
    // URL for deleting table item. null - no item deletion.
    item_delete_url: null,

    // Is it needed to make all items same height. Only in ul layout.
    fit_cell_height: false
};
var opts = $.extend(defaults, options);

var $container = this;
var $table = $container.find(opts.table_selector);
var layout = $table[0].tagName.toLowerCase();
var $items = null;
var $pagination_container =
    $container.find(opts.pagination_container_selector);
var current_page = 0;

bind_pagination_links();
update_table();

function update_table(page) {
    if (!opts.get_table_content_url) return;

    $pagination_container.children().remove();
    show_table_loader();

    var data = {};
    if (typeof page !== "undefined") data.page = page;
    add_additional_request_data(data);

    $.get(opts.get_table_content_url, data, function(data, status) {
        hide_table_loader();

        $table.find(opts.table_content_selector).append(data);

        $items = $table.find(opts.table_item_selector);

        set_up_item_altering();
        set_up_item_details_interface();
        set_up_pagination();

        $container.trigger("smartListUpdate");
    });
}

function set_up_item_details_interface() {
    $items.find(opts.item_details_link_selector).click(function() {
    var $item = $(this).closest(opts.table_item_selector);
        if (get_item_details($item).length > 0) close_item_details($item);
        else open_item_details($item);
        return false;
    });
}

function show_table_loader() {
    $table.find(opts.table_content_selector + " > *").remove();

    $loader = $('<div class="loader_container"><div class="loader">' + 
         '</div></div>');
    $table.after($loader);
}

function hide_table_loader() {
    $container.find(".loader_container").remove();
}

function add_additional_request_data(data) {
    for (var p in opts.additional_request_data)
        data[p] = opts.additional_request_data[p];
}

function set_up_item_altering() {
    if ($items.filter(".even, .odd").length > 0) return;

    i = 0;
    $items.each(function() {
        i += 1;
        $(this).addClass(i % 2 ? "even" : "odd");
    });
}

function open_item_details($item) {
    if (!opts.get_item_info_url) return;

    var $item_details = create_item_details_container($item);
    show_item_details_loader($item_details);

    var data = { id: $item.attr(opts.item_id_attr_name) };
    add_additional_request_data(data);

    $.get(opts.get_item_info_url, data, function(data) {
        hide_item_details_loader($item_details);

        var $info = $item_details.find(".info");
        $info.hide();
        $info.append(data);
        $info.slideDown(200);

        $container.trigger("itemDetailsShow");
    });
}

function close_item_details($item) {
    var $item_details = get_item_details($item);
    $item_details.find(".info").slideUp(200, function() {
        $item_details.remove();
    });
}

function get_item_details($item) {
    return $item.next(".details");
}

function create_item_details_container($item) {
    var item_alteration = $item.hasClass("odd") ? "odd" : "even";

    if (layout == "table") {
        var colspan = $item.find("td").length;
        var $item_details = $('<tr class="details ' + item_alteration +
            '"><td colspan="' + colspan + 
            '"><div class="info"></div></td></tr>');
    }
    // TODO: other layouts

    $item.after($item_details);
    return $item_details;
}

function show_item_details_loader($item_details) {
    $loader = $('<div class="loader_container"><div class="loader">' + 
         '</div></div>');
    $item_details.find(".info").append($loader);
}

function hide_item_details_loader($item_details) {
    $item_details.find(".info .loader_container").remove();
}

function set_up_pagination() {
    var $first_item = $items.first();
    if (typeof $first_item.attr("item_number") === "undefined" &&
            typeof $first_item.attr("item_count") === "undefined") return;

    var item_number = parseInt($first_item.attr("item_number"));
    var item_count = parseInt($first_item.attr("item_count"));
    current_page = Math.floor(item_number / opts.items_on_page);
    var pages_num = Math.ceil(item_count / opts.items_on_page);
    if (pages_num == current_page) return;

    var html = '<div class="current_page">Page ' + (current_page + 1) + "/" +
        pages_num + "</div>";
    html += '<div class="page_navigation">';
    if (current_page != 0)
        html += '<a href="#" class="prev_link">Previous</a>';
    if (current_page != pages_num - 1)
        html += '<a href="#" class="next_link">Next</a>';
    if (opts.allow_show_all)
        html += '<a href="#" class="show_all_link">Show all</a>';
    html += "</div>";

    $pagination_container.append(html);
}

function bind_pagination_links() {
    $pagination_container.find("a.prev_link").live("click", function() {
        update_table(current_page - 1);
        return false;
    });
    $pagination_container.find("a.next_link").live("click", function() {
        update_table(current_page + 1);
        return false;
    });
    $pagination_container.find("a.show_all_link").live("click", function() {
        update_table("all");
        return false;
    });
}

}})($);
