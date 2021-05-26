import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import ListSubheader from "@material-ui/core/ListSubheader";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import RefreshIcon from "@material-ui/icons/Refresh";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Divider from "@material-ui/core/Divider";
import useSchedule, { IScheduleItem } from "./useSchedule";
import { format, parseISO, compareAsc } from "date-fns";
import { ExecutionState, ExecutionStateDescriptions } from "../shared/types";
import useProviders, { IProvider } from "../providers/useProviders";
import useContracts, { IContract } from "../contracts/useContracts";
import HistoryIcon from "@material-ui/icons/History";
import UpcomingIcon from "@material-ui/icons/AlarmOn";
import { useState } from "react";

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
    row: ({ color = "#fff" }: any) => ({
      borderLeft: `${color} 4px solid`,
      borderBottom: `${color} 1px solid`,
      borderRadius: 15,
    }),
  })
);

const Item: React.FC<{
  item: IScheduleItem;
  contract?: IContract;
  provider?: IProvider;
}> = ({ item, contract, provider }) => {
  const classes = useRowStyles({ color: item.color });

  return (
    <ListItem button className={classes.row}>
      <ListItemText
        primary={item.title}
        secondary={`${format(parseISO(item.executeAt), "EEE do, HH:mm")} | ${
          ExecutionStateDescriptions[item.state ?? ExecutionState.Scheduled]
        }`}
        className={classes.part}
      />
      <Divider orientation="vertical" style={{ marginRight: 16 }} flexItem />
      <ListItemText
        primary={contract?.name}
        secondary={`${item.network} | ${provider?.name}`}
        className={classes.part}
      />
      <ListItemSecondaryAction>
        <IconButton edge="end">
          <RefreshIcon style={{ color: item.color }} />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

interface IGroupBy {
  [group: string]: IScheduleItem[];
}

const History = () => {
  const classes = useStyles();

  const [isFromThisMonth, setIsFromThisMonth] = useState(true);

  const scheduleItems = useSchedule((state) => state.scheduleItems);
  const contracts = useContracts((state) => state.contracts);
  const providers = useProviders((state) => state.providers);

  const firstDayCurrentMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  const itemsGroupedByMonth: IGroupBy = Object.entries(scheduleItems)
    .sort(([firstId, firstItem], [nextId, nextItem]) => {
      // Turn your strings into dates, and then subtract them
      // to get a value that is either negative, positive, or zero.
      return compareAsc(
        parseISO(firstItem.executeAt),
        parseISO(nextItem.executeAt)
      );
    })
    .filter(([id, item]) =>
      isFromThisMonth ? parseISO(item.executeAt) >= firstDayCurrentMonth : true
    )
    .reduce((prev: any, [id, item]) => {
      const groupId = format(parseISO(item.executeAt), "MMM yyyy");
      const group = [...(prev[groupId] ?? []), item];

      return { ...prev, [groupId]: group };
    }, {});

  const groupedEntries = Object.entries(itemsGroupedByMonth);

  return (
    <>
      {groupedEntries.length > 0 && (
        <Card>
          <CardHeader
            title={isFromThisMonth ? "From this month onwards" : "History"}
            action={
              <IconButton
                aria-label="filter"
                size="small"
                onClick={() => setIsFromThisMonth((prev) => !prev)}
              >
                {isFromThisMonth && <HistoryIcon />}
                {!isFromThisMonth && <UpcomingIcon />}
              </IconButton>
            }
          />
          <CardContent style={{ padding: 0 }}>
            {groupedEntries.map(([group, items], index) => (
              <List
                key={`history-group-${index}`}
                subheader={
                  <ListSubheader component="div">{group}</ListSubheader>
                }
                className={classes.root}
              >
                {items.map((item) => (
                  <Item
                    key={`history-item-${item.id}`}
                    item={item}
                    contract={contracts[item.contractId]}
                    provider={providers[item.providerId]}
                  />
                ))}
              </List>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default History;
