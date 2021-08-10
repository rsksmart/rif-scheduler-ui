import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import ListSubheader from "@material-ui/core/ListSubheader";
import List from "@material-ui/core/List";
import IconButton from "@material-ui/core/IconButton";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import { format, compareAsc, addMonths, addYears } from "date-fns";
import NextIcon from "@material-ui/icons/NavigateNext";
import BeforeIcon from "@material-ui/icons/NavigateBefore";
import { useEffect, useState } from "react";
import useConnector from "../connect/useConnector";
import ExecutionInfo from "./ExecutionInfo";
import { useExecutions } from "../sdk-hooks/useExecutions";
import { IExecutionSnapshot } from "../sdk-hooks/useExecution";
import { useMemo } from "react";
import {
  Button,
  FormControl,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Typography,
} from "@material-ui/core";
import LoadingCircle from "../shared/LoadingCircle";

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
interface IGroupBy {
  [group: string]: IExecutionSnapshot[];
}

enum EHistoryOption {
  Month,
  Year,
  Schedule,
}

const defaultDate = () =>
  new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  );

const defaultHistoryOption = () => {
  const option = JSON.parse(
    localStorage.getItem("DEFAULT_HISTORY_OPTION") ?? "0"
  ) as EHistoryOption;
  return [
    EHistoryOption.Month,
    EHistoryOption.Year,
    EHistoryOption.Schedule,
  ].includes(option)
    ? option
    : EHistoryOption.Month;
};

const PAGE_SIZE = 20;

const History = () => {
  const classes = useStyles();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(0);
  const [refDate, setRefDate] = useState<Date>(defaultDate());

  const connectedToNetwork = useConnector((state) => state.network);

  const [historyOption, setHistoryOption] = useState<EHistoryOption>(
    defaultHistoryOption()
  );

  const [executions, loadExecutions] = useExecutions();

  useEffect(() => {
    setIsLoading(true);
    loadExecutions().then(() => setIsLoading(false));
  }, [loadExecutions]);

  const itemsGrouped: IGroupBy = useMemo(() => {
    if (historyOption === EHistoryOption.Year) {
      return executions
        .filter(
          (item) =>
            item.index.network === connectedToNetwork &&
            item.executeAt.getFullYear() === refDate.getFullYear()
        )
        .sort((firstItem, nextItem) =>
          compareAsc(firstItem.executeAt, nextItem.executeAt)
        )
        .reduce((prev: any, item) => {
          const groupId = format(item.executeAt, "MMMM");
          const group = [...(prev[groupId] ?? []), item];

          return { ...prev, [groupId]: group };
        }, {});
    }
    if (historyOption === EHistoryOption.Month) {
      return executions
        .filter(
          (item) =>
            item.index.network === connectedToNetwork &&
            item.executeAt.getFullYear() === refDate.getFullYear() &&
            item.executeAt.getMonth() === refDate.getMonth()
        )
        .sort((firstItem, nextItem) =>
          compareAsc(firstItem.executeAt, nextItem.executeAt)
        )
        .reduce((prev: any, item) => {
          const groupId = format(item.executeAt, "EEEE, do");
          const group = [...(prev[groupId] ?? []), item];

          return { ...prev, [groupId]: group };
        }, {});
    }
    if (historyOption === EHistoryOption.Schedule) {
      return executions
        .filter(
          (item) =>
            item.index.network === connectedToNetwork &&
            item.executeAt >= refDate
        )
        .sort((firstItem, nextItem) =>
          compareAsc(firstItem.executeAt, nextItem.executeAt)
        )
        .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
        .reduce((prev: any, item) => {
          const groupId = "Your schedule";
          const group = [...(prev[groupId] ?? []), item];

          return { ...prev, [groupId]: group };
        }, {});
    }
  }, [connectedToNetwork, executions, historyOption, page, refDate]);

  const handleIncrement = (inc: number) => () => {
    switch (historyOption) {
      case EHistoryOption.Month:
        setRefDate((prev) => addMonths(prev, inc));
        break;
      case EHistoryOption.Year:
        setRefDate((prev) => addYears(prev, inc));
        break;
      case EHistoryOption.Schedule:
        setPage((prev) => {
          let result = prev + inc;

          if ((result + 1) * PAGE_SIZE > executions.length) result = prev;

          if (result <= 0) result = 0;

          return result;
        });
        break;
    }
  };

  const handleClear = () => {
    setRefDate(defaultDate());
    setPage(0);
  };

  const groupedEntries = Object.entries(itemsGrouped);

  return (
    <>
      <Card style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <CardHeader
          disableTypography
          title={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  alignItems: "center",
                  gap: "5px",
                  flexWrap: "nowrap",
                }}
              >
                <Button variant="outlined" onClick={handleClear}>
                  Today
                </Button>
                <div style={{ width: 60 }}>
                  <IconButton size="small" onClick={handleIncrement(-1)}>
                    <BeforeIcon />
                  </IconButton>
                  <IconButton size="small" onClick={handleIncrement(1)}>
                    <NextIcon />
                  </IconButton>
                </div>
                {historyOption === EHistoryOption.Year && (
                  <Typography variant="h6">
                    {format(refDate, "yyyy")}
                  </Typography>
                )}
                {historyOption === EHistoryOption.Month && (
                  <Typography variant="h6">
                    {format(refDate, "MMM yyyy")}
                  </Typography>
                )}
                {historyOption === EHistoryOption.Schedule && (
                  <Typography variant="h6">{`${page * PAGE_SIZE + 1}-${
                    (page + 1) * PAGE_SIZE > executions.length
                      ? executions.length
                      : (page + 1) * PAGE_SIZE
                  } of ${executions.length}`}</Typography>
                )}
              </div>
              <LoadingCircle isLoading={isLoading} />
              <FormControl variant="outlined" hiddenLabel size="small">
                <Select
                  value={historyOption}
                  onChange={(event) => {
                    const option = event.target.value as EHistoryOption;

                    setHistoryOption(option);
                    handleClear();

                    localStorage.setItem(
                      "DEFAULT_HISTORY_OPTION",
                      option.toString()
                    );
                  }}
                >
                  <MenuItem value={EHistoryOption.Month}>Month</MenuItem>
                  <MenuItem value={EHistoryOption.Year}>Year</MenuItem>
                  <MenuItem value={EHistoryOption.Schedule}>Schedule</MenuItem>
                </Select>
              </FormControl>
            </div>
          }
        />
        <CardContent style={{ padding: 0 }}>
          {groupedEntries.map(([group, items], index) => (
            <List
              key={`history-group-${index}`}
              subheader={<ListSubheader component="div">{group}</ListSubheader>}
              className={classes.root}
            >
              {items.map((item) => (
                <ExecutionInfo
                  key={`history-item-${item.id}`}
                  execution={item}
                />
              ))}
            </List>
          ))}
          {!isLoading && groupedEntries.length === 0 && (
            <List key={`history-group-empty`} className={classes.root}>
              <ListItem>
                <ListItemText
                  primary={
                    "There is nothing scheduled for the selected period."
                  }
                />
              </ListItem>
            </List>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default History;
