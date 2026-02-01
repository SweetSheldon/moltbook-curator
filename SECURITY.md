# Security Policy

## Overview

Moltbook Curator implements defense-in-depth security to protect against common web vulnerabilities and attacks targeting REST APIs.

---

## Security Features

### 1. HTTP Security Headers (Helmet)

#### HSTS (HTTP Strict Transport Security)
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
- Enforces HTTPS connections
- Prevents protocol downgrade attacks
- 1 year max-age with subdomain coverage

#### XSS Protection
```http
X-XSS-Protection: 1; mode=block
```
- Enables browser's built-in XSS filter
- Blocks page if XSS is detected
- Fallback for older browsers

#### Frame Protection
```http
X-Frame-Options: DENY
```
- Prevents clickjacking attacks
- No page can be embedded in frames

#### Content Type Options
```http
X-Content-Type-Options: nosniff
```
- Prevents MIME type sniffing
- Forces browser to respect declared content type

#### Referrer Policy
```http
Referrer-Policy: no-referrer
```
- Does not send referrer information
- Protects user privacy

---

### 2. XSS Prevention

#### DOMPurify Integration
```typescript
import * as DOMPurify from 'dompurify';

const sanitizedDescription = DOMPurify.sanitize(userInput);
```
- Sanitizes all HTML/JS in user input
- Whitelist-based filtering (safe approach)
- Protects against:
  - Cross-site scripting (XSS)
  - Script injection
  - Event handler injection

#### Input Trimming
```typescript
@Transform(({ value }) => value?.trim())
```
- Removes leading/trailing whitespace
- Prevents injection via padding

---

### 3. Input Validation

#### URL Validation
```typescript
@IsUrl({}, { message: 'URL must be a valid URL' })
```
- Validates URL format
- Prevents protocol injection
- Max length: 2000 characters

#### Description Validation
```typescript
@MinLength(1, { message: 'Description must be at least 1 character' })
@MaxLength(500, { message: 'Description must be less than 500 characters' })
```
- Length limits prevent DoS
- No empty descriptions

#### Post ID Validation
```typescript
@Matches(/^post_\d+_[a-z0-9]+$/, {
  message: 'Invalid post ID format'
})
```
- Strict format validation
- Prevents injection via ID parameter
- Format: `post_1234567890_abc123`

#### Whitelist Mode
```typescript
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
})
```
- Only allows validated properties
- Rejects additional fields
- Prevents mass assignment attacks

---

### 4. Error Handling

#### No Data Leaks
```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
const responseMessage = isDevelopment ? message : 'Internal server error';
```
- Generic error messages in production
- Detailed errors only in development
- Prevents information disclosure

#### Secure Logging
```typescript
this.logger.error(`[${request.method}] ${request.url}`, {
  error: exception.message,
  stack: exception.stack,
});
```
- Logs full errors server-side
- Logs include request metadata
- No sensitive data in logs

---

### 5. CORS Configuration

```typescript
app.enableCors({
  origin: process.env.NODE_ENV === 'production'
    ? allowedOrigins.filter(o => o !== '*')
    : '*',
  credentials: true,
});
```
- Whitelist origins in production
- No `*` wildcard in production
- Credentials support (cookies, auth)

**Recommended Production Origins:**
```
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-custom-domain.com
```

---

### 6. Data Integrity

#### Mutex Lock
```typescript
const fileMutex = new Mutex();

const release = await fileMutex.acquire();
try {
  // Critical section
} finally {
  release();
}
```
- Prevents race conditions
- Sequential file operations
- No data loss under concurrent requests

#### Validation on Every Request
```typescript
if (!isValidId) {
  throw new BadRequestException('Invalid post ID format');
}
```
- Validates before processing
- Fails fast on invalid input
- Prevents processing malicious data

---

## Protected Against

