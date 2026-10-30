#!/usr/bin/env python3
"""UApp · versionar: deja listos los archivos antes de publicar.

Qué hace, en orden:
  1. Revisa cada mazo de Estudiar (estudiar/mazos/*.json): códigos únicos, campos completos,
     alternativas y temas válidos. Si algo está mal, lo dice y no cambia nada.
  2. Escribe el índice de los mazos (INDICE) dentro de estudiar/estudiar.js: los códigos de
     tarjetas y preguntas, sus temas y la versión de cada mazo. Con eso la app muestra el avance
     sin descargar el contenido.
  3. Pone al día la versión (?v=…) de cada archivo que index.html carga con versión, según su
     contenido. Así ningún teléfono mezcla un archivo viejo con uno nuevo.

Uso (desde la carpeta del repositorio):
  python3 _desarrollo/versionar.py            → revisa y actualiza
  python3 _desarrollo/versionar.py --revisar  → solo revisa; sale con error si falta actualizar

No necesita instalar nada: solo Python 3.
"""
import hashlib, json, re, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
MAZOS = RAIZ / "estudiar" / "mazos"
JS = RAIZ / "estudiar" / "estudiar.js"
HTML = RAIZ / "index.html"
INI, FIN = "  var INDICE={", "  /* FIN ÍNDICE */"
ID_OK = re.compile(r"^[A-Za-z0-9_-]+$")
# Igual que preguntasDeArticulos() en estudiar.js: una tarjeta que cita un único artículo se vuelve pregunta
ART = re.compile(r"Art\. (\d+) (CC|CPC|COT|CPP|CT)", re.ASCII)


def huella(datos: bytes) -> str:
    return hashlib.sha1(datos).hexdigest()[:10]


def revisar_mazo(clave, M):
    err = []
    if not ID_OK.match(clave):
        err.append("el nombre del archivo solo puede tener letras, números y guiones")
    for campo in ("ramo", "nota"):
        if not isinstance(M.get(campo), str) or not M[campo].strip():
            err.append(f"falta «{campo}»")
    T, P = M.get("tarjetas"), M.get("preguntas")
    if not isinstance(T, list) or not isinstance(P, list):
        return err + ["«tarjetas» y «preguntas» deben ser listas"]
    temas = M.get("temas")
    if temas is not None:
        if not isinstance(temas, list) or any(not isinstance(t, dict) or t.get("n") != i + 1 or not t.get("t") for i, t in enumerate(temas)):
            err.append("«temas» debe numerarse 1, 2, 3… y cada uno llevar su título")
    vistos = set()
    def tema_ok(x, donde):
        u = x.get("u")
        if u is None:
            return
        if not temas or not isinstance(u, int) or not 1 <= u <= len(temas):
            err.append(f"{donde}: el tema {u!r} no existe")
    for x in T:
        i = x.get("id")
        donde = f"tarjeta {i}"
        if not isinstance(i, str) or not ID_OK.match(i): err.append(f"tarjeta con código inválido: {i!r}"); continue
        if i in vistos: err.append(f"{donde}: código repetido")
        vistos.add(i)
        for c in ("t", "d", "r"):
            if not isinstance(x.get(c), str) or not x[c].strip(): err.append(f"{donde}: falta «{c}»")
        tema_ok(x, donde)
    for x in P:
        i = x.get("id")
        donde = f"pregunta {i}"
        if not isinstance(i, str) or not ID_OK.match(i): err.append(f"pregunta con código inválido: {i!r}"); continue
        if i in vistos: err.append(f"{donde}: código repetido")
        vistos.add(i)
        for c in ("q", "por", "r"):
            if not isinstance(x.get(c), str) or not x[c].strip(): err.append(f"{donde}: falta «{c}»")
        o = x.get("o")
        if not isinstance(o, list) or len(o) < 2 or any(not isinstance(a, str) or not a.strip() for a in o):
            err.append(f"{donde}: las alternativas («o») deben ser al menos dos textos")
        elif not isinstance(x.get("ok"), int) or not 0 <= x["ok"] < len(o):
            err.append(f"{donde}: «ok» debe indicar una alternativa que exista (0 = la primera)")
        tema_ok(x, donde)
    return err


def n_articulos(T):
    por = {}
    for t in T:
        x = ART.fullmatch(t.get("r") or "")
        if not x or re.search(r"\b" + x.group(1) + r"\b", t.get("d") or "", re.ASCII):
            continue   # si el texto ya nombra el artículo, la pregunta se respondería sola
        g = por.setdefault(x.group(2), {"t": 0, "n": set()})
        g["t"] += 1
        g["n"].add(int(x.group(1)))
    return sum(g["t"] for g in por.values() if len(g["n"]) >= 4)   # hacen falta 4 artículos distintos del mismo código


