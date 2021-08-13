import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";

import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import RefreshIcon from "@material-ui/icons/Refresh";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";

import Divider from "@material-ui/core/Divider";
import { formatDistanceToNow } from "date-fns";

import { useState } from "react";
import hyphensAndCamelCaseToWords from "../shared/hyphensAndCamelCaseToWords";
import StatusLabel from "./StatusLabel";
import { Hidden } from "@material-ui/core";
import { useProvidersStore } from "../sdk-hooks/useProviders";
import { IExecutionSnapshot, useExecution } from "../sdk-hooks/useExecution";
import { BigNumber } from "ethers";
import { getMessageFromCode } from "eth-rpc-errors";
import { useSnackbar } from "notistack";

const useRowStyles = makeStyles((theme: Theme) =>
  createStyles({
    part: {
      display: "flex",
      flexDirection: "column",
      flex: 1,
    },
    row: ({ color }: any) => ({
      borderLeft: `${color} 4px solid`,
      borderBottom: `${color} 1px solid`,
      borderRadius: 15,
    }),
  })
);

export const ExecutionButton: React.FC<{
  item: IExecutionSnapshot;
  onClick?: () => void;
}> = ({ item, onClick }) => {
  const classes = useRowStyles({ color: item.index.color ?? "#333" });

  const { enqueueSnackbar } = useSnackbar();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [refresh, , , , contract, isConfirmed] = useExecution(
    item.ref,
    item.index
  );

  const providers = useProvidersStore((state) => state.providers);

  const provider = providers.find(
    (x) => x.config.contractAddress === item.index.providerAddress
  );

  const handleUpdateStatusClick = async () => {
    setIsLoading(true);

    try {
      await refresh();
    } catch (error) {
      const message = getMessageFromCode(error.code, error.message);

      enqueueSnackbar(message, {
        variant: "error",
      });
    }

    setIsLoading(false);
  };

  const handleItemClick = () => {
    if (onClick) onClick();
  };

  return (
    <ListItem button className={classes.row} onClick={handleItemClick}>
      <div
        className={classes.part}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <ListItemText
          className={classes.part}
          primary={item.index.title}
          secondary={`${formatDistanceToNow(item.executeAt, {
            addSuffix: true,
          })}`}
        />
        <div style={{ paddingLeft: 16, paddingRight: 16 }}>
          <StatusLabel execution={item} isConfirmed={isConfirmed} />
        </div>
      </div>
      <Hidden xsDown>
        <Divider orientation="vertical" style={{ marginRight: 16 }} flexItem />
        <ListItemText
          primary={
            <span>
              {contract?.name}&nbsp;&#10140;&nbsp;
              {hyphensAndCamelCaseToWords(item.index.contractMethod)}
            </span>
          }
          secondary={`Provider #${provider!.index + 1} - Plan #${BigNumber.from(
            item.index.providerPlanIndex
          )
            .add(1)
            .toString()}`}
          className={classes.part}
        />
      </Hidden>
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          onClick={handleUpdateStatusClick}
          disabled={isLoading || !isConfirmed}
        >
          <RefreshIcon style={{ color: item.index.color }} />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};
