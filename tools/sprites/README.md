# Sprite-Pipeline (Blender → Skia)

Das Spiel zeichnet die Hotels mit vorgerenderten isometrischen Sprites
(`components/iso`, Skia). Die Modelle kommen aus der bestehenden 3D-Szene
(`components/scene`); sie ist die „Modellierung in Code“. Blender (Cycles)
rendert daraus Hintergrund und Sprites mit echtem Licht, Schatten,
Umgebungsverdeckung und abgerundeten Kanten.

```
components/scene/*  ──(/export + Playwright)──▶  <hotel>-L<level>.glb, -doors.glb, -chars.glb
        │                                                   │
        │   Part-Tags (components/scene/parts.js)            ▼
        │                                         render_hotel.py / render_chars.py (bpy, Cycles)
        │                                                   │
        ▼                                                   ▼
  game logic unchanged                         pack.py ─▶ assets/sprites/<hotel>/ (Atlas + pack.json)
                                                            │
                                               components/iso (Skia) zeichnet das Spiel
```

## Voraussetzungen

- Expo-Webserver: `EXPO_OFFLINE=1 npx expo start --web --port 8081`
- Playwright (Chromium) für den Export
- Blender als Python-Modul: `python3.11 -m venv venv && venv/bin/pip install bpy==5.0.1 pillow`

## Ablauf pro Hotel

```bash
node tools/sprites/export-glb.js nachtruh /tmp/glb            # 10 GLB-Dateien
python tools/sprites/render_hotel.py /tmp/glb nachtruh /tmp/sp/nachtruh --samples 48
python tools/sprites/render_chars.py /tmp/glb/nachtruh-chars.glb nachtruh /tmp/sp/nachtruh
python tools/sprites/pack.py /tmp/sp/nachtruh /tmp/glb nachtruh assets/sprites
```

`--only backdrop` / `--only sprites` rendern nur einen Teil und ergänzen das
vorhandene Manifest. Ein Hotel dauert auf 4 CPU-Kernen etwa 50 Minuten.

## Wie die Szene zerlegt wird

- **Hintergrund** (`backdrop-*.webp`): alles Ungetaggte – Boden, Rückwände,
  Treppe, Gelände. Schatten der stehenden Teile sind eingebacken.
- **Sprites** (`<Part>`): alles, was vor einer Figur stehen kann (Trennwände,
  Vorderwände, Theken, Möbel, Deko im Vorgarten). Sie werden im Spiel nach
  ihrem Grundriss tiefensortiert (`components/iso/pack.js`).
- **Stationen** (`station="room:3"`, `bar`, `attr:1`): Varianten je Stufe
  (Export-Stufen 0, 1, 2, 3, 4, 6, 7, 10). Dynamische Teile haben zusätzlich
  ein eigenes Bodenschatten-Bild.
- **Figuren**: jedes Gast-/Personalmodell in 4 Richtungen × Stehen, 2 Laufbilder,
  Sitzen, Liegen; dazu Autos und Baustellen.

Beim Rendern eines Sprites bleibt die ganze Szene als Lichtquelle und
Schattenwerfer aktiv, nur für die Kamera unsichtbar – so passt jedes Sprite
exakt ins Gesamtbild.

## Projektion

2:1-Isometrie (30° Elevation, 45° Drehung), `TILE_W = 96` px pro Bodenkachel
im Atlas. `game/iso.js` rechnet Welt ↔ Bildschirm identisch zur Blender-Kamera.
