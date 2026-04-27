# EDS v3.0 — Form Validation Patterns

## Validation Strategy: "Validate on Blur, Show on Submit"

| Moment                                             | Action                                                                                  |
| -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Typing (`onChange`)                                | **Do NOT** show errors. Only clear an existing error if the user is actively fixing it. |
| Leave field (`onBlur`)                             | Validate that field. Show error immediately if invalid.                                 |
| Press Submit                                       | Validate all fields. Auto-focus the first field with an error.                          |
| Fixing an error (`onChange` while field has error) | Clear the error immediately — positive reinforcement.                                   |

## Error Message Guidelines

```
✅ "Invalid email. Please enter a valid format (e.g. name@email.com)"
❌ "Email is wrong"

✅ "Password must be at least 8 characters and include an uppercase letter and a number"
❌ "Password is not strong enough"

✅ "No account found with this email. Would you like to sign up?"
❌ "Login failed"
```

**Pattern**: `[What's wrong] + [Specific guidance]`

## Validation Hook

```jsx
const useFormValidation = (rules) => {
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

  const validateField = (name, value) => {
    const fieldRules = rules[name];
    if (!fieldRules) return null;
    for (const check of fieldRules) {
      const error = check(value);
      if (error) return error;
    }
    return null;
  };

  // Call on input's onBlur
  const handleBlur = (name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Call on input's onChange
  const handleChange = (name, value) => {
    if (errors[name]) {
      const error = validateField(name, value);
      if (!error) setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Call on form's onSubmit — returns true if all valid
  const validateAll = (values) => {
    const newErrors = {};
    Object.keys(rules).forEach((name) => {
      newErrors[name] = validateField(name, values[name]);
    });
    setErrors(newErrors);
    setTouched(Object.fromEntries(Object.keys(rules).map((k) => [k, true])));
    return Object.values(newErrors).every((e) => !e);
  };

  return { errors, touched, handleBlur, handleChange, validateAll };
};
```

## Usage Example

```jsx
const LoginForm = () => {
  const [values, setValues] = React.useState({ email: "", password: "" });

  const { errors, handleBlur, handleChange, validateAll } = useFormValidation({
    email: [rules.required(), rules.email()],
    password: [rules.required(), rules.minLength(8)],
  });

  const handleSubmit = () => {
    if (!validateAll(values)) {
      // errors are now set; focus first error field automatically
      return;
    }
    // proceed with submission
  };

  return (
    <div className="flex flex-col gap-4">
      <TextField
        id="email"
        label="Email"
        type="email"
        value={values.email}
        onChange={(e) => {
          setValues((v) => ({ ...v, email: e.target.value }));
          handleChange("email", e.target.value);
        }}
        onBlur={(e) => handleBlur("email", e.target.value)}
        error={errors.email}
      />
      <TextField
        id="password"
        label="Password"
        type="password"
        value={values.password}
        onChange={(e) => {
          setValues((v) => ({ ...v, password: e.target.value }));
          handleChange("password", e.target.value);
        }}
        onBlur={(e) => handleBlur("password", e.target.value)}
        error={errors.password}
      />
      <Button variant="primary" onClick={handleSubmit}>
        Sign In
      </Button>
    </div>
  );
};
```

## Validation Rules Library

```js
export const rules = {
  required:
    (msg = "This field is required") =>
    (v) =>
      !v || v.trim() === "" ? msg : null,

  email: () => (v) =>
    v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Invalid email address" : null,

  minLength: (n, msg) => (v) =>
    v && v.length < n ? (msg ?? `Minimum ${n} characters`) : null,

  maxLength: (n, msg) => (v) =>
    v && v.length > n ? (msg ?? `Maximum ${n} characters`) : null,

  studentCode: () => (v) =>
    v && !/^\d{10}$/.test(v) ? "Student ID must be exactly 10 digits" : null,

  scoreRange:
    (min = 0, max = 10) =>
    (v) =>
      v !== "" && (isNaN(v) || v < min || v > max)
        ? `Score must be between ${min} and ${max}`
        : null,

  match:
    (otherValue, msg = "Values do not match") =>
    (v) =>
      v !== otherValue ? msg : null,

  url: () => (v) =>
    v && !/^https?:\/\/.+/.test(v)
      ? "Please enter a valid URL starting with http:// or https://"
      : null,
};
```
