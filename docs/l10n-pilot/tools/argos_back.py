"""A third engine, used only to judge: Argos Translate (OpenNMT models from
the Argos package index, offline once fetched, no account) back-translates
BOTH versions into English, so neither is judged by the system that wrote
it, nor by the author of the other.

    python docs/l10n-pilot/tools/argos_back.py

Keep its data out of the repo: set ARGOS_PACKAGES_DIR (and XDG_DATA_HOME,
XDG_CACHE_HOME) to a scratch folder first. Writes
results/back/argos-<version>-<lang>.json and results/back/argos-versions.json.
"""
import json
import os
import sys

import argostranslate.package as pkg
import argostranslate.translate as tr

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
RES = os.path.join(ROOT, "results")
LANGS = {"de": "de", "fr": "fr", "es": "es", "pt-BR": "pt", "ru": "ru", "zh-CN": "zh", "ja": "ja", "ko": "ko"}

pkg.update_package_index()
available = pkg.get_available_packages()
versions = {}
for ours, code in LANGS.items():
    found = [p for p in available if p.from_code == code and p.to_code == "en"]
    if not found:
        print("no argos model", code, "-> en", file=sys.stderr)
        continue
    p = found[0]
    installed = [q for q in pkg.get_installed_packages() if q.from_code == code and q.to_code == "en"]
    if not installed:
        pkg.install_from_path(p.download())
    versions[ours] = f"translate-{code}_en {p.package_version}"

renders = json.load(open(os.path.join(RES, "render.json"), encoding="utf-8"))
# A model that degenerates (es_en 1.9 repeats one token forever under the
# installed ctranslate2) is left out rather than scored.
broken = {}
for ours, code in LANGS.items():
    if ours not in versions:
        continue
    probe = tr.translate(renders[f"{ours}.draft"]["title-play"], code, "en")
    if len(probe) > 60:
        broken[ours] = versions.pop(ours) + " (degenerate output, left out)"
        for version in ("draft", "machine"):
            stale = os.path.join(RES, "back", f"argos-{version}-{ours}.json")
            if os.path.exists(stale):
                os.remove(stale)
        print(ours, "broken:", probe[:40], flush=True)
for ours, code in LANGS.items():
    if ours not in versions:
        continue
    for version in ("draft", "machine"):
        target = os.path.join(RES, "back", f"argos-{version}-{ours}.json")
        if os.path.exists(target) and os.environ.get("ARGOS_REDO") != "1":
            continue
        lines = renders[f"{ours}.{version}"]
        out = {i: tr.translate(t or "", code, "en") for i, t in lines.items()}
        with open(target, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=1)
    print(ours, versions[ours], flush=True)
with open(os.path.join(RES, "back", "argos-versions.json"), "w", encoding="utf-8") as f:
    json.dump({**versions, "broken": broken}, f, indent=1)
