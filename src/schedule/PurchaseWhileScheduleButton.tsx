import { Button } from "@material-ui/core";
import { Plan, TokenType } from "@rsksmart/rif-scheduler-sdk";
import { getMessageFromCode } from "eth-rpc-errors";
import { BigNumber } from "ethers";
import { useSnackbar } from "notistack";
import { useEffect, useRef, useState } from "react";
import { usePlan } from "../sdk-hooks/usePlan";
import { EApprovalStatus } from "../store/Plan";

const PurchaseWhileSchedule: React.FC<{
  plan: Plan;
  planIsActive: boolean;
  executionsQuantity: BigNumber;
  tokenType: TokenType;
  onRevalidate: () => void;
}> = ({ plan, planIsActive, tokenType, executionsQuantity, onRevalidate }) => {
  const { enqueueSnackbar } = useSnackbar();
  const isAlreadyConfirmed = useRef(true);

  const [verifyApproval, approve, purchase, isConfirmed] = usePlan(plan);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [approvalStatus, setApprovalStatus] = useState<EApprovalStatus>(
    tokenType === TokenType.ERC20
      ? EApprovalStatus.verify
      : EApprovalStatus.approved
  );

  useEffect(() => {
    if (tokenType === TokenType.ERC20) {
      verifyApproval(executionsQuantity).then((approvalResult) =>
        setApprovalStatus(
          approvalResult ? EApprovalStatus.verified : EApprovalStatus.approved
        )
      );
    }
  }, [tokenType, executionsQuantity, verifyApproval]);

  useEffect(() => {
    if (
      !isAlreadyConfirmed.current &&
      approvalStatus === EApprovalStatus.approved &&
      isConfirmed
    ) {
      onRevalidate();
    }
    isAlreadyConfirmed.current = isConfirmed;
  }, [approvalStatus, isConfirmed, onRevalidate]);

  const handleBuyClick = async () => {
    const isValid = executionsQuantity.gt(0) ? true : false;

    if (isValid) {
      setIsLoading(true);

      try {
        if (approvalStatus === EApprovalStatus.verify) {
          const approvalResult = await verifyApproval(executionsQuantity);
          setApprovalStatus(
            approvalResult ? EApprovalStatus.verified : EApprovalStatus.approved
          );
        }

        if (approvalStatus === EApprovalStatus.verified) {
          await approve(executionsQuantity);
          setApprovalStatus(EApprovalStatus.verify);
        }

        if (approvalStatus === EApprovalStatus.approved) {
          await purchase(executionsQuantity);

          setApprovalStatus(
            tokenType === TokenType.ERC20
              ? EApprovalStatus.verify
              : EApprovalStatus.approved
          );
        }
      } catch (error) {
        const message = getMessageFromCode(error.code, error.message);

        enqueueSnackbar(message, {
          variant: "error",
        });
      }

      setIsLoading(false);
    }
  };

  return (
    <Button
      disabled={
        isLoading || !isConfirmed || !planIsActive || executionsQuantity.eq(0)
      }
      color="inherit"
      size="small"
      onClick={handleBuyClick}
    >
      {isConfirmed &&
        approvalStatus === EApprovalStatus.verify &&
        "Verify approval"}
      {isConfirmed && approvalStatus === EApprovalStatus.verified && "Approve"}
      {isConfirmed && approvalStatus === EApprovalStatus.approved && "Buy"}
      {!isConfirmed && "Waiting confirmation"}
    </Button>
  );
};

export default PurchaseWhileSchedule;
