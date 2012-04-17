import csv
from bottle import route, run, static_file, template, request

@route("/js/<path:path>")
def js(path):
    return static_file(path, root="../src")

@route("/<path:path>")
def static(path):
    return static_file(path, root="./")

@route("/get_countries")
def get_countries():
    data = get_countries_info()
    item_count = len(data)
    page = request.query.get("page", 0)
    if page != "all":
        first_item = int(page) * 50;
        last_item = first_item + 49;
        data = data[first_item:last_item + 1]
    else:
        first_item = 0
    return template("table_content", data=data, first_item=first_item,
        item_count=item_count)

@route("/get_country_details")
def get_country_details():
    data = get_countries_info()
    for c in data:
        if c[0] == request.query.get("id"):
            return template("country_info", info=c)

def get_countries_info():
    with open('countries.csv', 'rb') as f:
        reader = csv.reader(f); reader.next()
        data = [row for row in reader]
    return data

run(host="0.0.0.0", port=8000)
