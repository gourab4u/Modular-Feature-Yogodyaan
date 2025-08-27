# Google DNS TXT Verification — Filled for yogodyaan.com

Provided TXT value:
`google-site-verification=MiyWUfOivIrV6G74DySx0RXM-KJ7QGXMyvixZAqZzsE`

Add the following DNS TXT record at your DNS provider:

- Type: TXT  
- Name / Host: @  (or the specific host Google requested)  
- Value / Content:
```text
google-site-verification=MiyWUfOivIrV6G74DySx0RXM-KJ7QGXMyvixZAqZzsE
```
- TTL: default (or 300)

Examples to copy into provider UIs:

- Cloudflare: DNS → Add record → Type=TXT, Name=@, Content=(value above) → Save  
- GoDaddy: Manage DNS → Add → Type=TXT, Host=@, TXT Value=(value above) → Save  
- Namecheap: Advanced DNS → Add New Record → Type=TXT, Host=@, Value=(value above) → Save  
- Route 53 (console): Hosted zone → Create record → Type=TXT → Record name=@ → Value="google-site-verification=MiyWUfOivIrV6G74DySx0RXM-KJ7QGXMyvixZAqZzsE" → Save

CLI verification examples (run from your terminal):

```bash
# Replace example.com with your domain
dig TXT yogodyaan.com +short
nslookup -type=TXT yogodyaan.com
```

Expected output should include the exact string `google-site-verification=MiyWUfOivIrV6G74DySx0RXM-KJ7QGXMyvixZAqZzsE`.

If using Route 53 and you want a CLI example:
```bash
# create changes.json and run (replace ZONEID and domain)
cat > changes.json <<'JSON'
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "yogodyaan.com.",
        "Type": "TXT",
        "TTL": 300,
        "ResourceRecords": [
          { "Value": "\"google-site-verification=MiyWUfOivIrV6G74DySx0RXM-KJ7QGXMyvixZAqZzsE\"" }
        ]
      }
    }
  ]
}
JSON

aws route53 change-resource-record-sets --hosted-zone-id ZONEID --change-batch file://changes.json
```

Propagation: allow up to 48 hours; most providers are faster.

Exact reply to Google Trust & Safety (copy/paste and fill placeholders):

Subject: Domain verification evidence for Yogodyaan (Project: YOUR_PROJECT_ID)

Body:
> Hello,
>
> I have added the Google verification TXT record to the DNS for `yogodyaan.com`.
>
> Details:
> - Domain: https://yogodyaan.com/  
> - DNS provider: [e.g., Cloudflare / GoDaddy / Route 53]  
> - TXT record value: `google-site-verification=MiyWUfOivIrV6G74DySx0RXM-KJ7QGXMyvixZAqZzsE`  
> - OAuth Client ID: YOUR_OAUTH_CLIENT_ID  
> - Project ID: YOUR_PROJECT_ID
>
> Attached evidence:
> 1) Screenshot of the TXT record in the DNS provider console showing the exact value.  
> 2) Terminal output of `dig TXT yogodyaan.com +short` (shows the TXT record).  
> 3) Screenshot of Google verification success page (or Search Console verification).  
> 4) Screenshots of Privacy and Terms URLs on the live site:
>    - https://yogodyaan.com/privacy
>    - https://yogodyaan.com/terms
>
> I added the TXT record at: YYYY-MM-DD HH:MM (timezone). Please confirm once verification can proceed.
>
> Regards,  
> Yogodyaan Team

Checklist (current status):
- [x] Obtain TXT value from Google console
- [x] Document exact TXT value in repo
- [ ] Add TXT to DNS provider (user action required)
- [ ] Wait for propagation and confirm with dig/nslookup
- [ ] Click Verify in Google Console and capture success screenshot
- [ ] Prepare evidence (DNS screenshot, dig output, Search Console success, OAuth client ID)
- [ ] Reply to Trust & Safety with all evidence
- [ ] Confirm verification complete

Notes:
- If your DNS provider hides TXT content in the UI, capture a screenshot of the DNS record listing plus an authoritative `dig` output.  
- If you want, paste your OAuth Client ID and Project ID here and I will fill them into the reply text and produce a ready-to-send email body and attachments checklist.
