import React, { useRef } from "react";
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
import UnsupportedNetworkAlert from "./connect/UnsupportedNetworkAlert";
import Home from "./home/Home";
import { useConfirmationsNotifier } from "./sdk-hooks/useConfirmationsNotifier";

function App() {
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
        ref={notistackRef}
      >
        <UnsupportedNetworkAlert />
        <Routes />
      </SnackbarProvider>
    </ThemeProvider>
  );
}

const Routes = () => {
  const isConnected = useConnector((state) => state.isConnected);

  useConfirmationsNotifier();

  return (
    <Router>
      <Switch>
        <Route exact path="/connect">
          <Connect />
        </Route>
        <ConnectedRoute
          exact
          path="/"
          isConnected={isConnected}
          component={Home}
        />
        <ConnectedRoute
          exact
          path="/schedule"
          isConnected={isConnected}
          component={Schedule}
        />
        <ConnectedRoute
          exact
          path="/store"
          isConnected={isConnected}
          component={Store}
        />
        <ConnectedRoute
          exact
          path="/contracts"
          isConnected={isConnected}
          component={Contracts}
        />
        <ConnectedRoute
          exact
          path="/account"
          isConnected={isConnected}
          component={Account}
        />
        <Route path="*">
          <Redirect to="/" />
        </Route>
      </Switch>
    </Router>
  );
};

const ConnectedRoute: React.FC<{
  isConnected: boolean;
  exact: boolean;
  component: any;
  path: string;
}> = ({ isConnected, exact, path, component: Component }) => (
  <Route
    exact={exact}
    path={path}
    render={(props) =>
      isConnected ? (
        <Component {...props} />
      ) : (
        <Redirect
          to={{
            pathname: "/connect",
            state: { from: props.location },
          }}
        />
      )
    }
  />
);

export default App;
