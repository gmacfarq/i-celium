# I-celium

**Live:** https://gmacfarq.github.io/i-celium/

A meditation companion for observing attachments and cataloguing them as a living
mycelium. **I**, the self, sits at the centre; each attachment grows out of it as a hypha.

## The foundation: the four upādānas

Four main cords grow out of the I, one for each classical kind of attachment (upādāna):

| Cord | Pali | What one is attached to |
|---|---|---|
| Sensual attachment | kāmupādāna | sights, sounds, smells, tastes, touch, pleasant mental states |
| Attachment to views | diṭṭhupādāna | opinions, beliefs, ideologies, being right |
| Attachment to rites & rituals | sīlabbatupādāna | rules, routines, spiritual forms, meditation states, technique, progress |
| Attachment to self | attavādupādāna | self-image, roles, relationships, possessions: "I" and "mine" |

Each attachment branches off its cord, and a cord thickens as more held attachments feed it.
Each attachment also has a **form**: the practical shape it takes in Vipassana terms.
It also has a **tone**: craving (a filled node) or aversion (a hollow ring).

## Using it

- **Name an attachment.** Click the **I** or "+ Name an attachment". Choose its kind, form, tone, and how tightly it is held.
  Tighter attachments sit closer to the self and grow thicker hyphae.
- **Zoom into a kind.** Click a cord or its label to zoom into that kind of attachment.
  On a phone, tap anywhere in its quadrant. "← All four", Escape, or tapping empty space zooms back out.
  Tapping the I while zoomed in names a new attachment of that kind.
  On phones, the overview stays quiet (small dots, no labels, a count per cord), and the detail lives in the zoomed view.
- **Move it.** Drag any attachment to place it where it feels right. Its coordinates are saved,
  and changing its tightness later slides it toward or away from the I in the same direction.
- **Notice it.** Click an attachment, then "I noticed it" each time it arises in practice.
  The more often you notice it, the more nutrient pulses flow along its hypha.
- **Loosen it.** When the grip on something eases, mark it "Loosened". Its hypha fades to a faint, dotted thread.
  It stays on the map as a record.

Your data stays in this browser (localStorage). Use **Export** to back it up and **Import** to restore it.

## Running

No build step. Serve the folder and open it in a browser:

```bash
python3 -m http.server 8417
```

Then visit http://localhost:8417.

## Files

- `index.html`: layout and the side panel
- `style.css`: colours and type
- `app.js`: data model, mycelium generation and rendering, interaction
