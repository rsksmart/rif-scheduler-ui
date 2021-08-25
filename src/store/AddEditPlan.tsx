import { useState } from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { useTheme } from "@material-ui/core/styles";
import AddIcon from "@material-ui/icons/AddCircle";
import TextField from "@material-ui/core/TextField";
import NetworkLabel from "../connect/NetworkLabel";
import { IProviderSnapshot } from "../sdk-hooks/useProviders";
import useAdmin from "../shared/useAdmin";
import { BigNumber, utils } from "ethers";
import DecimalsInput from "../shared/DecimalsInput";
import { getMessageFromCode } from "eth-rpc-errors";
import { useSnackbar } from "notistack";
import environment from "../shared/environment";
import { Typography } from "@material-ui/core";
import { fromBigNumberToHms } from "../shared/formatters";
import { Token, TokenType } from "@rsksmart/rif-scheduler-sdk";

const tokenTypeDescription = {
  [TokenType.ERC20]: "ERC20",
  [TokenType.ERC677]: "ERC677",
  [TokenType.RBTC]: "RBTC",
};

interface IPlanFields {
  price: string;
  window: string;
  gasLimit: string;
  tokenAddress: string;
}

interface ITokenInfo {
  symbol: string;
  decimals: number;
  type: TokenType;
}

const AddEditPlan = ({
  provider,
  onClose,
}: {
  onClose?: () => void;
  provider: IProviderSnapshot;
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [open, setOpen] = useState(false);

  const [fields, setFields] = useState<Partial<IPlanFields> | null>(null);
  const [tokenInfo, setTokenInfo] = useState<ITokenInfo | null | undefined>(
    undefined
  );
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const verifyToken = async () => {
    try {
      const tokenAddress = fields!.tokenAddress!.toLowerCase();

      const token = new Token(provider.config, tokenAddress);

      const symbol = await token.symbol();
      const decimals = await token.decimals();
      const type = token.getType();

      setTokenInfo({ decimals, symbol, type });
    } catch (error) {
      console.log("aaaaa", error);

      setTokenInfo(null);
    }
  };

  const { addPlan } = useAdmin(provider);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setFields(null);
    setOpen(false);

    if (onClose) onClose();
  };

  const handleSave = async () => {
    const isValid =
      fields &&
      fields.window &&
      fields.price &&
      fields.gasLimit &&
      fields.tokenAddress;

    if (isValid) {
      setIsLoading(true);

      await verifyToken();

      if (!tokenInfo) {
        setIsLoading(false);
        return;
      }

      try {
        const tx = await addPlan(
          utils.parseEther(fields!.price!),
          fields!.window!,
          fields!.gasLimit!,
          fields!.tokenAddress!.toLowerCase()
        );
        tx.wait(environment.CONFIRMATIONS).then(() => {
          setIsLoading(false);
          enqueueSnackbar("Plan confirmed!", {
            variant: "success",
          });
          handleClose();
        });
      } catch (error) {
        const message = getMessageFromCode(error.code, error.message);

        enqueueSnackbar(message, {
          variant: "error",
        });

        setIsLoading(false);
      }
    }
  };

  const handleFieldChange = (fieldName: string) => (event: any) => {
    setFields((values) => ({ ...values, [fieldName]: event.target.value }));
  };

  const handleTokenFieldChange = (event: any) => {
    setFields((values) => ({ ...values, tokenAddress: event.target.value }));
    setTokenInfo(undefined);
  };

  return (
    <>
      <Button
        aria-label="add plan"
        color="primary"
        variant="contained"
        size="small"
        endIcon={<AddIcon />}
        onClick={handleClickOpen}
      >
        Add Plan
      </Button>
      <Dialog
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth={true}
        open={open}
        onClose={handleClose}
      >
        <DialogTitle>
          <div style={{ display: "flex", flex: 1 }}>
            <div style={{ display: "flex", flex: 1 }}>{"Add plan"}</div>
            <NetworkLabel />
          </div>
        </DialogTitle>
        <DialogContent>
          {isLoading && (
            <>
              <Typography variant="subtitle1" color="error" component="p">
                Waiting for transaction confirmation:
              </Typography>
              <Typography variant="subtitle1" color="error" component="p">
                Please do NOT close this window.
              </Typography>
            </>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Price"
            helperText="Set the price for this plan"
            variant="filled"
            fullWidth
            onChange={handleFieldChange("price")}
            value={fields?.price}
            InputProps={{
              inputComponent: DecimalsInput as any,
            }}
            disabled={isLoading}
          />
          <TextField
            margin="dense"
            label="Token"
            helperText={
              !fields?.tokenAddress || tokenInfo === undefined
                ? "Add the token address"
                : tokenInfo === null
                ? "Invalid token"
                : `${tokenTypeDescription[tokenInfo.type]} / ${
                    tokenInfo.symbol
                  }`
            }
            variant="filled"
            fullWidth
            onChange={handleTokenFieldChange}
            value={fields?.tokenAddress}
            onBlur={verifyToken}
            disabled={isLoading}
            error={tokenInfo === null ? true : false}
          />
          <TextField
            margin="dense"
            label="Gas limit"
            helperText="Set the gas limit for this plan"
            variant="filled"
            fullWidth
            onChange={handleFieldChange("gasLimit")}
            value={fields?.gasLimit}
            disabled={isLoading}
          />
          <TextField
            margin="dense"
            label="Window (in seconds)"
            helperText={
              fields?.window
                ? fromBigNumberToHms(BigNumber.from(fields.window))
                : "Set the execution window for this plan"
            }
            variant="filled"
            fullWidth
            onChange={handleFieldChange("window")}
            value={fields?.window}
            disabled={isLoading}
          />
        </DialogContent>
        <DialogActions
          style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 24 }}
        >
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            color="primary"
            variant="contained"
            disabled={isLoading}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddEditPlan;
