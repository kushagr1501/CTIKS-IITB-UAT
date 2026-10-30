Read this if you want to find a page, feature, or folder in the project.

# Project guide

The website has public pages, an admin panel, and a separate page for core faculty to edit their profiles. Use this guide to find the right place to make a change.

## Pages

| Page           | Address       | What it does                                                   |
| -------------- | ------------- | -------------------------------------------------------------- |
| Home           | `/`           | Introduces CTIKS and shows recent updates.                     |
| People         | `/people`     | Lists faculty and links to their profiles or websites.         |
| Research       | `/research`   | Shows the centre's research areas.                             |
| Academics      | `/academics`  | Shows academic programmes and their details.                   |
| Projects       | `/projects`   | Introduces the centre's projects.                              |
| Activities     | `/activities` | Lists news, announcements, and events.                         |
| Resources      | `/resources`  | Collects useful CTIKS and IIT Bombay links.                    |
| Contact        | `/contact-us` | Shows contact information and directions.                      |
| Admin          | `/admin`      | Manages people, activities, research areas, and audit history. |
| Faculty editor | `/faculty`    | Lets a core faculty member edit their own profile.             |

## Folders

| Folder                                | What you will find                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| [`src/app`](../src/app)               | Pages, layouts, and server endpoints. Start here to find a page by its address. |
| [`src/features`](../src/features)     | The screens, forms, and page-specific code for each feature.                    |
| [`src/components`](../src/components) | Shared pieces such as the header and footer.                                    |
| [`src/config`](../src/config)         | Shared settings such as navigation links.                                       |
| [`src/server`](../src/server)         | Sign-in, validation, database operations, and access checks.                    |
| [`prisma`](../prisma)                 | Database models and migration files.                                            |
| [`public`](../public)                 | Images, fonts, and other files used by the website.                             |
| [`scripts`](../scripts)               | Local setup, database, and integration-test commands.                           |
| [`tests`](../tests)                   | Focused automated tests.                                                        |
| [`docs`](.)                           | Setup, architecture, testing, and contribution guides.                          |

## Common changes

- **Navigation and footer links:** start with `src/config/navigation.ts`.
- **People and faculty profiles:** look in `src/features/people`, `src/features/faculty`, and `src/server/faculty`.
- **News, announcements, and events:** look in `src/features/activities` and `src/server/activities`.
- **Research areas:** look in `src/features/research` and `src/server/research`.
- **Academic programme content:** start with `src/features/academics/content.ts` and `msc-content.ts`.
- **Admin forms:** look in `src/features/admin/components`.

For a more detailed file-by-file map, see [Codebase map](CODEBASE_MAP.md). Before changing sign-in, database migrations, or audit history, read the relevant notes there and ask for a review.

Next: [Getting started](GETTING_STARTED.md), [Architecture](ARCHITECTURE.md), or [Testing](TESTING.md).
