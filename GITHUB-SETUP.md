# GitHub Setup & Push (PowerShell)

If you've created a repository on GitHub and want to connect this local project, follow these steps.

1. Verify your current git status and remotes:

```powershell
git status
git remote -v
```

2. If a remote named `origin` is not set (or you want to set a new remote), add it. Replace <YOUR_REPO_URL> with your GitHub repo URL (HTTPS or SSH):

```powershell
# Add remote (only if not already set)
git remote add origin <YOUR_REPO_URL>

# If origin exists and you want to change it:
# git remote set-url origin <YOUR_REPO_URL>
```

3. Stage, commit, and push your changes to GitHub (PowerShell):

```powershell
# Stage all changes
git add .

# Commit
git commit -m "chore: add .gitignore, .gitattributes, and editor settings"

# Ensure your branch is named main (adjust if different)
git branch -M main

# Push to remote
git push -u origin main
```

Notes & troubleshooting

- If you get authentication errors, ensure your GitHub credentials/SSH keys are configured.
- If you prefer SSH and your repo URL is like `git@github.com:username/repo.git`, use that when adding the remote.
- If your local branch and remote branch have diverged, you may need to pull first:

```powershell
git pull --rebase origin main
```

- If git add fails due to large files, check the files and add them to `.gitignore` if appropriate.

If you share your GitHub repository URL here I can run the `git remote add` and `git push` commands for you in this session; otherwise, copy/paste the commands above into your PowerShell terminal.
