// import { createStart, createMiddleware } from "@tanstack/react-start";

// import { renderErrorPage } from "./lib/error-page";

// const errorMiddleware = createMiddleware().server(async ({ next }) => {
//   try {
//     return await next();
//   } catch (error) {
//     if (error != null && typeof error === "object" && "statusCode" in error) {
//       throw error;
//     }
//     console.error(error);
//     return new Response(renderErrorPage(), {
//       status: 500,
//       headers: { "content-type": "text/html; charset=utf-8" },
//     });
//   }
// });

// export const startInstance = createStart(() => ({
//   requestMiddleware: [errorMiddleware],
// }));


import React from "react";
import ReactDOM from "react-dom/client";
import {
RouterProvider,
createRouter,
} from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

const router = createRouter({
routeTree,
});

declare module "@tanstack/react-router" {
interface Register {
router: typeof router;
}
}

const rootElement = document.getElementById("root");

if (rootElement) {
ReactDOM.createRoot(rootElement).render(
<React.StrictMode> <RouterProvider router={router} />
</React.StrictMode>
);
}
