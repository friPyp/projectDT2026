# Prisma query engine cache (not source code)

## What this is

This folder holds one file that isn't part of the application:
`debian-openssl-3.0.x/libquery_engine.so.node`, a compiled Prisma query
engine binary, plus its `.sha256` checksum.

Normally `npx prisma generate` downloads this automatically from
`binaries.prisma.sh`. It's committed here **only** because Claude's
sandbox environment (used to help build this project across chat
sessions) has no network access to that domain, so it can't fetch its
own copy. Keeping one here lets Claude run `prisma generate` and
`tsc -b` on its side to sanity-check schema changes compile, without
needing a live Neon connection.

**This is a deliberate exception, made by frPyP (project head), aware
that:**
- it's a large (~16 MB) compiled binary, not source
- it's platform-specific (Debian/Ubuntu + OpenSSL 3.0.x only — won't
  work on macOS, Windows, or a different Linux base image)
- normal Prisma projects gitignore this and let it download fresh
  per machine

It's accepted here because this is a college project, not a production
codebase maintained by a team that cares about repo size or portability
across platforms.

**Nothing about the running app depends on this file.** Render, Vercel,
and every teammate's own machine still get their engine binary the
normal way, via `prisma generate`'s automatic download. This file is
read only by Claude, only inside its own sandbox, and only as an
optional sanity check.

## How to tell if it's gone stale

It's tied to one specific Prisma **engine version** (a commit hash, not
the same as the `prisma` npm package version). If the Prisma package
gets upgraded, this file may no longer match and generate/compile
checks using it could be unreliable or simply refuse to load.

To check the engine hash your project currently expects:

```bash
cd apps/backend
npx prisma -v
```

Look for a line like:

```
Engine Version : 605197351a3c8bdd595af2d2a9bc3025bca48ea2
```

That hash is what this file was built for (see below). If it's
different from `605197351a3c8bdd595af2d2a9bc3025bca48ea2`, this cached
copy is stale and needs replacing.

## How to get the exact fresh download link, if it ever goes stale

The engine hash from `npx prisma -v` above slots directly into this URL
pattern:

```
https://binaries.prisma.sh/all_commits/<ENGINE_HASH>/debian-openssl-3.0.x/libquery_engine.so.node.gz
https://binaries.prisma.sh/all_commits/<ENGINE_HASH>/debian-openssl-3.0.x/libquery_engine.so.node.gz.sha256
```

For example, with the hash above:

```
https://binaries.prisma.sh/all_commits/605197351a3c8bdd595af2d2a9bc3025bca48ea2/debian-openssl-3.0.x/libquery_engine.so.node.gz
```

To refresh this file yourself, on a machine that can reach that domain:

```bash
HASH=$(cd apps/backend && npx prisma -v | grep "Engine Version" | awk '{print $NF}')
BASE="https://binaries.prisma.sh/all_commits/$HASH/debian-openssl-3.0.x"
curl -O "$BASE/libquery_engine.so.node.gz"
curl -O "$BASE/libquery_engine.so.node.gz.sha256"
gunzip libquery_engine.so.node.gz
sha256sum libquery_engine.so.node   # compare by eye against the .sha256 file
```

Then replace both files in this folder and update the hash quoted above
in this README, and give the new file to Claude in whatever chat needs
it (Claude's sandbox resets between conversations, so this repo copy is
the only way the binary carries over — Claude will re-copy it into its
own scratch space each session, it doesn't run directly from here).

## Current file

- `debian-openssl-3.0.x/libquery_engine.so.node` — engine hash
  `605197351a3c8bdd595af2d2a9bc3025bca48ea2`, added 2026-09-27.
- `debian-openssl-3.0.x/libquery_engine.so.node.sha256` — its checksum,
  for verifying the file wasn't corrupted if re-downloaded or re-copied.
