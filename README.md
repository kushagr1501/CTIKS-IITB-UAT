Read this if you want to run or work on the CTIKS website.

# CTIKS website

The website for the Centre for Traditional Indian Knowledge and Skills, IIT Bombay. It brings together the centre's people, research, academic programmes, and activities. Administrators manage website content, and core faculty can edit their own profiles.

## Screenshots

| Home                                                   | Research                                              |
| ------------------------------------------------------ | ----------------------------------------------------- |
| ![CTIKS home page](docs/screenshots/home.jpg)          | ![Research areas](docs/screenshots/research.jpg)      |
| **Academics**                                          | **Administration**                                    |
| ![Academic programmes](docs/screenshots/academics.jpg) | ![Admin people directory](docs/screenshots/admin.jpg) |

Screenshots show an example build. The admin screenshot uses a test account.

## Built with

- **Next.js, React and TypeScript** for the website and server.
- **PostgreSQL and Prisma** for storing and accessing data.
- **Better Auth** for sign-in, and **Redis** for sessions and request limits.
- **Tailwind CSS and CSS modules** for styling, and **Zod** for checking form data.
- **Playwright** and Node's test runner for automated checks.

## Production setup

Follow [Production setup](docs/PRODUCTION_SETUP.md) for the full sequence, including Neon transfer and initial admin access. A local Docker test uses `http://localhost:3000`; hosting requires HTTPS. It uses one private `env.prod` file and one `compose.prod.yaml` stack; the website, PostgreSQL, Redis and daily backups run in Docker.

To get the source and create the private settings file:

```bash
git clone --branch prod --single-branch https://github.com/kushagr1501/CTIKS-IITB-UAT.git
cd CTIKS-IITB-UAT
cp env.prod.example env.prod
```

Edit `env.prod`, then follow the setup guide before starting the stack. Do not commit that file.

## Find your way around

- [Project guide](docs/PROJECT_GUIDE.md) — pages, features and the folders behind them.
- [Production setup](docs/PRODUCTION_SETUP.md) — Docker-only IITB deployment.
- [IITB handover](docs/IITB_HANDOVER.md) — one guide for deployment, data transfer, storage, backups and login.
- [Docker and database setup](docs/DOCKER_DATABASE.md) — server container and PostgreSQL migrations.
- [Production handover](docs/PRODUCTION_HANDOVER.md) — deployment, backup, restore and initial admin access.
- [Testing](docs/TESTING.md) — checks and how to run them.
- [Contributing](docs/CONTRIBUTING.md) — making and reviewing changes.

Next: [set up production](docs/PRODUCTION_SETUP.md) or [open the project guide](docs/PROJECT_GUIDE.md).
