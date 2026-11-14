#!/usr/bin/env python3
# Módulo MyBible MINI de prueba (texto RV1909 público de la propia app).
import json, sqlite3, os, glob
BASE = os.path.join(os.path.dirname(__file__), '..')
OUT = '/tmp/fixture-mini-prueba.SQLite3'
data = {}
for part in sorted(glob.glob(os.path.join(BASE, 'src/data/rv1909-*.json'))):
    with open(part) as f: data.update(json.load(f))
if os.path.exists(OUT): os.remove(OUT)
con = sqlite3.connect(OUT); cur = con.cursor()
cur.execute('CREATE TABLE info (name TEXT, value TEXT)')
cur.execute('CREATE TABLE books (book_number INT, short_name TEXT, long_name TEXT)')
cur.execute('CREATE TABLE verses (book_number INT, chapter INT, verse INT, text TEXT)')
cur.execute("INSERT INTO info VALUES ('description', 'RV1909 MINI PRUEBA (fixture publico)')")
cur.execute("INSERT INTO info VALUES ('name', 'RV1909 MINI PRUEBA')")
cur.execute("INSERT INTO info VALUES ('language', 'spa')")
cur.execute('INSERT INTO books VALUES (570, ?, ?)', ('Fil', 'Filipenses'))
cur.execute('INSERT INTO books VALUES (190, ?, ?)', ('Sal', 'Salmos'))
n = 0
for ch, verses in [('4', data['filipenses']['4']), ('23', data['salmos']['23'])]:
    book = 570 if ch == '4' else 190
    for v, text in verses.items():
        if book == 570 and int(v) < 10: continue
        cur.execute('INSERT INTO verses VALUES (?, ?, ?, ?)', (book, int(ch), int(v), f'<i></i>{text}'))
        n += 1
con.commit(); con.close()
print(f'OK {OUT} versiculos={n}')
