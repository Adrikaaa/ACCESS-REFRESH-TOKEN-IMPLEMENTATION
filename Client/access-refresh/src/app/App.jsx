import "./App.css";
import { RouterProvider } from "react-router";
import router from "./app.routes";
import { AuthProvider } from "../modules/auth/context/useAuthContext";

const App = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;
