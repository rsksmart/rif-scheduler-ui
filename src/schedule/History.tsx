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
import useProviders, { IProvider } from "../store/useProviders";
import useContracts, { IContract } from "../contracts/useContracts";
import HistoryIcon from "@material-ui/icons/History";
import UpcomingIcon from "@material-ui/icons/AlarmOn";
import { useState } from "react";
import hyphensAndCamelCaseToWords from "../shared/hyphensAndCamelCaseToWords";
import shallow from "zustand/shallow";
import useRIFSchedulerProvider from "../store/useRIFSchedulerProvider";
import useConnector from "../connect/useConnector";
import StatusLabel from "./StatusLabel";
import { Hidden } from "@material-ui/core";
import ExecutionInfo from "./ExecutionInfo";

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
    row: ({ color = "#333" }: any) => ({
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
  onClick?: (executionId: string) => void
}> = ({ item, contract, provider, onClick }) => {
  const classes = useRowStyles({ color: item.color });
  const [updateStatus, isLoading] = useSchedule(
    (state) => [state.updateStatus, state.isLoading],
    shallow
  );

  const rifScheduler = useRIFSchedulerProvider();

  const handleUpdateStatusClick = () => {
    updateStatus(item.id!, rifScheduler!);
  };

  const handleItemClick = () => {
    if (onClick)
      onClick(item.id!)
  };

  console.log({item})

  return (
    <ListItem button className={classes.row} onClick={handleItemClick}>
      <div className={classes.part} style={{flexDirection:"row", alignItems: "center"}}>
        <ListItemText
          className={classes.part}
          primary={item.title}
          secondary={`${format(parseISO(item.executeAt), "EEE do, hh:mm aaa")}`}
        />
        <div style={{paddingLeft:16, paddingRight:16}}>
          <StatusLabel state={item.state} />
        </div>
      </div>
      <Hidden xsDown>
        <Divider orientation="vertical" style={{ marginRight: 16 }} flexItem />
        <ListItemText
          primary={
            <span>
              {contract?.name}&nbsp;&#10140;&nbsp;
              {hyphensAndCamelCaseToWords(item.contractMethod)}
            </span>
          }
          secondary={`${provider?.name} - Plan #${+item.providerPlanIndex + 1}`}
          className={classes.part}
        />
      </Hidden>
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          onClick={handleUpdateStatusClick}
          disabled={isLoading}
        >
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

  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null)

  const connectedToNetwork = useConnector(state => state.network)

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
      item.network === connectedToNetwork &&
      (isFromThisMonth ? parseISO(item.executeAt) >= firstDayCurrentMonth : true)
    )
    .reduce((prev: any, [id, item]) => {
      const groupId = format(parseISO(item.executeAt), "MMM yyyy");
      const group = [...(prev[groupId] ?? []), item];

      return { ...prev, [groupId]: group };
    }, {});

  const groupedEntries = Object.entries(itemsGroupedByMonth);

  return (
    <>
      <ExecutionInfo selectedExecutionId={selectedExecutionId} onClose={()=>setSelectedExecutionId(null)} />
      {groupedEntries.length > 0 && (
        <Card style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <CardHeader
            title={isFromThisMonth ? "Current and pending" : "History"}
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
                    onClick={(value) => setSelectedExecutionId(value)}
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
