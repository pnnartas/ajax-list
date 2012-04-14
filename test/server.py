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
    return template("table_content", data=data)

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
