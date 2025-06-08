# CustomSearchBar Component for Next.js

This directory contains the files needed to integrate the CustomSearchBar component into your Next.js windsurfing project.

## Files Included

- `CustomSearchBar.tsx` - The React component from the Replit project
- `animations.css` - CSS animations used by the component (if any)
- `NextJsVersion-CustomSearchBar.tsx` - A reference implementation for Next.js

## Integration Steps

1. **Install required dependencies:**
   ```bash
   npm install @radix-ui/react-popover @radix-ui/react-select date-fns lucide-react
   ```

2. **Setup Shadcn UI components:**
   ```bash
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button calendar popover select
   ```

3. **Key changes for Next.js:**
   ```typescript
   // Change this:
   import { useLocation } from 'wouter';
   // To this:
   import { useRouter } from 'next/navigation';
   
   // Change this:
   const [, setLocation] = useLocation();
   // To this:
   const router = useRouter();
   
   // Change this in handleSearch function:
   setLocation(`/search?${searchParams.toString()}`);
   // To this:
   router.push(`/search?${searchParams.toString()}`);
   ```

4. **Update import paths:**
   Make sure all import paths like `@/components/ui/button` match your Next.js project structure

5. **Use in a page:**
   ```tsx
   import CustomSearchBar from '@/components/CustomSearchBar';
   
   export default function WindsurfingSearchPage() {
     return (
       <div className="container mx-auto py-8">
         <h1 className="text-3xl font-bold mb-8">Find Your Perfect Windsurfing Spot</h1>
         <CustomSearchBar className="mb-12" />
         {/* Other content */}
       </div>
     );
   }
   ```
