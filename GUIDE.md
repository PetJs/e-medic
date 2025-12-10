# Package Usage Guide

This guide covers the main packages added to e-medic and how to use them effectively.

## Table of Contents

1. [Tailwind CSS](#tailwind-css)
2. [React Router](#react-router)
3. [Zod](#zod)
4. [Lucide React](#lucide-react)
5. [Radix UI](#radix-ui)
6. [Class Variance Authority](#class-variance-authority)
7. [Utility Packages](#utility-packages)

---

## Tailwind CSS

**Version:** 4.1.17 (with Vite integration)

Tailwind is a utility-first CSS framework for building interfaces quickly without writing custom CSS.

### Basic Usage

Apply utility classes directly to your JSX elements:

```tsx
export function Button() {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
      Click me
    </button>
  );
}
```

### Common Classes

- **Padding/Margin:** `p-4`, `m-2`, `px-6` (padding/margin on specific sides)
- **Background:** `bg-blue-500`, `bg-red-400`
- **Text:** `text-white`, `text-lg`, `font-bold`
- **Display:** `flex`, `grid`, `block`, `hidden`
- **Responsive:** `md:flex`, `lg:hidden` (applies at breakpoints)
- **Hover/States:** `hover:bg-blue-600`, `focus:outline-none`

### Configure Colors & Spacing

Edit `tailwind.config.ts` (or create one if missing):

```ts
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#1f2937',
      },
      spacing: {
        '128': '32rem',
      },
    },
  },
  plugins: [],
};
```

### Tips

- Use responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Combine utilities: `flex items-center justify-between gap-4`
- Use square brackets for arbitrary values: `w-[400px]`
- Docs: https://tailwindcss.com/docs

---

## React Router

**Version:** 7.10.1

React Router enables client-side navigation and dynamic routing in your SPA.

### Basic Setup

In `main.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router';
import Home from './pages/Home';
import About from './pages/About';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Navigation

Use the `Link` component to navigate without page reload:

```tsx
import { Link } from 'react-router';

export function Navigation() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
    </nav>
  );
}
```

### Dynamic Routes & Params

```tsx
<Route path="/user/:id" element={<UserProfile />} />

// In UserProfile component:
import { useParams } from 'react-router';

export function UserProfile() {
  const { id } = useParams();
  return <h1>User {id}</h1>;
}
```

### Query Strings

```tsx
import { useSearchParams } from 'react-router';

export function Search() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q');
  
  return (
    <input 
      value={query || ''} 
      onChange={(e) => setParams({ q: e.target.value })} 
    />
  );
}
```

### Tips

- Use nested routes for shared layouts
- Use `useNavigate()` for programmatic navigation
- Lazy load pages with `React.lazy()` + `<Suspense>`
- Docs: https://reactrouter.com/

---

## Zod

**Version:** 4.1.13

Zod is a TypeScript-first schema validation library. Use it to validate user input, API responses, and form data.

### Basic Validation

```tsx
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be 8+ characters'),
  age: z.number().int().positive().optional(),
});

// Validate data
const data = { email: 'user@example.com', password: 'secure123' };
const result = UserSchema.parse(data); // throws if invalid
// OR
const result = UserSchema.safeParse(data); // returns { success, data, error }
```

### Common Validators

```tsx
const schema = z.object({
  name: z.string(),
  email: z.string().email(),
  url: z.string().url(),
  phone: z.string().regex(/^\d{10}$/),
  age: z.number().int().min(0).max(120),
  role: z.enum(['admin', 'user', 'guest']),
  tags: z.array(z.string()),
  meta: z.record(z.string()), // { key: string }
  active: z.boolean().default(true),
});
```

### Inferring Types from Schemas

```tsx
type User = z.infer<typeof UserSchema>;
// User = { email: string; password: string; age?: number }
```

### Form Validation Example

```tsx
import { z } from 'zod';
import { useState } from 'react';

const FormSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
});

