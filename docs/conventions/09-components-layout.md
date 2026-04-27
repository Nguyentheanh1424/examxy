# EDS v3.0 — Components: AuthEdgeLayout

> Required component for ALL authentication pages (login, register, reset password).

## Anatomy

`[Hero Panel (left/top)] + [Form Panel (right/bottom)]`

## Props

`heroImage`, `heroTitle`, `heroSubtitle`, `logoSrc`, `children`

## Layout Rules

| Breakpoint       | Hero Panel                                                      | Form Panel                             |
| ---------------- | --------------------------------------------------------------- | -------------------------------------- |
| Desktop (`≥ md`) | Left 45%, `object-cover` image with gradient mask on right edge | Right 55%, vertically centered, `p-12` |
| Mobile (`< md`)  | Top banner, fixed `h-[200px]` with gradient mask on bottom edge | Below hero, `p-8`                      |

## Additional Rules

- Hero image gradient: `to-background-surface` — blends smoothly into the form panel background.
- Form content: max-width `max-w-sm`, horizontally centered within the panel.
- Logo: Always top-left of the form panel, `h-8`.
- Hero title text: Only shown on mobile (`md:hidden`) overlaid on the hero image with `drop-shadow`.

## Code

```jsx
const AuthEdgeLayout = ({
  heroImage,
  heroTitle,
  heroSubtitle,
  logoSrc,
  children,
}) => (
  <div className="min-h-screen flex flex-col md:flex-row">
    {/* Hero Panel */}
    <div className="relative h-[200px] md:h-auto md:w-[45%] overflow-hidden">
      <img
        src={heroImage}
        alt=""
        className="w-full h-full object-cover"
        aria-hidden="true"
      />
      {/* Gradient mask — blends hero into form panel */}
      <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-transparent to-background-surface" />

      {/* Mobile-only title overlay */}
      {heroTitle && (
        <div className="absolute bottom-6 left-6 right-6 md:hidden">
          <h1 className="text-h2 font-bold text-white drop-shadow">
            {heroTitle}
          </h1>
          {heroSubtitle && (
            <p className="text-sm text-white/80 mt-1 drop-shadow">
              {heroSubtitle}
            </p>
          )}
        </div>
      )}
    </div>

    {/* Form Panel */}
    <div className="flex-1 md:w-[55%] flex flex-col justify-center p-8 md:p-12 bg-background-surface">
      {logoSrc && (
        <img src={logoSrc} alt="Examxy" className="h-8 w-auto mb-8 md:mb-12" />
      )}
      <div className="w-full max-w-sm mx-auto">{children}</div>
    </div>
  </div>
);
```

## Usage

```jsx
// Login page
<AuthEdgeLayout
  heroImage="/images/auth-hero.jpg"
  heroTitle="Welcome back"
  logoSrc="/logo.svg"
>
  <LoginForm />
</AuthEdgeLayout>

// Register page
<AuthEdgeLayout
  heroImage="/images/register-hero.jpg"
  heroTitle="Get started"
  logoSrc="/logo.svg"
>
  <RegisterForm />
</AuthEdgeLayout>
```
