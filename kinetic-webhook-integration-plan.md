# Kinetic Webhook Integration Guide
## Oregon Exterior Blog Automated Draft Creation

---

## Table of Contents

1. [Context](#context)
2. [Webhook Endpoint Configuration](#webhook-endpoint-configuration)
3. [Payload Schema](#payload-schema)
4. [Field Requirements & Guidelines](#field-requirements--guidelines)
5. [Complete Example Request](#complete-example-request)
6. [Expected Responses](#expected-responses)
7. [Post-Creation Workflow](#post-creation-workflow)
8. [Important Notes](#important-notes)
9. [Testing Checklist](#testing-checklist)
10. [Contact for Issues](#contact-for-issues)

---

## Context

You are configuring the Kinetic SEO engine to automatically create draft blog posts in the Oregon Exterior Experts blog system via webhook. The blog is powered by a Supabase-backed Node.js/Express backend that receives automated content and creates draft posts for admin review before publication.

### Architecture Overview

- **Backend**: Node.js Express API hosted on Koyeb
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Storage**: Supabase Storage for blog images
- **Auth**: Supabase Auth for admin users
- **Scale**: Optimized for 374+ posts with pagination and caching

### Workflow Summary

1. Kinetic sends POST request with blog post data
2. Backend validates authentication and creates draft post
3. Admin reviews draft in dashboard at `https://oregonexteriorexperts.com/admin/`
4. Admin edits if needed (content, images, meta tags)
5. Admin publishes post to make it live on the blog

---

## Webhook Endpoint Configuration

### Production Endpoint

**URL**: `https://api.oregonexteriorexperts.com/api/external/kinetic-draft`

**Method**: `POST`

**Content-Type**: `application/json`

### Authentication

**Header-based authentication** is required for all requests.

**Required Headers**:
```
Content-Type: application/json
X-KINETIC-AUTH: k8Jx2mP9vL4nQBLAHBLAHwR5tY3zA6bN1cM8
```

**Critical**: The `X-KINETIC-AUTH` header value must match exactly (case-sensitive). This secret authenticates Kinetic's requests to the Oregon Exterior backend.

### Rate Limiting

**Limit**: 20 requests per hour per IP address

**Why**: Prevents abuse and protects the backend from overload.

**Strategy for 374-post rollout**: Send posts in batches of 15-20 per hour, spreading the import over 2-3 days to allow admin review between batches.

---

## Payload Schema

Send a JSON payload with the following structure:

```json
{
  "title": "string (required)",
  "slug": "string (required)",
  "content": "string (required)",
  "excerpt": "string (optional)",
  "meta_description": "string (optional)",
  "meta_keywords": "string (optional)",
  "canonical_url": "string (optional)",
  "reading_time": "integer (optional)",
  "kinetic_id": "string (optional)",
  "featured_image_url": "string (optional)",
  "featured_image_alt": "string (optional)",
  "author_id": "string (required)"
}
```

### Schema Summary Table

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ Yes | Post title displayed on blog |
| `slug` | string | ✅ Yes | URL-friendly slug (lowercase, hyphens) |
| `content` | string | ✅ Yes | Full HTML content of the post |
| `author_id` | string | ✅ Yes | UUID of Supabase Auth user (post author) |
| `excerpt` | string | ⭐ Recommended | Short summary for blog listing cards |
| `meta_description` | string | ⭐ Recommended | SEO description (150-160 chars) |
| `meta_keywords` | string | Optional | Comma-separated keywords |
| `canonical_url` | string | ⭐ Recommended | Full canonical URL to prevent duplicate content |
| `reading_time` | integer | Optional | Estimated reading time in minutes |
| `kinetic_id` | string | ⭐ Recommended | Unique Kinetic system identifier |
| `featured_image_url` | string | Optional | URL to featured image |
| `featured_image_alt` | string | ⭐ Recommended | Alt text for accessibility and image SEO |

---

## Field Requirements & Guidelines

### Required Fields

#### 1. `title` (string)

The display title of the blog post.

**Requirements**:
- Non-empty string
- Maximum length: 200 characters (recommended)
- Should be compelling and include target keywords

**Example**:
```json
"title": "Top 5 Gutter Maintenance Tips for Portland Homeowners"
```

---

#### 2. `slug` (string)

URL-friendly version of the title used in the post URL.

**Requirements**:
- Lowercase only
- Use hyphens instead of spaces
- No special characters (only letters, numbers, hyphens)
- Must be unique across all posts
- Maximum length: 100 characters (recommended)

**Format**: `https://oregonexteriorexperts.com/blog/post.html?slug=YOUR-SLUG-HERE`

**Example**:
```json
"slug": "top-5-gutter-maintenance-tips-for-portland-homeowners"
```

**Important**: If a slug already exists in the database, the request will fail with a 400 error. Consider adding a timestamp suffix for uniqueness if needed (e.g., `slug-name-2026-02-06`).

---

#### 3. `content` (HTML string)

Full HTML content of the blog post.

**Requirements**:
- Must be valid HTML
- Use semantic HTML tags: `<h2>`, `<h3>`, `<p>`, `<ul>`, `<ol>`, `<blockquote>`, `<a>`
- Avoid inline styles unless necessary
- Use proper heading hierarchy (H2, H3, H4 - NOT H1)
- Break content into readable paragraphs
- Compatible with TipTap WYSIWYG editor

**Example**:
```json
"content": "<h2>Why Gutter Maintenance Matters</h2><p>Regular gutter maintenance prevents costly water damage to your home's foundation and exterior. Here are the top 5 tips every Portland homeowner should know.</p><h3>1. Clean Gutters Twice a Year</h3><p>Remove leaves, pine needles, and debris in spring and fall to prevent clogs and water overflow.</p><h3>2. Check for Leaks and Rust</h3><p>Inspect seams, joints, and downspouts for signs of leaking or rust damage during rainy weather.</p>"
```

**Content Quality Guidelines**:
- Use descriptive, keyword-rich headings
- Break content into scannable sections
- Include internal links to other Oregon Exterior pages where relevant
- Ensure proper grammar and spelling
- Avoid excessive keyword stuffing

---

#### 4. `author_id` (UUID string)

UUID of the Supabase Auth user who will be listed as the post author.

**Requirements**:
- Must be a valid UUID format (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
- Must exist in the Oregon Exterior Supabase Auth users table
- Requests with invalid or non-existent UUIDs will fail

**Example**:
```json
"author_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

**Critical**: You MUST obtain the correct author UUID from the Oregon Exterior team before sending any posts. This UUID identifies the default author for Kinetic-generated content.

---

### Optional but Strongly Recommended Fields

#### 5. `excerpt` (string)

Brief summary displayed on blog listing cards.

**Requirements**:
- 1-2 sentences
- 100-150 characters (recommended)
- Compelling summary that encourages clicks
- Include primary keyword if possible

**Example**:
```json
"excerpt": "Learn essential gutter maintenance tips to protect your Portland home from water damage and extend your gutter system's lifespan."
```

---

#### 6. `meta_description` (string)

SEO-optimized description for search engines.

**Requirements**:
- 150-160 characters (Google truncates longer descriptions)
- Include target keywords naturally
- Compelling and action-oriented
- Unique for each post

**Example**:
```json
"meta_description": "Protect your Portland home with these 5 essential gutter maintenance tips. Expert advice from Oregon Exterior on cleaning, repair, and prevention."
```

---

#### 7. `meta_keywords` (string)

Comma-separated list of target keywords for SEO.

**Requirements**:
- 5-10 keywords relevant to the post
- Include variations and long-tail keywords
- Comma-separated format

**Example**:
```json
"meta_keywords": "gutter maintenance, Portland gutters, gutter cleaning, water damage prevention, home exterior maintenance, gutter repair"
```

---

#### 8. `canonical_url` (string)

Full canonical URL for the post to prevent duplicate content SEO issues.

**Requirements**:
- Full URL including protocol (https://)
- Format: `https://oregonexteriorexperts.com/blog/post.html?slug={slug}`
- Should match the final published URL

**Example**:
```json
"canonical_url": "https://oregonexteriorexperts.com/blog/post.html?slug=top-5-gutter-maintenance-tips-for-portland-homeowners"
```

---

#### 9. `reading_time` (integer)

Estimated reading time in minutes.

**Requirements**:
- Integer value (no decimals)
- Calculate based on word count (average 200-250 words per minute)
- Displayed as a badge on blog cards and post pages

**Example**:
```json
"reading_time": 5
```

**Calculation**: For a 1200-word post: `1200 ÷ 225 ≈ 5 minutes`

---

#### 10. `kinetic_id` (string)

Unique identifier from the Kinetic system for tracking and correlation.

**Requirements**:
- Unique across all Kinetic-generated posts
- Helps correlate posts between systems
- Useful for debugging and auditing

**Example**:
```json
"kinetic_id": "kinetic_post_2026_001"
```

---

#### 11. `featured_image_url` (string)

URL to the featured image for the post.

**Requirements**:
- Full URL with protocol (https://)
- Can be Supabase Storage URL or external CDN
- Recommended dimensions: 1200x630px (optimal for social sharing)
- Supported formats: JPG, PNG, WebP

**Example (Supabase Storage)**:
```json
"featured_image_url": "https://ekobnouwnsiochmuvafm.supabase.co/storage/v1/object/public/blog-images/gutter-maintenance.jpg"
```

**Example (External CDN)**:
```json
"featured_image_url": "https://cdn.example.com/images/gutter-maintenance-portland.jpg"
```

**Image Handling Options**:
1. **Option A**: Upload images to Oregon Exterior's Supabase Storage bucket first, then use the returned URL
2. **Option B**: Use external CDN URLs, and admins can replace them via the dashboard before publishing

---

#### 12. `featured_image_alt` (string)

Descriptive alt text for the featured image.

**Requirements**:
- 50-125 characters
- Descriptive and specific
- Include relevant keywords naturally
- Critical for accessibility (screen readers)
- Important for image SEO (Google Images ranking)

**Example**:
```json
"featured_image_alt": "Professional gutter cleaning service on a Portland residential home"
```

**Benefits**:
- ♿ **Accessibility**: Screen readers can describe images to visually impaired users
- 🖼️ **Image SEO**: Google Images uses alt text for ranking
- 📱 **Fallback**: If image fails to load, alt text displays
- 🎯 **Keyword Relevance**: Natural keyword inclusion for SEO

---

## Complete Example Request

### cURL Command

```bash
curl -X POST https://api.oregonexteriorexperts.com/api/external/kinetic-draft \
  -H "Content-Type: application/json" \
  -H "X-KINETIC-AUTH: k8Jx2mP9vL4nQBLAHBLAHwR5tY3zA6bN1cM8" \
  -d '{
    "title": "Top 5 Gutter Maintenance Tips for Portland Homeowners",
    "slug": "top-5-gutter-maintenance-tips-for-portland-homeowners",
    "content": "<h2>Why Gutter Maintenance Matters</h2><p>Regular gutter maintenance prevents costly water damage to your home'\''s foundation and exterior. Portland'\''s rainy climate makes proper gutter care essential. Here are the top 5 tips every Portland homeowner should know.</p><h3>1. Clean Gutters Twice a Year</h3><p>Remove leaves, pine needles, and debris in spring and fall to prevent clogs and water overflow. Portland'\''s trees shed heavily in autumn, making fall cleaning especially important.</p><h3>2. Check for Leaks and Rust</h3><p>Inspect seams, joints, and downspouts for signs of leaking or rust damage during rainy weather. Catch small issues before they become expensive repairs.</p><h3>3. Ensure Proper Drainage</h3><p>Verify that water flows away from your foundation. Downspouts should extend at least 5 feet from the house to prevent basement flooding and foundation damage.</p><h3>4. Trim Overhanging Branches</h3><p>Cut back tree branches that hang over your roof to reduce debris accumulation and prevent roof damage from falling limbs.</p><h3>5. Install Gutter Guards</h3><p>Consider investing in quality gutter guards to reduce maintenance frequency and protect your system year-round.</p>",
    "excerpt": "Learn essential gutter maintenance tips to protect your Portland home from water damage and extend your gutter system'\''s lifespan.",
    "meta_description": "Protect your Portland home with these 5 essential gutter maintenance tips. Expert advice from Oregon Exterior on cleaning, repair, and prevention.",
    "meta_keywords": "gutter maintenance, Portland gutters, gutter cleaning, water damage prevention, home exterior maintenance, gutter repair",
    "canonical_url": "https://oregonexteriorexperts.com/blog/post.html?slug=top-5-gutter-maintenance-tips-for-portland-homeowners",
    "reading_time": 5,
    "kinetic_id": "kinetic_post_2026_001",
    "featured_image_url": "https://ekobnouwnsiochmuvafm.supabase.co/storage/v1/object/public/blog-images/gutter-maintenance-portland.jpg",
    "featured_image_alt": "Professional gutter cleaning service on a Portland residential home with ladder and safety equipment",
    "author_id": "REPLACE_WITH_ACTUAL_UUID_FROM_OREGON_EXTERIOR_TEAM"
  }'
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

const createDraftPost = async () => {
  try {
    const response = await axios.post(
      'https://api.oregonexteriorexperts.com/api/external/kinetic-draft',
      {
        title: 'Top 5 Gutter Maintenance Tips for Portland Homeowners',
        slug: 'top-5-gutter-maintenance-tips-for-portland-homeowners',
        content: '<h2>Why Gutter Maintenance Matters</h2><p>Regular gutter maintenance prevents costly water damage...</p>',
        excerpt: 'Learn essential gutter maintenance tips to protect your Portland home from water damage and extend your gutter system\'s lifespan.',
        meta_description: 'Protect your Portland home with these 5 essential gutter maintenance tips. Expert advice from Oregon Exterior on cleaning, repair, and prevention.',
        meta_keywords: 'gutter maintenance, Portland gutters, gutter cleaning, water damage prevention, home exterior maintenance, gutter repair',
        canonical_url: 'https://oregonexteriorexperts.com/blog/post.html?slug=top-5-gutter-maintenance-tips-for-portland-homeowners',
        reading_time: 5,
        kinetic_id: 'kinetic_post_2026_001',
        featured_image_url: 'https://ekobnouwnsiochmuvafm.supabase.co/storage/v1/object/public/blog-images/gutter-maintenance-portland.jpg',
        featured_image_alt: 'Professional gutter cleaning service on a Portland residential home with ladder and safety equipment',
        author_id: 'REPLACE_WITH_ACTUAL_UUID_FROM_OREGON_EXTERIOR_TEAM'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-KINETIC-AUTH': 'k8Jx2mP9vL4nQBLAHBLAHwR5tY3zA6bN1cM8'
        }
      }
    );
    
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

createDraftPost();
```

### Python Example

```python
import requests
import json

url = 'https://api.oregonexteriorexperts.com/api/external/kinetic-draft'
headers = {
    'Content-Type': 'application/json',
    'X-KINETIC-AUTH': 'k8Jx2mP9vL4nQBLAHBLAHwR5tY3zA6bN1cM8'
}
payload = {
    'title': 'Top 5 Gutter Maintenance Tips for Portland Homeowners',
    'slug': 'top-5-gutter-maintenance-tips-for-portland-homeowners',
    'content': '<h2>Why Gutter Maintenance Matters</h2><p>Regular gutter maintenance prevents costly water damage...</p>',
    'excerpt': 'Learn essential gutter maintenance tips to protect your Portland home from water damage and extend your gutter system\'s lifespan.',
    'meta_description': 'Protect your Portland home with these 5 essential gutter maintenance tips. Expert advice from Oregon Exterior on cleaning, repair, and prevention.',
    'meta_keywords': 'gutter maintenance, Portland gutters, gutter cleaning, water damage prevention, home exterior maintenance, gutter repair',
    'canonical_url': 'https://oregonexteriorexperts.com/blog/post.html?slug=top-5-gutter-maintenance-tips-for-portland-homeowners',
    'reading_time': 5,
    'kinetic_id': 'kinetic_post_2026_001',
    'featured_image_url': 'https://ekobnouwnsiochmuvafm.supabase.co/storage/v1/object/public/blog-images/gutter-maintenance-portland.jpg',
    'featured_image_alt': 'Professional gutter cleaning service on a Portland residential home with ladder and safety equipment',
    'author_id': 'REPLACE_WITH_ACTUAL_UUID_FROM_OREGON_EXTERIOR_TEAM'
}

response = requests.post(url, headers=headers, json=payload)

if response.status_code == 201:
    print('Success:', response.json())
else:
    print(f'Error {response.status_code}:', response.text)
```

---

## Expected Responses

### Success Response (201 Created)

When the post is created successfully:

```json
{
  "success": true,
  "message": "Draft post created successfully",
  "post": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "title": "Top 5 Gutter Maintenance Tips for Portland Homeowners",
    "slug": "top-5-gutter-maintenance-tips-for-portland-homeowners",
    "status": "draft",
    "source_engine": "kinetic",
    "kinetic_id": "kinetic_post_2026_001",
    "created_at": "2026-02-06T12:00:00.000Z"
  }
}
```

**What happens next**:
- Post is saved in the database with `status = 'draft'`
- Post is marked with `source_engine = 'kinetic'` for tracking
- Admin can see the new draft in the dashboard
- Post is NOT visible on the public blog until published

---

### Error Responses

#### 401 Unauthorized

**Cause**: Invalid or missing `X-KINETIC-AUTH` header

```json
{
  "error": "Unauthorized - Invalid or missing X-KINETIC-AUTH header"
}
```

**Solution**: Verify the `X-KINETIC-AUTH` header value matches exactly (case-sensitive): `k8Jx2mP9vL4nQBLAHBLAHwR5tY3zA6bN1cM8`

---

#### 400 Bad Request

**Cause**: Missing required fields or validation errors

```json
{
  "error": "Validation error: title is required"
}
```

Other validation error examples:
```json
{
  "error": "Validation error: slug must contain only lowercase letters, numbers, and hyphens"
}
```
```json
{
  "error": "Validation error: slug already exists"
}
```
```json
{
  "error": "Validation error: author_id must be a valid UUID"
}
```

**Solution**: Check that all required fields (`title`, `slug`, `content`, `author_id`) are present and valid. Review the Field Requirements section above.

---

#### 429 Too Many Requests

**Cause**: Rate limit exceeded (more than 20 requests per hour)

```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

**Solution**: Wait until the rate limit window resets (1 hour from first request in the window). Implement batching strategy for bulk imports.

---

#### 500 Internal Server Error

**Cause**: Server-side issue (database connection, Supabase error, etc.)

```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

**Solution**: Contact Oregon Exterior development team with request details, timestamp, and error message.

---

## Post-Creation Workflow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. Kinetic sends POST request with blog post payload      │
│     ↓                                                       │
│  2. Backend validates X-KINETIC-AUTH header                │
│     ↓                                                       │
│  3. Backend validates required fields (title, slug, etc.)  │
│     ↓                                                       │
│  4. Backend inserts post into Supabase database            │
│     • status = 'draft'                                     │
│     • source_engine = 'kinetic'                            │
│     • kinetic_id = (from payload)                          │
│     ↓                                                       │
│  5. Backend returns 201 Created with post details          │
│     ↓                                                       │
│  6. Admin logs into dashboard                              │
│     → https://oregonexteriorexperts.com/admin/             │
│     ↓                                                       │
│  7. Admin sees new draft in Posts list                     │
│     • Draft badge displayed                                │
│     • "Kinetic" source badge displayed                     │
│     ↓                                                       │
│  8. Admin clicks "Edit" to review                          │
│     ↓                                                       │
│  9. Admin reviews/edits:                                   │
│     • Title, slug, content                                 │
│     • Excerpt, meta description                            │
│     • Featured image and alt text                          │
│     • Reading time                                         │
│     ↓                                                       │
│  10. Admin clicks "Publish"                                │
│      • Changes status from 'draft' to 'published'          │
│      • Sets published_at timestamp                         │
│      ↓                                                      │
│  11. Post appears on public blog                           │
│      → https://oregonexteriorexperts.com/blog/             │
│      ↓                                                      │
│  12. Post included in sitemap for search engines           │
│      → https://oregonexteriorexperts.com/sitemap-blog.xml  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Admin Dashboard Access

**URL**: `https://oregonexteriorexperts.com/admin/`

**Features**:
- View all posts (drafts and published)
- Filter by status (draft/published)
- Sort by date, title, author
- Source badge shows "Kinetic" for automated posts
- TipTap WYSIWYG editor for content editing
- Image upload capability
- Meta tag editor for SEO optimization

### Draft Review Checklist

Before publishing, admins should verify:

- ✅ Title is accurate and compelling
- ✅ Slug is unique and SEO-friendly
- ✅ Content is well-formatted and error-free
- ✅ Featured image displays correctly
- ✅ Alt text is descriptive and includes keywords
- ✅ Excerpt is engaging
- ✅ Meta description is optimized (150-160 chars)
- ✅ Keywords are relevant
- ✅ Reading time is accurate
- ✅ Internal links to other Oregon Exterior pages are included where relevant

---

## Important Notes

### 1. Staging vs Production Testing

**Always test with 1-2 posts before bulk import**

**Testing Workflow**:
1. Send 1 test post with the `kinetic_id` = `"test_001"`
2. Verify post appears in admin dashboard as draft
3. Have admin review, edit, and publish the test post
4. Verify post appears on public blog
5. Verify SSR meta tags are working (view page source)
6. Send 1-2 more test posts to verify consistency
7. Once validated, proceed with bulk import

**Why**: Catches configuration issues early before importing all 374 posts.

---

### 2. Author ID Requirement

**Critical**: You MUST obtain the correct `author_id` UUID from the Oregon Exterior team.

**How to Get Author ID**:
1. Contact Oregon Exterior development team
2. They will provide a UUID from their Supabase Auth users table
3. This UUID represents the default author for Kinetic-generated content
4. Use the same UUID for all automated posts

**Example**: `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`

**What happens if invalid**:
- Request will fail with 400 Bad Request
- Error message: `"Validation error: author_id must be a valid UUID"`
- No post will be created

---

### 3. Slug Uniqueness Constraints

**Each slug must be unique across all posts in the database.**

**Handling Duplicate Slugs**:
- If a slug already exists, the request will fail with 400 error
- Consider adding a timestamp or counter suffix for uniqueness
- Example: `gutter-maintenance-tips-2026-02-06`
- Example: `gutter-maintenance-tips-portland-part-1`

**Recommendation**: Implement slug uniqueness validation in Kinetic before sending requests to avoid rejected posts.

---

### 4. Featured Image Handling Options

**Option A: Upload to Supabase Storage First (Recommended)**
1. Upload image to Oregon Exterior's Supabase Storage bucket
2. Receive Supabase URL: `https://ekobnouwnsiochmuvafm.supabase.co/storage/v1/object/public/blog-images/image.jpg`
3. Include URL in `featured_image_url` field
4. Image is permanently hosted on Oregon Exterior's infrastructure

**Option B: Use External CDN URL**
1. Host image on Kinetic's CDN or external service
2. Include external URL in `featured_image_url` field
3. Admin can replace with Supabase-hosted image before publishing

**Option C: Leave Empty**
1. Send `featured_image_url` as empty string or omit field
2. Admin uploads image via dashboard before publishing

**Recommended**: Option A for best performance and control.

---

### 5. Rate Limiting Strategy for 374-Post Rollout

**Rate Limit**: 20 requests per hour per IP address

**Batching Strategy**:
- **Batch Size**: 15-20 posts per hour (stay safely under limit)
- **Timeline**: 374 posts ÷ 20 per hour = ~19 hours
- **Recommendation**: Spread over 2-3 days for admin review

**Implementation**:
```javascript
// Pseudocode for batching
const BATCH_SIZE = 18; // Stay under 20/hour limit
const DELAY_BETWEEN_BATCHES = 3600000; // 1 hour in milliseconds

async function sendPostsBatched(posts) {
  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);
    
    for (const post of batch) {
      await sendPostToWebhook(post);
      await delay(2000); // 2 seconds between posts
    }
    
    console.log(`Batch ${i / BATCH_SIZE + 1} complete. Waiting 1 hour...`);
    await delay(DELAY_BETWEEN_BATCHES);
  }
}
```

**Benefits**:
- Avoids 429 rate limit errors
- Allows admin to review batches incrementally
- Reduces load on backend
- Easier to identify and fix issues mid-rollout

---

### 6. Content Quality Guidelines

**HTML Best Practices**:
- Use semantic HTML tags (`<h2>`, `<h3>`, `<p>`, `<ul>`, `<ol>`)
- Avoid inline styles unless necessary
- Use proper heading hierarchy (H2 → H3 → H4, never skip levels)
- Break content into readable paragraphs (3-5 sentences max)
- Include internal links to other Oregon Exterior pages

**SEO Best Practices**:
- Target keywords in headings naturally
- Include local keywords (Portland, Oregon, specific neighborhoods)
- Write for humans first, search engines second
- Ensure readability (8th-10th grade reading level)
- Add value with actionable advice

**Content Length**:
- Minimum: 600 words (for proper SEO depth)
- Ideal: 1000-1500 words (comprehensive coverage)
- Maximum: 2500 words (maintain reader engagement)

---

## Testing Checklist

Before starting the 374-post rollout, complete these tests:

### 1. Authentication Tests

- [ ] **Test 1**: Send request with correct `X-KINETIC-AUTH` header
  - **Expected**: 201 Created response
- [ ] **Test 2**: Send request with incorrect auth header
  - **Expected**: 401 Unauthorized error
- [ ] **Test 3**: Send request with no auth header
  - **Expected**: 401 Unauthorized error

---

### 2. Required Field Validation Tests

- [ ] **Test 4**: Send request missing `title` field
  - **Expected**: 400 Bad Request error: "title is required"
- [ ] **Test 5**: Send request missing `slug` field
  - **Expected**: 400 Bad Request error: "slug is required"
- [ ] **Test 6**: Send request missing `content` field
  - **Expected**: 400 Bad Request error: "content is required"
- [ ] **Test 7**: Send request missing `author_id` field
  - **Expected**: 400 Bad Request error: "author_id is required"
- [ ] **Test 8**: Send request with invalid `author_id` (not UUID)
  - **Expected**: 400 Bad Request error: "author_id must be a valid UUID"

---

### 3. Slug Validation Tests

- [ ] **Test 9**: Send request with slug containing uppercase letters
  - **Expected**: 400 Bad Request error: "slug must be lowercase"
- [ ] **Test 10**: Send request with slug containing spaces
  - **Expected**: 400 Bad Request error: "slug must use hyphens"
- [ ] **Test 11**: Send request with slug containing special characters (@, #, etc.)
  - **Expected**: 400 Bad Request error: "slug contains invalid characters"
- [ ] **Test 12**: Send request with duplicate slug (send same slug twice)
  - **Expected**: First request succeeds, second request fails with "slug already exists"

---

### 4. Complete Valid Request Test

- [ ] **Test 13**: Send request with all required + optional fields
  - **Expected**: 201 Created response with post details
- [ ] **Test 14**: Verify post appears in admin dashboard
  - **Location**: `https://oregonexteriorexperts.com/admin/`
  - **Expected**: Draft appears with "Kinetic" source badge
- [ ] **Test 15**: Admin edits and publishes post
  - **Expected**: Post changes to "Published" status
- [ ] **Test 16**: Verify post appears on public blog
  - **Location**: `https://oregonexteriorexperts.com/blog/`
  - **Expected**: Post visible in blog listing with featured image, excerpt, etc.
- [ ] **Test 17**: Verify SSR meta tags are working
  - **Action**: View page source of published post
  - **Expected**: Meta tags visible in HTML `<head>` (not injected by JavaScript)

---

### 5. Rate Limiting Test

- [ ] **Test 18**: Send 21 requests within 1 hour
  - **Expected**: First 20 succeed, 21st fails with 429 error
- [ ] **Test 19**: Wait 1 hour, send another request
  - **Expected**: Request succeeds (rate limit window reset)

---

### 6. Featured Image Test

- [ ] **Test 20**: Send request with valid `featured_image_url`
  - **Expected**: 201 Created, image displays in admin dashboard
- [ ] **Test 21**: Send request with invalid image URL
  - **Expected**: 201 Created (backend doesn't validate image URLs), but admin can replace before publishing
- [ ] **Test 22**: Send request without `featured_image_url`
  - **Expected**: 201 Created, admin can upload image later

---

### 7. End-to-End Integration Test

- [ ] **Test 23**: Complete workflow test
  1. Send 3 posts with different content
  2. Admin reviews all 3 drafts
  3. Admin edits 1 post (title, content, image)
  4. Admin publishes all 3 posts
  5. Verify all 3 appear on public blog
  6. Verify all 3 appear in sitemap
  7. Verify social sharing works (Open Graph meta tags)

---

## Contact for Issues

If you encounter errors during configuration or testing:

### Troubleshooting Steps

1. **Check the response body** for specific error messages
2. **Verify authentication**: Confirm `X-KINETIC-AUTH` header matches exactly (case-sensitive)
3. **Validate required fields**: Ensure `title`, `slug`, `content`, and `author_id` are present
4. **Check field formats**: 
   - `slug` must be lowercase, hyphens only
   - `author_id` must be valid UUID format
   - `content` must be valid HTML
5. **Verify rate limiting**: Check if you've exceeded 20 requests/hour
6. **Test with cURL**: Use the example cURL command to isolate issues

---

### Information to Provide When Reporting Issues

When contacting Oregon Exterior development team, include:

1. **Request payload** (sanitize sensitive data if needed)
2. **Response status code** and full response body
3. **Timestamp** of the request (with timezone)
4. **Your IP address** (for rate limit troubleshooting)
5. **Request headers** (especially `X-KINETIC-AUTH` value to verify)
6. **Environment** (production vs staging)
7. **Screenshots** if admin dashboard issues

---

### Common Issues and Solutions

**Issue**: "Unauthorized - Invalid or missing X-KINETIC-AUTH header"
- **Solution**: Verify header value is exactly `k8Jx2mP9vL4nQBLAHBLAHwR5tY3zA6bN1cM8` (case-sensitive)

**Issue**: "Validation error: slug already exists"
- **Solution**: Change slug to a unique value or add timestamp suffix

**Issue**: "Validation error: author_id must be a valid UUID"
- **Solution**: Contact Oregon Exterior team for correct author UUID

**Issue**: "Too many requests from this IP"
- **Solution**: Wait 1 hour or implement batching strategy (15-20 posts/hour max)

**Issue**: Post created but doesn't appear in admin dashboard
- **Solution**: Check admin is logged in and viewing "All Posts" (not just Published)

**Issue**: Post published but doesn't appear on public blog
- **Solution**: Clear browser cache, verify status is "published" not "draft"

---

## Appendix: Quick Reference

### Essential URLs

- **Webhook Endpoint**: `https://api.oregonexteriorexperts.com/api/external/kinetic-draft`
- **Admin Dashboard**: `https://oregonexteriorexperts.com/admin/`
- **Public Blog**: `https://oregonexteriorexperts.com/blog/`
- **Sitemap**: `https://oregonexteriorexperts.com/sitemap-blog.xml`

### Authentication

- **Header Name**: `X-KINETIC-AUTH`
- **Header Value**: `k8Jx2mP9vL4nQBLAHBLAHwR5tY3zA6bN1cM8`

### Rate Limiting

- **Limit**: 20 requests/hour/IP
- **Recommended**: 15-20 posts/hour with 1-hour delay between batches

### Required Fields

- `title` (string)
- `slug` (string, lowercase with hyphens)
- `content` (HTML string)
- `author_id` (UUID string - obtain from Oregon Exterior team)

### Recommended Optional Fields

- `excerpt` (100-150 chars)
- `meta_description` (150-160 chars)
- `canonical_url` (full URL)
- `featured_image_alt` (50-125 chars)
- `kinetic_id` (unique identifier)
- `reading_time` (integer minutes)

---

**End of Documentation**

For questions or support, contact the Oregon Exterior development team with the information outlined in the "Contact for Issues" section above.
