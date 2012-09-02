import sqlite3
import csv

with open('countries.csv', 'rb') as f:
    reader = csv.reader(f)
    reader.next()
    data = [[a.decode("utf-8") for a in row] for row in reader]

# print(data)

# for a in data:
#     print(len(a), a[0])

conn = sqlite3.connect('countries.db')
# conn.text_factory = str
c = conn.cursor()

c.execute('''
    create table countries (
        common_name text,
        formal_name text,
        type text,
        sub_type text,
        sovereignty text,
        capital text,
        iso4217_currency_code text,
        iso4217_currency_name text,
        itu_t_telephone_code text,
        iso3166_1_2letter_code text,
        iso3166_1_3letter_code text,
        iso_3166_1_number text,
        iana_country_code_tld text)''')

c.executemany(u"insert into countries values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", data)

conn.commit()