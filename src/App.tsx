import { useRef, useEffect } from "react";
import { ThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import theme from "./assets/theme";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { SnackbarProvider } from "notistack";
import Schedule from "./schedule/Schedule";
import Providers from "./providers/Providers";
import Contracts from "./contracts/Contracts";
import useProviders from "./providers/useProviders";
import Connect from "./connect/Connect";
import useConnector from "./connect/useConnector";
import shallow from "zustand/shallow";
import Account from "./connect/Account";
import { Button } from "@material-ui/core";

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

  const notistackRef = useRef<any>(null);
  const onClickDismiss = (key: any) => () => {
    notistackRef?.current?.closeSnackbar(key);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={2}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        ref={notistackRef}
        // action={(key) => (
        //   <Button color={"primary"} onClick={onClickDismiss(key)}>
        //     Close
        //   </Button>
        // )}
      >
        <Router>
          {!isConnected && <PublicRoutes />}
          {isConnected && <ConnectedRoutes />}
        </Router>
      </SnackbarProvider>
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
