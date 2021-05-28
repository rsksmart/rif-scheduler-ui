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
import Connect from "./connect/Connect";
import useConnector from "./connect/useConnector";
import shallow from "zustand/shallow";
import Account from "./connect/Account";

function App() {
  const loadProviders = useProviders((state) => state.load);

  const [isConnected, load, rifScheduler] = useConnector(
    (state) => [state.isConnected, state.load, state.rifScheduler],
    shallow
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (rifScheduler) loadProviders(rifScheduler);
  }, [loadProviders, rifScheduler]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {!isConnected && <PublicRoutes />}
        {isConnected && <ConnectedRoutes />}
      </Router>
    </ThemeProvider>
  );
}

const PublicRoutes = () => {
  return (
    <Switch>
      <Route exact path="/connect">
        <Connect />
      </Route>
      <Route path="*">
        <Redirect to="/connect" />
      </Route>
    </Switch>
  );
};

const ConnectedRoutes = () => {
  return (
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
      <Route exact path="/account">
        <Account />
      </Route>
      <Route path="*">
        <Redirect to="/" />
      </Route>
    </Switch>
  );
};

export default App;
