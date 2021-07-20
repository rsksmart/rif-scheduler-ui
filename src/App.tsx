import { useRef } from "react";
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
import Store from "./store/Store";
import Contracts from "./contracts/Contracts";
import Connect from "./connect/Connect";
import useConnector from "./connect/useConnector";
import Account from "./connect/Account";
import useProvidersLoader from "./store/useProvidersLoader";
import UnsupportedNetworkAlert from "./connect/UnsupportedNetworkAlert";
import Home from "./home/Home";

function App() {
  const isConnected = useConnector((state) => state.isConnected);

  useProvidersLoader();

  const notistackRef = useRef<any>(null);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={2}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        autoHideDuration={1000}
        ref={notistackRef}
      >
        <UnsupportedNetworkAlert />
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
        <Home />
      </Route>
      <Route exact path="/schedule">
        <Schedule />
      </Route>
      <Route exact path="/store">
        <Store />
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
