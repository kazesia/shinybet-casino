# Security Policy

## Reporting a Vulnerability

We take the security of Shiny.bet seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

1. **DO NOT** open a public GitHub issue
2. Email security concerns to: **shinybetting@gmail.com**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution Timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 90 days

### Disclosure Policy

- We follow responsible disclosure practices
- We will credit researchers who report vulnerabilities (unless they prefer to remain anonymous)
- Please allow us time to fix the issue before public disclosure

---

## Security Best Practices for Contributors

### Code Security

1. **Never commit sensitive data**
   - No API keys, passwords, or secrets in code
   - Use environment variables for all credentials
   - Check `.gitignore` before committing

2. **Input Validation**
   - Validate all user inputs on both client and server
   - Use Zod schemas for type-safe validation
   - Sanitize data before database operations

3. **Authentication & Authorization**
   - Use Supabase Auth for all authentication
   - Implement Row-Level Security (RLS) policies
   - Never expose service-role keys in frontend

4. **Dependencies**
   - Run `npm audit` before submitting PRs
   - Keep dependencies up to date
   - Review security advisories for used packages

### Database Security

1. **Row-Level Security (RLS)**
   - All tables must have RLS enabled
   - Users can only access their own data
   - Admin operations require role checks

2. **SQL Injection Prevention**
   - Always use Supabase client methods
   - Never concatenate user input into SQL
   - Use parameterized queries in Edge Functions

### Frontend Security

1. **XSS Prevention**
   - Never use `dangerouslySetInnerHTML`
   - Sanitize user-generated content
   - Use React's built-in escaping

2. **Data Exposure**
   - Don't log sensitive data to console
   - Use development-only logger (`src/lib/logger.ts`)
   - Sanitize error messages sent to client

3. **HTTPS Only**
   - All production traffic must use HTTPS
   - No mixed content (HTTP resources on HTTPS pages)
   - Use secure cookies

---

## Security Checklist for Deployment

### Pre-Deployment

- [ ] All environment variables set in deployment platform
- [ ] No hard-coded secrets in codebase
- [ ] `npm audit` shows no critical vulnerabilities
- [ ] RLS policies tested and active
- [ ] Security headers configured
- [ ] HTTPS certificate installed
- [ ] Error messages sanitized

### Post-Deployment

- [ ] Verify HTTPS enforcement
- [ ] Test security headers (securityheaders.com)
- [ ] Verify RLS policies with test accounts
- [ ] Check error handling (no stack traces to client)
- [ ] Monitor logs for security events

### Ongoing Maintenance

- **Daily**: Monitor error logs
- **Weekly**: Check for new dependency vulnerabilities
- **Monthly**: Review access logs for suspicious activity
- **Quarterly**: Full security audit
- **Annually**: Third-party penetration testing (recommended)

---

## Known Security Measures

### Implemented

✅ Row-Level Security (RLS) on all tables
✅ Supabase Auth with secure session management
✅ Environment variable configuration
✅ Security headers (CSP, X-Frame-Options, etc.)
✅ Development-only logging
✅ Input validation with Zod
✅ HTTPS enforcement in production
✅ Service-role keys only in backend

### Planned

🔄 Rate limiting on API endpoints
🔄 2FA for admin accounts
🔄 Automated security scanning (Dependabot)
🔄 Regular penetration testing
🔄 Bug bounty program

---

## Security Headers

Our application implements the following security headers:

- **Content-Security-Policy**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME-type attacks
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features
- **X-XSS-Protection**: Legacy XSS protection

---

## Compliance

### Data Protection

- User data encrypted at rest (Supabase)
- User data encrypted in transit (TLS/HTTPS)
- Minimal data collection
- User data deletion on request

### Responsible Gaming

- Age verification required
- Self-exclusion options
- Deposit limits
- Responsible gaming resources

---

## Contact

For security concerns: **shinybetting@gmail.com**

For general inquiries: See README.md

---

*Last updated: 2025-12-04*
