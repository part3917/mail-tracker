# Access Tokens

This fork replaces the original single shared `DASHBOARD_PASSWORD` with
**per-user access tokens**. Each token sees only its own tracking records.

## Why

With a single shared password, everyone who could open the dashboard could read,
modify, and delete everyone else's records — including recipient addresses,
subject lines, and open times. Tokens scope each user to their own data.

## Key layout

```
t:<id>              tracker data (carries an `owner` field)
u:<token>:<id>      ownership index — /list scans only this prefix
u:<token>:__meta__  user registration record
```

The tracking ID never contains the token. Pixel URLs travel inside outgoing
email and are visible to recipients, so putting the token in the ID would hand
out the dashboard key.

## Issuing a token

```bash
bash tools/issue-user.sh "Their Name"
```

Prints a 32-character token and registers it. Give the token to the user; they
paste it into the extension's **Your access token** field.

## Revoking a token

```bash
npx wrangler kv key delete --binding=TRACKER --remote "u:<token>:__meta__"
```

The user is locked out immediately. Their records remain in storage; delete the
`u:<token>:*` and matching `t:<id>` keys to remove them.

## Authentication

HTTP Basic. The username is ignored; put the token in the password field.

```bash
curl -u "x:<token>" https://your-worker.example.com/list
```

Unregistered tokens get 401. `/t/:id` (the pixel) is deliberately
unauthenticated — recipients must be able to load it.

## Legacy records

Records created before this change have no `owner` field. They are locked out of
all authenticated routes, so no token can read or modify them. Their pixels still
resolve, so already-sent emails keep recording opens.

## `DASHBOARD_PASSWORD`

No longer used. Any value left in the environment is ignored.