export function MyForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    const result = FormSchema.safeParse(data);
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    console.log('Valid data:', result.data);
    // Submit to API
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" placeholder="Username" />
      {errors.username && <span>{errors.username}</span>}
      <input name="email" placeholder="Email" />
      {errors.email && <span>{errors.email}</span>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Tips

- Use `safeParse()` for user input (won't throw)
- Use `parse()` for trusted data
- Docs: https://zod.dev/

---

## Lucide React

**Version:** 0.556.0

Lucide React provides 500+ beautiful, consistent SVG icons.

### Basic Usage

```tsx
import { Heart, Settings, Menu, X, ArrowRight } from 'lucide-react';

export function IconExample() {
  return (
    <div>
      <Heart size={24} />
      <Settings size={20} color="blue" />
      <Menu strokeWidth={1.5} />
    </div>
  );
}
```

### Common Props

- `size={24}` — Icon size in pixels (default 24)
- `color="red"` — SVG fill color
- `strokeWidth={1}` — Stroke thickness
- `className="text-red-500"` — Tailwind classes work too

### Example: Button with Icon

```tsx
import { ArrowRight } from 'lucide-react';

export function CTAButton() {
  return (
    <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded">
      Continue
      <ArrowRight size={18} />
    </button>
  );
}
```

### Tips

- Browse all icons: https://lucide.dev/
- Combine with Tailwind classes: `className="text-red-500 hover:text-red-600"`
- Icons are tree-shakeable (unused ones won't be in your bundle)

---

## Radix UI

**Version:** 1.2.4 (React Slot)

Radix UI provides unstyled, accessible UI primitives. The `react-slot` package is a component composition utility.

### React Slot Usage

Slot allows you to compose components and merge props:

```tsx
import { Slot } from '@radix-ui/react-slot';

interface ButtonProps {
  asChild?: boolean;
}

export function Button({ asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp {...props} className="px-4 py-2 bg-blue-500 text-white rounded" />;
}

// Usage:
<Button>Normal button</Button>
<Button asChild><a href="/home">Link styled as button</a></Button>
```

### Why Use Slot?

- Avoids wrapper `<div>` elements
- Merges props intelligently
- Common in design systems (shadcn/ui uses it heavily)

### Tips

- Use `asChild` to render as a different element
- Combine with Tailwind for styled primitives
- Docs: https://www.radix-ui.com/docs/primitives/utilities/slot

---

## Class Variance Authority

**Version:** 0.7.1

CVA helps you build type-safe, composable component variants with Tailwind CSS.

### Basic Example

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonStyles = cva(
  'px-4 py-2 rounded font-semibold transition',
  {
    variants: {
      intent: {
        primary: 'bg-blue-500 text-white hover:bg-blue-600',
        secondary: 'bg-gray-200 text-black hover:bg-gray-300',
        danger: 'bg-red-500 text-white hover:bg-red-600',
      },
      size: {
        sm: 'text-sm px-2 py-1',
        md: 'text-base px-4 py-2',
        lg: 'text-lg px-6 py-3',
      },
    },
    defaultVariants: {
      intent: 'primary',
      size: 'md',
    },
  }
);

type ButtonVariants = VariantProps<typeof buttonStyles>;

interface ButtonProps extends ButtonVariants {
  children: React.ReactNode;
}

export function Button({ intent, size, children }: ButtonProps) {
  return (
    <button className={buttonStyles({ intent, size })}>
      {children}
    </button>
  );
}

// Usage:
<Button intent="primary" size="sm">Small</Button>
<Button intent="danger" size="lg">Delete</Button>
```

### Compound Variants

```tsx
const cardStyles = cva('rounded p-4', {
  variants: {
    variant: { outline: 'border-2', filled: 'bg-gray-100' },
    interactive: { true: 'cursor-pointer hover:shadow-lg' },
  },
  compoundVariants: [
    {
      variant: 'outline',
      interactive: true,
      className: 'border-blue-500',
    },
  ],
});
```

### Tips

- Extract variant types with `VariantProps<typeof YourStyles>`
- Improves maintainability over inline className strings
- Docs: https://cva.style/

---

## Utility Packages

### clsx

**Version:** 2.1.1

Conditionally combine class names (alternative to `classnames`):

```tsx
import clsx from 'clsx';

export function Card({ isActive, disabled }) {
  return (
    <div
      className={clsx(
        'p-4 rounded border',
        isActive && 'bg-blue-100 border-blue-500',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      Content
    </div>
  );
}
```

### tailwind-merge

**Version:** 3.4.0

Merges Tailwind classes intelligently, preventing conflicts:

```tsx
import { twMerge } from 'tailwind-merge';

export function Button({ className, ...props }) {
  return (
    <button
      className={twMerge(
        'px-4 py-2 bg-blue-500 text-white rounded',
        className // Custom classes override defaults
      )}
      {...props}
    />
  );
}

// Usage:
<Button className="bg-red-500">Will be red, not blue</Button>
```

### tw-animate-css

**Version:** 1.4.0 (DevDependency)

Provides animation utilities for Tailwind (optional, for animations):

```tsx
<div className="animate-bounce">Bouncing element</div>
<div className="animate-spin">Spinning element</div>
```

---

## Best Practices

1. **Combine Tailwind + CVA** for scalable component systems
2. **Use Zod** for all user input validation
3. **Route with React Router** for multi-page navigation
4. **Use Lucide icons** for consistency across the app
5. **Use Slot** when building composable component libraries
6. **Merge Tailwind classes** with `tailwind-merge` in reusable components

---

## Quick References

| Package | Use For | Docs |
|---------|---------|------|
| Tailwind CSS | Styling | https://tailwindcss.com |
| React Router | Navigation | https://reactrouter.com |
| Zod | Validation | https://zod.dev |
| Lucide React | Icons | https://lucide.dev |
| Radix UI Slot | Component composition | https://radix-ui.com |
| CVA | Component variants | https://cva.style |
| clsx | Conditional classes | https://github.com/lukeed/clsx |
| tailwind-merge | Class merging | https://github.com/dcastil/tailwind-merge |

---

## Questions?

Refer back to this guide or check the official docs linked above. Each package is well-documented and has great community support.
