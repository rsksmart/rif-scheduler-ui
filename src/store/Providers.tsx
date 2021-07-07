import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import ListSubheader from "@material-ui/core/ListSubheader";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Divider from "@material-ui/core/Divider";
import useProviders, { IPlan, IProvider } from "../store/useProviders";
import { useState } from "react";
import useConnector from "../connect/useConnector";
import StatusLabel from "./StatusLabel";
import { Hidden } from "@material-ui/core";
import { formatBigNumber, fromBigNumberToHms } from "../shared/formatters";
import PurchaseExecutions from "./PurchaseExecutions";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: "100%",
      padding: 5,
      gap: "5px",
      display: "flex",
      flexDirection: "column",
    },
  })
);

const useRowStyles = makeStyles((theme: Theme) =>
  createStyles({
    part: {
      display: "flex",
      flexDirection: "column",
      flex: 1,
    },
    row: {
      borderLeft: `rgba(0, 0, 0, 0.12) 4px solid`,
      borderBottom: `rgba(0, 0, 0, 0.12) 1px solid`,
      borderRadius: 15,
    },
  })
);

const Item: React.FC<{
  item: IPlan;
  onClick?: (index: number) => void
}> = ({ item, onClick }) => {
  const classes = useRowStyles();

  const handleItemClick = () => {
    if (onClick)
      onClick(item.index)
  };

  return (
    <ListItem button className={classes.row} onClick={handleItemClick}>
      <div className={classes.part} style={{flexDirection:"row", alignItems: "center"}}>
        <ListItemText
          className={classes.part}
          primary={`#${item.index + 1}`}
          secondary={`${item.remainingExecutions?.toString() ?? 0} executions left`}
        />
        <div style={{paddingLeft:16, paddingRight:16}}>
          <StatusLabel plan={item} />
        </div>
      </div>
      <Hidden xsDown>
        <Divider orientation="vertical" style={{ marginRight: 16 }} flexItem />
        <ListItemText
          primary={`Window: ${fromBigNumberToHms(item.window)}`}
          secondary={`Gas limit: ${formatBigNumber(item.gasLimit, 0)}`}
          className={classes.part}
        />
      </Hidden>
    </ListItem>
  );
};

const Providers = () => {
  const classes = useStyles();

  const [selectedPlan, setSelectedPlan] = useState<{ provider: IProvider, planIndex: number } | null>(null)

  const connectedToNetwork = useConnector(state => state.network)

  const providers = useProviders((state) => state.providers)

  const networkProviders = Object.entries(providers)
    .filter(([id, provider])=> provider.network === connectedToNetwork)

  return (
    <>
      <PurchaseExecutions provider={selectedPlan?.provider} planIndex={selectedPlan?.planIndex} onClose={()=>setSelectedPlan(null)} />
      <Card style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <CardHeader
          title={"Plans"}
        />
        <CardContent style={{ padding: 0 }}>
          {networkProviders.map(([id, provider])=>(
            <List
                key={`provider-list-${id}`}
                subheader={
                  <ListSubheader component="div">{provider.name}</ListSubheader>
                }
                className={classes.root}
              >
                {provider.plans.map((item) => (
                  <Item
                    key={`plan-item-${item.index}`}
                    item={item}
                    onClick={(value) => setSelectedPlan({ provider, planIndex: value })}
                  />
                ))}
            </List>
          ))}
        </CardContent>
      </Card>
    </>
  );
};

export default Providers;
