# Writing commit messages

The changelog is rendered from commit **subjects and bodies**, so what you commit
is what readers see. Watch out for characters that a **shell** re-interprets —
especially when a message is drafted by an **AI/LLM** and committed through
`git commit -m "…"`.

## Shell escaping

- **PowerShell** treats a backtick as its escape character, so `` `r `` / `` `n `` /
  `` `t `` / `` `b `` become CR / LF / TAB / backspace. A preceding `\` is left
  behind, so `` `resolveVite `` can land in the changelog as a stray `\`, a CR and
  `esolveVite`.
- **bash** runs an unquoted `` `…` `` as command substitution, and `$(…)` / `${…}`
  expand before `git` ever sees them.

The result is invisible control characters, stray `\` and dropped letters.
`sanitizeText` maps the common control characters back to the letter they
replaced (`BEL`→`a`, `BS`→`b`, `FF`→`f`, `VT`→`v`, `TAB`→`t`, `LF`→`n`,
`CR`→`r`, `ESC`→`e`, `NUL`→`0`) and drops the stray `\`, so words like `any`,
`false` and `bin` are restored. A character the shell consumed without leaving a
trace still cannot be recovered.

## Authoring safely

- Prefer a **file over `-m`**: `git commit -F message.txt`, or a quoted heredoc
  (`git commit -F - <<'EOF' … EOF`) — nothing is re-interpreted. Avoid assembling
  multi-line messages inline in PowerShell.
- When an AI/LLM drafts the message, strip **typographic characters** before
  committing: curly quotes (`’ “ ”`), em/en dashes (`— –`), non-breaking spaces,
  zero-width characters and emoji all survive into the changelog and can break
  `commitlint` or the markdown.
- **Preview the entry**: `dbx changelog --dry-run` prints the proposed entry —
  check it for stray `\`, `\r`, `\b`, `\t` or mojibake before releasing.
