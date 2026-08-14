# Security policy

## Supported version

The latest version on `main` is supported.

## Reporting a vulnerability

Please use [GitHub private vulnerability reporting](https://github.com/RishabhKumar124/houserank/security/advisories/new). Do not include vulnerabilities, API keys, buyer profiles, property notes, or private addresses in a public issue.

Include:

- affected route or component
- reproduction steps
- likely impact
- suggested mitigation, if known

## Data handling

HouseRank is local-first, but AI features transmit selected buyer-profile and property context to OpenAI through server-side routes. The application:

- never exposes `OPENAI_API_KEY` to browser code
- sends OpenAI requests with `store: false`
- does not persist buyer data in an application database
- stores app state in the user's browser
- supports JSON export and import

Users should avoid placing secrets, account numbers, or unnecessary personal information in free-form notes.

## Deployment checklist

- Keep `OPENAI_API_KEY` in platform environment variables.
- Never rename it to a `NEXT_PUBLIC_*` variable.
- Review dependency alerts and CI before deployment.
- Add authentication, tenant isolation, rate limiting, encryption, and deletion controls before storing multi-user data server-side.
