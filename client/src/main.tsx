import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/animations.css";  // Import microanimations
import { Helmet, HelmetProvider } from 'react-helmet-async';

const helmetContext = {};

createRoot(document.getElementById("root")!).render(
  <HelmetProvider context={helmetContext}>
    <Helmet>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
      <meta name="description" content="Find and book unique accommodations directly from hosts - no fees, no middlemen, just authentic stays." />
      <meta name="theme-color" content="#3B82F6" />
      <title>StayDirectly - Book Unique Accommodations Directly</title>
    </Helmet>
    <App />
  </HelmetProvider>
);
