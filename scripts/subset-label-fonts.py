"""Rebuild the two local web fonts after adding a place name. Requires FontTools and Brotli."""
import argparse
import json
from datetime import date
from pathlib import Path
import subprocess

from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--kai", default="/usr/share/fonts/truetype/arphic/ukai.ttc")
parser.add_argument("--song", default="/usr/share/fonts/truetype/arphic/uming.ttc")
args = parser.parse_args()

catalog = subprocess.check_output([
    "node", "--input-type=module", "-e",
    "import {places} from './src/content.js'; console.log(JSON.stringify(places.map(p => p.name)));"
], cwd=root, text=True)
labels = "".join(json.loads(catalog)) + "当前视点全景漫游紫禁城宫城图志外朝故宮"
for source, output in [(args.kai, "palace-kai.ttf"), (args.song, "palace-song.woff2")]:
    font = TTFont(source, fontNumber=0)
    missing = set(labels) - {chr(code) for code in font.getBestCmap()}
    if missing:
        raise ValueError(f"{source} lacks glyphs for {''.join(sorted(missing))}")
    builder = subset.Subsetter()
    builder.populate(text=labels)
    builder.subset(font)
    font["name"].setName(
        f"Subset for Palace Atlas title and place labels, {date.today().isoformat()}. "
        "Distributed under the Arphic Public License; see ARPHICPL.TXT.", 10, 3, 1, 0x409)
    if output.endswith(".woff2"):
        font.flavor = "woff2"
    font.save(root / "public" / "media" / output)
