# Claude Development Guidelines

## TypeScript-First Development

### 🚨 **CRITICAL: Only modify TypeScript files (.ts/.tsx)**

This project follows a TypeScript-first development approach. **DO NOT** modify JavaScript (.js/.jsx) files directly.

### File Extension Rules

#### ✅ **MODIFY THESE FILES:**
- `.ts` - TypeScript files
- `.tsx` - TypeScript React components
- `.json` - Configuration files
- `.md` - Documentation files
- `.sql` - Database migration files
- `.css` - Stylesheets

#### ❌ **NEVER MODIFY THESE FILES:**
- `.js` - JavaScript files (auto-generated)
- `.jsx` - JavaScript React components (auto-generated)

### Why This Rule Exists

1. **Auto-Generation**: JavaScript files are automatically compiled/transpiled from TypeScript files during the build process
2. **Source of Truth**: TypeScript files are the single source of truth for all logic and components
3. **Type Safety**: Modifications in TypeScript ensure type safety and catch errors at compile time
4. **Build Process**: Running `npm run build` automatically generates JavaScript from TypeScript
5. **Consistency**: Prevents conflicts between manually edited JS files and auto-generated versions

### Development Workflow

1. **Make changes only in TypeScript files** (`.ts`/`.tsx`)
2. **Run build command** to compile TypeScript to JavaScript:
   ```bash
   npm run build
   ```
3. **Verify compilation** - Check that build completes without errors
4. **Test functionality** using the compiled JavaScript files

### Project Structure Understanding

```
src/
├── components/
│   ├── Component.tsx     ← EDIT THIS
│   └── Component.js      ← AUTO-GENERATED (DO NOT EDIT)
├── services/
│   ├── service.ts        ← EDIT THIS
│   └── service.js        ← AUTO-GENERATED (DO NOT EDIT)
└── utils/
    ├── helper.ts         ← EDIT THIS
    └── helper.js         ← AUTO-GENERATED (DO NOT EDIT)
```

### Build Commands

- `npm run build` - Compiles TypeScript and builds for production
- `npm run dev` - Development server with hot reload
- `npm run lint` - Lints TypeScript files (if ESLint is configured)

### When You See Both .ts and .js Files

If you encounter both TypeScript and JavaScript versions of the same file:
- The `.ts`/`.tsx` file is the **source file** - make changes here
- The `.js`/`.jsx` file is the **compiled output** - never edit this

### Exception Cases

The only time you might see standalone `.js` files that can be modified:
- Legacy files that haven't been migrated to TypeScript yet
- Third-party library files in `node_modules` (but you shouldn't edit these anyway)
- Configuration files that are explicitly meant to be JavaScript (rare)

### Key Reminders for Claude

1. **Always check file extensions** before making changes
2. **Search for TypeScript versions** (`.ts`/`.tsx`) of components you need to modify
3. **Run build command** after making changes to see compiled results
4. **If you see duplicate functionality in both .ts and .js files**, only modify the TypeScript version
5. **Verify your changes** by checking the build output includes your modifications

### Error Prevention

❌ **Wrong approach:**
```
Modifying: Component.js
Result: Changes lost on next build
```

✅ **Correct approach:**
```
Modifying: Component.tsx
Running: npm run build
Result: Changes compiled to Component.js automatically
```

This guideline ensures code consistency, prevents build conflicts, and maintains the TypeScript development workflow integrity.