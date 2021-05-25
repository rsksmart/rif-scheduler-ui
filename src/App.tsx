import { ThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import theme from "./assets/theme";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import Schedule from "./schedule/Schedule";
import Providers from "./providers/Providers";
import Contracts from "./contracts/Contracts";
import useProviders from "./providers/useProviders";
import { useEffect } from "react";

function App() {
  const loadProviders = useProviders((state) => state.load);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Switch>
          <Route exact path="/">
            <Schedule />
          </Route>
          <Route exact path="/providers">
            <Providers />
          </Route>
          <Route exact path="/contracts">
            <Contracts />
          </Route>
          <Route path="*">
            <Redirect to="/" />
          </Route>
        </Switch>
      </Router>
    </ThemeProvider>
  );
}

export default App;
