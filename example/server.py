import sqlite3
import urllib
from bottle import route, run, static_file, template, request, post

conn = sqlite3.connect("countries.db")
conn.row_factory = sqlite3.Row
c = conn.cursor()

country_fields = [ "common_name", "formal_name", "type", "sub_type",
    "sovereignty", "capital", "iso4217_currency_code", "iso4217_currency_name",
    "itu_t_telephone_code", "iso3166_1_2letter_code", "iso3166_1_3letter_code",
    "iso_3166_1_number", "iana_country_code_tld" ]

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

    return template("country_list", data=data, count=count, per_page=per_page,
        start=start)


@route("/country_info_get_details")
def get_country_details():
    id = int(request.query.get("id"))
    res = c.execute("select * from countries where rowid = ?", [id])
    return template("country_details", data=res.fetchone())


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
