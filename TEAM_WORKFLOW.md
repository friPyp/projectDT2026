# SIH26032 — Team Workflow (Read This Once, Then Just Follow It)

You don't need to know how to code for this. You need to follow steps in order.
Read this whole thing once — it's short — then keep it open the first few times
you do a work session.

---

## The 30-second version

We're building an app together using Claude (an AI) to write the actual code.
Your job is: open a chat with Claude, tell it what needs doing, paste in two
files so it knows the current state of the project, and let it work. Claude
will save everything to a shared online project folder (called a **repo**) so
the other two people always see the latest version.

---

## Part 0 — Two words you need to know

- **Repo (repository):** the shared online folder holding all the project's
  code. Think Google Drive folder, but for code. Lives on a website called
  GitHub.
- **PAT (Personal Access Token):** basically a password that lets Claude save
  changes to the repo *as you*, so everyone can tell who did what. You'll
  make one, once, and keep it private like a password.

That's genuinely all the jargon you need.

---

## Part 1 — One-time setup (do this once, ever)

### Step 1: Make a GitHub account
Go to **github.com** → "Sign up" → use your real name or something recognizable
as your username (not an anonymous handle — we need to know who did what).

### Step 2: Get added to the repo
Send [ORGANIZER NAME] your GitHub username. They'll add you as a collaborator
on the repo. You'll get an email invite — accept it.

### Step 3: Make your Personal Access Token (PAT)
This is the fiddliest one-time step. Follow exactly:

1. On GitHub, click your profile picture (top right) → **Settings**
2. Scroll all the way down the left sidebar → **Developer settings**
3. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
4. Give it a name like `sih26032-claude`
5. Set **Expiration** to 30 days (past our deadline is fine, doesn't matter)
6. Under **Repository access**, choose "Only select repositories" and pick our repo
7. Under **Permissions**, find "Contents" and set it to **Read and write**
8. Click **Generate token**
9. **Copy the token immediately** — GitHub only shows it once. It'll look like
   `github_pat_11ABC...` — a long random string.

### Step 4: Save it somewhere safe
Paste it into your phone's Notes app, or a password manager. **Do not** post
it in the group chat, don't put it in a public doc. It works like a password —
anyone with it can push code as you.

That's the entire one-time setup. You won't do this again.

---

## Part 2 — Every time you sit down to work

### Step 1: Open a fresh chat with Claude
New chat every time, don't try to reuse an old long one.

### Step 2: Paste the "kickoff message" below, filling in your blanks

```
Here's our project. Read the two files below, tell me what state the
project is in and what the next task is, then help me do it.

My GitHub PAT: [PASTE YOUR PAT HERE]
Repo URL: [ORGANIZER FILLS THIS IN]
My name (for the status log): [YOUR NAME]

Follow the development rules in the "Rules Claude Always Follows" section
below exactly. When we're done with this session, commit and push the
changes to GitHub yourself, and fully rewrite PROJECT_STATUS.md (not just
add a line) before finishing.

--- PROJECT_REFERENCE.md ---
[paste the whole file here]

--- PROJECT_STATUS.md ---
[paste the whole file here — always grab the LATEST version from GitHub
first, since a teammate may have updated it since you last looked]

--- Rules Claude Always Follows ---
[paste Part 3 below]
```

**Important:** always grab the newest `PROJECT_STATUS.md` from GitHub right
before you paste it in — not an old copy sitting in your notes. That file is
how you avoid stepping on a teammate's work.

### Step 3: Tell Claude what you want done
If you don't know, just say: *"do the next task listed in PROJECT_STATUS.md."*
If you have something specific in mind, say it in plain English — you don't
need to speak in technical terms, Claude will translate.

### Step 4: Let it work, answer anything it asks you
It might ask you to confirm a decision. Answer honestly, in plain language.
If you genuinely don't know, say so — don't guess just to keep things moving.

### Step 5: Confirm it actually pushed
Before you close the chat, ask directly: **"Did you push everything to GitHub
and update PROJECT_STATUS.md?"** Don't just assume — confirm it out loud in
the chat. If it says no or hits an error, don't leave — ask it to fix the
problem before you go.

---

## Part 3 — Rules Claude Always Follows

*(paste this block into every chat — it's Claude's guardrails so it doesn't
wander off and build things we don't need)*

```
Development philosophy for this project:
- Don't build ahead of the current phase in PROJECT_STATUS.md. If the next
  task is "booking," don't also start on payments.
- Don't introduce new libraries/tools without explaining why in plain
  language and getting a yes from me first.
- Don't rewrite or "improve" code that's already working and marked done —
  leave it alone unless I specifically ask.
- If something in PROJECT_REFERENCE.md conflicts with what I'm asking for,
  say so before proceeding, don't just silently pick one.
- At the end of every session: run git pull first (in case a teammate
  pushed since I opened this chat), do the work, test it works, then
  git add / commit / push, and fully rewrite PROJECT_STATUS.md (not append —
  rewrite the whole file) before ending.
- If you hit a merge conflict or push error, stop and explain what happened
  in plain language rather than force-pushing over someone else's work.
```

---

## Part 4 — What could go wrong (and what to do)

**"Claude says there's a conflict / push failed."**
This means someone else pushed changes while you were working. Don't panic —
tell Claude: *"there's a conflict, please resolve it carefully without
deleting anyone's work, explain what happened."* Claude can usually sort this
out itself. If it's stuck, ping [ORGANIZER NAME].

**"I don't know what to ask Claude to build."**
Say: *"read PROJECT_STATUS.md and tell me the next task, then do it."* You
never have to invent the task yourself.

**"I think I broke something."**
Tell Claude directly: *"I think this broke something, can you check and fix
it before we push?"* Never push something you're not sure works.

**"My PAT stopped working."**
It probably expired (30 days) or was revoked. Make a new one — same steps as
Part 1, Step 3.

---

## Part 5 — Cheat sheet (screenshot this)

1. New Claude chat
2. Paste kickoff message + latest `PROJECT_STATUS.md` from GitHub + rules block
3. Say what needs doing (or "do the next task")
4. Answer Claude's questions honestly
5. Before closing: ask "did you push and update the status file?"
6. Done — close the chat
