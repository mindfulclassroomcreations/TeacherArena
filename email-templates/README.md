# Professional Email Templates for Supabase Auth

## 📧 Overview

This folder contains professional, responsive HTML email templates for all Supabase authentication flows. These templates are designed to look official, modern, and provide a great user experience.

## ✨ Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Professional Styling**: Modern gradient headers, clean typography, proper spacing
- **Brand Consistent**: Uses Teacher Arena branding and colors
- **Security-Focused**: Clear security messages and warnings
- **User-Friendly**: Clear CTAs, alternative text links, and helpful information

## 📁 Templates Included

### 1. **confirmation-email.html** - Email Confirmation
- Used when users sign up
- Confirms their email address
- Includes welcome message and feature highlights
- **Gradient**: Blue (#2563eb → #1d4ed8)

### 2. **password-reset-email.html** - Password Reset
- Used when users request password reset
- Includes security tips
- Clear warning about expiration
- **Gradient**: Red (#dc2626 → #b91c1c)

### 3. **magic-link-email.html** - Magic Link Sign-In
- Used for passwordless login
- Quick and easy sign-in
- Modern "magic" themed design
- **Gradient**: Purple (#7c3aed → #6d28d9)

## 🚀 How to Use

### Step 1: Go to Supabase Dashboard

1. Navigate to https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Email Templates** (in left sidebar)

### Step 2: Update Each Template

#### For Confirmation Email:
1. Click on **"Confirm signup"** template
2. Copy the entire contents of `confirmation-email.html`
3. Paste into the editor, replacing everything
4. Click **"Save"**

#### For Password Reset:
1. Click on **"Reset Password"** template
2. Copy the entire contents of `password-reset-email.html`
3. Paste into the editor, replacing everything
4. Click **"Save"**

#### For Magic Link:
1. Click on **"Magic Link"** template
2. Copy the entire contents of `magic-link-email.html`
3. Paste into the editor, replacing everything
4. Click **"Save"**

## 🎨 Customization

### Colors

The templates use gradient backgrounds. You can customize the colors:

**Confirmation Email (Blue):**
```css
background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
```

**Password Reset (Red):**
```css
background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
```

**Magic Link (Purple):**
```css
background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
```

### Logo

To add your logo, replace the emoji (🎓) with an image:

```html
<img src="https://yoursite.com/logo.png" alt="Teacher Arena" style="max-width: 200px; height: auto;" />
```

### Links

Update these placeholder links in the footer:
- `/support` → Your support page
- `/privacy` → Your privacy policy
- `/terms` → Your terms of service
- `support@teacherarena.asia` → Your support email

## 📱 Template Structure

Each template follows this structure:

```
┌─────────────────────────────────┐
│ Gradient Header with Brand      │
│ (Logo + Title)                  │
├─────────────────────────────────┤
│ Main Content                    │
│ - Heading                       │
│ - Explanation text              │
│ - CTA Button                    │
│ - Text link alternative         │
│ - Important notices             │
├─────────────────────────────────┤
│ Footer                          │
│ - Help text                     │
│ - Links                         │
│ - Copyright                     │
└─────────────────────────────────┘
```

## 🔒 Security Features

Each template includes:

- ✅ Clear expiration warnings
- ✅ "Didn't request this?" messages
- ✅ Security tips (password reset)
- ✅ Alternative text links for accessibility
- ✅ Professional, trustworthy design

## 📊 Template Variables

Supabase provides these variables:

| Variable | Description | Used In |
|----------|-------------|---------|
| `{{ .ConfirmationURL }}` | The action link | All templates |
| `{{ .Email }}` | User's email | Available but not used |
| `{{ .Token }}` | Confirmation token | Available but not used |

## ✅ Testing

After uploading templates:

1. **Test Signup**: Create a new account → Check confirmation email
2. **Test Password Reset**: Request password reset → Check reset email
3. **Test Magic Link**: Request magic link → Check magic link email

Check:
- ✅ Email arrives within 1 minute
- ✅ Design looks good on desktop
- ✅ Design looks good on mobile
- ✅ All links work correctly
- ✅ Buttons are clickable
- ✅ Text is readable

## 🎯 Best Practices

### Email Deliverability

1. **Use inline styles** (✅ Already done)
2. **Avoid JavaScript** (✅ No JS used)
3. **Test spam scores** using tools like mail-tester.com
4. **Use tables for layout** (✅ Already done)
5. **Provide text alternatives** (✅ Plain text links included)

### Accessibility

- ✅ Semantic HTML
- ✅ Alt text for images
- ✅ Readable font sizes (14px+)
- ✅ High contrast colors
- ✅ Clear call-to-actions

## 📝 Template Preview

### Confirmation Email
- **Subject**: Confirm your email address
- **From**: Teacher Arena <noreply@yourproject.supabase.co>
- **Style**: Welcoming, professional, feature highlights

### Password Reset
- **Subject**: Reset your password
- **From**: Teacher Arena <noreply@yourproject.supabase.co>
- **Style**: Secure, urgent, with security tips

### Magic Link
- **Subject**: Your sign-in link
- **From**: Teacher Arena <noreply@yourproject.supabase.co>
- **Style**: Modern, quick, magical theme

## 🆘 Troubleshooting

**Emails not sending?**
- Check Supabase email settings
- Verify SMTP configuration
- Check spam folder
- Test with different email providers

**Design broken?**
- Ensure all HTML is copied
- Check for missing closing tags
- Test in email client preview

**Links not working?**
- Verify `{{ .ConfirmationURL }}` is present
- Check Supabase redirect settings
- Test link in incognito mode

## 📚 Resources

- [Supabase Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Email on Acid - HTML Email Guide](https://www.emailonacid.com/)
- [Can I Email - CSS Support](https://www.caniemail.com/)

## 📦 File Structure

```
email-templates/
├── README.md                      # This file
├── confirmation-email.html        # Email confirmation template
├── password-reset-email.html      # Password reset template
└── magic-link-email.html         # Magic link template
```

## 🎉 Result

After implementing these templates, your users will receive:
- **Professional-looking emails** that build trust
- **Clear instructions** for each action
- **Responsive design** that works everywhere
- **Branded experience** consistent with your app

---

**Made with ❤️ for Teacher Arena**

For questions or customization help, check the documentation or contact support.
