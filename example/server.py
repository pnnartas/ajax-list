import sqlite3
import urllib
import os
from bottle import route, run, static_file, template, request, post

project_dir = os.path.dirname(os.path.realpath(__file__))
views_dir = os.path.join(project_dir, "views/")
static_dir = os.path.join(project_dir, "static/")
conn = sqlite3.connect(os.path.join(project_dir, "countries.db"))
conn.row_factory = sqlite3.Row
c = conn.cursor()

country_fields = ["common_name", "formal_name", "type", "sub_type",
    "sovereignty", "capital", "iso4217_currency_code", "iso4217_currency_name",
    "itu_t_telephone_code", "iso3166_1_2letter_code", "iso3166_1_3letter_code",
    "iso_3166_1_number", "iana_country_code_tld"]


@route("/")
def index():
    return static_file("index.html", root=views_dir)


@route("/static/<path:path>")
def js(path):
    return static_file(path, root=static_dir)


@route("/ajax-list/<path:path>")
def static(path):
    return static_file(path, root=os.path.join(project_dir, "../src"))


@route("/country_table")
def html():
    return static_file("country_table.html", root=views_dir)


@route("/country_info_get_list")
def get_list():
    page = request.query.get("page", 0)
    sort = request.query.get("sort", "common_name")
    sort_dir = request.query.get("sort_dir", "asc")

    res = c.execute("select count(*) from countries")
    count = res.fetchone()[0]

    per_page = 50
    if page == "all":
        start = 0
        per_page = 10000
    else:
        start = per_page * int(page)

    res = c.execute(("select rowid, * from countries order by %s %s " +
        "limit ?, ?") % (sort, sort_dir), (start, per_page))
    data = [{f: unicode(row[f]).encode("utf-8")
        for f in country_fields + ["rowid"]} for row in res]
    for d in data:
        d["item_data"] = urllib.urlencode(d.items()).replace("+", "%20")

    return template(os.path.join(views_dir, "country_list.html"),
        data=data, count=count, per_page=per_page, start=start)


@route("/country_info_get_details")
def get_country_details():
    id = int(request.query.get("id"))
    res = c.execute("select * from countries where rowid = ?", [id])
    return template(os.path.join(views_dir, "country_details.html"),
        data=res.fetchone())


@post("/country_info_save")
def save_country_info():

    id = int(request.forms.get("id", 0))
    data = [ request.forms.get(f, None).decode("utf-8")
        for f in country_fields ]

    if id == 0:
        c.execute(u"insert into countries values " +
            u" (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", data)
    else:
        c.execute(u"""
            update countries set
                common_name = ?,
                formal_name = ?,
                type = ?,
                sub_type = ?,
                sovereignty = ?,
                capital = ?,
                iso4217_currency_code = ?,
                iso4217_currency_name = ?,
                itu_t_telephone_code = ?,
                iso3166_1_2letter_code = ?,
                iso3166_1_3letter_code = ?,
                iso_3166_1_number = ?,
                iana_country_code_tld = ?
            where rowid = %i""" % (id), data)

@post("/country_info_delete")
def delete_country_info():
    id = int(request.forms.get("id"))
    c.execute("delete from countries where rowid = ?", (id, ))

run(host="0.0.0.0", port=8000)
