# ClikGett on AWS (live since 11 Nov 2026)

Account 288761749672, Mumbai (ap-south-1). AWS CLI profile `clikgett`.

| Part | What |
|---|---|
| Server | EC2 `clikgett-v2` (i-0e49954297e2ba356), t3.micro, Ubuntu 24.04, 20 GB encrypted disk, 2 GB swap, IMDSv2 only, termination protection on. Built by CloudFormation stack `clikgett-server` ([server.yaml](server.yaml)) |
| Address | Elastic IP 13.203.168.243 (DNS at GoDaddy: api, admin, @, www) |
| Firewall | Security group `clikgett-web`: 80/443 from anywhere, 22 from the office IPs only |
| Backend | Docker container `clikgett-backend` ([docker-compose.yml](docker-compose.yml)) in `/opt/clikgett`, on 127.0.0.1:5000 only. Settings: `/opt/clikgett/.env` (mode 600; copy in `deploy/aws.env` on the dev PC, outside git) |
| nginx | [nginx-clikgett.conf](nginx-clikgett.conf) → `/etc/nginx/conf.d/clikgett.conf`. Admin site in `/var/www/admin`, website in `/var/www/site` |
| Certificates | Let's Encrypt, renewed by `certbot.timer` |
| Database | RDS MySQL `clikgett` (database `clikgett-dev`), private; 3306 only from `clikgett-web` (and the old server's group until it is deleted) and the office IP |
| Images | S3 bucket `clikgett`, private (public access blocked, ACLs off). CloudFront `E3DF3ZQG80KBMV` (d3c9kvg5gaqz48.cloudfront.net): catalog folders from S3 through OAC, everything else (signed invoices, photo orders, uploads) to the backend's `/media`. Backend setting `PUBLIC_MEDIA_BASE_URL` = that CloudFront address |
| Redis | Not used (`REDIS_ENABLED=false`); the backend only used it in its health check |
| Background jobs | `BACKGROUND_JOBS=on` here only. Never on a second server against this database (the payment sweep issues real refunds) |

## Deploy a new backend version

```bash
git archive --format=tar.gz --prefix=Backend/ HEAD:Backend -o backend.tgz
scp -i clikgett_key.pem backend.tgz ubuntu@13.203.168.243:/opt/clikgett/
ssh ubuntu@13.203.168.243 'cd /opt/clikgett && rm -rf Backend && tar xzf backend.tgz && rm backend.tgz \
  && sudo docker compose up -d --build && sudo docker compose logs --tail 30 backend'
```

Migrations run on start (`run_on_start.js`); a failed migration stops the container from starting,
and the old one keeps no traffic, so check `curl https://api.clikgett.com/api/health/db` after each deploy.
After changing `.env`, run `sudo docker compose up -d --force-recreate` (a plain restart keeps the old settings).

## Deploy the admin site

```bash
cd Admin && CI=false BUILD_PATH=build-aws REACT_APP_BASE_URL=https://api.clikgett.com/api GENERATE_SOURCEMAP=false npx react-scripts build
tar czf admin.tgz -C build-aws . && scp admin.tgz ubuntu@13.203.168.243:/tmp/
ssh ubuntu@13.203.168.243 'sudo rm -rf /var/www/admin/* && sudo tar xzf /tmp/admin.tgz -C /var/www/admin && rm /tmp/admin.tgz'
```

## App builds for this server

- Customer: `flutter build apk --release --dart-define=API_BASE_URL=https://api.clikgett.com/api --dart-define=GOOGLE_PLACES_KEY=...`
- Rider: `./gradlew assembleRelease -PapiBaseUrl=https://api.clikgett.com/api/`

## Going back (until the old server is terminated)

The old server `clikgett` (i-037b8d21955d5b369) is **stopped**, not deleted. To return to it: start it,
move Elastic IP 13.203.168.243 back to it, stop `clikgett-v2`. Its uploads need the bucket's object
ACLs (now off), so admin image uploads on the old code would fail. Snapshots from before the switch:
RDS `before-v2-server-2026-11-11`, EBS `snap-0f634ba667b1cc0b4`.
