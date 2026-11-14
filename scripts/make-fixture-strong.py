#!/usr/bin/env python3
# Genera un módulo MyBible de PRUEBA con etiquetas Strong/notas/morfología,
# con texto de ejemplo escrito para el test (sin texto bíblico con derechos).
# Solo para tests locales del parser: etiquetas reales del formato MyBible
# según BibleMultiConverter (MyBibleZone.java): <S> Strong, <f> nota al pie,
# <m> morfología, <pb/> <br/> <t> saltos/títulos, <n> <i> <J> <e> formato.
import sqlite3, os

OUT = '/tmp/fixture-strong-prueba.SQLite3'

VERSES = [
    # (book_number, chapter, verse, text)
    # Salmos (190): etiqueta pegada a la palabra anterior, doble etiqueta seguida
    (190, 23, 1, "<pb/>Jehová<S>3068</S> es<S>1961</S> mi pastor;<S>7462</S> <f>[1]</f>nada<S>3808</S> me faltará.<S>2637</S>"),
    (190, 23, 2, "En lugares<S>5116</S> de verdes pastos<S>1877</S><m>N-msa</m> me hará descansar,<S>7257</S> junto a<S>5921</S> aguas<S>4325</S> de reposo<S>4496</S> me guiará.<S>5095</S>"),
    (190, 23, 3, "El restaurará<S>7725</S> mi alma;<S>5315</S> <n>y</n> me conducirá<S>5148</S> por sendas<S>4570</S> de justicia<S>6664</S> por amor<S>4616</S> de su nombre.<S>8034</S>"),
    # Título de salmo (<t>) + asterisco, como en la captura real de Ale
    (190, 27, 1, "<t>«Salmo de David.»</t> * <pb/>Jehová<S>3068</S> es<S>1961</S> mi luz<S>216</S> y mi salvación;<S>3468</S> ¿de quién<S>4310</S><S>6342</S> temeré?<S>3372</S> Jehová<S>3068</S> es<S>1961</S> la fortaleza<S>4581</S> de mi vida;<S>2416</S> ¿de quién<S>4310</S> he de atemorizarme?<S>6342</S>"),
    # Números legítimos del texto: NO deben tocarse
    (190, 90, 10, "Los días<S>3117</S> de nuestra edad son 70 años;<S>8141</S> y si<S>518</S> en los más robustos son 80 años, con todo, su fortaleza es molestia y trabajo,<S>205</S><S>3015</S> porque pronto pasa,<S>2440</S><S>2498</S> y volamos.<S>5774</S>"),
    # Etiqueta Strong al inicio del versículo (borde)
    (190, 1, 1, "<S>376</S>Bienaventurado el varón<S>835</S> que no anduvo<S>1980</S> en consejo<S>6098</S> de malos.<S>7563</S>"),
    # Juan (500): palabras de Jesús (<J>) y griego
    (500, 3, 16, "Porque<S>3754</S> de tal manera<S>3779</S> amó<S>25</S> Dios<S>2316</S> al mundo,<S>2889</S> <J>que ha dado<S>1325</S> a su Hijo<S>5207</S> unigénito,<S>3439</S> para que<S>2443</S> todo<S>3956</S> aquel que<S>3588</S> en él<S>846</S> cree,<S>4100</S> no se pierda,<S>622</S> mas tenga<S>2192</S> vida<S>2222</S> eterna.<S>166</S></J>"),
    # Génesis (10): cursiva <i> y negrita <e> conservan su texto
    (10, 1, 1, "<i>En el principio</i><S>7225</S> <e>creó</e><S>1254</S> Dios<S>430</S> los cielos<S>8064</S> y la tierra.<S>776</S>"),
]

BOOKS = [
    (190, 'Sal', 'Salmos'),
    (500, 'Jn', 'Juan'),
    (10, 'Gn', 'Génesis'),
]

if os.path.exists(OUT):
    os.remove(OUT)
con = sqlite3.connect(OUT)
cur = con.cursor()
cur.execute('CREATE TABLE info (name TEXT, value TEXT)')
cur.execute('CREATE TABLE books (book_number INT, short_name TEXT, long_name TEXT)')
cur.execute('CREATE TABLE verses (book_number INT, chapter INT, verse INT, text TEXT)')
cur.execute("INSERT INTO info VALUES ('description', 'RV1909 STRONG PRUEBA (fixture publico con etiquetas)')")
cur.execute("INSERT INTO info VALUES ('name', 'RV1909 STRONG PRUEBA')")
cur.execute("INSERT INTO info VALUES ('language', 'spa')")
cur.execute("INSERT INTO info VALUES ('strong_numbers', 'true')")
for num, short, long in BOOKS:
    cur.execute('INSERT INTO books VALUES (?, ?, ?)', (num, short, long))
for v in VERSES:
    cur.execute('INSERT INTO verses VALUES (?, ?, ?, ?)', v)
con.commit()
con.close()
print(f'OK {OUT} versiculos={len(VERSES)}')