| Attack | Protection | Implementation |
|---------|-------------|------------------|
| XSS (Cross-Site Scripting) | ✅ DOMPurify, Helmet | `dompurify`, `helmet` |
| CSRF (Cross-Site Request Forgery) | ⚠️ Partial | CORS configuration |
| Clickjacking | ✅ Helmet | `X-Frame-Options: DENY` |
| MIME Sniffing | ✅ Helmet | `X-Content-Type-Options` |
| Protocol Downgrade | ✅ HSTS | `Strict-Transport-Security` |
| SQL Injection | N/A | JSON storage (no SQL) |
| NoSQL Injection | N/A | JSON storage (no NoSQL) |
| Mass Assignment | ✅ Validation Pipe | `forbidNonWhitelisted: true` |
| Path Traversal | ✅ Validation | ID format validation |
| Command Injection | ✅ Validation | URL validation |
| DoS (via large payloads) | ✅ Validation | Length limits |
| Race Conditions | ✅ Mutex Lock | Sequential file operations |
| Information Disclosure | ✅ Error Handler | Generic errors in prod |

---

## Security Monitoring

### Log Events

1. **Voting Activity**
   ```
   [Vote] Post post_123_abc voted from 192.168.1.1
   ```

2. **Post Suggestions**
   ```
   [PostSuggestion] New post suggested from 192.168.1.1: post_456_def
   ```

3. **Client Errors (4xx)**
   ```
   [Client Error] 400 POST /api/vote/invalid-id
   ```

4. **Server Errors (5xx)**
   ```
   [Server Error] 500 POST /api/suggest
   ```

### Recommended Monitoring

- [ ] Sentry (error tracking)
- [ ] LogRocket (session replay)
- [ ] Datadog (infrastructure monitoring)
- [ ] Uptime monitoring (Pingdom, UptimeRobot)

---

## Security Best Practices

### For Deployment

1. **Environment Variables**
   ```bash
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-app.vercel.app
   # No secrets in .env (we don't have any)
   ```

2. **HTTPS Only**
   - Vercel provides HTTPS by default
   - HSTS header enforces it
   - No HTTP allowed in production

3. **Database (if added)**
   - Use connection strings, not credentials file
   - Encrypt at rest (Vercel Postgres does)
   - Use prepared statements (Prevents SQL injection)

### For Development

1. **Never Commit Secrets**
   ```gitignore
   .env
   .env.local
   ```

2. **Use Different Environments**
   - Development: lax validation, detailed errors
   - Production: strict validation, generic errors

3. **Security Testing**
   - Use OWASP ZAP for vulnerability scanning
   - Test with Burp Suite for manual testing
   - Run `npm audit` for dependency vulnerabilities

---

## Known Limitations

### Current
- ⚠️ No rate limiting (recommended for production)
- ⚠️ No authentication (public API)
- ⚠️ JSON storage (not for high-scale)
- ⚠️ No IP-based blocking (only logging)

### Recommended Mitigations
- Add `@nestjs/throttler` for rate limiting
- Add authentication (JWT, API keys) if needed
- Migrate to Postgres for high-scale
- Add IP-based blocking with fail2ban or similar

---

## Vulnerability Disclosure

### If You Find a Vulnerability

**Do NOT:**
- ❌ Open a public issue
- ❌ Post details on social media
- ❌ Exploit the vulnerability

**Do:**
- ✅ Email security@moltbook-curator.com (when setup)
- ✅ Include: description, steps to reproduce, impact
- ✅ Give time to fix before disclosure

### Responsible Disclosure Timeline

1. **Acknowledgment**: Within 48 hours
2. **Investigation**: Within 7 days
3. **Fix**: Within 14 days (or communicate timeline)
4. **Public Disclosure**: After fix is deployed

---

## Security Checklist

Before deploying to production:

- [ ] `NODE_ENV=production` is set
- [ ] `ALLOWED_ORIGINS` is configured (no `*`)
- [ ] No `.env` files in repository
- [ ] Dependencies are audited (`npm audit`)
- [ ] HTTPS is enforced (HSTS)
- [ ] Error logging is configured
- [ ] Security headers are present (test with https://securityheaders.com)
- [ ] XSS protection is tested (try `<script>alert(1)</script>`)
- [ ] Input validation is tested (invalid URLs, IDs)
- [ ] Rate limiting is configured (recommended)
- [ ] Monitoring is set up

---

## External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten)
- [Helmet Documentation](https://helmetjs.github.io/)
- [NestJS Security Guide](https://docs.nestjs.com/security)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)

---

**Last Updated:** 2026-02-01
**Security Contact:** security@moltbook-curator.com (to be configured)
