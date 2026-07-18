import { RouterProvider } from "react-router/dom";
import { AuthProvider } from "@/lib/auth";
import { router } from "./routes/routes";

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
