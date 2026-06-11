/**
 * features/story/storyData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Narrative content: the global game intro shown on first launch, plus a
 * short intro sequence per world shown the first time it becomes active.
 * Each intro is an array of "pages" — { speaker, text } — paged through by
 * components/ui/StoryIntro.js.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const GAME_INTRO = {
  id:    'gameIntro',
  title: 'PROJEKT GENESIS',
  pages: [
    {
      speaker: 'ARIA · STATIONS-KI',
      text:    'Kommandant, willkommen an Bord der Station Alpha. Sie sind der letzte aktive Terraform-Offizier dieses Sektors.',
    },
    {
      speaker: 'ARIA · STATIONS-KI',
      text:    'Drei Welten liegen in Reichweite — alle am Rand des ökologischen Kollapses. Unsere Mission: sie Kontinent für Kontinent zurück ins Leben holen.',
    },
    {
      speaker: 'ARIA · STATIONS-KI',
      text:    'Sammeln Sie Energie, errichten Sie Infrastruktur, züchten Sie Pflanzen im Gewächshaus. Jeder reparierte Boden bringt einen Planeten zurück.',
    },
  ],
};

export const WORLD_INTROS = {
  kepler9b: {
    id:    'kepler9b',
    title: 'KEPLER-9B',
    pages: [
      {
        speaker: 'ARIA · ORBITALSCAN',
        text:    'Kepler-9b. Einst ein blühender Kohlenstoff-Garten — heute von Erosion und Dürre gezeichnet. Das Magnetfeld hält noch. Es gibt Hoffnung.',
      },
      {
        speaker: 'ARIA · ORBITALSCAN',
        text:    'Beginnen Sie auf dem Kontinent Ashen Reach. Sobald alle Zonen dort repariert sind, geben wir die Reiseroute zum nächsten Kontinent frei.',
      },
    ],
  },
  glacius4: {
    id:    'glacius4',
    title: 'GLACIUS IV',
    pages: [
      {
        speaker: 'ARIA · ORBITALSCAN',
        text:    'Glacius IV. Ein Eisriese mit einem Ozean unter der Kruste. Frost und Strahlung haben die Oberfläche versiegelt — aber unter dem Eis pulsiert Leben.',
      },
      {
        speaker: 'ARIA · ORBITALSCAN',
        text:    'Kryophile Flora ist der Schlüssel. Erforschen Sie das Frostfall Shelf und pflanzen Sie, was die Kälte erträgt.',
      },
    ],
  },
  vexprime: {
    id:    'vexprime',
    title: 'VEX PRIME',
    pages: [
      {
        speaker: 'ARIA · ORBITALSCAN',
        text:    'Vex Prime. Schwefelstürme, toxischer Schlamm, tödliche Strahlung. Die feindlichste Welt des Sektors — und unsere letzte Prüfung.',
      },
      {
        speaker: 'ARIA · ORBITALSCAN',
        text:    'Wenn hier wieder etwas wächst, Kommandant, ist Projekt Genesis vollendet. Beginnen Sie in den Sludge Flats.',
      },
    ],
  },
};

/** Intro for a world id, or null. */
export function getWorldIntro(worldId) {
  return WORLD_INTROS[worldId] || null;
}

// ─── continent arrival events ────────────────────────────────────────────────
// Shown once when the player travels to continent index > 0.
// Keyed in seenIntros as `${worldId}:${continentId}`.
const ARRIVAL_FLAVOR = {
  kepler9b: 'Die Sonden melden stabilere Bodenwerte als erwartet.',
  glacius4: 'Das Eis ist hier dünner — die Wärme Ihrer Arbeit breitet sich aus.',
  vexprime: 'Die Sturmfront schwächt sich ab. Ihre Flora verändert die Atmosphäre.',
};

/** Arrival event for a continent, or null. */
export function getContinentArrival(worldId, continent) {
  if (!continent) return null;
  return {
    id:    `${worldId}:${continent.id}`,
    title: continent.name.toUpperCase(),
    pages: [
      {
        speaker: 'ARIA · LANDEKAPSEL',
        text:    `Ankunft auf ${continent.name}. ${ARRIVAL_FLAVOR[worldId] || 'Neue Zonen warten auf Erkundung.'}`,
      },
    ],
  };
}

// ─── terraform complete events ───────────────────────────────────────────────
// Keyed in seenIntros as `${worldId}:done`.
const OUTRO_TEXT = {
  kepler9b: 'Kepler-9b atmet wieder. Wälder werden folgen, wo heute Moos wächst. Der Sektor hat seine erste grüne Welt zurück.',
  glacius4: 'Glacius IV taut. Unter dem Eis erwacht der Ozean — und mit ihm eine Biosphäre, die niemand mehr für möglich hielt.',
  vexprime: 'Vex Prime blüht. Projekt Genesis ist vollendet, Kommandant. Drei Welten leben — wegen Ihnen.',
};

/** Terraform-complete event for a world, or null. */
export function getTerraformOutro(worldId, worldName) {
  return {
    id:    `${worldId}:done`,
    title: `${worldName.toUpperCase()} — TERRAFORMIERT`,
    pages: [
      {
        speaker: 'ARIA · GLOBALSCAN',
        text:    OUTRO_TEXT[worldId] || `${worldName} ist vollständig terraformiert.`,
      },
    ],
  };
}
