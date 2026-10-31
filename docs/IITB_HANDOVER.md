Read this if you are receiving the CTIKS production handover.

# IITB handover

**Repository:** [CTIKS-IITB-UAT](https://github.com/kushagr1501/CTIKS-IITB-UAT)

Use [Production setup](PRODUCTION_SETUP.md) from top to bottom. It uses one Compose file, `compose.prod.yaml`, and one private settings file, `env.prod`. Docker runs the website, one PostgreSQL database, Redis, and daily backups; temporary maintenance commands run in the `tools` container. No host-side Node.js or PostgreSQL client installation is needed.

The initial administrator email is `admin@ctiks.local`. The password is in the private Word/PDF handover, not Git. Set it with the documented one-time Docker command and change it after first sign-in.

Neon transfer copies database records and website account hashes. It does not copy image/PDF files. [Storage and backups](PRODUCTION_HANDOVER.md) explains the separate file handover, automatic daily backup sets, and how to restore a chosen set. Check production upload and serving with a real image and PDF before launch.

Next: [Production setup](PRODUCTION_SETUP.md) · [Storage and backups](PRODUCTION_HANDOVER.md)
