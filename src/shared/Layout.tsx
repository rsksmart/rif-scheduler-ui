import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Logo from "../assets/Logo";
import { Link } from "react-router-dom";
import BottomNavigation from "@material-ui/core/BottomNavigation";
import BottomNavigationAction from "@material-ui/core/BottomNavigationAction";

import HomeIcon from "@material-ui/icons/Home";
import ScheduleIcon from "@material-ui/icons/EventAvailable";
import StoreIcon from "@material-ui/icons/Store";
import ContractsIcon from "@material-ui/icons/OfflineBolt";
import AccountIcon from "@material-ui/icons/AccountCircle";

import HomeOutlinedIcon from "@material-ui/icons/HomeOutlined";
import ScheduleOutlinedIcon from "@material-ui/icons/EventAvailableOutlined";
import StoreOutlinedIcon from "@material-ui/icons/StoreOutlined";
import ContractsOutlinedIcon from "@material-ui/icons/OfflineBoltOutlined";
import AccountOutlinedIcon from "@material-ui/icons/AccountCircleOutlined";

import { useLocation } from "react-router-dom";
import useScrollTrigger from "@material-ui/core/useScrollTrigger";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    logo: ({ hideMenu }: any) => ({
      height: 32,
      "@media (max-width: 360px)": {
        display: hideMenu ? "initial" : "none",
      },
    }),
    title: ({ hideMenu }: any) => ({
      marginTop: 8,
      marginLeft: 5,
      flexGrow: 1,
      "@media (max-width: 500px)": {
        display: hideMenu ? "initial" : "none",
      },
    }),
    navButtons: {
      display: "flex",
      flex: 1,
      justifyContent: "flex-end",
      gap: "5px",
    },
    navButton: {
      padding: 0,
      minWidth: 60,
      paddingTop: "0px !important",
      fontSize: "0.75rem !important",
    },
    navLabel: {
      fontSize: "0.75rem !important",
    },
    toolbar: {
      display: "flex",
      flex: 1,
      width: "100%",
      maxWidth: 800,
      padding: 0,
      paddingLeft: 12,
    },
    appBar: ({ scrolled }) => ({
      display: "flex",
      flex: 1,
      alignItems: "center",
      backgroundColor: "#faf9f9",
      padding: 0,
      boxShadow: scrolled ? "0px 5px 20px -5px rgb(0 0 0 / 25%)" : "none",
    }),
    setBehind: {
      zIndex: 1
    }
  })
);

enum ESection {
  Home = 0,
  Schedule = 1,
  Store = 2,
  Contracts = 3,
  Account = 4,
}

const menuIndexes: { [key: string]: number } = {
  "/": ESection.Home,
  "/schedule": ESection.Schedule,
  "/store": ESection.Store,
  "/contracts": ESection.Contracts,
  "/account": ESection.Account,
};

const Layout: React.FC<{ hideMenu?: boolean, setBehind?: boolean }> = ({ children, hideMenu, setBehind }) => {
  const location = useLocation();
  const scrolled = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });
  const classes = useStyles({ hideMenu, scrolled });

  return (
    <>
      <AppBar position="sticky" className={classes.appBar + (setBehind ? ' '  + classes.setBehind : '')} elevation={0}>
        <Toolbar className={classes.toolbar}>
          <Logo className={classes.logo} />
          <Typography
            variant="h6"
            className={classes.title}
            color="textPrimary"
          >
            scheduler
          </Typography>
          {!hideMenu && (
            <div className={classes.navButtons}>
              <BottomNavigation
                showLabels
                value={menuIndexes[location.pathname]}
                style={{ background: "transparent" }}
              >
                <BottomNavigationAction
                  label="Home"
                  icon={
                    menuIndexes[location.pathname] === ESection.Home ? (
                      <HomeIcon />
                    ) : (
                      <HomeOutlinedIcon />
                    )
                  }
                  component={Link}
                  classes={{
                    root: classes.navButton,
                    label: classes.navLabel,
                  }}
                  to="/"
                />
                <BottomNavigationAction
                  label="Schedule"
                  icon={
                    menuIndexes[location.pathname] === ESection.Schedule ? (
                      <ScheduleIcon />
                    ) : (
                      <ScheduleOutlinedIcon />
                    )
                  }
                  component={Link}
                  classes={{
                    root: classes.navButton,
                    label: classes.navLabel,
                  }}
                  to="/schedule"
                />
                <BottomNavigationAction
                  label="Store"
                  icon={
                    menuIndexes[location.pathname] === ESection.Store ? (
                      <StoreIcon />
                    ) : (
                      <StoreOutlinedIcon />
                    )
                  }
                  component={Link}
                  classes={{
                    root: classes.navButton,
                    label: classes.navLabel,
                  }}
                  to="/store"
                />
                <BottomNavigationAction
                  label="Contracts"
                  icon={
                    menuIndexes[location.pathname] === ESection.Contracts ? (
                      <ContractsIcon />
                    ) : (
                      <ContractsOutlinedIcon />
                    )
                  }
                  component={Link}
                  classes={{
                    root: classes.navButton,
                    label: classes.navLabel,
                  }}
                  to="/contracts"
                />
                <BottomNavigationAction
                  label="Account"
                  icon={
                    menuIndexes[location.pathname] === ESection.Account ? (
                      <AccountIcon />
                    ) : (
                      <AccountOutlinedIcon />
                    )
                  }
                  component={Link}
                  classes={{
                    root: classes.navButton,
                    label: classes.navLabel,
                  }}
                  to="/account"
                />
              </BottomNavigation>
            </div>
          )}
        </Toolbar>
      </AppBar>
      <div
        style={{
          padding: 15,
          display: "flex",
          flex: 1,
          alignItems: "center",
          flexDirection: "column",
          paddingBottom: 60,
        }}
      >
        {children}
      </div>
    </>
  );
};

export default Layout;
