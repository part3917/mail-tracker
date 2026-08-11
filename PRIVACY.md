# Privacy Policy — Mail Tracker

**Effective date:** 2026-08-11
**Contact:** borelpart@gmail.com

## What this extension does

Mail Tracker adds an invisible 1×1 image to emails you send from Gmail. When a
recipient's mail client loads that image, the load is recorded so you can see
whether your email was opened.

## Data the extension stores on your device

Held in Chrome's `storage` API, on your machine only:

- The server URL you connect to
- Your access token
- A local cache of your own tracking records, used to show read indicators in Gmail

This data is never transmitted anywhere except to the server URL you configure.

## Data sent to the tracking server

When you send a tracked email, the extension sends the following to your server:

- Recipient email address
- Subject line and a short preview of the message body
- Gmail message ID
- Your IP address at the time of sending (used to exclude your own opens)

When a recipient opens the email, the server records:

- Time of the open
- IP address and country of the request
- User-agent string of the requesting client
- Whether the request arrived through a mail provider's image proxy

**The extension does not read your inbox, does not collect your contacts, and
does not transmit anything to any third party.** All requests go to the single
server address you configure and nowhere else.

## Who operates the server

The server is a self-hosted Cloudflare Worker. It is not operated by Google or
by any company. If you received an access token from someone else, that person
operates the server and stores the data described above.

Each access token is scoped to its own records. Holders of other tokens cannot
read, modify, or delete your records.

## Retention and deletion

Records persist until deleted. You can delete any individual tracking record
from the dashboard at any time, which removes it from storage. To have your
account and all associated records removed, contact the operator of your server.

## No sale or sharing of data

Data collected by Mail Tracker is not sold, rented, shared, or transferred to
any third party. It is not used for advertising, profiling, or any purpose
beyond showing you whether your own emails were opened.

## Limitations you should know

Open tracking is a signal, not a fact. Apple Mail Privacy Protection loads
images on delivery regardless of whether a human read the message, and some
mail clients block images entirely. Recorded opens should be treated as
evidence, not proof.

## Recipients

Recipients of your emails are not notified that a tracking pixel is present.
Laws governing email tracking differ by jurisdiction. You are responsible for
using this extension in compliance with the law that applies to you.

## Changes

Material changes to this policy will be published in this file, with the
effective date above updated.

## Source code

Mail Tracker is open source under AGPL-3.0. The full source, including the
server, is available in this repository.
