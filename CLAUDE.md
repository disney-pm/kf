# Repo notes

## Git remote: always push via PAT, not the proxy

The `origin` remote points at the local git proxy (`http://local_proxy@127.0.0.1:36813/git/disney-pm/kf`). Its GitHub App installation token is unreliable — pushes regularly 403 with `Permission to disney-pm/kf.git denied to disney-pm`, even right after the connector is re-added.

For any operation that touches the remote (push, fetch from origin if it fails, etc.), skip the proxy and use the personal PAT in `$GH_TOKEN` directly:

```sh
git push "https://disney-pm:${GH_TOKEN}@github.com/disney-pm/kf.git" HEAD:refs/heads/<branch>
```

`$GH_TOKEN` has admin/push on `disney-pm/kf` (verified). Don't loop on proxy 403s — go straight to the PAT. When logging the command, redact the token.
