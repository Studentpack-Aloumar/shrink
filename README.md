# Shrink

**Make large GNSS RINEX files small enough to upload to [AUSPOS](https://gnss.ga.gov.au/auspos) on a slow connection.**

Live: https://shrink-gnss.vercel.app

Receivers often log every 1–2 seconds and record every satellite system, so one session can be 70 MB or more. Uploads that big to AUSPOS tend to time out or fail with *"Failed to submit processing request"*.

AUSPOS only uses GPS and resamples everything to 30 seconds anyway. Shrink does those two steps in your browser before you upload, so each file becomes about 1 MB and the AUSPOS result stays the same.

## How to use

1. Open the page and drop in your observation files (`.26O`, `.25O`, `.rnx` …).
2. Click **Save small files**.
3. Upload the saved files to AUSPOS. Check the antenna heights against the ones Shrink shows.

Nothing is uploaded anywhere: the files are read and written on your own computer. You can also download `index.html` and open it offline.

## What it changes

| Kept | Removed |
| --- | --- |
| Header: station name, antenna type and height, receiver, position | Header lines for other satellite systems (GLONASS, Galileo, BeiDou …) |
| GPS observations at whole 30-second marks | Other satellite systems and in-between epochs |
| | Event records (epoch flags 2–5) |

`INTERVAL`, `TIME OF FIRST OBS` and `TIME OF LAST OBS` are updated. Output files are named `SSSSDDD0.YYO` (station, day of year), which AUSPOS accepts.

It also warns when a file has under 1 hour of data, when files sent together don't overlap by more than 1 hour, and when the data is too recent for AUSPOS.

Supports RINEX 2.x and 3.x/4.x observation files. Compressed files (Hatanaka `.d`, `.crx`, `.gz`) aren't supported.

## Development

Everything is in `index.html` (no build step, no dependencies). The RINEX logic lives in the `<script id="core">` block.

```sh
node test/run.js
```

Not affiliated with Geoscience Australia.

## License

MIT
