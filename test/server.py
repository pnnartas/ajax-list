import sqlite3
from bottle import route, run, static_file, template, request

conn = sqlite3.connect("countries.db")
conn.row_factory = sqlite3.Row
c = conn.cursor()


@route("/static/<path:path>")
def js(path):
    return static_file(path, root="./static")


@route("/ajax-list/<path:path>")
def static(path):
    return static_file(path, root="../src")


@route("/<path:path>")
def html(path):
    return static_file(path, root="./static")


@route("/country_info_get_list")
def get_list():
    page = request.query.get("page", 0)
    sort = request.query.get("sort", "name")
    sort_dir = request.query.get("sort_dir")

    res = c.execute("select count(*) from countries")
    count = res.fetchone()[0]

    per_page = 50;
    if page == "all":
        start = 0
        end = count
    else:
        start = per_page * int(page)
        end = start + per_page

    res = c.execute("select rowid, * from countries limit ?, ?",
        (start, end))
    data = [data for data in res]

    return template("country_list", data=data, count=count, per_page=per_page,
        start=start)


@route("/country_info_get_details")
def get_country_details():
    id = int(request.query.get("id"))
    res = c.execute("select * from countries where rowid = ?", [id])
    return template("country_details", data=res.fetchone())


# @route("/get_countries")
# def get_countries():
#     page = request.query.get("page", 0)
#     sort = request.query.get("sort", "name")
#     sort_dir = request.query.get("sort_dir", "asc")

#     data = get_countries_info()
#     item_count = len(data)

#     sort_i = {"name": 0, "type": 2, "capital": 5}.get(sort, "name")
#     data = sorted(data, key=lambda s: s[sort_i],
#         reverse=sort_dir == "desc" and True or False)

#     if page != "all":
#         first_item = int(page) * 50
#         last_item = first_item + 49
#         data = data[first_item:last_item + 1]
#     else:
#         first_item = 0

#     return template("table_content", data=data, first_item=first_item,
#         item_count=item_count)


# @route("/get_country_details")
# def get_country_details():
#     data = get_countries_info()
#     for c in data:
#         if c[0] == request.query.get("id"):
#             return template("country_info", info=c)


# def get_countries_info():
#     with open('countries.csv', 'rb') as f:
#         reader = csv.reader(f)
#         reader.next()
#         data = [row for row in reader]
#     return data

run(host="0.0.0.0", port=8000)
