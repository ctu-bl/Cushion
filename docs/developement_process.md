# Git Workflow

## 1. Branching model
- Create a `dev` branch from `main`/`master`. It keeps production code separate from work-in-progress. When a larger milestone is done, merge `dev` → `main` to create a checkpoint.

## 2. Feature branches from `dev`
Everyone works in their own feature branch created from `dev`.

Update and branch off from `dev`:
```bash
git checkout dev
git fetch
git pull

git checkout -b feature/<initials>/<name>
# e.g.
# git checkout -b feature/dz/navbar
```
Work only on the parts you own to minimize conflicts.

## 3. Commits
- Commit everything you add/change frequently.
- Write commit messages in English and be specific.

Good:
```
feat: add borrow function
```
Bad:
```
fix code
```

## 4. Merge (Pull Request)
When your feature is ready:
- Open GitHub and click “Compare & pull request”.
- Target: `dev` ← `feature/...` (not `main`/`master`).
- If the PR is small and CI is green, you may self-approve. Otherwise, request a review and merge after approval.

## 5. Rebase to keep your branch up-to-date
If your branch is behind `dev`, rebase frequently:
```bash
git checkout <your_feature_branch>
git fetch
git rebase origin/dev
```
- If there are no conflicts, continue working.
- If there are conflicts, resolve them in the files, then:
```bash
git add <file>
git rebase --continue
```
If you’re stuck, ask a teammate for help.

> Note: GitHub shows “This branch is behind dev”. When you see it, it’s a good time to rebase.