def compactar(us):
    """[1,1,1,2,None] → «1*3,2,» (como lo despliega desplegar() en estudiar.js)."""
    if all(u is None for u in us):
        return None
    tramos = []
    for u in us:
        s = "" if u is None else str(u)
        if tramos and tramos[-1][0] == s: tramos[-1][1] += 1
        else: tramos.append([s, 1])
    return ",".join(s if n == 1 else f"{s}*{n}" for s, n in tramos)


def entrada(clave, datos: bytes, M):
    e = {"v": huella(datos), "ramo": M["ramo"], "nota": M["nota"]}
    if M.get("revision"): e["revision"] = M["revision"]
    if M.get("temas"): e["temas"] = M["temas"]
    e["art"] = n_articulos(M["tarjetas"])
    e["t"] = ",".join(x["id"] for x in M["tarjetas"])
    tu = compactar([x.get("u") for x in M["tarjetas"]])
    if tu: e["tu"] = tu
    e["p"] = ",".join(x["id"] for x in M["preguntas"])
    pu = compactar([x.get("u") for x in M["preguntas"]])
    if pu: e["pu"] = pu
    return e


def main():
    solo_revisar = "--revisar" in sys.argv[1:]
    problemas, indice, cuentas = [], {}, []
    for f in sorted(MAZOS.glob("*.json")):
        datos = f.read_bytes()
        try:
            M = json.loads(datos.decode("utf-8"))
        except Exception as ex:
            problemas.append(f"{f.name}: no es un JSON válido ({ex})"); continue
        err = revisar_mazo(f.stem, M)
        problemas += [f"{f.name}: {x}" for x in err]
        if not err:
            indice[f.stem] = entrada(f.stem, datos, M)
            cuentas.append((f.stem, len(M["tarjetas"]), len(M["preguntas"]), len(datos)))
    if problemas:
        print("Hay que corregir los mazos antes de publicar:")
        for p in problemas: print("  ·", p)
        sys.exit(1)

    js = JS.read_text(encoding="utf-8")
    a, b = js.find(INI), js.find(FIN)
    if a < 0 or b < a:
        sys.exit("No encontré las marcas del índice en estudiar/estudiar.js")
    # se respeta el orden que ya tiene el índice; los mazos nuevos van al final
    previo = re.findall(r'^    "([^"]+)":', js[a:b], re.M)
    orden = [k for k in previo if k in indice] + sorted(k for k in indice if k not in previo)
    lineas = [f'    {json.dumps(k, ensure_ascii=False)}:{json.dumps(indice[k], ensure_ascii=False, separators=(",", ":"))}' for k in orden]
    bloque = INI + "\n" + ",\n".join(lineas) + "\n  };\n"
    js_nuevo = js[:a] + bloque + js[b:]

    html = HTML.read_text(encoding="utf-8")
    cambios = []
    def poner_version(m):
        ruta = m.group(2)
        archivo = RAIZ / ruta
        if not archivo.is_file():
            problemas.append(f"index.html carga «{ruta}», pero ese archivo no existe")
            return m.group(0)
        datos = js_nuevo.encode("utf-8") if archivo == JS else archivo.read_bytes()
        v = huella(datos)
        if v != m.group(3): cambios.append(f"{ruta}: {m.group(3)} → {v}")
        return f"{m.group(1)}{ruta}?v={v}{m.group(4)}"
    html_nuevo = re.sub(r'((?:src|href)=")([^"?#:]+)\?v=([0-9A-Za-z]+)(")', poner_version, html)
    if problemas:
        for p in problemas: print("  ·", p)
        sys.exit(1)

    pendiente = js_nuevo != js or html_nuevo != html
    if solo_revisar:
        if pendiente:
            print("Falta actualizar: corre  python3 _desarrollo/versionar.py")
            for c in cambios: print("  ·", c)
            if js_nuevo != js: print("  · el índice de estudiar/estudiar.js no coincide con los mazos")
            sys.exit(1)
        print(f"Todo al día: {len(indice)} mazos, versiones correctas.")
        return
    if js_nuevo != js: JS.write_text(js_nuevo, encoding="utf-8")
    if html_nuevo != html: HTML.write_text(html_nuevo, encoding="utf-8")
    tt, tp = sum(c[1] for c in cuentas), sum(c[2] for c in cuentas)
    print(f"Mazos revisados: {len(indice)} ({tt} tarjetas y {tp} preguntas).")
    print("Versiones:", "sin cambios" if not cambios else "")
    for c in cambios: print("  ·", c)


if __name__ == "__main__":
    main()
